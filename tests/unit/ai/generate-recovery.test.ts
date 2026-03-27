import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockAnthropicClient } from '../../helpers/anthropic-mock'
import { mockReview, mockBusiness } from '../../helpers/mocks'

const mockClient = createMockAnthropicClient()

vi.mock('@anthropic-ai/sdk', () => {
  const MockAnthropicClass = function (this: unknown) {
    return mockClient
  } as unknown as { new (): typeof mockClient }
  return { default: MockAnthropicClass }
})

import { generateRecoverySequence } from '@/lib/ai/generate-recovery'

describe('generateRecoverySequence', () => {
  beforeEach(() => {
    mockClient.reset()
  })

  const validSequenceResponse = JSON.stringify({
    phase1: 'Dear customer, we are deeply sorry about your experience with the cold food and long wait. We take full responsibility and would love to make it right with a complimentary meal.',
    phase2: 'Hi again, I wanted to follow up on my previous message. Our offer for a complimentary meal still stands. No pressure at all.',
    phase3: 'Thank you so much for giving us another chance! If you felt the difference, we would be grateful if you considered updating your review.',
    phase4: 'Thank you for updating your review. We truly appreciate the second chance.',
    suggestedResolution: 'Offer a complimentary meal to make up for the bad experience.',
  })

  it('generates exactly 4 phases', async () => {
    mockClient.setResponseText(validSequenceResponse)

    const review = mockReview({
      star_rating: 1,
      review_text: 'Cold food and 45 minute wait.',
    })
    const business = mockBusiness()

    const result = await generateRecoverySequence(review, business)

    expect(result.phase1).toBeDefined()
    expect(result.phase2).toBeDefined()
    expect(result.phase3).toBeDefined()
    expect(result.phase4).toBeDefined()
    expect(result.suggestedResolution).toBeDefined()
  })

  it('phase 1 is immediate (sendAfterDays = 0)', async () => {
    mockClient.setResponseText(validSequenceResponse)

    const review = mockReview({ star_rating: 1 })
    const business = mockBusiness()

    const result = await generateRecoverySequence(review, business)

    expect(result.phase1.sendAfterDays).toBe(0)
  })

  it('phase 2 is scheduled ~7 days out', async () => {
    mockClient.setResponseText(validSequenceResponse)

    const review = mockReview({ star_rating: 1 })
    const business = mockBusiness()

    const result = await generateRecoverySequence(review, business)

    expect(result.phase2.sendAfterDays).toBe(7)
  })

  it('phases 3 and 4 have null sendAfterDays (event-triggered)', async () => {
    mockClient.setResponseText(validSequenceResponse)

    const review = mockReview({ star_rating: 1 })
    const business = mockBusiness()

    const result = await generateRecoverySequence(review, business)

    expect(result.phase3.sendAfterDays).toBeNull()
    expect(result.phase4.sendAfterDays).toBeNull()
  })

  it('recovery messages never ask the reviewer to delete their review', async () => {
    mockClient.setResponseText(validSequenceResponse)

    const review = mockReview({
      star_rating: 1,
      review_text: 'Absolutely terrible food.',
    })
    const business = mockBusiness()

    const result = await generateRecoverySequence(review, business)

    const allMessages = [
      result.phase1.message,
      result.phase2.message,
      result.phase3.message,
      result.phase4.message,
    ].join(' ')

    expect(allMessages.toLowerCase()).not.toContain('delete')
    expect(allMessages.toLowerCase()).not.toContain('remove your review')
  })

  it('references the specific complaint from the original review', async () => {
    const review = mockReview({
      star_rating: 1,
      review_text: 'Cold food and 45 minute wait.',
    })
    const business = mockBusiness()

    mockClient.setResponseText(validSequenceResponse)

    await generateRecoverySequence(review, business)

    const call = mockClient.getLastCall()
    expect(call!.messages[0].content).toContain('Cold food and 45 minute wait.')
  })

  it('includes business name and tone in the system prompt', async () => {
    const review = mockReview({ star_rating: 1 })
    const business = mockBusiness({
      name: "Mario's Pizzeria",
      tone: 'casual',
      business_type: 'pizzeria',
    })

    mockClient.setResponseText(validSequenceResponse)

    await generateRecoverySequence(review, business)

    const call = mockClient.getLastCall()
    expect(call!.system).toContain("Mario's Pizzeria")
    expect(call!.system).toContain('casual')
    expect(call!.system).toContain('pizzeria')
  })

  it('handles malformed JSON response gracefully', async () => {
    mockClient.setResponseText('This is not valid JSON at all')

    const review = mockReview({ star_rating: 1 })
    const business = mockBusiness()

    const result = await generateRecoverySequence(review, business)

    // Falls back: phase1 gets raw text, others empty
    expect(result.phase1.message).toBe('This is not valid JSON at all')
    expect(result.phase1.sendAfterDays).toBe(0)
    expect(result.phase2.sendAfterDays).toBe(7)
  })
})
