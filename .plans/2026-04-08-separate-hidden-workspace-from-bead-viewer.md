# Separate Hidden-Workspace Scope from Bead Viewer Branch

**Date:** 2026-04-08  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Rebuild `feature/bead-viewer` so it contains only Beads-specific scope and excludes the canonical hidden-workspace Issue + PR scope, using PR #246 commits as the source-of-truth boundary for what belongs to hidden-workspace.

---

## Overview

Derrick clarified that hidden-workspace is already its own Issue + PR and should not be part of the Beads branch. The canonical reference for hidden-workspace scope is PR #246 commits:
- `be6199b4463fa51c380ddf86a660b03c7b1ad798`
- `1c9f322958f66893062418b63ab1576f4ce6c5b3`

That means the current `feature/bead-viewer` branch is contaminated if it still carries those commits or their equivalent content. The job now is to treat PR #246 as authoritative, identify exactly which pieces of the current Beads branch are true hidden-workspace scope versus true Beads scope, and reconstruct `feature/bead-viewer` as a clean upstream-master-based Beads branch.

Combo remains integration-only. After cleanup, the corrected Beads branch can be rolled into combo for testing, but combo is not part of this branch-cleanup task unless a later follow-up explicitly asks for it.

---

## Tasks

### Task 1: Audit current `feature/bead-viewer` against hidden-workspace PR #246 canonical commits

**Bead ID:** `nerve-srts`  
**SubAgent:** `research`  
**Prompt:** Audit `feature/bead-viewer` in `gambit-openclaw-nerve` against hidden-workspace PR #246 canonical commits `be6199b4463fa51c380ddf86a660b03c7b1ad798` and `1c9f322958f66893062418b63ab1576f4ce6c5b3`. Determine which current `feature/bead-viewer` commits/files/hunks belong to hidden-workspace versus true Beads scope, and identify the cleanest reconstruction path for a Beads-only branch based on `upstream/master`.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-separate-hidden-workspace-from-bead-viewer.md`

**Status:** ✅ Complete

**Results:** Audited `feature/bead-viewer` against `upstream/master` and the canonical hidden-workspace PR #246 commits (`1c9f322958f66893062418b63ab1576f4ce6c5b3`, `be6199b4463fa51c380ddf86a660b03c7b1ad798`).

Exact current commit stack on `feature/bead-viewer` vs `upstream/master`:
1. `92060af` — **hidden-workspace scope**. Recommitted equivalent of canonical `1c9f322` (hidden workspace entries toggle).
2. `b6b1e36` — **hidden-workspace scope**. Equivalent of canonical `be6199b` (respect `showHidden` in remote file tree fallback).
3. `5c883fa` — **Beads scope**, but contains a temporary investigation plan doc that should not be part of the eventual upstream Beads PR. No hidden-workspace code hunks live inside this commit’s code delta; the hidden-workspace contamination is inherited from the two parent commits above it.
4. `93c9c4c` — **Beads scope** (`bead:` markdown handling fix).
5. `214dd64` — **docs/meta only** (branch-consolidation plan note).
6. `dee3ecb` — **docs/meta only** (final Beads branch model note).

Hidden-workspace files/hunks still present on the branch and attributable only to the hidden-workspace commits:
- `server/routes/file-browser.test.ts`
- `server/routes/file-browser.ts`
- `src/contexts/SettingsContext.tsx`
- `src/features/file-browser/FileTreePanel.test.tsx`
- `src/features/file-browser/FileTreePanel.tsx`
- `src/features/file-browser/hooks/useFileTree.test.ts`
- `src/features/file-browser/hooks/useFileTree.ts`
- `src/features/settings/AppearanceSettings.tsx`

Important split finding:
- The current combined Beads commit `5c883fa` does **not** itself modify any of the hidden-workspace files above.
- So the hidden-workspace scope is cleanly isolated at commit level in `92060af` and `b6b1e36`.
- The only hidden-workspace-related content inside a Beads commit is textual/meta reference inside `.plans/2026-04-08-investigate-beads-branch-consolidation.md`, not product code.

Recommended reconstruction method for a clean Beads-only branch on top of `upstream/master`:
- Start a fresh branch from current `upstream/master`.
- Cherry-pick only `5c883fa` and `93c9c4c`.
- Drop `92060af` and `b6b1e36` entirely.
- Omit or rewrite the plan/doc commits (`214dd64`, `dee3ecb`, and the investigation plan file added in `5c883fa`) unless Derrick explicitly wants repo-local planning history preserved on the feature branch.

Risky files likely needing manual review/edit during reconstruction:
- `src/features/markdown/MarkdownRenderer.tsx` — current commit stack shows a duplicate `onOpenBeadId` prop line in the interface after the markdown follow-up; likely harmless to audit now, but it is the highest-risk Beads file to clean while reconstructing.
- `.plans/2026-04-08-investigate-beads-branch-consolidation.md` — contains historical text about the hidden-workspace branch and should almost certainly be excluded from the canonical Beads PR branch.
- `src/App.tsx`, `src/features/chat/MessageBubble.tsx`, `src/features/file-browser/TabbedContentArea.tsx` — Beads-only files, but they sit at integration seams and should be rechecked when replayed onto fresh `upstream/master`.

Concise exclusion rule for the Beads branch:
- Exclude the entire hidden-workspace toggle / `showHidden` file-tree feature, including all changes to file-browser server routes, file-tree hook wiring, settings context/state, file-tree panel plumbing, and appearance settings UI.
- Keep only the Bead viewer API/UI/tab work and the explicit `bead:` markdown-link handling needed to open bead tabs.

---

### Task 2: Rebuild `feature/bead-viewer` as a Beads-only upstream branch

**Bead ID:** `nerve-c9tp`  
**SubAgent:** `coder`  
**Prompt:** Using the audit and treating hidden-workspace PR #246 as canonical scope for exclusion, rebuild `feature/bead-viewer` so it contains only Beads-specific commits/content on top of `upstream/master`. Remove or avoid carrying hidden-workspace commits/content. Preserve actual Beads behavior such as the specialized bead viewer and `bead:` markdown handling when they are truly Beads-specific. Keep history understandable and document the exact commit stack that remains.

**Folders Created/Deleted/Modified:**
- `.plans/`
- only Beads-related code paths actually required after cleanup

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-separate-hidden-workspace-from-bead-viewer.md`
- any Beads-specific files needed in the corrected branch

**Status:** ✅ Complete

**Results:** Rebuilt `feature/bead-viewer` as a fresh Beads-only branch from current `upstream/master` (`a5f7973`) and force-pushed the corrected history to `origin/feature/bead-viewer`.

Method used:
- created a safety backup branch from the pre-rebuild state: `backup/feature-bead-viewer-pre-rebuild-2026-04-08`
- reset local `feature/bead-viewer` to `upstream/master`
- replayed the Beads foundation as a clean rewritten commit by cherry-picking `5c883fa` with `--no-commit`, explicitly dropping the temporary investigation plan file before committing as `5501e33 feat(beads): add bead viewer foundation`
- cherry-picked the Beads follow-up `93c9c4c` cleanly on top, producing `1531caf fix(markdown): preserve bead: links through react-markdown transform`
- excluded hidden-workspace commits `92060af` / `b6b1e36` entirely, along with docs/meta-only branch commits `214dd64` / `dee3ecb`

Final commit stack on `feature/bead-viewer` (oldest → newest):
1. `5501e33` — `feat(beads): add bead viewer foundation`
2. `1531caf` — `fix(markdown): preserve bead: links through react-markdown transform`

Conflicts / resolutions:
- No cherry-pick conflicts occurred against current `upstream/master`.
- The only manual cleanup during reconstruction was excluding `.plans/2026-04-08-investigate-beads-branch-consolidation.md` from the rewritten foundation commit so the branch stayed product-scope-only.

Focused verification run:
- `npm test -- --run server/routes/beads.test.ts src/features/beads/links.test.ts src/features/chat/MessageBubble.test.tsx src/features/markdown/MarkdownRenderer.test.tsx`
- Result: 4 test files passed, 42 tests passed, exit code 0.

Push result:
- `git push --force-with-lease origin feature/bead-viewer`
- Result: success (`214dd64...1531caf feature/bead-viewer -> feature/bead-viewer (forced update)`).

---

### Task 3: Verify the cleaned branch and document the corrected branch model

**Bead ID:** `nerve-ha0i`  
**SubAgent:** `primary`  
**Prompt:** Verify the cleaned `feature/bead-viewer` branch, update this plan with the final corrected commit stack and what hidden-workspace content was removed/excluded, and document the corrected branch model for future sessions. Include any caveats if some combined commit had to be split or rewritten.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-separate-hidden-workspace-from-bead-viewer.md`

**Status:** ✅ Complete

**Results:** Verified the rebuilt branch state directly.

Verification points:
- `feature/bead-viewer` is exactly two commits ahead of `upstream/master` and contains only:
  1. `5501e33` — `feat(beads): add bead viewer foundation`
  2. `1531caf` — `fix(markdown): preserve bead: links through react-markdown transform`
- `feature/bead-viewer` still descends from `upstream/master`.
- Excluded commits are not ancestors of the cleaned branch:
  - hidden-workspace equivalents removed: `92060af`, `b6b1e36`
  - docs/meta commits omitted: `214dd64`, `dee3ecb`
- Recovery branch confirmed present: `backup/feature-bead-viewer-pre-rebuild-2026-04-08`
- Combo remains an integration-only lane; current combo branch reference is `feature/combo-workhorse-all-unmerged-2026-04-07` and should continue to be treated as aggregation/testing scope rather than canonical Beads scope.

Corrected branch model for future sessions:
- `feature/bead-viewer` is now the canonical **Beads-only** feature branch.
- Hidden-workspace remains its own canonical scope under PR #246 and should not be reintroduced into `feature/bead-viewer`.
- Combo remains integration-only and may absorb Beads + hidden-workspace for testing, but it is not the source-of-truth for either isolated feature.
- `backup/feature-bead-viewer-pre-rebuild-2026-04-08` exists as the pre-cleanup recovery/reference branch if historical comparison is needed.

No additional branch surgery was performed in this verification task; this step only documented and confirmed the corrected model.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Re-established and documented the correct split between the Beads-only `feature/bead-viewer` branch, the separate hidden-workspace PR #246 scope, and the integration-only combo branch. The plan now records the final cleaned commit stack, excluded commits, and the backup branch for future recovery/reference.

**Commits:**
- `5501e33` - feat(beads): add bead viewer foundation
- `1531caf` - fix(markdown): preserve bead: links through react-markdown transform
- docs(plan): record verified bead-viewer branch model

**Lessons Learned:** When a feature branch has absorbed unrelated scope, the safest recovery path is to rebuild it from `upstream/master`, preserve only the canonical product commits, and document the resulting branch model immediately so future sessions do not treat integration branches as authoritative.

---

*Completed on 2026-04-08*
