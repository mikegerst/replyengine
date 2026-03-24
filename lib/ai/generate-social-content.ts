import Anthropic from '@anthropic-ai/sdk'
import type { Business, Review } from '@/lib/types/database'

interface SocialContent {
  instagram: string
  twitter: string
}

export async function generateSocialContent(
  review: Review,
  business: Business
): Promise<SocialContent> {
  const client = new Anthropic()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: `Generate social media posts for a business to share a great customer review. The business is "${business.name}" (${business.business_type ?? 'local business'}).

Return JSON (no markdown, no code fences):
{
  "instagram": "Instagram/Facebook post with emojis, the best quote from the review, a brief grateful caption, and a call to action. 2-4 sentences.",
  "twitter": "X/Twitter post — shorter, punchy, under 280 characters. Include the best one-liner from the review in quotes."
}`,
    messages: [
      {
        role: 'user',
        content: `Create social posts from this 5-star review:

Reviewer: ${review.reviewer_name ?? 'A customer'}
Review: "${review.review_text ?? ''}"`,
      },
    ],
  })

  const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const cleaned = rawText.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned) as { instagram?: string; twitter?: string }
    return {
      instagram: parsed.instagram ?? '',
      twitter: parsed.twitter ?? '',
    }
  } catch {
    return { instagram: '', twitter: '' }
  }
}
