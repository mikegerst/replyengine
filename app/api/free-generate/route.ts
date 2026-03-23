import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const FreeGenerateSchema = z.object({
  business_type: z.string().min(1, 'Business type is required'),
  business_name: z.string().max(200).optional(),
  tone: z.enum(['professional', 'friendly', 'casual', 'formal']).default('friendly'),
  star_rating: z.number().int().min(1).max(5),
  review_text: z.string().min(5, 'Review text must be at least 5 characters').max(5000),
  reviewer_name: z.string().max(100).optional(),
})

// In-memory rate limiting: IP -> { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT = 10
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  // Clean up stale entries periodically
  if (rateLimitMap.size > 10000) {
    rateLimitMap.forEach((val, key) => {
      if (now - val.windowStart > WINDOW_MS) {
        rateLimitMap.delete(key)
      }
    })
  }

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= RATE_LIMIT) {
    return false
  }

  entry.count++
  return true
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function POST(request: Request) {
  const ip = getClientIp(request)

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later (10 per hour).' },
      { status: 429 }
    )
  }

  const body: unknown = await request.json()
  const parsed = FreeGenerateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const { business_type, business_name, tone, star_rating, review_text, reviewer_name } =
    parsed.data

  const displayName = business_name || 'your business'

  const systemPrompt = [
    `You are a review response assistant for "${displayName}", a ${business_type} business.`,
    `Write responses in a ${tone} tone.`,
    'Write a moderate-length response — around 3-5 sentences (roughly 100 words).',
    '',
    'Guidelines:',
    '- Address the reviewer by their first name when available',
    '- Reference specific details from their review to show you read it',
    '- For positive reviews: express genuine gratitude and reinforce what they enjoyed',
    '- For negative reviews: acknowledge their experience with empathy, offer to make it right, provide a way to reach you directly',
    '- Never admit legal fault or liability',
    '- Do not use generic phrases like "valued customer" or "we appreciate your feedback"',
    business_name ? '- Mention the business name naturally once' : '',
    '- Do not use exclamation marks excessively',
    '',
    'Return ONLY the response text. No labels, no headers, no metadata.',
  ]
    .filter(Boolean)
    .join('\n')

  const userPrompt = [
    `Reviewer: ${reviewer_name || 'Anonymous'}`,
    `Rating: ${star_rating}/5 stars`,
    '',
    'Review:',
    review_text,
  ].join('\n')

  try {
    const client = new Anthropic()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const response =
      message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    return NextResponse.json({ data: { response } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
