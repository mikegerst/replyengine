import Anthropic from '@anthropic-ai/sdk'
import type { Review } from '@/lib/types/database'

export interface DisputeAnalysis {
  isDisputable: boolean
  confidence: 'high' | 'medium' | 'low'
  violations: string[]
  reasoning: string
  suggestedDisputeText: string
}

const VIOLATION_TYPES = [
  'SPAM_FAKE',
  'OFFENSIVE',
  'CONFLICT_OF_INTEREST',
  'OFF_TOPIC',
  'RESTRICTED_CONTENT',
] as const

export async function analyzeForDispute(review: Review): Promise<DisputeAnalysis> {
  const client = new Anthropic()

  const systemPrompt = `You are an expert at analyzing Google reviews for policy violations. You help business owners identify reviews that may be removable under Google's review policies.

Analyze the review and determine if it violates any of these Google review policies:

1. SPAM_FAKE: Vague text with no specific details about an actual visit, very short reviews with no substance, reviews that appear auto-generated or copied.
2. OFFENSIVE: Contains profanity, hate speech, threats, slurs, or personal attacks on named employees.
3. CONFLICT_OF_INTEREST: Appears to be from a competitor, ex-employee, or someone with a personal/business dispute unrelated to the customer experience.
4. OFF_TOPIC: Discusses unrelated topics, politics, personal grievances not about the business experience.
5. RESTRICTED_CONTENT: Contains personal information like phone numbers, addresses, or makes specific legal accusations.

Be conservative — only flag reviews you are genuinely confident violate a policy. A bad review is NOT the same as a fake review. Legitimate negative experiences should not be flagged.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Analyze this review for potential Google policy violations:

Reviewer: ${review.reviewer_name ?? 'Anonymous'}
Rating: ${review.star_rating}/5 stars
Review text: "${review.review_text ?? '(No text)'}"

Respond with a JSON object (no markdown, no code fences):
{
  "isDisputable": boolean,
  "confidence": "high" | "medium" | "low",
  "violations": ["SPAM_FAKE" | "OFFENSIVE" | "CONFLICT_OF_INTEREST" | "OFF_TOPIC" | "RESTRICTED_CONTENT"],
  "reasoning": "1-2 sentence explanation",
  "suggestedDisputeText": "The text to submit to Google when filing the dispute. Reference the specific policy and explain why the review violates it. Leave empty string if not disputable."
}`,
      },
    ],
  })

  const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    // Strip any markdown fences if present
    const cleaned = rawText.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned) as {
      isDisputable?: boolean
      confidence?: string
      violations?: string[]
      reasoning?: string
      suggestedDisputeText?: string
    }

    const confidence =
      parsed.confidence === 'high' || parsed.confidence === 'medium' || parsed.confidence === 'low'
        ? parsed.confidence
        : 'low'

    const violations = Array.isArray(parsed.violations)
      ? parsed.violations.filter((v): v is string =>
          typeof v === 'string' && VIOLATION_TYPES.includes(v as typeof VIOLATION_TYPES[number])
        )
      : []

    return {
      isDisputable: parsed.isDisputable === true && violations.length > 0,
      confidence,
      violations,
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
      suggestedDisputeText: typeof parsed.suggestedDisputeText === 'string' ? parsed.suggestedDisputeText : '',
    }
  } catch {
    return {
      isDisputable: false,
      confidence: 'low',
      violations: [],
      reasoning: 'Unable to analyze review.',
      suggestedDisputeText: '',
    }
  }
}
