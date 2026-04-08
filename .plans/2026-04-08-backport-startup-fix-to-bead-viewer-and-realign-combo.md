# Backport Startup Fix to Bead Viewer and Realign Combo

**Date:** 2026-04-08  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Move the Nerve startup regression fix to the canonical `feature/bead-viewer` branch if the bug originated from the Beads roll-forward, then realign combo so it carries the fix only via the canonical Beads branch.

---

## Overview

A live Nerve outage was fixed directly on `feature/combo-workhorse-all-unmerged-2026-04-07` with commit `77a7962` (`Fix Nerve startup TypeScript regressions`). Derrick correctly pointed out that if the regression was introduced by Beads work rolled from `feature/bead-viewer`, then the fix belongs first on the canonical Beads branch, not uniquely on combo.

This correction task will identify whether the broken code path came from the Beads branch state, backport or recreate the fix on `feature/bead-viewer` if so, verify that branch, and then ensure combo is aligned from the corrected canonical source rather than carrying a combo-only divergence.

---

## Tasks

### Task 1: Determine whether the startup regression originated from `feature/bead-viewer`

**Bead ID:** `nerve-w6av`  
**SubAgent:** `research`  
**Prompt:** Inspect commit `77a7962` and the relevant files on `feature/bead-viewer` versus combo. Determine whether the startup regression fixed on combo was introduced by Beads-branch content that should also be corrected on `feature/bead-viewer`, or whether it was combo-only integration fallout.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-backport-startup-fix-to-bead-viewer-and-realign-combo.md`

**Status:** ✅ Complete

**Results:** Verified that `feature/bead-viewer` matches the pre-fix combo state for both affected files (`git diff feature/bead-viewer 77a796256ce88f362ee2ba2934571956832ed7e6^ -- src/features/markdown/MarkdownRenderer.tsx src/features/beads/BeadViewerTab.tsx` returned no diff). On `feature/bead-viewer`, `src/features/markdown/MarkdownRenderer.tsx` still contains the duplicate `onOpenBeadId` prop declaration, and `src/features/beads/BeadViewerTab.tsx` still requires `onOpenBeadId` / `onOpenWorkspacePath` even though `src/features/file-browser/TabbedContentArea.tsx` passes those callbacks as optional props. Conclusion: the regression is not combo-only integration fallout; it is present on the canonical `feature/bead-viewer` branch, so commit `77a7962` (or a clean equivalent) belongs canonically on `feature/bead-viewer` and should be backported/cherry-picked there before combo is realigned.

---

### Task 2: Put the fix on `feature/bead-viewer` if it belongs there

**Bead ID:** `nerve-fjhz`  
**SubAgent:** `coder`  
**Prompt:** If the regression originated from Beads branch content, apply the startup-fix commit (or a clean equivalent) to `feature/bead-viewer`, verify build/tests, and push the corrected canonical branch.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `src/features/beads/`
- `src/features/markdown/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-backport-startup-fix-to-bead-viewer-and-realign-combo.md`
- `src/features/beads/BeadViewerTab.tsx`
- `src/features/markdown/MarkdownRenderer.tsx`

**Status:** ✅ Complete

**Results:** Applied the minimal canonical equivalent of combo commit `77a796256ce88f362ee2ba2934571956832ed7e6` directly on `feature/bead-viewer` without bringing over combo-only plan churn. Updated `src/features/markdown/MarkdownRenderer.tsx` to remove the duplicate `onOpenBeadId` prop declaration, and updated `src/features/beads/BeadViewerTab.tsx` so `onOpenBeadId` / `onOpenWorkspacePath` are optional and the related UI buttons safely disable when those callbacks are absent. Verification passed with `npm run build` and focused tests via `npx vitest run src/features/markdown/MarkdownRenderer.test.tsx src/features/file-browser/TabbedContentArea.test.tsx` (35 tests passed). Branch is ready to push as the canonical source of the fix.

---

### Task 3: Re-align combo with the corrected canonical branch and document the final state

**Bead ID:** `nerve-jb0k`  
**SubAgent:** `primary`  
**Prompt:** Ensure combo no longer carries a unique startup-fix divergence if the fix properly belongs to `feature/bead-viewer`. Document the final branch relationship and exact commit mapping in this plan.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-backport-startup-fix-to-bead-viewer-and-realign-combo.md`

**Status:** ✅ Complete

**Results:** Compared canonical commit `105e43455f87eec2021579f0d2c9bee6739ac238` on `feature/bead-viewer` with combo commit `77a796256ce88f362ee2ba2934571956832ed7e6` for the affected code paths and found no diff in `src/features/markdown/MarkdownRenderer.tsx` or `src/features/beads/BeadViewerTab.tsx`. That means combo is already functionally aligned with the canonical startup fix, but via its earlier combo-local commit rather than by ancestry from `feature/bead-viewer`. No additional cherry-pick was applied to combo because it would create duplicate/empty code churn and would also drag branch-specific plan history across branches. Final mapping: canonical source of truth is now `feature/bead-viewer@105e434`; combo remains semantically aligned at `feature/combo-workhorse-all-unmerged-2026-04-07@77a7962` and should pick up the canonical lineage naturally the next time combo is rebuilt/rebased/merged from the corrected Beads branch.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Restored the Nerve startup regression fix to its proper canonical home on `feature/bead-viewer`, then verified combo already contains the same code fix and therefore did not need any additional code change. The final state is truthful about both lineage and semantics: `feature/bead-viewer` now owns the canonical fix via `105e434`, while combo still contains an earlier equivalent repair at `77a7962` until a future combo rebuild/rebase absorbs the canonical branch history.

**Commits:**
- `105e434` - Fix Nerve startup TypeScript regressions
- docs(plan): record combo realignment against canonical bead-viewer startup fix

**Lessons Learned:** When a hotfix lands on an integration branch first, realignment should prefer proving semantic equivalence before forcing another cherry-pick. If the code is already identical, document the mapping and let the next branch rebuild restore ancestry cleanly instead of manufacturing extra churn.

---

*Completed on 2026-04-08*
