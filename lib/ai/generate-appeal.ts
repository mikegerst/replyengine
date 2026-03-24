import Anthropic from '@anthropic-ai/sdk'
import type { Business, Review, ReviewDispute } from '@/lib/types/database'

const POLICY_NAMES: Record<string, string> = {
  SPAM_FAKE: 'Google Maps User Contributed Content Policy — Fake Engagement / Spam',
  OFFENSIVE: 'Google Maps User Contributed Content Policy — Harassment and Bullying',
  CONFLICT_OF_INTEREST: 'Google Maps User Contributed Content Policy — Conflict of Interest',
  OFF_TOPIC: 'Google Maps User Contributed Content Policy — Off-Topic Content',
  RESTRICTED_CONTENT: 'Google Maps User Contributed Content Policy — Restricted Content / Personal Information',
}

export async function generateAppealText(
  review: Review,
  business: Business,
  dispute: ReviewDispute
): Promise<string> {
  const client = new Anthropic()

  const policyRefs = (dispute.violations ?? [])
    .map((v) => POLICY_NAMES[v] ?? v)
    .join('; ')

  const systemPrompt = `You are an expert at writing Google review dispute appeals. The business owner gets ONE appeal per review, so this must be as effective as possible.

Write a factual, professional appeal (150-300 words) that:
1. Cites the exact Google policy by its official name
2. Lists ALL violations found — multiple violations increase success rate
3. Provides specific evidence from the review text itself
4. Points out what the review LACKS (no mention of specific services, no verifiable visit details, etc.)
5. Is purely factual — NO emotion, NO pleading, NO personal opinions
6. References the business type to show what a legitimate review would contain
7. Uses clear, structured paragraphs

Business: "${business.name}" (${business.business_type ?? 'local business'})
Violations detected: ${policyRefs}
Original AI analysis: ${dispute.ai_analysis ?? dispute.reason}

Return ONLY the appeal text, no labels or headers.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Write a one-time appeal for this review:

Reviewer: ${review.reviewer_name ?? 'Anonymous'}
Rating: ${review.star_rating}/5
Review text: "${review.review_text ?? '(No text)'}"

Violations: ${(dispute.violations ?? []).join(', ')}`,
      },
    ],
  })

  return message.content[0].type === 'text' ? message.content[0].text.trim() : ''
}
