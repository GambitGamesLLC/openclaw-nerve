# Remove `.plans` Artifacts from PR #253 History

**Date:** 2026-04-09  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Remove unintended repo-local `.plans/` artifacts from PR `#253` so the Beads viewer PR contains only upstream-appropriate code and test changes.

---

## Overview

Derrick spotted a real packaging problem: PR `#253` still contains `.plans/` files in its commit history. Those files are local orchestration artifacts and should not be part of the maintainer-facing upstream PR. Even if the current branch is mechanically green, this packaging issue means the PR is not actually ready for review.

The right fix is to rewrite or restack the PR branch so the code/test changes remain intact while `.plans/` changes are removed from the branch history and final diff. After that, the refreshed branch must be revalidated, force-pushed carefully to the Gambit fork, and PR `#253` must be re-checked to confirm the `.plans/` artifacts are gone and checks are healthy.

---

## Tasks

### Task 1: Audit exactly which `.plans/` files are present in PR `#253` and design the clean branch rewrite

**Bead ID:** `nerve-xekr`  
**SubAgent:** `research`  
**Prompt:** In `~/workspace/projects/gambit-openclaw-nerve` on branch `feature/beads-view-ui`, inspect PR `#253` and determine exactly which `.plans/` files are still included in the PR diff/history and the cleanest safe way to remove them without losing intended code/test changes. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Audited PR 253 .plans contamination" --json`. Record the exact offending files, whether they are in the current diff versus only historical commits, and recommend the narrowest branch-rewrite strategy.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-09-remove-plans-from-pr-253-history.md`

**Status:** ✅ Complete

**Results:** Audit complete against `upstream/master...feature/beads-view-ui`.

Exact offending `.plans/` files still present in the current PR diff **and** in branch history:
- `.plans/2026-04-08-verify-and-fix-coderabbit-beads-findings.md`
- `.plans/2026-04-08-verify-and-fix-second-coderabbit-pass-on-pr-253.md`
- `.plans/2026-04-08-clean-up-final-coderabbit-batch-on-pr-253.md`
- `.plans/2026-04-09-final-pr-253-coderabbit-cleanup.md`

Current diff status vs `upstream/master` for all four is `A` (added). There were **no** additional `.plans/` files found that exist only in historical commits but not in the current diff.

History findings:
- The four files above were introduced/updated across commits `649887e`, `55939c5`, `f7f40b3`, `d758222`, `adf292d`, `bc9a491`, `94c13de`, `cd6b4e8`, `33adcdd`, `13735e9`, `14cca87`, `992c3a7`, `384a352`, `dc1a8e9`, `f775ca9`, `8b685b5`, `e847172`, and `6b9840c`.
- Mixed code+plan commits that will need selective preservation are: `649887e`, `d758222`, `94c13de`, `33adcdd`, and `f775ca9`.
- Pure plan-only commits that should simply disappear in the rewrite are: `55939c5`, `f7f40b3`, `adf292d`, `bc9a491`, `cd6b4e8`, `13735e9`, `14cca87`, `992c3a7`, `384a352`, `dc1a8e9`, `8b685b5`, `e847172`, and `6b9840c`.

Recommended narrow safe strategy: **restack the branch from `upstream/master` by cherry-picking only the seven code-bearing commits**, dropping plan-only commits entirely and removing `.plans/` paths from the five mixed commits before recommitting them. This is safer and narrower than an 18-commit interactive rebase because it preserves the intended Beads viewer code/test evolution while eliminating all `.plans/` artifacts from both PR diff and branch history in one pass.

---

### Task 2: Rewrite `feature/beads-view-ui` to remove `.plans/` artifacts while preserving intended PR code

**Bead ID:** `nerve-swbl`  
**SubAgent:** `coder`  
**Prompt:** In `~/workspace/projects/gambit-openclaw-nerve`, after Task 1, rewrite/restack `feature/beads-view-ui` so PR `#253` no longer includes unintended `.plans/` artifacts, while preserving the intended Beads viewer code and tests. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Rewrote PR 253 branch to remove .plans artifacts" --json`. Use the narrowest safe git history-edit strategy that produces a clean PR diff. Update this plan with exact files removed from the PR, exact git operations used, resulting commits, and any caveats.

**Folders Created/Deleted/Modified:**
- `.plans/`
- git history on `feature/beads-view-ui`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-09-remove-plans-from-pr-253-history.md`
- PR code/test files only as needed to preserve intended diff

**Status:** ✅ Complete

**Results:** Local branch rewrite complete.

Exact git strategy used:
1. `git fetch upstream`
2. Created a safety backup before rewriting: `git branch backup/feature-beads-view-ui-pre-rewrite-2026-04-09 HEAD`
3. Reset local `feature/beads-view-ui` to the clean base: `git reset --hard upstream/master`
4. Reapplied pure code commits directly with `git cherry-pick`:
   - `63bf93b`
   - `56a1ed7`
5. Reapplied mixed code+plan commits one by one with `git cherry-pick --no-commit`, then removed `.plans` changes before recommitting with the original commit message:
   - `649887e` → recommitted as `b70e833`
   - `d758222` → recommitted as `5e83bd6`
   - `94c13de` → recommitted as `8219438`
   - `33adcdd` → recommitted as `3d6a52d`
   - `f775ca9` → recommitted as `4023098`
6. For mixed commits, `.plans` contamination was stripped either with `git restore --staged --worktree --source=HEAD -- <path>` or, where cherry-pick surfaced modify/delete conflicts for removed plan files, with `git rm -f <path>` before committing.
7. Verified the cleaned result with:
   - `git diff --name-only upstream/master...HEAD`
   - `git log --oneline --name-only upstream/master..HEAD -- .plans`

Files removed from PR contamination:
- `.plans/2026-04-08-verify-and-fix-coderabbit-beads-findings.md`
- `.plans/2026-04-08-verify-and-fix-second-coderabbit-pass-on-pr-253.md`
- `.plans/2026-04-08-clean-up-final-coderabbit-batch-on-pr-253.md`
- `.plans/2026-04-09-final-pr-253-coderabbit-cleanup.md`

Plan-only commits dropped entirely from the rewritten branch:
- `55939c5`
- `f7f40b3`
- `adf292d`
- `bc9a491`
- `cd6b4e8`
- `13735e9`
- `14cca87`
- `992c3a7`
- `384a352`
- `dc1a8e9`
- `8b685b5`
- `e847172`
- `6b9840c`

Resulting local commit stack on `feature/beads-view-ui` after rewrite:
- `94b9ea1` - feat(beads): transplant bead viewer UI from canonical branch
- `cd4e751` - fix(beads): avoid sync effect reset in bead detail hook
- `b70e833` - Fix verified bead viewer blocker findings
- `5e83bd6` - Fix second CodeRabbit bead viewer blockers
- `8219438` - Revalidate PR 253 branch and fix lint follow-up
- `3d6a52d` - Handle final bead viewer cleanup fixes
- `4023098` - Finish final PR 253 cleanup fixes

Status/caveats:
- `git diff upstream/master...HEAD` now contains **no `.plans/` files**.
- `git log upstream/master..HEAD -- .plans` returns no entries, confirming the rewritten branch history no longer carries `.plans` changes.
- The branch has been rewritten **locally only**. No force-push or PR refresh was performed here, per Task 3 ownership.

---

### Task 3: Revalidate, force-push safely, and re-check PR `#253`

**Bead ID:** `nerve-czha`  
**SubAgent:** `research`  
**Prompt:** In `~/workspace/projects/gambit-openclaw-nerve`, after Task 2, rerun the necessary validation, force-push the rewritten `feature/beads-view-ui` branch to the Gambit fork safely, and re-check PR `#253`. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Revalidated and refreshed cleaned PR 253" --json`. Record exact validation commands, push command used, resulting PR state, and confirm whether `.plans/` artifacts are absent from the PR diff.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-09-remove-plans-from-pr-253-history.md`

**Status:** ✅ Complete

**Results:** Revalidation, guarded force-push, and direct PR re-check completed.

Exact validation commands run:
- `npm test -- --run src/features/beads/BeadViewerTab.test.tsx src/features/beads/links.test.ts src/features/chat/MessageBubble.test.tsx src/features/file-browser/MarkdownDocumentView.test.tsx src/features/file-browser/TabbedContentArea.test.tsx src/features/markdown/MarkdownRenderer.test.tsx src/App.test.tsx server/lib/beads.test.ts server/lib/plans.test.ts server/routes/beads.test.ts`
- `npm run lint`
- `npm run build`

Validation outcomes:
- Focused Vitest run: **10 test files passed, 95 tests passed**.
- `npm run lint`: **passed with 6 pre-existing `react-hooks/exhaustive-deps` warnings only**, no errors.
- `npm run build`: **passed**. Vite emitted existing chunk-size / dynamic-import warnings only.

Exact `.plans` contamination checks run:
- `git diff --name-only upstream/master...HEAD -- .plans`
- `git log --oneline upstream/master..HEAD -- .plans`
- `gh pr diff 253 --name-only`

`.plans` contamination result:
- `git diff --name-only upstream/master...HEAD -- .plans` returned **no paths**.
- `git log --oneline upstream/master..HEAD -- .plans` returned **no commits**.
- `gh pr diff 253 --name-only` listed only code/test files and **no `.plans/` entries**.
- Conclusion: **PR #253 no longer contains `.plans` artifacts in the branch diff or visible PR diff.**

Exact push commands run:
- `git fetch origin feature/beads-view-ui`
- `git push --force-with-lease=refs/heads/feature/beads-view-ui:$(git rev-parse origin/feature/beads-view-ui) origin HEAD:refs/heads/feature/beads-view-ui`

Push outcome:
- Force-push succeeded: `6b9840c...4023098 HEAD -> feature/beads-view-ui (forced update)`.
- Remote branch now matches local rewritten tip `40230983263bed2564a5126731eb8385d5db0285`.

Direct PR `#253` re-check after push:
- PR URL: `https://github.com/daggerhashimoto/openclaw-nerve/pull/253`
- State: **OPEN**
- Draft: **false**
- Head/base: `GambitGamesLLC:feature/beads-view-ui` → `daggerhashimoto:master`
- Mergeable (GraphQL): **MERGEABLE**
- Merge state status: **BLOCKED**
- Review decision: **REVIEW_REQUIRED**
- Checks after refresh:
  - `build` workflow: **QUEUED** on the rewritten head
  - `CodeRabbit`: **PENDING** on the rewritten head

Observed reason for `BLOCKED`:
- The branch itself is mergeable, but the PR is currently blocked by still-pending refreshed checks and the lack of an approving review (`REVIEW_REQUIRED`).

Commits now on the PR after refresh:
- `94b9ea1` - feat(beads): transplant bead viewer UI from canonical branch
- `cd4e751` - fix(beads): avoid sync effect reset in bead detail hook
- `b70e833` - Fix verified bead viewer blocker findings
- `5e83bd6` - Fix second CodeRabbit bead viewer blockers
- `8219438` - Revalidate PR 253 branch and fix lint follow-up
- `3d6a52d` - Handle final bead viewer cleanup fixes
- `4023098` - Finish final PR 253 cleanup fixes

Plan-file handling note:
- This plan file remains a local `.plans/` artifact for orchestration documentation. It was **updated locally but intentionally not committed onto `feature/beads-view-ui`**, because doing so would immediately reintroduce the exact `.plans` contamination this cleanup removed from PR `#253`.

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:** The rewritten `feature/beads-view-ui` branch was successfully revalidated and safely force-pushed to the PR branch. PR `#253` now points at the cleaned 7-commit stack and no longer shows any `.plans/` contamination in its diff. The remaining blockers are external PR state only: refreshed CI/CodeRabbit checks are still pending and the PR still requires review approval.

**Commits:**
- `94b9ea1` - feat(beads): transplant bead viewer UI from canonical branch
- `cd4e751` - fix(beads): avoid sync effect reset in bead detail hook
- `b70e833` - Fix verified bead viewer blocker findings
- `5e83bd6` - Fix second CodeRabbit bead viewer blockers
- `8219438` - Revalidate PR 253 branch and fix lint follow-up
- `3d6a52d` - Handle final bead viewer cleanup fixes
- `4023098` - Finish final PR 253 cleanup fixes

**Lessons Learned:** When a PR cleanup specifically removes repo-local `.plans/` artifacts from history, the plan should be updated locally for documentation, but that update cannot be committed back onto the same PR branch without reintroducing the contamination. PR readiness should therefore distinguish between branch cleanliness and external gate state such as pending checks and review requirements.

---

*Started on 2026-04-09*
