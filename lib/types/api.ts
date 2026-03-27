import { z } from 'zod'

export const CreateBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(200),
  business_type: z.string().max(100).optional(),
  tone: z.enum(['professional', 'friendly', 'casual', 'formal']).default('professional'),
  response_length: z.enum(['short', 'medium', 'long']).default('medium'),
  custom_instructions: z.string().max(2000).optional(),
  business_description: z.string().max(2000).optional(),
  business_does_not_have: z.string().max(2000).optional(),
})

export type CreateBusinessInput = z.infer<typeof CreateBusinessSchema>

export const UpdateBusinessSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  business_type: z.string().max(100).optional(),
  tone: z.enum(['professional', 'friendly', 'casual', 'formal']).optional(),
  response_length: z.enum(['short', 'medium', 'long']).optional(),
  custom_instructions: z.string().max(2000).nullable().optional(),
  auto_respond: z.boolean().optional(),
  auto_respond_min_stars: z.number().min(1).max(5).optional(),
  notification_email: z.boolean().optional(),
  notification_sms: z.boolean().optional(),
  phone: z.string().max(20).nullable().optional(),
  business_description: z.string().max(2000).nullable().optional(),
  business_does_not_have: z.string().max(2000).nullable().optional(),
  location_label: z.string().max(100).nullable().optional(),
})

export type UpdateBusinessInput = z.infer<typeof UpdateBusinessSchema>

export const UpdateReviewStatusSchema = z.object({
  status: z.enum(['pending', 'draft', 'approved', 'posted', 'skipped']),
  edited_response: z.string().max(5000).optional(),
})

export type UpdateReviewStatusInput = z.infer<typeof UpdateReviewStatusSchema>

export const ReviewsQuerySchema = z.object({
  status: z.enum(['pending', 'draft', 'approved', 'posted', 'skipped']).optional(),
  star_rating: z.coerce.number().min(1).max(5).optional(),
  page: z.coerce.number().min(1).default(1),
  per_page: z.coerce.number().min(1).max(100).default(20),
})

export type ReviewsQuery = z.infer<typeof ReviewsQuerySchema>

export type ApiResponse<T> = { data: T } | { error: string }
