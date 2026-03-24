import Anthropic from '@anthropic-ai/sdk'
import type { Business, Review } from '@/lib/types/database'

interface AmplifyResult {
  response: string
  sentiment: 'positive' | 'neutral' | 'negative'
  keyTopics: string[]
}

export async function generateAmplifyResponse(
  review: Review,
  business: Business
): Promise<AmplifyResult> {
  const client = new Anthropic()

  const promotions = business.current_promotions
    ? `\n\nCurrent promotions/features to subtly work in (pick ONE that's most relevant):\n${business.current_promotions}`
    : ''

  const systemPrompt = `You are a review response assistant for "${business.name}"${business.business_type ? `, a ${business.business_type} business` : ''}.
Write responses in a ${business.tone} tone. Aim for 3-5 sentences.

This is a POSITIVE review (4-5 stars). Your response should serve as a public advertisement to anyone reading it. In addition to thanking the reviewer:

1. Reference specific details from their review to show authenticity
2. Subtly mention one thing the business wants to promote (a new offering, feature, or event)
3. Suggest a specific reason to return ("next time try our...", "come back for...")
4. Mention something that future readers would find appealing
5. Keep it natural — never sound like an ad or marketing copy
6. Sign with the owner's first name
7. Do not use exclamation marks excessively${promotions}

Guidelines:
- Address the reviewer by first name
- Mention the business name naturally once
- The promotional mention should feel organic, not forced
- Think: what would make someone reading this want to visit?

IMPORTANT: Return your output exactly as:
---RESPONSE---
(your response here)
---METADATA---
{"sentiment": "positive", "topics": ["topic1", "topic2"]}`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Reviewer: ${review.reviewer_name ?? 'Anonymous'}
Rating: ${review.star_rating}/5 stars
Review: ${review.review_text ?? '(No text)'}`,
      },
    ],
  })

  const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

  const responsePart = rawText.split('---METADATA---')[0]
  const response = responsePart.replace('---RESPONSE---', '').trim()

  let keyTopics: string[] = []
  const metadataMatch = rawText.match(/---METADATA---\s*(\{[\s\S]*\})/)
  if (metadataMatch) {
    try {
      const metadata = JSON.parse(metadataMatch[1]) as { topics?: string[] }
      keyTopics = (metadata.topics ?? []).filter((t): t is string => typeof t === 'string')
    } catch { /* ignore */ }
  }

  return {
    response: response || rawText.trim(),
    sentiment: 'positive',
    keyTopics,
  }
}
