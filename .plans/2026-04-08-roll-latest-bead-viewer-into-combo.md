# Roll Latest Bead Viewer Branch into Combo

**Date:** 2026-04-08  
**Status:** Draft  
**Agent:** Chip 🐱‍💻

---

## Goal

Make sure `feature/combo-workhorse-all-unmerged-2026-04-07` includes the latest `feature/bead-viewer` updates, especially the completed markdown-document-preview `bead:` routing fix, while keeping combo as an integration-only branch.

---

## Overview

`feature/bead-viewer` is now the canonical Beads-only source branch, and it includes the completed markdown-document-preview routing fix at commit `1de7195` (`Fix bead link routing in markdown document preview`). The combo branch should carry that latest Beads work for integration/dogfood testing, but combo itself must remain a roll-up branch rather than the source of truth.

This task will verify the delta between `feature/bead-viewer` and combo, roll the missing Beads commits into combo, verify the result with focused tests, and document the final combo state for future sessions.

---

## Tasks

### Task 1: Audit the current delta between `feature/bead-viewer` and combo

**Bead ID:** `nerve-btev`  
**SubAgent:** `research`  
**Prompt:** Compare `feature/bead-viewer` to `feature/combo-workhorse-all-unmerged-2026-04-07` and identify exactly which Beads commits are missing from combo, including whether the markdown-document-preview routing fix `1de7195` is absent. Document the roll-forward set needed.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-roll-latest-bead-viewer-into-combo.md`

**Status:** ✅ Complete

**Results:** Audited `feature/bead-viewer` against `feature/combo-workhorse-all-unmerged-2026-04-07` with `git log --left-right --cherry-pick`, `git cherry -v`, targeted file diffs, and `git range-diff`. Exact canonical Beads commits missing from combo are `5501e33` (`feat(beads): add bead viewer foundation`), `1531caf` (`fix(markdown): preserve bead: links through react-markdown transform`), and `1de7195` (`Fix bead link routing in markdown document preview`). Combo does contain related follow-up work under different hashes, but not as patch-equivalent matches: `d2015b8` is a broader combo-side variant of the markdown transform fix, and `20e2b8c` is a combo-side variant of the markdown preview routing fix. `git cherry -v` reports all three canonical bead-viewer commits as unmatched, so combo has not actually absorbed the canonical bead-viewer stack. `5501e33` has no equivalent on combo and is the major missing foundation commit. Recommended roll-forward method: cherry-pick the canonical stack in branch order (`5501e33`, `1531caf`, `1de7195`) onto combo, resolving overlaps against `d2015b8` / `20e2b8c` in favor of the canonical bead-viewer branch state rather than trying to preserve both divergent variants.

---

### Task 2: Roll the missing Beads commits into combo and verify

**Bead ID:** `nerve-9zpk`  
**SubAgent:** `coder`  
**Prompt:** On `feature/combo-workhorse-all-unmerged-2026-04-07`, roll in the missing commits from `feature/bead-viewer`, preserving combo’s role as an integration branch. Resolve conflicts carefully, run focused tests for the bead-link markdown preview path, and keep the roll-forward limited to the proven Beads changes.

**Folders Created/Deleted/Modified:**
- `.plans/`
- only the code/test paths touched by the Beads roll-forward

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-roll-latest-bead-viewer-into-combo.md`
- code/test files required by the roll-forward

**Status:** ✅ Complete

**Results:** Claimed bead `nerve-9zpk`, checked out `feature/combo-workhorse-all-unmerged-2026-04-07`, and rolled the canonical `feature/bead-viewer` stack forward in order starting from `5501e33`. Cherry-picking `5501e33` surfaced content/add-add conflicts in the files that overlapped combo’s earlier variants (`d2015b8`, `20e2b8c`); those were resolved by taking the final canonical `feature/bead-viewer` versions of the affected Beads, markdown, chat, file-browser, and server files so combo matches the cleaned source branch state. Because that resolution already incorporated the later canonical changes, `1531caf` and `1de7195` became empty during cherry-pick and were skipped rather than duplicated. Net combo code commit: `ad1c0dc` (`feat(beads): add bead viewer foundation` on combo, carrying the canonical final bead-viewer content for this stack). Verification: `git diff --stat feature/bead-viewer -- <rolled files>` returned no output for the rolled file set, confirming combo now matches canonical branch content there. Focused tests passed with `npm test -- --run src/features/beads/links.test.ts src/features/markdown/MarkdownRenderer.test.tsx src/features/file-browser/MarkdownDocumentView.test.tsx src/features/file-browser/TabbedContentArea.test.tsx src/features/chat/MessageBubble.test.tsx server/routes/beads.test.ts` → `6` test files passed, `48` tests passed. One existing React test warning appeared during `TabbedContentArea.test.tsx` about nested `<button>` markup in the tab component test render, but the suite still passed and this task did not change that structure. Push/close details are recorded with the execution commit and bead closure.

---

### Task 3: Verify combo branch dogfood readiness and document final state

**Bead ID:** `nerve-2xmd`  
**SubAgent:** `primary`  
**Prompt:** Verify combo now contains the latest Beads updates from `feature/bead-viewer`, document the exact combo commit(s), test results, and expected dogfood behavior, then update the final results in this plan.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-roll-latest-bead-viewer-into-combo.md`

**Status:** ⏳ Pending

**Results:** Pending.

---

## Final Results

**Status:** ⏳ Pending

**What We Built:** Pending.

**Commits:**
- Pending

**Lessons Learned:** Pending.

---

*Drafted on 2026-04-08*
