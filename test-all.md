---
allowed-tools: Bash(npm run *)
description: Run the full test suite and report results
---

## Full Test Suite

Run all test layers in order and report results for each:

1. **Unit Tests:**
```
npm run test:unit
```
Report: number of tests passed/failed

2. **Integration Tests:**
```
npm run test:integration
```
Report: number of tests passed/failed

3. **Lint:**
```
npm run lint
```
Report: pass/fail and any issues

4. **Build Check:**
```
npm run build
```
Report: pass/fail and any TypeScript errors

5. **Coverage (if unit tests pass):**
```
npm run test:coverage
```
Report: coverage percentage for key directories (lib/, components/, app/api/)

Summarize with a clear pass/fail for each layer and highlight any failures that need attention.
