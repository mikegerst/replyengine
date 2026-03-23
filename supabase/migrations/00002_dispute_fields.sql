-- Add new fields to review_disputes for enhanced dispute analysis
alter table review_disputes
  add column if not exists violations text[] default '{}',
  add column if not exists suggested_dispute_text text,
  add column if not exists confidence text default 'low'
    check (confidence in ('high', 'medium', 'low'));

-- Update status check to include new statuses
alter table review_disputes drop constraint if exists review_disputes_status_check;
alter table review_disputes
  add constraint review_disputes_status_check
    check (status in ('detected', 'flagged', 'submitted', 'under_review', 'removed', 'denied', 'dismissed'));

-- Add insert policy for disputes (was missing)
create policy "Users can insert disputes for own businesses"
  on review_disputes for insert
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

-- Add insert policy for recovery_outreach (was missing)
create policy "Users can insert recovery for own businesses"
  on recovery_outreach for insert
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

-- Add suggested_resolution to recovery_outreach
alter table recovery_outreach
  add column if not exists suggested_resolution text;
