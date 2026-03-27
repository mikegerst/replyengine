import { describe, it, expect } from 'vitest'
import {
  PLAN_LIMITS,
  canGenerateResponse,
  getRemainingResponses,
} from '@/lib/utils/plan-limits'
import { mockBusiness } from '../../helpers/mocks'

describe('PLAN_LIMITS', () => {
  it('free plan: 5 responses per month', () => {
    expect(PLAN_LIMITS.free.responsesPerMonth).toBe(5)
  })

  it('starter plan: 30 responses per month', () => {
    expect(PLAN_LIMITS.starter.responsesPerMonth).toBe(30)
  })

  it('pro plan: unlimited responses', () => {
    expect(PLAN_LIMITS.pro.responsesPerMonth).toBe(Infinity)
  })
})

describe('canGenerateResponse', () => {
  it('allows free plan user under the limit', () => {
    const business = mockBusiness({ plan: 'free', monthly_response_count: 3 })
    expect(canGenerateResponse(business)).toBe(true)
  })

  it('rejects free plan user at the limit', () => {
    const business = mockBusiness({ plan: 'free', monthly_response_count: 5 })
    expect(canGenerateResponse(business)).toBe(false)
  })

  it('rejects free plan user over the limit', () => {
    const business = mockBusiness({ plan: 'free', monthly_response_count: 6 })
    expect(canGenerateResponse(business)).toBe(false)
  })

  it('allows starter plan user under the limit', () => {
    const business = mockBusiness({
      plan: 'starter',
      monthly_response_count: 29,
    })
    expect(canGenerateResponse(business)).toBe(true)
  })

  it('rejects starter plan user at the limit', () => {
    const business = mockBusiness({
      plan: 'starter',
      monthly_response_count: 30,
    })
    expect(canGenerateResponse(business)).toBe(false)
  })

  it('always allows pro plan user', () => {
    const business = mockBusiness({
      plan: 'pro',
      monthly_response_count: 999,
    })
    expect(canGenerateResponse(business)).toBe(true)
  })

  it('allows user when reset date is in the past (counter will reset)', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    const business = mockBusiness({
      plan: 'free',
      monthly_response_count: 5,
      monthly_response_reset_at: pastDate,
    })
    expect(canGenerateResponse(business)).toBe(true)
  })

  it('rejects user when reset date is in the future and at limit', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString()
    const business = mockBusiness({
      plan: 'free',
      monthly_response_count: 5,
      monthly_response_reset_at: futureDate,
    })
    expect(canGenerateResponse(business)).toBe(false)
  })
})

describe('getRemainingResponses', () => {
  it('returns correct remaining for free plan', () => {
    const business = mockBusiness({ plan: 'free', monthly_response_count: 3 })
    expect(getRemainingResponses(business)).toBe(2)
  })

  it('returns 0 when at limit', () => {
    const business = mockBusiness({ plan: 'free', monthly_response_count: 5 })
    expect(getRemainingResponses(business)).toBe(0)
  })

  it('returns 0 (not negative) when over limit', () => {
    const business = mockBusiness({ plan: 'free', monthly_response_count: 7 })
    expect(getRemainingResponses(business)).toBe(0)
  })

  it('returns Infinity for pro plan', () => {
    const business = mockBusiness({
      plan: 'pro',
      monthly_response_count: 999,
    })
    expect(getRemainingResponses(business)).toBe(Infinity)
  })

  it('returns correct remaining for starter plan', () => {
    const business = mockBusiness({
      plan: 'starter',
      monthly_response_count: 10,
    })
    expect(getRemainingResponses(business)).toBe(20)
  })
})
