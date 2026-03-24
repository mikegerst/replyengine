-- Add current_promotions to businesses for amplify responses
alter table businesses
  add column if not exists current_promotions text;

-- Add recovery sequence fields
alter table recovery_outreach
  add column if not exists phase integer default 1 check (phase between 1 and 4),
  add column if not exists sequence_id uuid,
  add column if not exists scheduled_for timestamptz,
  add column if not exists auto_send boolean default false;

-- Index for finding scheduled outreach
create index if not exists idx_recovery_outreach_scheduled
  on recovery_outreach(scheduled_for) where status = 'scheduled';

-- Add 'scheduled' to recovery_outreach status
alter table recovery_outreach drop constraint if exists recovery_outreach_status_check;
alter table recovery_outreach
  add constraint recovery_outreach_status_check
    check (status in ('draft', 'scheduled', 'sent', 'responded', 'resolved', 'dismissed', 'skipped'));
