---
allowed-tools: Bash(grep *), Bash(find *), Read, Grep, Glob
description: Run a security audit on the codebase
---

## Security Audit

Check the codebase for common security issues. Run each check and report findings:

### 1. Exposed Secrets
Search for hardcoded API keys, tokens, or passwords in the codebase:
```
grep -r "sk-ant-" --include="*.ts" --include="*.tsx" --include="*.js" .
grep -r "sk_live_" --include="*.ts" --include="*.tsx" --include="*.js" .
grep -r "sk_test_" --include="*.ts" --include="*.tsx" --include="*.js" .
grep -r "whsec_" --include="*.ts" --include="*.tsx" --include="*.js" .
grep -r "password\s*=" --include="*.ts" --include="*.tsx" --include="*.js" . | grep -v "test" | grep -v "node_modules"
```
Any matches = CRITICAL FAILURE. These must be moved to environment variables.

### 2. Unprotected API Routes
Check that all API routes in `app/api/` (except webhooks and public routes) verify authentication:
- Search for route files that don't contain `supabase` or `auth` or `session`
- Public routes (webhooks, cron) should verify their own secrets instead

### 3. Missing Input Validation
Check that API routes use Zod or similar validation:
- Search route files for `z.object` or `z.string` or `zod`
- Routes without validation = WARNING

### 4. Row Level Security
Check that RLS policies exist for all tables in the migration files:
```
grep -r "ENABLE ROW LEVEL SECURITY" supabase/migrations/
grep -r "CREATE POLICY" supabase/migrations/
```
Every table should have RLS enabled and at least one policy.

### 5. Environment Variables
Check .env.example exists and has all required variables.
Check .env.local is in .gitignore.
```
grep ".env.local" .gitignore
```

### 6. TypeScript Safety
Check for usage of `any` type:
```
grep -r ": any" --include="*.ts" --include="*.tsx" . | grep -v "node_modules" | grep -v ".next"
```
Each instance = WARNING. Should use proper types or `unknown`.

### 7. Error Handling
Check API routes for try/catch blocks:
- Route files without `try` and `catch` = WARNING

Report a summary: CRITICAL issues (must fix), WARNINGS (should fix), and PASSED checks.
