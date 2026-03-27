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

import { analyzeForDispute } from '@/lib/ai/analyze-dispute'

describe('analyzeForDispute', () => {
  beforeEach(() => {
    mockClient.reset()
  })

  describe('pre-screening: conflict of interest', () => {
    it('flags review from a competitor', async () => {
      const review = mockReview({
        reviewer_name: 'BurgerKing Official',
        review_text: 'This place is terrible, come to us instead.',
      })
      const business = mockBusiness({
        competitor_names: ['BurgerKing'],
      })

      const result = await analyzeForDispute(review, business)

      expect(result.isDisputable).toBe(true)
      expect(result.violations).toContain('CONFLICT_OF_INTEREST')
      expect(result.confidence).toBe('medium')
    })

    it('flags review from an employee', async () => {
      const review = mockReview({
        reviewer_name: 'John Smith',
        review_text: 'Great place!',
      })
      const business = mockBusiness({
        employee_names: ['John Smith'],
      })

      const result = await analyzeForDispute(review, business)

      expect(result.isDisputable).toBe(true)
      expect(result.violations).toContain('CONFLICT_OF_INTEREST')
      expect(result.confidence).toBe('high')
    })
  })

  describe('pre-screening: PII detection', () => {
    it('flags review containing phone numbers', async () => {
      const review = mockReview({
        review_text: 'Call the owner at 555-123-4567, he is a fraud!',
      })

      const result = await analyzeForDispute(review)

      expect(result.isDisputable).toBe(true)
      expect(result.violations).toContain('RESTRICTED_CONTENT')
      expect(result.confidence).toBe('high')
    })

    it('flags review containing email addresses', async () => {
      const review = mockReview({
        review_text: 'Contact owner@business.com to complain, the food is bad.',
      })

      const result = await analyzeForDispute(review)

      expect(result.isDisputable).toBe(true)
      expect(result.violations).toContain('RESTRICTED_CONTENT')
      expect(result.confidence).toBe('high')
    })

    it('flags review with legal accusations', async () => {
      const review = mockReview({
        review_text: 'The owner committed fraud and stole from me. Press charges!',
      })

      const result = await analyzeForDispute(review)

      expect(result.isDisputable).toBe(true)
      expect(result.violations).toContain('RESTRICTED_CONTENT')
      expect(result.confidence).toBe('high')
    })
  })

  describe('pre-screening: off-topic content', () => {
    it('flags review about third-party delivery', async () => {
      const review = mockReview({
        review_text: 'My UberEats driver was 2 hours late and spilled my food.',
      })

      // Off-topic is detected but goes through AI analysis (not early return)
      mockClient.setResponseText(
        JSON.stringify({
          isDisputable: true,
          confidence: 'medium',
          violations: ['OFF_TOPIC'],
          reasoning: 'Review discusses delivery service, not the business.',
          suggestedDisputeText: 'Off-topic review.',
        })
      )

      const result = await analyzeForDispute(review)

      expect(result.violations).toContain('OFF_TOPIC')
    })

    it('flags non-experience review', async () => {
      const review = mockReview({
        review_text: "Never been here but heard from a friend it was terrible.",
      })

      mockClient.setResponseText(
        JSON.stringify({
          isDisputable: true,
          confidence: 'medium',
          violations: ['SPAM_FAKE'],
          reasoning: 'Reviewer admits to never visiting.',
          suggestedDisputeText: 'Non-experience review.',
        })
      )

      const result = await analyzeForDispute(review)

      expect(result.isDisputable).toBe(true)
      expect(result.violations).toContain('OFF_TOPIC')
    })
  })

  describe('legitimate reviews', () => {
    it('does NOT flag legitimate negative review about bad service', async () => {
      const review = mockReview({
        star_rating: 1,
        reviewer_name: 'Sarah Jones',
        review_text:
          'Waited 45 minutes for our food. When it arrived, my steak was overcooked. The waiter was apologetic but it ruined our anniversary dinner.',
      })
      const business = mockBusiness()

      mockClient.setResponseText(
        JSON.stringify({
          isDisputable: false,
          confidence: 'low',
          violations: [],
          reasoning: 'This is a legitimate negative review describing a real experience.',
          suggestedDisputeText: '',
        })
      )

      const result = await analyzeForDispute(review, business)

      expect(result.isDisputable).toBe(false)
      expect(result.violations).toHaveLength(0)
    })

    it('does NOT flag legitimate negative review about long wait', async () => {
      const review = mockReview({
        star_rating: 2,
        reviewer_name: 'Mike Brown',
        review_text:
          'Food was okay but we had to wait over an hour. The server forgot our appetizers. Not worth the price.',
      })

      mockClient.setResponseText(
        JSON.stringify({
          isDisputable: false,
          confidence: 'low',
          violations: [],
          reasoning: 'Legitimate complaint about wait times and service.',
          suggestedDisputeText: '',
        })
      )

      const result = await analyzeForDispute(review)

      expect(result.isDisputable).toBe(false)
    })
  })

  describe('confidence thresholds', () => {
    it('returns high confidence for PII violations', async () => {
      const review = mockReview({
        review_text: 'The manager John can be reached at 555-987-6543.',
      })

      const result = await analyzeForDispute(review)

      expect(result.confidence).toBe('high')
    })

    it('returns medium confidence for competitor matches', async () => {
      const review = mockReview({
        reviewer_name: 'Rival Pizza',
      })
      const business = mockBusiness({
        competitor_names: ['Rival Pizza'],
      })

      const result = await analyzeForDispute(review, business)

      expect(result.confidence).toBe('medium')
    })

    it('passes through AI confidence for AI-only analysis', async () => {
      const review = mockReview({
        review_text: 'This place sucks. Worst ever.',
      })

      mockClient.setResponseText(
        JSON.stringify({
          isDisputable: false,
          confidence: 'low',
          violations: [],
          reasoning: 'Generic negative review.',
          suggestedDisputeText: '',
        })
      )

      const result = await analyzeForDispute(review)

      expect(result.confidence).toBe('low')
    })
  })
})
