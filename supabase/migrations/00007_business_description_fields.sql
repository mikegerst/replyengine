-- Add business description fields for wrong-business review detection
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS business_description TEXT,
  ADD COLUMN IF NOT EXISTS business_does_not_have TEXT;

COMMENT ON COLUMN businesses.business_description IS 'Owner description of their business (space, services, features) used for wrong-business review detection';
COMMENT ON COLUMN businesses.business_does_not_have IS 'Features the business explicitly does NOT have, used to detect reviews meant for a different business';
