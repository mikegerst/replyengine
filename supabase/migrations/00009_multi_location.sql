-- Multi-location support: group businesses under a parent
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS parent_business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_label TEXT;

CREATE INDEX IF NOT EXISTS idx_businesses_parent_id ON businesses(parent_business_id);

COMMENT ON COLUMN businesses.parent_business_id IS 'Parent business ID for multi-location grouping (NULL = standalone or parent)';
COMMENT ON COLUMN businesses.location_label IS 'Short label for the location (e.g., Downtown, Westside)';
