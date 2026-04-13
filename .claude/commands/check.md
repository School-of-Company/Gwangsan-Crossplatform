Run the full local quality gate — same checks as CI.

## Steps

Run the three checks **sequentially** and report a clear pass/fail summary at the end.

### 1. Lint

```bash
npm run lint
```

If there are fixable issues, run `npm run format` and re-check.

### 2. TypeScript

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -30
```

Show the first 30 lines of output. List each error file + message.

### 3. Unit tests

```bash
npm test -- --passWithNoTests 2>&1 | tail -30
```

Show the last 30 lines. List any failing test names.

## Output format

After all three checks, print a summary table:

| Check | Status | Notes |
|-------|--------|-------|
| Lint | ✓ / ✗ | error count or "clean" |
| TypeScript | ✓ / ✗ | error count or "no errors" |
| Tests | ✓ / ✗ | pass/fail counts |

If any check failed, list the specific files/errors that need fixing.
Do not suggest fixes unless asked — just report what's broken.
