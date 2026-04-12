# gambit-openclaw-nerve — workspace link wrapper + file URI follow-ups

**Date:** 2026-04-10  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Fix the remaining workspace-linkification misses so `/workspace/...` slices still become clickable when wrapped in common formatting delimiters (backticks, single quotes, double quotes, and angle brackets) and when embedded in `file:///workspace/...` URIs, while making the whole matched wrapped token appear/click as one link even though resolution still normalizes to the inner `/workspace/...` path.

---

## Overview

Dogfood narrowed the current behavior nicely. The earlier embedded-slice fix restored many prefixed `/workspace/...` cases, but at least one important URI form still misses: `file:///workspace/avatar.png`. Derrick also wants the assistant’s natural formatting style to remain usable, which means wrapped forms like `` `/workspace/foo` ``, `'/workspace/foo'`, `"/workspace/foo"`, and `</workspace/foo>` should still expose the inner `/workspace/...` slice as a clickable link.

This should be treated as a follow-up to the existing canonical workspace-linkification branch rather than a new `workhorse`-only tweak. The source of truth for this feature is the clean upstream-master-based branch `bugfix/workspace-inline-reference-slice`; any new fix belongs there first, with focused validation on the clean branch before rolling the result back into `workhorse`.

The likely implementation area remains the markdown inline reference extractor in `src/features/markdown/inlineReferences.tsx`, with focused regression coverage in `src/features/markdown/MarkdownRenderer.test.tsx`. The implementation should preserve normalized `/workspace/...` resolution internally, but the desired UX is now broader: for wrapped or URI-prefixed matches, the whole matched token (for example `` `/workspace/foo` ``, `"/workspace/foo"`, `</workspace/foo>`, or `file:///workspace/foo`) should present and behave visually like one clickable link, while the click handler still resolves only the extracted normalized `/workspace/...` path under the hood.

---

## Tasks

### Task 1: Define the exact wrapper/URI matching contract

**Bead ID:** `nerve-2hbe`  
**SubAgent:** `primary`  
**Prompt:** Confirm the exact expected behavior for wrapped and URI-prefixed workspace paths using the current code/tests and Derrick’s examples. Produce a concrete matching contract covering backticks, single quotes, double quotes, angle brackets, `file:///workspace/...`, and punctuation boundary rules we should preserve, including the new UX requirement that the whole matched wrapped token should look/click as one link while resolving only the extracted normalized `/workspace/...` target.

**Folders Created/Deleted/Modified:**
- `.plans/`
- source/test files only for inspection

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-workspace-link-wrapper-followups.md`

**Status:** ✅ Complete

**Results:** Inspected the current canonical implementation on `bugfix/workspace-inline-reference-slice` and pinned down the follow-up contract. Today `src/features/markdown/inlineReferences.tsx` rejects any token that begins with a URI scheme, which is why `file:///workspace/...` still misses, and `src/features/markdown/MarkdownRenderer.tsx` explicitly skips `<code>` nodes, which is why backtick-wrapped forms do not linkify at all yet.

Recommended contract for Task 2:
- **Normalized target stays canonical:** every accepted wrapped/URI form must still call `onOpenWorkspacePath()` with the inner normalized `/workspace/...` path only.
- **Whole-token clickable text for approved wrappers/prefixes:** the rendered link text should be the full matched token for these cases, not just the inner slice:
  - `file:///workspace/...` → visible/clickable text `file:///workspace/...`, resolved target `/workspace/...`
  - `` `/workspace/...` `` → visible/clickable text includes both backticks, resolved target `/workspace/...`
  - `'/workspace/...'` → visible/clickable text includes both quotes, resolved target `/workspace/...`
  - `"/workspace/..."` → visible/clickable text includes both quotes, resolved target `/workspace/...`
  - `</workspace/...>` → visible/clickable text includes `<` and `>`, resolved target `/workspace/...`
- **Trailing punctuation still stays outside the link:** preserve the current sentence-boundary behavior for trailing `.,:;!?` after a valid token, e.g. `"/workspace/foo".` should render the quoted token as the link and leave the final `.` plain text.
- **Do not promote unmatched closers into the link:** if there is no matching recognized opener, keep existing trimming behavior for stray closing `) ] } ' "` at token end.
- **Reject empty targets:** bare `/workspace/` and bare `file:///workspace/` remain non-links.

Implementation path clarified for the canonical branch: Task 2 likely needs a small parser upgrade rather than only broadening the current trailing-trim regex. The cleanest path is to teach the inline matcher about a narrow allowlist of whole-token wrappers/prefixes (including `file:///`) and to let inline code spans opt into that same path-aware rendering for workspace targets, instead of blanket-skipping all `<code>` children. Focused regression tests should cover positive whole-token rendering, negative bare-prefix cases, and punctuation staying outside the link.

---

### Task 2: Implement the follow-up on the canonical clean branch

**Bead ID:** `nerve-cmi6`  
**SubAgent:** `coder`  
**Prompt:** Apply the narrowest clean fix on `bugfix/workspace-inline-reference-slice` so wrapped `/workspace/...` tokens and `file:///workspace/...` forms linkify correctly, with the whole matched token appearing/clicking as one link while the resolver still uses only the normalized inner `/workspace/...` target. Account for the fact that backtick-wrapped cases currently fail at the markdown tree level because inline `<code>` nodes are skipped before the inline path matcher runs.

**Folders Created/Deleted/Modified:**
- `src/features/markdown/`

**Files Created/Deleted/Modified:**
- `src/features/markdown/inlineReferences.tsx`
- `src/features/markdown/MarkdownRenderer.tsx`
- `src/features/markdown/MarkdownRenderer.test.tsx`

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 3: Validate on the clean branch before integration

**Bead ID:** `nerve-k8tv`  
**SubAgent:** `coder`  
**Prompt:** Run focused validation for the wrapper/URI follow-up on the canonical clean branch, making sure tests/build pass before anything is rolled into `workhorse`.

**Folders Created/Deleted/Modified:**
- `src/features/markdown/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/markdown/MarkdownRenderer.test.tsx`
- `src/features/markdown/MarkdownRenderer.tsx`
- `src/features/markdown/inlineReferences.tsx`
- `.plans/2026-04-10-workspace-link-wrapper-followups.md`

**Status:** ✅ Complete

**Results:** Validated on `bugfix/workspace-inline-reference-slice` with focused coverage plus a nearby build sanity check. `npm test -- --run src/features/markdown/MarkdownRenderer.test.tsx` passed all 38 tests, including the new wrapper/file-URI cases (`linkifies wrapped file URIs while normalizing the opened workspace path`, `linkifies wrapped workspace paths as a single inline token`, `keeps trailing punctuation outside wrapped workspace links`, `does not linkify bare wrapped workspace prefixes or bare file workspace prefixes`, `does not turn unmatched wrappers into whole wrapped links`, and `linkifies configured path text inside inline code spans`). As a prudent adjacent check, `npm run build` also passed, covering TypeScript + client build + server build; only pre-existing Vite chunk-size/dynamic-import warnings were emitted, with no failure.

Branch/base validation: `git merge-base --is-ancestor upstream/master HEAD` succeeded and the merge base is `a5f7973`, so the canonical branch remains upstream-master-based. `git diff --name-only upstream/master...HEAD` shows only the three intended markdown files and no `.plans`/`.beads` entries in the branch diff. The worktree is not fully clean because the repo has an untracked `.plans/` directory (this plan file), but that noise is outside the branch diff and should not be committed as part of the roll-forward. Based on the focused tests + successful build, the canonical follow-up looks safe to roll into `workhorse` now, but Task 4 should do the actual integration and revalidation there.

---

### Task 4: Roll the validated follow-up into `workhorse`

**Bead ID:** `nerve-w4fn`  
**SubAgent:** `coder`  
**Prompt:** Once the canonical branch passes validation, roll the follow-up into `workhorse`, rerun the minimum focused validation there, and prepare manual dogfood strings that exercise wrapped and `file:///workspace/...` cases.

**Folders Created/Deleted/Modified:**
- integration branch only after canonical fix is validated
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/markdown/inlineReferences.tsx`
- `src/features/markdown/MarkdownRenderer.tsx`
- `src/features/markdown/MarkdownRenderer.test.tsx`
- `.plans/2026-04-10-workspace-link-wrapper-followups.md`

**Status:** ✅ Complete

**Results:** Inspected repo state first, then switched from `bugfix/workspace-inline-reference-slice` to `workhorse` and cleanly cherry-picked follow-up commit `a04876e` as new `workhorse` commit `719db38` (`Fix wrapped workspace inline path links`). The roll-forward applied without conflicts, preserving the canonical clean-branch change as an isolated integration commit on top of `workhorse` (`40e9e14` → `719db38`).

Focused revalidation on `workhorse` passed:
- `npm test -- --run src/features/markdown/MarkdownRenderer.test.tsx` ✅ — 47/47 tests passed
- `npm run build` ✅ — client + server build passed; only the same pre-existing Vite chunk-size / dynamic-import warnings were emitted

Manual dogfood strings prepared for Derrick after `update.sh` + `restore.sh`:
- `Open file:///workspace/src/App.tsx, now`
- `Open '/workspace/src/App.tsx' "/workspace/src/Main.tsx" </workspace/src/Guide.md> now`
- `Open '/workspace/src/App.tsx', now`
- ``Use `file:///workspace/src/App.tsx` and `/workspace/src/Main.tsx` later``

Readiness state: `workhorse` is ready for manual dogfood of wrapped and file-URI workspace links once Derrick refreshes the installed wrappers manually. `.plans/` remains untracked in the worktree and was not committed to the product branch.

---

## Final Results

**Status:** ✅ Ready for manual dogfood

**What We Built:** Rolled the validated wrapper + `file:///workspace/...` inline-link follow-up from the canonical clean branch into `workhorse`, preserving full-token click/render behavior for wrapped workspace paths and file URIs while still normalizing the opened target to the inner `/workspace/...` path.

**Commits:**
- `a04876e` - Fix wrapped workspace inline path links (canonical clean branch)
- `719db38` - Fix wrapped workspace inline path links (`workhorse` cherry-pick)

**Lessons Learned:** Keeping the canonical clean-branch fix isolated made the `workhorse` roll-forward a clean cherry-pick. The minimum confidence bar for this regression area is the focused markdown renderer test file plus a full build, which was enough to re-justify dogfood readiness after integration.

---

*Created on 2026-04-10*
