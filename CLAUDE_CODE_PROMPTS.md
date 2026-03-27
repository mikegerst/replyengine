# ReplyEngine — Claude Code Prompts

Use these prompts one at a time in Claude Code. Each is self-contained and references the existing codebase. Run them in order — later prompts may depend on earlier work.

---

## Prompt 1: Build the Analytics Dashboard

```
Build a full analytics dashboard page at app/(dashboard)/dashboard/analytics/page.tsx. The current page is a placeholder with just a heading. Replace it with a data-rich, interactive analytics page.

BACKEND — Create a new API route at app/api/analytics/route.ts that:
- Authenticates the user via Supabase session
- Resolves the selected business via resolveBusinessId (see lib/utils/resolve-business.ts)
- Rate limits at 60 req/min per user using rateLimitResponse from lib/utils/rate-limit.ts
- Queries the reviews table and computes:
  1. Rating trend: average star_rating grouped by month for the last 12 months
  2. Review volume: count of reviews per month for the last 12 months
  3. Sentiment breakdown: count of reviews grouped by sentiment_label (positive/neutral/negative/mixed) — this column already exists on the reviews table
  4. Response performance: average time between review_date and responded_at for posted reviews, grouped by month
  5. Star distribution: count of reviews for each star_rating (1-5)
  6. Top keywords: aggregate key_topics (text[] column on reviews) and return the top 15 with counts
  7. Recovery stats: count of recovery_outreach by status (draft/sent/opened/converted) from the recovery_outreach table
  8. Dispute stats: count of review_disputes by status (flagged/appeal_ready/appealed/removed/denied) from the review_disputes table
- Returns all data in a single JSON response
- Validate query params with Zod (optional date range filter: start_date, end_date)

FRONTEND — Rebuild app/(dashboard)/dashboard/analytics/page.tsx as a 'use client' component:
- Use the existing project patterns: fetch with buildApiUrl from lib/utils/selected-business, loading skeleton with animate-pulse, error states
- Layout sections (top to bottom):
  1. Header with "Analytics" title and a date range selector (Last 30 days / Last 90 days / Last 12 months / All time) — use buttons, not a library
  2. Summary cards row: Total Reviews, Avg Rating, Response Rate, Avg Response Time — use the existing StatCard component from components/dashboard/stat-card.tsx
  3. Rating Trend chart: line chart showing monthly average rating over time. Use a simple SVG-based chart — DO NOT add recharts or chart.js as a dependency. Build a lightweight <LineChart> component in components/dashboard/line-chart.tsx that takes {labels: string[], values: number[], color?: string} and renders an SVG with axes, gridlines, and a smooth polyline. Make it responsive.
  4. Review Volume chart: bar chart showing monthly review count. Build a <BarChart> component in components/dashboard/bar-chart.tsx with similar props pattern.
  5. Two-column grid:
     - Left: Star Distribution as horizontal bars (5 stars at top, 1 star at bottom, with count and percentage). No library needed — just styled divs.
     - Right: Sentiment Breakdown as a donut/ring chart. Build a simple SVG donut in components/dashboard/donut-chart.tsx
  6. Top Keywords section: display as a tag cloud or simple grid of pills showing keyword + count, sorted by frequency descending
  7. Recovery & Dispute Stats: two side-by-side cards showing funnel-style breakdowns (e.g., Flagged → Appealed → Removed for disputes)

IMPORTANT:
- Follow all code standards from CLAUDE.md (TypeScript strict, no any, Tailwind only, mobile-first responsive)
- All chart components must be custom SVG — do not add any charting library to package.json
- Add proper TypeScript interfaces for all analytics data shapes in lib/types/database.ts
- Charts must be responsive and look good on mobile (stack to single column below sm breakpoint)
- Use the existing color palette: gray-900 for text, blue-600 for primary accent, green/yellow/red for sentiment
- Include empty states for each section ("No data yet" messages when there are no reviews)
```

---

## Prompt 2: Recovery Email & SMS Sending

```
Implement the actual email and SMS sending logic for the recovery outreach system. Currently, recovery_outreach records are created with message drafts (see app/api/recovery/route.ts and the POST handler that creates 4-phase sequences), but no emails or SMS messages are actually sent.

STEP 1 — Email sending with Resend:
- Install resend: npm install resend
- Create lib/notifications/email.ts:
  - Initialize Resend client with process.env.RESEND_API_KEY
  - Export async function sendRecoveryEmail({ to, subject, htmlBody, textBody, fromName, replyTo }) that sends via Resend
  - Use a "from" address format: "{businessName} <noreply@yourdomain.com>" — make the domain configurable via RESEND_FROM_DOMAIN env var
  - Return { success: boolean, messageId?: string, error?: string }
  - Wrap in try/catch, never throw — always return the result object

STEP 2 — SMS sending with Twilio:
- Install twilio: npm install twilio
- Create lib/notifications/sms.ts:
  - Initialize Twilio client with TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN env vars
  - Export async function sendRecoverySms({ to, body, from }) that sends via Twilio
  - Use TWILIO_PHONE_NUMBER env var for the "from" number
  - Return { success: boolean, sid?: string, error?: string }
  - Wrap in try/catch, never throw

STEP 3 — Recovery outreach sending endpoint:
- Create app/api/recovery/[outreachId]/send/route.ts (POST):
  - Authenticate user, verify business ownership, check Pro plan
  - Load the recovery_outreach record by ID
  - Validate it's in 'draft' status and has a message_draft
  - Determine channel from the outreach record or business preferences (email vs SMS)
  - Call sendRecoveryEmail or sendRecoverySms accordingly
  - On success: update recovery_outreach status to 'sent', set sent_at = now()
  - On failure: return error but don't change status
  - Rate limit: 20 sends per hour per business (prevent spam)

STEP 4 — Automated phase progression cron:
- Create app/api/cron/recovery-followup/route.ts (POST):
  - Verify CRON_SECRET from Authorization header (match pattern in dispute-reminders cron)
  - Query recovery_outreach where status = 'sent' and the next phase is due (check scheduled_for <= now())
  - For each due follow-up: send the message, update status
  - If a recovery_outreach has status = 'converted' or 'opted_out', skip all remaining phases
  - Log results, return summary JSON
- Add the cron to vercel.json: run daily at 10am UTC

STEP 5 — Update the recovery page UI:
- In app/(dashboard)/dashboard/recovery/page.tsx, add a "Send" button next to each draft outreach
- When clicked, POST to /api/recovery/{outreachId}/send
- Show success/error toast (use a simple div notification, no toast library)
- After sending, update the local state to reflect 'sent' status
- Add visual indicators: draft = gray, sent = blue, opened = yellow, converted = green, opted_out = red

STEP 6 — Add to .env.example:
- RESEND_API_KEY, RESEND_FROM_DOMAIN, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

Follow all CLAUDE.md code standards. Add proper TypeScript types, Zod validation on the send endpoint, and meaningful error messages.
```

---

## Prompt 3: Google Token Encryption

```
The businesses table stores google_access_token and google_refresh_token as plaintext text columns. Encrypt these at rest using application-level encryption before storing, and decrypt when reading.

STEP 1 — Create lib/utils/encryption.ts:
- Use Node.js built-in crypto module (no new dependencies)
- Implement AES-256-GCM encryption:
  - Export function encrypt(plaintext: string): string — returns "iv:authTag:ciphertext" as a single base64-encoded string
  - Export function decrypt(encrypted: string): string — splits and decrypts
  - Use ENCRYPTION_KEY from process.env (must be 32 bytes / 64 hex chars)
  - Generate a random IV (12 bytes) for each encryption call
  - Include the auth tag for integrity verification
- Export function isEncrypted(value: string): boolean — checks if value matches the encrypted format (helps with migration)
- Add comprehensive error handling — if decryption fails, log a warning and return empty string (don't crash the app)

STEP 2 — Create a migration helper:
- Create lib/utils/migrate-tokens.ts:
  - Export async function migrateTokensToEncrypted() that:
    - Reads all businesses with non-null google_access_token or google_refresh_token
    - For each, checks if already encrypted via isEncrypted()
    - If plaintext, encrypts and updates the row
    - Returns { migrated: number, skipped: number, errors: number }

STEP 3 — Create a token access layer:
- Create lib/google/token-store.ts:
  - Export async function getGoogleTokens(businessId: string): Promise<{ accessToken: string, refreshToken: string } | null>
    - Reads from businesses table using service role client
    - Decrypts both tokens before returning
  - Export async function saveGoogleTokens(businessId: string, accessToken: string, refreshToken: string): Promise<void>
    - Encrypts both tokens before saving to the database
  - Export async function clearGoogleTokens(businessId: string): Promise<void>
    - Sets both token columns to null

STEP 4 — Update all existing code that reads/writes Google tokens:
- Search the entire codebase for references to google_access_token and google_refresh_token
- Replace direct database reads with getGoogleTokens()
- Replace direct database writes with saveGoogleTokens()
- This likely includes: Google OAuth callback, token refresh logic, review sync, and any API route that calls Google APIs

STEP 5 — Create a one-time migration API route:
- Create app/api/admin/migrate-tokens/route.ts (POST):
  - Require CRON_SECRET auth (same as other admin/cron routes)
  - Call migrateTokensToEncrypted()
  - Return the result summary
  - This is a one-time route — can be removed after migration

STEP 6 — Add ENCRYPTION_KEY to .env.example with a comment explaining it must be 64 hex characters (32 bytes). Add a note that you can generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Follow all CLAUDE.md standards. Never log decrypted tokens. Never expose tokens in API responses to the client.
```

---

## Prompt 4: Security Fixes (Critical)

```
Fix the following security issues identified in the codebase. These are critical for production readiness.

FIX 1 — .gitignore (.env.local exposure):
- Open .gitignore and verify that .env.local is excluded
- The current pattern .env.* with !.env.example SHOULD work, but add an explicit .env.local line above the pattern to be safe
- Run: git status to check if .env.local is currently tracked
- If tracked: git rm --cached .env.local to untrack it (do NOT delete the file)
- Verify with git status that .env.local shows as untracked/ignored

FIX 2 — Atomic rate limiter:
- Open lib/utils/rate-limit.ts
- The current implementation has a race condition: it reads the count, checks the limit, then writes a new count in separate operations. Two concurrent requests can both read the same count and both pass through.
- Replace with an atomic approach using a Supabase RPC (Postgres function):
  - Create a new migration file supabase/migrations/00008_atomic_rate_limit.sql:
    ```sql
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
    ```
  - Update lib/utils/rate-limit.ts to call this function via supabase.rpc('check_rate_limit', { p_key, p_max_count, p_window_ms }) instead of the current read-then-write pattern
  - Keep the same external API (checkRateLimit and rateLimitResponse functions should keep their signatures)

FIX 3 — Cron route authentication hardening:
- In app/api/cron/dispute-reminders/route.ts and app/api/cron/weekly-wins/route.ts:
  - Verify the CRON_SECRET check exists and is correct
  - Also add a check for the Vercel cron authorization header: request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}` — this is already there, just verify
  - Add an additional safeguard: if the request does NOT come from a Vercel cron (check for x-vercel-cron header) AND does not have the correct CRON_SECRET, reject it
  - Return 401 with a generic "Unauthorized" message (no details about what's wrong)

FIX 4 — Weekly wins email integration:
- In app/api/cron/weekly-wins/route.ts, the email is currently just console.log'd
- If lib/notifications/email.ts exists (from Prompt 2), use sendRecoveryEmail to actually send the weekly wins digest
- If not, at minimum replace console.log with a TODO comment and add proper error handling

FIX 5 — Content Security Policy headers:
- Create middleware.ts at the project root (or update if it exists)
- Add security headers to all responses:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()
- Only apply to non-API routes (API routes return JSON, not HTML)

Run: npm run lint && npm run build after all fixes to verify nothing is broken.
```

---

## Prompt 5: Multi-Location Support

```
Add multi-location support so businesses with multiple Google Business Profiles can manage all their locations from one account. This is critical for scaling to dental groups, restaurant chains, franchise owners, and multi-location service businesses.

STEP 1 — Database migration (supabase/migrations/00009_multi_location.sql):
- The businesses table already supports multiple businesses per user (user_id is not unique), so the schema mostly works
- Add a new column: parent_business_id UUID REFERENCES businesses(id) ON DELETE SET NULL — allows grouping locations under a parent
- Add a new column: location_label TEXT — e.g., "Downtown", "Westside", for display purposes
- Add an index on parent_business_id for fast lookups
- Update RLS policies to ensure users can only see their own businesses (should already work since policies check user_id = auth.uid())

STEP 2 — Locations API:
- Create app/api/businesses/locations/route.ts:
  - GET: Return all businesses for the authenticated user, ordered by parent_business_id (nulls first = parent locations), then by name
  - Include a computed field: reviewCount (count of reviews per business)
  - POST: Create a new location linked to a parent business
    - Validate with Zod: { parent_business_id: string, name: string, location_label?: string, google_place_id?: string }
    - Verify the parent belongs to the user
    - Copy configuration defaults (tone, response_length, etc.) from the parent

STEP 3 — Business switcher enhancement:
- Update components/dashboard/business-switcher.tsx:
  - Currently it's a simple dropdown. Enhance it to:
    - Group locations under their parent business name
    - Show location_label in parentheses if set
    - Add an "All Locations" option at the top that shows aggregate data
    - Show a small review count badge next to each location
    - Add a "Manage Locations" link at the bottom of the dropdown

STEP 4 — Locations management page:
- Create app/(dashboard)/dashboard/locations/page.tsx:
  - List all businesses/locations for the user
  - For each: show name, location_label, Google connection status, review count, avg rating
  - "Add Location" button that opens a form to create a new location
  - "Connect Google" button for locations without a Google Business Profile connected
  - Ability to set a location_label (editable inline or via modal)
  - Delete location button (with confirmation)

STEP 5 — Aggregate "All Locations" view:
- Update app/api/dashboard/stats/route.ts:
  - If business_id query param is "all" or not provided AND user has multiple businesses:
    - Return aggregate stats across all businesses
    - totalReviews = sum across all, avgRating = weighted average, etc.
- Update app/api/reviews/route.ts:
  - If business_id is "all", query reviews across all user's businesses
  - Add business_name to the response so the UI can show which location each review belongs to

STEP 6 — Plan enforcement:
- Update lib/stripe/plans.ts to add location limits:
  - Free: 1 location
  - Starter: 3 locations
  - Pro: 10 locations (or unlimited — your call)
- Enforce the limit in the POST handler for creating new locations
- Show an upgrade prompt in the locations page when at the limit

STEP 7 — Update the dashboard overview:
- In app/(dashboard)/dashboard/page.tsx, when "All Locations" is selected:
  - Show a location breakdown card: mini table showing each location's name, rating, and pending review count
  - Keep the existing fairness score and recent reviews sections but label which location each review belongs to

STEP 8 — Navigation:
- Add "Locations" to the dashboard sidebar navigation (check the layout at app/(dashboard)/layout.tsx)
- Place it between "Settings" and "Billing" in the nav order

Follow all CLAUDE.md standards. Mobile-first responsive design. Tailwind CSS only.
```

---

## Recommended Execution Order

1. **Prompt 4 (Security Fixes)** — Fix critical issues first
2. **Prompt 3 (Token Encryption)** — Secure sensitive data
3. **Prompt 1 (Analytics Dashboard)** — Biggest visible feature gap
4. **Prompt 2 (Recovery Email/SMS)** — Complete the recovery workflow
5. **Prompt 5 (Multi-Location)** — Biggest expansion feature

Each prompt is designed to be run independently in Claude Code, but running them in this order minimizes conflicts.
