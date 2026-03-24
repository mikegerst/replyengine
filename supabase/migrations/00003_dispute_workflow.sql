-- Add guided workflow fields to review_disputes
alter table review_disputes
  add column if not exists flagged_at timestamptz,
  add column if not exists appeal_text text,
  add column if not exists appeal_submitted_at timestamptz,
  add column if not exists escalation_type text
    check (escalation_type in ('forum', 'support', 'legal')),
  add column if not exists escalation_notes text;

-- Update status constraint for new workflow statuses
alter table review_disputes drop constraint if exists review_disputes_status_check;
alter table review_disputes
  add constraint review_disputes_status_check
    check (status in ('detected', 'flagged', 'appeal_ready', 'submitted', 'under_review', 'removed', 'denied', 'escalated', 'dismissed'));
