import type { Business } from '@/lib/types/database'

export const PLAN_LIMITS = {
  free: { responsesPerMonth: 10 },
  pro: { responsesPerMonth: 100 },
  enterprise: { responsesPerMonth: Infinity },
} as const

export function canGenerateResponse(business: Business): boolean {
  const limit = PLAN_LIMITS[business.plan]?.responsesPerMonth ?? 0

  if (business.monthly_response_reset_at) {
    const resetDate = new Date(business.monthly_response_reset_at)
    if (resetDate < new Date()) {
      return true // counter will be reset
    }
  }

  return business.monthly_response_count < limit
}

export function getRemainingResponses(business: Business): number {
  const limit = PLAN_LIMITS[business.plan]?.responsesPerMonth ?? 0
  if (limit === Infinity) return Infinity
  return Math.max(0, limit - business.monthly_response_count)
}
