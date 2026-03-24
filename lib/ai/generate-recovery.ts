import Anthropic from '@anthropic-ai/sdk'
import type { Business, Review } from '@/lib/types/database'

export interface RecoveryResult {
  message: string
  suggestedResolution: string
}

export interface RecoverySequence {
  phase1: { message: string; sendAfterDays: 0 }
  phase2: { message: string; sendAfterDays: 7 }
  phase3: { message: string; sendAfterDays: null }
  phase4: { message: string; sendAfterDays: null }
  suggestedResolution: string
}

function getOwnerName(business: Business): string {
  return business.name.split(/[''\u2019]s?\s/)[0] ?? 'The Owner'
}

export async function generateRecoveryOutreach(
  review: Review,
  business: Business
): Promise<RecoveryResult> {
  const seq = await generateRecoverySequence(review, business)
  return { message: seq.phase1.message, suggestedResolution: seq.suggestedResolution }
}

export async function generateRecoverySequence(
  review: Review,
  business: Business
): Promise<RecoverySequence> {
  const client = new Anthropic()
  const ownerName = getOwnerName(business)

  const systemPrompt = `You are helping a business owner write a 4-phase private recovery message sequence for an unhappy customer.

Business: "${business.name}" (${business.business_type ?? 'local business'})
Owner first name: "${ownerName}"
Tone: ${business.tone} but always empathetic for recovery

Generate ALL 4 phases as a JSON object:

Phase 1 — ACKNOWLEDGE (send immediately):
Reference the specific complaint. Express genuine empathy. Take responsibility. Offer a specific resolution. Sign with owner name. 3-5 sentences.

Phase 2 — FOLLOW UP (7 days later if no response):
Short, 2-3 sentences. Mention the previous message. Reiterate the offer. No pressure. Sign with owner name.

Phase 3 — GENTLE CLOSE (after resolution/return visit):
Thank them for giving another chance. Ask if they'd consider UPDATING their review IF they felt the difference. NEVER ask to delete or remove. 2-3 sentences. Sign with owner name.

Phase 4 — THANK YOU (if review is updated):
Brief gratitude for the second chance and the update. 2 sentences. Sign with owner name.

CRITICAL RULES:
- NEVER ask to delete, remove, or change a review in phases 1-2
- Phase 3 only asks to "update" IF they felt a difference — not as a condition
- NEVER offer compensation in exchange for changing reviews
- Be genuine and specific to their complaint, not generic

Respond with JSON (no markdown, no code fences):
{
  "phase1": "message text",
  "phase2": "message text",
  "phase3": "message text",
  "phase4": "message text",
  "suggestedResolution": "brief description of resolution offered"
}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate recovery sequence for this review:

Reviewer: ${review.reviewer_name ?? 'Customer'}
Rating: ${review.star_rating}/5
Review: "${review.review_text ?? '(No text)'}"`,
      },
    ],
  })

  const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const cleaned = rawText.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned) as Record<string, string>

    return {
      phase1: { message: parsed.phase1 ?? '', sendAfterDays: 0 },
      phase2: { message: parsed.phase2 ?? '', sendAfterDays: 7 },
      phase3: { message: parsed.phase3 ?? '', sendAfterDays: null },
      phase4: { message: parsed.phase4 ?? '', sendAfterDays: null },
      suggestedResolution: parsed.suggestedResolution ?? '',
    }
  } catch {
    return {
      phase1: { message: rawText.trim(), sendAfterDays: 0 },
      phase2: { message: '', sendAfterDays: 7 },
      phase3: { message: '', sendAfterDays: null },
      phase4: { message: '', sendAfterDays: null },
      suggestedResolution: '',
    }
  }
}
