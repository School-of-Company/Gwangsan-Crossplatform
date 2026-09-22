Write a PR description for the current branch against the base branch (default: `develop`). Do NOT push or create the PR — output only.

This command's output structure is a copy of `.github/pull_request_template.md`, which is
the required, CI-enforced PR template for this repo (see "PR Template Check" workflow). If
that file changes, update this command to match.

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
## 💡 PR 요약

- <what changed and why, focused on why>

## 📋 작업 내용

- <bullet: concrete work done>
- ...

## 🤝 리뷰 시 참고사항

- <trade-offs, open questions, or things worth flagging to reviewers — omit this section entirely if there's nothing to add>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

Rules:
- Title must follow `<type>: <summary>` format (type: feat / fix / chore / refactor / docs / test)
- `## 💡 PR 요약` is always required and must never be left as a placeholder — CI (`pr-template-check.yml`) fails the PR otherwise
- `## 📋 작업 내용` and `## 🤝 리뷰 시 참고사항` are optional — omit a section entirely if there's nothing real to put in it, don't leave placeholder text
- Do not push, create, or open a PR — output only
