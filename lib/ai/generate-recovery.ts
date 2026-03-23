import Anthropic from '@anthropic-ai/sdk'
import type { Business, Review } from '@/lib/types/database'

export interface RecoveryResult {
  message: string
  suggestedResolution: string
}

export async function generateRecoveryOutreach(
  review: Review,
  business: Business
): Promise<RecoveryResult> {
  const client = new Anthropic()

  const ownerFirstName = business.name.split(/['']s?\s/)[0] ?? 'The Owner'

  const systemPrompt = `You are helping a business owner write a private recovery message to an unhappy customer who left a negative Google review.

Business: "${business.name}" (${business.business_type ?? 'local business'})

Follow this framework:
Phase 1 — Acknowledge: Reference the specific issue from their review. Express genuine empathy. Take responsibility where appropriate.
Phase 2 — Resolve: Offer a specific resolution based on the complaint type. This could be an invitation to return, offer to redo the service, provide direct contact info, or another appropriate remedy.

CRITICAL RULES:
- NEVER ask the customer to delete, edit, or change their review — this violates Google's policies
- NEVER offer compensation in exchange for changing the review
- Be genuine and specific, not generic
- Keep it concise — 3-5 sentences max
- Sign with the owner's first name: "${ownerFirstName}"
- The tone should be ${business.tone} but always empathetic for recovery messages

Respond with a JSON object (no markdown, no code fences):
{
  "message": "the private recovery message",
  "suggestedResolution": "a brief description of the resolution being offered, e.g. 'Complimentary appetizer on next visit' or 'Free redo of service'"
}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Write a private recovery message for this negative review:

Reviewer: ${review.reviewer_name ?? 'Customer'}
Rating: ${review.star_rating}/5 stars
Review: "${review.review_text ?? '(No text)'}"`,
      },
    ],
  })

  const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const cleaned = rawText.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned) as {
      message?: string
      suggestedResolution?: string
    }

    return {
      message: typeof parsed.message === 'string' ? parsed.message : rawText.trim(),
      suggestedResolution: typeof parsed.suggestedResolution === 'string' ? parsed.suggestedResolution : '',
    }
  } catch {
    return {
      message: rawText.trim(),
      suggestedResolution: '',
    }
  }
}
