import type { Business } from '@/lib/types/database'

const SENSITIVE_FIELDS = [
  'stripe_customer_id',
  'stripe_subscription_id',
  'google_access_token',
  'google_refresh_token',
  'google_token_expires_at',
  'monthly_response_reset_at',
] as const

/**
 * Strips sensitive fields from a business object before returning to the client.
 */
export function sanitizeBusinessForClient(
  business: Business
): Omit<Business, typeof SENSITIVE_FIELDS[number]> {
  const sanitized = { ...business }
  for (const field of SENSITIVE_FIELDS) {
    delete (sanitized as Record<string, unknown>)[field]
  }
  return sanitized as Omit<Business, typeof SENSITIVE_FIELDS[number]>
}

/**
 * The explicit column list for businesses table queries.
 * Excludes sensitive fields at the database query level.
 */
export const BUSINESS_PUBLIC_COLUMNS = [
  'id',
  'owner_id',
  'name',
  'google_place_id',
  'google_account_id',
  'google_location_id',
  'business_type',
  'tone',
  'response_length',
  'custom_instructions',
  'auto_respond',
  'auto_respond_min_stars',
  'notification_email',
  'notification_sms',
  'phone',
  'plan',
  'monthly_response_count',
  'current_promotions',
  'employee_names',
  'competitor_names',
  'created_at',
  'updated_at',
].join(', ')
