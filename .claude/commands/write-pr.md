Write a PR description for the current branch against the base branch (default: `develop`). Do NOT push or create the PR — output only.

## Steps

### 1. Gather information

Run these in parallel:

```bash
git log develop..HEAD --oneline
```

```bash
git diff develop...HEAD --stat
```

```bash
git diff develop...HEAD
```

### 2. Analyze the diff

- Identify what changed and why (feat / fix / chore / refactor / docs / test)
- Group related changes into bullet points
- Keep the title under 70 characters

### 3. Output the PR description

Print exactly this block (ready to copy-paste):

---

**Title:**
```
<type>: <short summary>
```

**Body:**
```markdown
## Summary

- <bullet: what changed and why>
- ...

## Test plan

- [ ] <concrete thing to verify>
- [ ] ...

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

Rules:
- Title must follow `<type>: <summary>` format (type: feat / fix / chore / refactor / docs / test)
- Summary bullets focus on **why**, not just what
- Test plan items must be concrete and checkable — no vague "verify it works"
- Do not push, create, or open a PR — output only
