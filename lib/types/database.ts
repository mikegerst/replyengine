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
  plan: 'free' | 'starter' | 'pro'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  monthly_response_count: number
  monthly_response_reset_at: string | null
  current_promotions: string | null
  employee_names: string[]
  competitor_names: string[]
  business_description: string | null
  business_does_not_have: string | null
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
  previous_star_rating: number | null
  previous_review_text: string | null
  updated_at_google: string | null
  update_count: number
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
  status: 'draft' | 'scheduled' | 'sent' | 'responded' | 'resolved' | 'dismissed' | 'skipped'
  phase: number
  sequence_id: string | null
  scheduled_for: string | null
  auto_send: boolean
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
  status: 'detected' | 'flagged' | 'appeal_ready' | 'submitted' | 'under_review' | 'removed' | 'denied' | 'escalated' | 'dismissed'
  google_case_id: string | null
  flagged_at: string | null
  appeal_text: string | null
  appeal_submitted_at: string | null
  escalation_type: 'forum' | 'support' | 'legal' | null
  escalation_notes: string | null
  submitted_at: string | null
  resolved_at: string | null
  reviewer_specificity: 'high' | 'medium' | 'low' | null
  reviewer_verifiable_details: string[] | null
  reviewer_suspicious_indicators: string[] | null
  reviewer_profile_summary: string | null
  evidence_package: EvidencePackage | null
  forum_post_draft: string | null
  created_at: string
  updated_at: string
}

export interface EvidencePackage {
  appealText: string
  timeline: string
  reviewerAnalysis: string
  employeeMatchResults: string | null
  piiDetectionResults: string | null
  patternAnalysis: string | null
  ratingImpact: string
  allViolations: string[]
  crossReferences: string | null
  formattedSummary: string
}

export interface AttackDetection {
  id: string
  business_id: string
  detected_at: string
  confidence: 'high' | 'medium' | 'low'
  attack_review_ids: string[]
  pattern_description: string | null
  evidence_package: AttackEvidencePackage | null
  status: 'detected' | 'reported' | 'resolved' | 'dismissed'
  created_at: string
  updated_at: string
}

export interface AttackEvidencePackage {
  businessName: string
  businessUrl: string
  normalReviewVelocity: string
  attackTimeline: string
  suspiciousReviewUrls: string[]
  reviewerProfileUrls: string[]
  commonPatterns: string
}

export interface ReviewerAnalysis {
  specificityScore: 'high' | 'medium' | 'low'
  verifiableDetails: string[]
  suspiciousIndicators: string[]
  profileSummary: string
}

export interface ReviewVelocity {
  normalVelocity: number
  safeTarget: number
  currentMonthCount: number
  remainingThisMonth: number
  warning: string | null
}

export interface FairnessScoreResult {
  googleRating: number
  fairnessScore: number
  unfairReviewCount: number
  unfairReviews: Array<{ id: string; star_rating: number; reason: string }>
  ratingGap: number
  potentialRating: number
  reviewsNeededToRecover: number
  estimatedRevenueImpact: { low: number; high: number }
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

export interface MonthlyDataPoint {
  month: string
  value: number
}

export interface KeywordCount {
  keyword: string
  count: number
}

export interface AnalyticsData {
  ratingTrend: MonthlyDataPoint[]
  reviewVolume: MonthlyDataPoint[]
  sentimentBreakdown: {
    positive: number
    neutral: number
    negative: number
    mixed: number
  }
  responsePerformance: MonthlyDataPoint[]
  starDistribution: Record<number, number>
  topKeywords: KeywordCount[]
  recoveryStats: Record<string, number>
  disputeStats: Record<string, number>
  summary: {
    totalReviews: number
    avgRating: number
    responseRate: number
    avgResponseTimeHours: number
  }
}
