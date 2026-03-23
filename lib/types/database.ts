export interface Business {
  id: string
  owner_id: string
  name: string
  google_place_id: string | null
  google_account_id: string | null
  google_location_id: string | null
  google_access_token: string | null
  google_refresh_token: string | null
  google_token_expires_at: string | null
  business_type: string | null
  tone: 'professional' | 'friendly' | 'casual' | 'formal'
  response_length: 'short' | 'medium' | 'long'
  custom_instructions: string | null
  auto_respond: boolean
  auto_respond_min_stars: number | null
  notification_email: boolean
  notification_sms: boolean
  phone: string | null
  plan: 'free' | 'pro' | 'enterprise'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  monthly_response_count: number
  monthly_response_reset_at: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  business_id: string
  google_review_id: string | null
  reviewer_name: string | null
  reviewer_photo_url: string | null
  star_rating: number
  review_text: string | null
  review_date: string | null
  ai_response: string | null
  edited_response: string | null
  response_status: 'pending' | 'draft' | 'approved' | 'posted' | 'skipped'
  posted_at: string | null
  sentiment: 'positive' | 'neutral' | 'negative' | null
  key_topics: string[] | null
  google_response_id: string | null
  created_at: string
  updated_at: string
}

export interface ResponsePattern {
  id: string
  business_id: string
  name: string
  star_rating_min: number
  star_rating_max: number
  template_instructions: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SyncJob {
  id: string
  business_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  reviews_found: number | null
  reviews_new: number | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface RecoveryOutreach {
  id: string
  review_id: string
  business_id: string
  outreach_type: 'email' | 'sms'
  message_draft: string | null
  status: 'draft' | 'sent' | 'responded' | 'resolved' | 'dismissed'
  sent_at: string | null
  resolved_at: string | null
  notes: string | null
  suggested_resolution: string | null
  created_at: string
  updated_at: string
}

export interface ReviewDispute {
  id: string
  review_id: string
  business_id: string
  reason: string
  ai_confidence_score: number | null
  ai_analysis: string | null
  violations: string[]
  suggested_dispute_text: string | null
  confidence: 'high' | 'medium' | 'low'
  status: 'detected' | 'flagged' | 'submitted' | 'under_review' | 'removed' | 'denied' | 'dismissed'
  google_case_id: string | null
  submitted_at: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface RecoveryOutreachWithReview extends RecoveryOutreach {
  reviews: Review
}

export interface ReviewDisputeWithReview extends ReviewDispute {
  reviews: Review
}

export interface DashboardStats {
  totalReviews: number
  pendingResponses: number
  avgRating: number
  responseRate: number
  reviewsByStatus: {
    pending: number
    draft: number
    approved: number
    posted: number
    skipped: number
  }
}
