# ReplyEngine — AI Review Response Manager

## About This Project
SaaS product that connects to a business's Google Business Profile, pulls their reviews, uses AI (Claude) to draft personalized responses, and lets the owner approve/edit/post with one tap. Includes negative review recovery outreach and illegitimate review dispute detection.

## Tech Stack
- **Frontend + API:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database + Auth:** Supabase (Postgres, Auth, RLS, Real-time)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Reviews:** Google Business Profile API (OAuth)
- **Payments:** Stripe (Checkout, Customer Portal, Webhooks)
- **Email:** Resend
- **SMS:** Twilio (optional notifications)
- **Hosting:** Vercel
- **Testing:** Vitest (unit + integration), Playwright (E2E)

## Key Directories
- `app/(marketing)/` — public landing pages
- `app/(auth)/` — login, signup, OAuth callback
- `app/(dashboard)/` — protected contractor dashboard pages
- `app/api/` — API routes (reviews, billing, webhooks, cron)
- `lib/` — core business logic (ai/, google/, stripe/, notifications/, supabase/, utils/)
- `components/ui/` — reusable UI primitives
- `components/dashboard/` — dashboard-specific components
- `components/marketing/` — marketing page components
- `tests/unit/` — unit tests
- `tests/integration/` — API and database integration tests
- `tests/e2e/` — Playwright browser tests
- `tests/ai-quality/` — AI output quality validation
- `tests/fixtures/` — shared test data
- `supabase/migrations/` — database migration files

## Code Standards
- TypeScript strict mode — no `any` types, use `unknown` when type is uncertain
- Zod validation on every API route input
- All async operations wrapped in try/catch with meaningful error messages
- No raw SQL — use Supabase client (parameterized queries)
- Absolute imports using `@/` alias (e.g., `@/lib/ai/generate-response`)
- Functional components with hooks only — no class components
- Mobile-first responsive design on every page and component
- Tailwind CSS for all styling — no inline styles, no CSS modules

## Testing Rules
- Write unit tests for every new utility function and AI logic function
- Write integration tests for every new API route
- Before committing, run: `npm run test:unit && npm run lint && npm run build`
- All three must pass before any commit
- Test file naming: `[name].test.ts` for unit/integration, `[name].spec.ts` for E2E
- Use Vitest's `describe` and `it` blocks with clear test names
- Mock external APIs (Anthropic, Google, Stripe) in unit tests — never make real API calls in unit tests
- Integration tests may use the Supabase test database

## Git Rules
- Work on the `dev` branch — never commit directly to `main`
- Commit after completing each feature or logical chunk of work
- Commit message format:
  - `feat: short description` — new features
  - `fix: short description` — bug fixes
  - `test: short description` — adding or updating tests
  - `refactor: short description` — code improvements without behavior change
  - `docs: short description` — documentation updates
  - `chore: short description` — dependency updates, config changes
- Push to `origin dev` after each commit
- Never commit: node_modules, .env.local, .next, coverage/

## Security Rules
- Never hardcode API keys, secrets, or credentials — use environment variables
- Every API route must verify authentication via Supabase session
- Row Level Security (RLS) must be enabled on every table
- Stripe webhooks must verify the signing secret before processing
- Google OAuth tokens must be stored encrypted, never logged or exposed to client
- Error responses must not leak sensitive information (stack traces, DB details)
- Rate limit all public-facing endpoints
- Sanitize all user input before database operations

## Architecture Decisions
- Supabase Auth handles all session management — do not build custom auth
- AI response generation happens server-side only — never expose API keys to client
- Google API tokens are refreshed server-side using the refresh token
- Stripe Customer Portal handles payment method updates — do not build custom billing forms
- Cron jobs run via Vercel Cron (vercel.json) or Supabase Edge Functions
- Real-time review notifications use Supabase Realtime subscriptions

## Common Commands
- `npm run dev` — start development server
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npm run test` — run all unit + integration tests
- `npm run test:unit` — unit tests only
- `npm run test:integration` — integration tests only
- `npm run test:e2e` — Playwright E2E tests
- `npm run test:ai` — AI quality tests (uses real API tokens)
- `npm run test:coverage` — tests with coverage report

## Environment Variables
See `.env.example` for the complete list. Key variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase public anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin key (server only)
- `ANTHROPIC_API_KEY` — Claude API key
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe
- `RESEND_API_KEY` — email service

## Important Patterns
- Review response generation: `lib/ai/generate-response.ts` builds a system prompt from the business config, sends the review to Claude, and returns the draft response
- All review operations check the business's subscription plan limits before proceeding
- Negative reviews (1-2 stars) trigger both a public response draft AND a private recovery outreach draft
- The dispute detection system runs `lib/ai/analyze-review.ts` on every new review to check for fake/spam signals
- Notification preferences are per-business — always check before sending
