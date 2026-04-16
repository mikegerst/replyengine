# Progress Log

## 2026-04-15 — GEO optimization review and corrections

### Context
Commit `0600e0a` (`feat: GEO optimization — AI crawler access, schema markup, blog with 5 posts`) was pushed to `origin/dev` on 2026-04-14. A code review surfaced two classes of problems:

1. The commit itself was mechanically broken — 6 files were truncated mid-line during the push, leaving the working tree as the only source of the complete content.
2. Content data (plan numbers, pricing, URLs) inside the GEO artifacts was inconsistent with `lib/stripe/plans.ts`, feeding wrong claims to AI crawlers — the exact opposite of what a GEO feature is supposed to accomplish.

Fixes landed in two commits on `dev`.

---

### Commit 1 — `0e6a58e` `fix: recomplete truncated files from GEO commit 0600e0a`

Restored the tail bytes of 6 files that `0600e0a` had cut off mid-line. A new commit (not `--amend`) because `0600e0a` was already pushed and amending would have required force-pushing a shared branch.

| File | Was truncated at | Completion restored |
|---|---|---|
| `app/layout.tsx` | `...Free plan available. An af` | `metadataBase`, `openGraph`, `twitter`, `robots`, `alternates`, and the entire `RootLayout` function with Organization + SoftwareApplication JSON-LD |
| `app/sitemap.ts` | `lastModified: ne` | `/signup` entry, `blogPosts.map()`, `return` |
| `public/robots.txt` | `# Explicitly al` | All 9 AI crawler UA groups, Disallow rules, Sitemap line |
| `app/(marketing)/page.tsx` | `text-sm text-gray-500 leading-re` | VALUE_PROPS close, FAQ section, final CTA, footer |
| `app/(marketing)/free/page.tsx` | `text-sm font-semibold text-` | FAQ rendering close, footer |
| `package.json` | `"res` | `resend`, `stripe`, `twilio`, `zod` dependencies |

`package-lock.json` was also refreshed in the same commit.

---

### Commit 2 — `a5bc981` `fix: correct GEO feature data accuracy and robots.txt grouping`

Addressed the critical content/behavior issues and a handful of important correctness issues.

**Source of truth.** `lib/stripe/plans.ts` is the authoritative plan spec:
- Free: 5 AI responses/month, 1 location
- Starter $19: 30 AI responses/month, up to 3 locations, dispute detection alerts
- Pro $39: unlimited AI responses, unlimited locations, recovery outreach, full dispute filing, analytics

**Critical fixes**

- `app/layout.tsx` — `SoftwareApplication` JSON-LD `offers[].description` rewritten to match `plans.ts`. Starter was previously advertised as "Unlimited AI responses, 3 locations, recovery outreach, analytics" — all four claims wrong.
- `public/llms.txt` — Starter description corrected (was "unlimited responses, 3 locations"). Removed 7 broken URLs that AI crawlers would have 404'd on: `/features/ai-responses`, `/features/dispute-detection`, `/features/recovery`, `/features/analytics`, `/features/multi-location`, `/pricing` (none of those routes exist), and corrected `/blog/dispute-fake-review` → `/blog/dispute-fake-google-review`. Pricing block now points to `/` (where pricing actually lives).
- `content/blog/review-management-cost.mdx:54` — free tier was "up to 10 responses per month"; now 5. Added Starter to the description so all three plans are represented.
- `content/blog/replyengine-vs-birdeye.mdx` — body (line 23) and comparison table (lines 31-33) rewritten. Previously claimed "free plan includes 15 reviews", "Starter plan at $19 per month covers unlimited reviews for a single location" (three wrong facts in one sentence). Also removed the literal Claude model ID `claude-sonnet-4-20250514` from the public body (I8).
- `content/blog/replyengine-vs-podium.mdx` — the worst offender, largely rewritten:
  - Fabricated plan names `"Pro plan at $19"` and `"Business plan at $39"` replaced with actual Starter/Pro.
  - The five-location cost comparison had `$39 × 5 = $195/mo` math, but Pro is a flat $39/mo regardless of location count. The original phrasing reversed the main argument of the post ("ReplyEngine is cheaper for multi-location"); now correctly claims $39 vs $1,245.
  - Nonsensical phrase "flat per-location pricing" removed.
  - Feature table reflected incorrect "Pro+" and "Business plan" tier names; now references Starter/Pro correctly and accurately maps which features are on which tier.
  - Two instances of the exact Claude model ID removed (I8).
- `public/robots.txt` — previously had two `User-agent: *` groups, with Disallow rules only in the second. Real crawler behavior varies on duplicate-UA group merging — named groups like GPTBot and ClaudeBot could end up matching their own `User-agent: GPTBot / Allow: /` group and never see the Disallow rules, effectively allowing AI crawlers into `/api/` and `/dashboard/`. Rewritten so every named UA group carries its own `Disallow /api/` and `Disallow /dashboard/` rules.

**Important fixes**

- `app/sitemap.ts` — added `/privacy` and `/terms` (priority 0.3, yearly). Replaced `new Date()` on all static entries with a module-level `STATIC_PAGE_LAST_MODIFIED = new Date('2026-04-15')` constant so static pages don't claim fresh `lastModified` on every fetch (was causing spurious re-crawls).
- `app/(marketing)/blog/[slug]/page.tsx` — added `export const dynamicParams = false` so unknown blog slugs return 404 at the router instead of hitting `fs.readFileSync` at runtime. Returned `{ title: 'Not Found' }` from `generateMetadata` instead of `{}` for missing posts. Widened the FAQ extraction regex from `[^*]+?` to `[\s\S]+?` so future FAQ answers containing `*` (italic, bold, list markers) don't silently disappear from the JSON-LD.

### Verification
- `npm run lint` — clean
- `npm run build` — passes, 43 static pages, 5 blog posts prerendered, sitemap.xml contains 12 URLs (5 blog + 7 static)
- `npm run test:unit` — 7 test files, 73 tests, all passing

### Unresolved (not addressed in these commits)

Items from the code review that were deferred. Tackle in a follow-up PR before marking GEO "done":

- **I1 Centralize plan descriptions.** Every user-facing plan string (schema `offers`, llms.txt, `components/marketing/pricing-toggle.tsx`, `app/(dashboard)/dashboard/billing/page.tsx`, 5 MDX files) is still hand-written. A single price change would require touching all of them again. Recommend a `lib/stripe/plan-descriptions.ts` helper that derives strings from `plans.ts` and is imported wherever needed.
- **I4 Schema metadata.** `SoftwareApplication` has no `aggregateRating`, `logo`, or `image`. Google Rich Results will not promote it without these. Add once real review/rating data exists and product assets are finalized; consider removing `SoftwareApplication` from layout until then.
- **I5 Shared heading slug util.** `components/blog/blog-post-layout.tsx` `extractToc` slugifies raw markdown text while `app/(marketing)/blog/[slug]/page.tsx` h2/h3 overrides slugify React children — only safe for plain-text headings. Any future heading with inline `**bold**` or `[link](...)` markup will produce a broken TOC anchor.
- **S3 Adopt rehype-slug + remark-gfm.** Would delete the manual h2/h3 override and TOC regex and fix I5 at the same time. One-line declaration in `MDXRemote` options.
- **S5 Drop unnecessary `'use client'`.** `components/blog/blog-post-layout.tsx` has no hooks or event handlers; converting to a server component would cut `/blog/[slug]` JS bundle size.
- **Unit tests for `lib/blog/mdx.ts`.** `CLAUDE.md` requires unit tests for every new utility function. `getAllPosts`, `getPostBySlug`, `getAllSlugs`, and `getRelatedPosts` have none. Also add an integration-style test asserting the plan descriptions in `app/layout.tsx` JSON-LD stay consistent with `lib/stripe/plans.ts`.
- **Untracked draft .md files at repo root.** `CLAUDE_CODE_PROMPT_BLOG_GEO.md`, `CLAUDE_CODE_PROMPT_GEO_FULL.md`, `STARLIFT_GEO_DEEP_DIVE.md`, `STARLIFT_MARKETING_PLAYBOOK_2026.md` — decide whether to commit under `docs/internal/` or add to `.gitignore`.
