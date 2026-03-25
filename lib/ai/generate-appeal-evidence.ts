import type { Business, Review, ReviewDispute, EvidencePackage } from '@/lib/types/database'
import { calculateRatingImpact, formatRevenue } from '@/lib/utils/rating-impact'

export async function generateAppealPackage(
  review: Review,
  dispute: ReviewDispute,
  business: Business,
  allReviews: Review[]
): Promise<EvidencePackage> {
  const ratingImpact = calculateRatingImpact(
    allReviews.map((r) => ({ id: r.id, star_rating: r.star_rating })),
    [review.id]
  )

  // Timeline
  const timeline = buildTimeline(review, dispute)

  // Reviewer analysis
  const reviewerAnalysis = buildReviewerAnalysisSummary(dispute)

  // Employee match
  const employeeMatch = buildEmployeeMatchSummary(review, business)

  // PII detection
  const piiResults = buildPiiSummary(review)

  // Pattern analysis (if part of an attack)
  const patternAnalysis = null // Will be populated if attack detection data exists

  // All violations
  const allViolations = (dispute.violations ?? []).map((v) => {
    const names: Record<string, string> = {
      SPAM_FAKE: 'Fake Engagement / Spam',
      OFFENSIVE: 'Harassment and Bullying',
      CONFLICT_OF_INTEREST: 'Conflict of Interest',
      OFF_TOPIC: 'Off-Topic Content',
      RESTRICTED_CONTENT: 'Restricted Content / Personal Information',
    }
    return `Google Maps Policy: ${names[v] ?? v}`
  })

  // Cross-references
  const crossReferences = findSimilarReviews(review, allReviews)

  // Format everything as a clean summary
  const formattedSummary = formatEvidenceSummary({
    businessName: business.name,
    businessType: business.business_type,
    reviewerName: review.reviewer_name,
    starRating: review.star_rating,
    timeline,
    violations: allViolations,
    reviewerAnalysis,
    employeeMatch,
    piiResults,
    ratingImpact: `Current: ${ratingImpact.currentRating} → Projected: ${ratingImpact.projectedRating} (${ratingImpact.ratingChange > 0 ? '+' : ''}${ratingImpact.ratingChange})`,
    revenueImpact: `${formatRevenue(ratingImpact.estimatedRevenueImpact.low)}–${formatRevenue(ratingImpact.estimatedRevenueImpact.high)}/year`,
  })

  return {
    appealText: dispute.appeal_text ?? '',
    timeline,
    reviewerAnalysis,
    employeeMatchResults: employeeMatch,
    piiDetectionResults: piiResults,
    patternAnalysis,
    ratingImpact: `${ratingImpact.currentRating} → ${ratingImpact.projectedRating} (${ratingImpact.ratingChange > 0 ? '+' : ''}${ratingImpact.ratingChange}). Revenue impact: ${formatRevenue(ratingImpact.estimatedRevenueImpact.low)}–${formatRevenue(ratingImpact.estimatedRevenueImpact.high)}/yr`,
    allViolations,
    crossReferences,
    formattedSummary,
  }
}

function buildTimeline(review: Review, dispute: ReviewDispute): string {
  const events: string[] = []

  if (review.review_date) {
    events.push(`Review posted: ${new Date(review.review_date).toLocaleDateString()}`)
  } else {
    events.push(`Review posted: ${new Date(review.created_at).toLocaleDateString()}`)
  }

  events.push(`Violation detected: ${new Date(dispute.created_at).toLocaleDateString()}`)

  if (dispute.flagged_at) {
    events.push(`Flagged to Google: ${new Date(dispute.flagged_at).toLocaleDateString()}`)
  }

  if (dispute.submitted_at) {
    events.push(`Appeal submitted: ${new Date(dispute.submitted_at).toLocaleDateString()}`)
  }

  return events.join('\n')
}

function buildReviewerAnalysisSummary(dispute: ReviewDispute): string {
  const parts: string[] = []

  if (dispute.reviewer_specificity) {
    parts.push(`Specificity: ${dispute.reviewer_specificity}`)
  }

  if (dispute.reviewer_verifiable_details?.length) {
    parts.push(`Verifiable details: ${dispute.reviewer_verifiable_details.join(', ')}`)
  } else {
    parts.push('Verifiable details: None found')
  }

  if (dispute.reviewer_suspicious_indicators?.length) {
    parts.push(`Suspicious indicators: ${dispute.reviewer_suspicious_indicators.join(', ')}`)
  }

  if (dispute.reviewer_profile_summary) {
    parts.push(`Summary: ${dispute.reviewer_profile_summary}`)
  }

  return parts.join('\n')
}

function buildEmployeeMatchSummary(review: Review, business: Business): string | null {
  if (!review.reviewer_name) return null

  const name = review.reviewer_name.toLowerCase().trim()

  for (const emp of business.employee_names ?? []) {
    if (emp && name.includes(emp.toLowerCase().trim())) {
      return `Reviewer name "${review.reviewer_name}" matches employee "${emp}". This is a potential conflict of interest violation.`
    }
  }

  for (const comp of business.competitor_names ?? []) {
    if (comp && name.includes(comp.toLowerCase().trim())) {
      return `Reviewer name "${review.reviewer_name}" contains competitor name "${comp}". This is a potential conflict of interest violation.`
    }
  }

  return null
}

function buildPiiSummary(review: Review): string | null {
  const text = review.review_text ?? ''
  const findings: string[] = []

  // Phone number pattern
  if (/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(text)) {
    findings.push('Contains phone number')
  }

  // Email pattern
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    findings.push('Contains email address')
  }

  // Legal accusations
  const legalTerms = ['committed fraud', 'stole from me', 'should be arrested', 'is a criminal', 'call the police', 'press charges']
  for (const term of legalTerms) {
    if (text.toLowerCase().includes(term)) {
      findings.push(`Contains legal accusation: "${term}"`)
    }
  }

  return findings.length > 0 ? `PII/Legal content detected: ${findings.join('; ')}` : null
}

function findSimilarReviews(review: Review, allReviews: Review[]): string | null {
  if (!review.review_text) return null

  const words = review.review_text.toLowerCase().split(/\s+/).filter((w) => w.length > 4)
  if (words.length < 3) return null

  const similar = allReviews.filter((r) => {
    if (r.id === review.id || !r.review_text) return false
    const otherWords = r.review_text.toLowerCase().split(/\s+/)
    const overlap = words.filter((w) => otherWords.includes(w)).length
    return overlap / words.length > 0.5
  })

  if (similar.length === 0) return null

  return `${similar.length} other review(s) share similar language patterns with this review.`
}

function formatEvidenceSummary(data: {
  businessName: string
  businessType: string | null
  reviewerName: string | null
  starRating: number
  timeline: string
  violations: string[]
  reviewerAnalysis: string
  employeeMatch: string | null
  piiResults: string | null
  ratingImpact: string
  revenueImpact: string
}): string {
  const sections = [
    `EVIDENCE SUMMARY — ${data.businessName}`,
    `Business type: ${data.businessType ?? 'Local business'}`,
    `Reviewer: ${data.reviewerName ?? 'Anonymous'} (${data.starRating}/5 stars)`,
    '',
    '--- TIMELINE ---',
    data.timeline,
    '',
    '--- POLICY VIOLATIONS ---',
    data.violations.map((v) => `• ${v}`).join('\n'),
    '',
    '--- REVIEWER ANALYSIS ---',
    data.reviewerAnalysis,
  ]

  if (data.employeeMatch) {
    sections.push('', '--- CONFLICT OF INTEREST ---', data.employeeMatch)
  }

  if (data.piiResults) {
    sections.push('', '--- PII / RESTRICTED CONTENT ---', data.piiResults)
  }

  sections.push(
    '',
    '--- RATING IMPACT ---',
    `Rating change: ${data.ratingImpact}`,
    `Estimated revenue impact: ${data.revenueImpact}`
  )

  return sections.join('\n')
}
