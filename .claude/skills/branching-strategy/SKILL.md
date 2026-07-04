---
name: branching-strategy
description: Git branching and PR workflow for this repo — trunk-based development with short-lived, type-prefixed branches merged into main via squashed pull requests. Use whenever starting a new piece of work, creating a branch or commit, opening/merging a PR, or answering how changes should land on main.
---

# Branching strategy

Trunk-based development: **`main` is always releasable**, and every change lands
through a short-lived branch and a **squash-merged pull request**. No direct
commits to `main`.

## Principles

- **Never commit directly to `main`.** If you find yourself on `main` with
  changes to make, create a branch first.
- **One branch per unit of work**, small and focused. Merge within ~a day;
  don't let branches diverge for long.
- **`main` stays green and releasable** — only squashed, reviewed PRs land there.

## Branch names

`<type>/<short-kebab-description>`, where `<type>` matches the change's intent:

| Type        | For                                             | Example                       |
| ----------- | ----------------------------------------------- | ----------------------------- |
| `feat/`     | new user-facing capability                      | `feat/recurring-invoices`     |
| `fix/`      | bug fix                                         | `fix/vat-number-leak`         |
| `refactor/` | code change with no behaviour change            | `refactor/centralize-terms`   |
| `chore/`    | deps, tooling, config, housekeeping             | `chore/bump-next`             |
| `docs/`     | docs / README / skills only                     | `docs/readme-run-steps`       |
| `test/`     | tests only                                      | `test/money-rounding`         |
| `perf/`     | performance work                                | `perf/pdf-render`             |

Keep it short and specific; describe the change, not the file.

## Commit & PR messages (Conventional Commits)

Because we **squash-merge**, the **PR title becomes the single commit on
`main`** — so the PR title is what must be clean. Branch commits can be WIP.

- Format: `type: imperative summary` (e.g. `fix: clear supplier VAT number when not registered`).
- `type` is the same set as branch prefixes (`feat`, `fix`, `refactor`, …).
- Keep the summary under ~72 chars; add a body for the why when it isn't obvious.
- Preserve this repo's commit footers (the `Co-Authored-By` / session trailers).

## Workflow

```bash
# 1. Start from an up-to-date main
git switch main && git pull --ff-only

# 2. Branch
git switch -c feat/recurring-invoices

# 3. Work in small commits (these get squashed later, so don't over-polish them)
git add -A && git commit -m "feat: add recurring schedule field"

# 4. Push and open a PR (title MUST be a clean Conventional Commit line)
git push -u origin feat/recurring-invoices
gh pr create --fill        # then edit the title if needed, or:
# gh pr create --title "feat: recurring invoices" --body "..."

# 5. Once checks pass, squash-merge and delete the branch
gh pr merge --squash --delete-branch

# 6. Return to main and sync
git switch main && git pull --ff-only
```

## Keeping a branch current

If `main` moved while you worked, rebase (don't merge) to keep history linear:

```bash
git fetch origin
git rebase origin/main
# resolve conflicts, then:
git push --force-with-lease
```

## Guardrails

- **Only push/PR/merge when the user asks** — branching is proactive, but
  publishing (push, PR, merge) needs an explicit go-ahead.
- **Protect `main`** on GitHub once ready: require a PR and a passing CI check
  before merge; disallow force-pushes. This enforces the strategy for humans too.
- **Delete branches after merge** (`--delete-branch` does this remotely; prune
  locally with `git fetch --prune`).
- Don't reuse a merged branch — start a fresh one from `main` for the next change.

## Quick reference

```
main protected · branch from main · <type>/<kebab> · small commits
→ push -u → gh pr create (Conventional-Commit title) → gh pr merge --squash --delete-branch
```
