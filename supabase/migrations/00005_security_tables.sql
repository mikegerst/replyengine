-- Rate limiting table for persistent rate limit tracking
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now()
);

-- API usage tracking for cost protection
CREATE TABLE IF NOT EXISTS api_usage (
  date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  generation_count INTEGER DEFAULT 0,
  estimated_cost_cents INTEGER DEFAULT 0
);

-- Index for rate limit cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits (window_start);

-- No RLS on rate_limits or api_usage — these are accessed via service role only
