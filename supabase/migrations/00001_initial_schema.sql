-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- BUSINESSES TABLE
-- ============================================
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  google_place_id text,
  google_account_id text,
  google_location_id text,
  google_access_token text,
  google_refresh_token text,
  google_token_expires_at timestamptz,
  business_type text,
  tone text not null default 'professional',
  response_length text not null default 'medium',
  custom_instructions text,
  auto_respond boolean not null default false,
  auto_respond_min_stars integer default 4,
  notification_email boolean not null default true,
  notification_sms boolean not null default false,
  phone text,
  plan text not null default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  monthly_response_count integer not null default 0,
  monthly_response_reset_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for looking up businesses by owner
create index idx_businesses_owner_id on businesses(owner_id);

-- ============================================
-- REVIEWS TABLE
-- ============================================
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  google_review_id text unique,
  reviewer_name text,
  reviewer_photo_url text,
  star_rating integer not null check (star_rating between 1 and 5),
  review_text text,
  review_date timestamptz,
  ai_response text,
  edited_response text,
  response_status text not null default 'pending'
    check (response_status in ('pending', 'draft', 'approved', 'posted', 'skipped')),
  posted_at timestamptz,
  sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  key_topics text[],
  google_response_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for reviews
create index idx_reviews_business_id on reviews(business_id);
create index idx_reviews_status on reviews(response_status);
create index idx_reviews_rating on reviews(star_rating);
create index idx_reviews_date on reviews(review_date desc);

-- ============================================
-- RESPONSE PATTERNS TABLE
-- ============================================
create table response_patterns (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  star_rating_min integer not null check (star_rating_min between 1 and 5),
  star_rating_max integer not null check (star_rating_max between 1 and 5),
  template_instructions text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (star_rating_min <= star_rating_max)
);

create index idx_response_patterns_business_id on response_patterns(business_id);

-- ============================================
-- SYNC JOBS TABLE
-- ============================================
create table sync_jobs (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed')),
  reviews_found integer default 0,
  reviews_new integer default 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_sync_jobs_business_id on sync_jobs(business_id);
create index idx_sync_jobs_status on sync_jobs(status);

-- ============================================
-- RECOVERY OUTREACH TABLE
-- ============================================
create table recovery_outreach (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references reviews(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  outreach_type text not null default 'email'
    check (outreach_type in ('email', 'sms')),
  message_draft text,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'responded', 'resolved', 'dismissed')),
  sent_at timestamptz,
  resolved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_recovery_outreach_review_id on recovery_outreach(review_id);
create index idx_recovery_outreach_business_id on recovery_outreach(business_id);
create index idx_recovery_outreach_status on recovery_outreach(status);

-- ============================================
-- REVIEW DISPUTES TABLE
-- ============================================
create table review_disputes (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references reviews(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  reason text not null,
  ai_confidence_score numeric(3,2) check (ai_confidence_score between 0 and 1),
  ai_analysis text,
  status text not null default 'detected'
    check (status in ('detected', 'flagged', 'submitted', 'resolved', 'dismissed')),
  google_case_id text,
  submitted_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_review_disputes_review_id on review_disputes(review_id);
create index idx_review_disputes_business_id on review_disputes(business_id);
create index idx_review_disputes_status on review_disputes(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table businesses enable row level security;
alter table reviews enable row level security;
alter table response_patterns enable row level security;
alter table sync_jobs enable row level security;
alter table recovery_outreach enable row level security;
alter table review_disputes enable row level security;

-- Businesses: users can only access their own businesses
create policy "Users can view own businesses"
  on businesses for select
  using (auth.uid() = owner_id);

create policy "Users can insert own businesses"
  on businesses for insert
  with check (auth.uid() = owner_id);

create policy "Users can update own businesses"
  on businesses for update
  using (auth.uid() = owner_id);

create policy "Users can delete own businesses"
  on businesses for delete
  using (auth.uid() = owner_id);

-- Reviews: users can access reviews for their businesses
create policy "Users can view reviews for own businesses"
  on reviews for select
  using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Users can insert reviews for own businesses"
  on reviews for insert
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Users can update reviews for own businesses"
  on reviews for update
  using (business_id in (select id from businesses where owner_id = auth.uid()));

-- Response patterns: users can manage patterns for their businesses
create policy "Users can view patterns for own businesses"
  on response_patterns for select
  using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Users can insert patterns for own businesses"
  on response_patterns for insert
  with check (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Users can update patterns for own businesses"
  on response_patterns for update
  using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Users can delete patterns for own businesses"
  on response_patterns for delete
  using (business_id in (select id from businesses where owner_id = auth.uid()));

-- Sync jobs: users can view sync jobs for their businesses
create policy "Users can view sync jobs for own businesses"
  on sync_jobs for select
  using (business_id in (select id from businesses where owner_id = auth.uid()));

-- Recovery outreach: users can manage for their businesses
create policy "Users can view recovery for own businesses"
  on recovery_outreach for select
  using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Users can update recovery for own businesses"
  on recovery_outreach for update
  using (business_id in (select id from businesses where owner_id = auth.uid()));

-- Review disputes: users can manage for their businesses
create policy "Users can view disputes for own businesses"
  on review_disputes for select
  using (business_id in (select id from businesses where owner_id = auth.uid()));

create policy "Users can update disputes for own businesses"
  on review_disputes for update
  using (business_id in (select id from businesses where owner_id = auth.uid()));

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on businesses
  for each row execute function update_updated_at();

create trigger set_updated_at before update on reviews
  for each row execute function update_updated_at();

create trigger set_updated_at before update on response_patterns
  for each row execute function update_updated_at();

create trigger set_updated_at before update on recovery_outreach
  for each row execute function update_updated_at();

create trigger set_updated_at before update on review_disputes
  for each row execute function update_updated_at();
