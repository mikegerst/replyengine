---
allowed-tools: Bash(npm run *), Bash(git add:*), Bash(git status), Bash(git commit:*), Bash(git push:*), Bash(git diff:*)
description: Run quality checks and commit with a descriptive message
---

## Pre-Commit Quality Gate

Before committing, run these checks in order. If any fail, fix the issues before committing.

1. Run unit tests:
```
npm run test:unit
```

2. Run linter:
```
npm run lint
```

3. Run build:
```
npm run build
```

Only if ALL THREE pass, proceed to commit:

4. Check what changed:
```
git status
git diff --stat
```

5. Stage changes:
```
git add -A
```

6. Commit with a descriptive message following the convention:
- `feat: description` for new features
- `fix: description` for bug fixes
- `test: description` for test additions
- `refactor: description` for code improvements
- `docs: description` for documentation
- `chore: description` for config/dependency changes

The commit message should be specific about WHAT changed, not vague.
Good: `feat: add ReviewCard component with approve/edit/skip actions`
Bad: `feat: update components`

7. Push to origin:
```
git push origin dev
```

Report the results of each step clearly.
