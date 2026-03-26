-- Atomic rate limiting function to prevent race conditions
-- Replaces the read-then-write pattern with a single atomic upsert
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max_count INTEGER,
  p_window_ms BIGINT
) RETURNS TABLE(allowed BOOLEAN, current_count INTEGER) AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_now TIMESTAMPTZ := now();
  v_count INTEGER;
BEGIN
  v_window_start := v_now - (p_window_ms || ' milliseconds')::INTERVAL;

  -- Upsert and increment atomically
  INSERT INTO rate_limits (key, count, window_start)
  VALUES (p_key, 1, v_now)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN rate_limits.window_start < v_window_start THEN 1
      ELSE rate_limits.count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start < v_window_start THEN v_now
      ELSE rate_limits.window_start
    END
  RETURNING rate_limits.count INTO v_count;

  RETURN QUERY SELECT v_count <= p_max_count, v_count;
END;
$$ LANGUAGE plpgsql;
