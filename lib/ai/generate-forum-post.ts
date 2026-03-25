import type { Business, Review, ReviewDispute } from '@/lib/types/database'

const POLICY_NAMES: Record<string, string> = {
  SPAM_FAKE: 'Fake Engagement / Spam',
  OFFENSIVE: 'Harassment and Bullying',
  CONFLICT_OF_INTEREST: 'Conflict of Interest',
  OFF_TOPIC: 'Off-Topic Content',
  RESTRICTED_CONTENT: 'Restricted Content / Personal Information',
}

export function generateForumPost(
  dispute: ReviewDispute,
  review: Review,
  business: Business
): string {
  const violations = (dispute.violations ?? [])
    .map((v) => `Google Maps User Contributed Content Policy — ${POLICY_NAMES[v] ?? v}`)

  const violationList = violations.map((v) => `• ${v}`).join('\n')

  const caseIdLine = dispute.google_case_id
    ? `Case ID: ${dispute.google_case_id}`
    : 'Case ID: [pending — will update when available]'

  const evidenceSummary = buildEvidenceSummary(dispute, review)

  const post = `Subject: Review removal denied — ${(dispute.violations ?? [])[0] ? POLICY_NAMES[(dispute.violations ?? [])[0]] : 'Policy violation'} — ${caseIdLine}

Hello Product Experts,

I am the owner of ${business.name}, a ${business.business_type ?? 'local business'}. I am requesting a second review of a report that was denied.

${caseIdLine}

VIOLATION DETAILS:
The following review violates these Google Maps policies:
${violationList}

REVIEW IN QUESTION:
- Rating: ${review.star_rating}/5 stars
- Reviewer: ${review.reviewer_name ?? 'Anonymous'}
- Posted: ${review.review_date ? new Date(review.review_date).toLocaleDateString() : 'Unknown date'}

WHY THIS VIOLATES GOOGLE'S POLICIES:
${evidenceSummary}

EVIDENCE SUBMITTED:
${dispute.appeal_text ? dispute.appeal_text.slice(0, 500) : dispute.ai_analysis ?? dispute.reason}

TIMELINE:
- Review flagged: ${dispute.flagged_at ? new Date(dispute.flagged_at).toLocaleDateString() : 'N/A'}
- Appeal submitted: ${dispute.submitted_at ? new Date(dispute.submitted_at).toLocaleDateString() : 'N/A'}
- Appeal denied: ${dispute.resolved_at ? new Date(dispute.resolved_at).toLocaleDateString() : 'Recently'}

I respectfully request that a Product Expert review this case. The review clearly violates the policies cited above, and I believe the initial review may have been automated.

Thank you for your time.`

  return post
}

function buildEvidenceSummary(dispute: ReviewDispute, review: Review): string {
  const parts: string[] = []

  if (dispute.reviewer_specificity === 'low') {
    parts.push('The reviewer provides no verifiable details about an actual visit — no mention of specific products, services, staff, or dates.')
  }

  if (dispute.reviewer_suspicious_indicators?.length) {
    parts.push(`Suspicious indicators: ${dispute.reviewer_suspicious_indicators.join('; ')}.`)
  }

  // Check for PII
  const text = review.review_text ?? ''
  if (/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(text)) {
    parts.push('The review contains personal phone number(s), violating the Restricted Content policy.')
  }
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    parts.push('The review contains personal email address(es), violating the Restricted Content policy.')
  }

  if (parts.length === 0) {
    parts.push(dispute.ai_analysis ?? dispute.reason)
  }

  return parts.join(' ')
}
