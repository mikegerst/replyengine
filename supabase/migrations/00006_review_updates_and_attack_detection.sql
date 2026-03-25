-- Part 1: Review update detection fields
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS previous_star_rating INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS previous_review_text TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at_google TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS update_count INTEGER DEFAULT 0;

-- Part 3: Employee roster & conflict of interest detection
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS employee_names TEXT[] DEFAULT '{}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS competitor_names TEXT[] DEFAULT '{}';

-- Part 6: Reviewer analysis fields on disputes
ALTER TABLE review_disputes ADD COLUMN IF NOT EXISTS reviewer_specificity TEXT;
ALTER TABLE review_disputes ADD COLUMN IF NOT EXISTS reviewer_verifiable_details TEXT[];
ALTER TABLE review_disputes ADD COLUMN IF NOT EXISTS reviewer_suspicious_indicators TEXT[];
ALTER TABLE review_disputes ADD COLUMN IF NOT EXISTS reviewer_profile_summary TEXT;

-- Part 7: Evidence package on disputes
ALTER TABLE review_disputes ADD COLUMN IF NOT EXISTS evidence_package JSONB;

-- Part 8: Forum post on disputes
ALTER TABLE review_disputes ADD COLUMN IF NOT EXISTS forum_post_draft TEXT;

-- Part 2: Attack detection tracking
CREATE TABLE IF NOT EXISTS attack_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  detected_at TIMESTAMPTZ DEFAULT now(),
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  attack_review_ids UUID[] DEFAULT '{}',
  pattern_description TEXT,
  evidence_package JSONB,
  status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'reported', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attack_detections_business ON attack_detections(business_id);
CREATE INDEX IF NOT EXISTS idx_attack_detections_status ON attack_detections(status);

-- Enable RLS on attack_detections
ALTER TABLE attack_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attack detections"
  ON attack_detections FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update their own attack detections"
  ON attack_detections FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
