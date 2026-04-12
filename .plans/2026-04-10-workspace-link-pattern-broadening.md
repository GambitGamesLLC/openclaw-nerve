# gambit-openclaw-nerve — broaden workspace link matching

**Date:** 2026-04-10  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Adjust the OpenClaw Nerve link-detection setting/implementation on `workhorse` so chat messages linkify paths that contain `/workspace/` anywhere in the string, not just direct exact-prefix `/workspace/...` paths.

---

## Overview

Right now, the effective behavior appears too narrow: only direct `/workspace/...` matches become clickable in chat. Derrick wants a broader rule so strings with any leading prefix before `/workspace/` and any valid suffix after it also become links. The intent is effectively a wildcard shape like `*/workspace/*`.

We confirmed that the capability was originally added via the editable workspace-linkification configuration path introduced by an earlier PR already present in `workhorse` history, but the limiting behavior is enforced by code in the markdown inline-reference matcher. A first implementation/validation pass was mistakenly performed directly on `workhorse`, which violates the branch-ownership rule Derrick reinforced: real fixes belong either on the owning unmerged feature branch or, if that feature is already merged upstream, on a fresh clean branch from `upstream/master`, with `workhorse` reserved only for downstream roll-forward and dogfood.

So this plan is now in repair mode. The completed ownership and implementation work below remains useful as technical discovery, but the next execution order changes: first remove the mistaken product change from `workhorse`, then recreate the same narrow fix on a fresh clean upstream-master-based branch, validate it there, and only after that roll the clean branch back into `workhorse` for dogfood. The user-visible goal stays the same, but provenance must be corrected before this becomes canonical.

---

## Tasks

### Task 1: Locate the editable workspace-linkification file and current rule

**Bead ID:** `nerve-kb9s`  
**SubAgent:** `primary`  
**Prompt:** Find the editable file in `gambit-openclaw-nerve` that controls chat path linkification for `/workspace/...` paths. Derrick expects this capability to have come from an earlier PR already present in `workhorse` history. Confirm the current rule, document the exact file(s), and verify whether the broader `*/workspace/*` behavior can be implemented by updating that file alone or if supporting code also needs adjustment.

**Folders Created/Deleted/Modified:**
- `.plans/`
- source folders to inspect once ownership is known

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-workspace-link-pattern-broadening.md`
- diagnostic-only until ownership is proven

**Status:** ✅ Complete

**Results:** Located the ownership chain on `workhorse` in the earlier PR `c31601d` / `25bf206` (`feat(chat): add configurable workspace path links`, PR #239). The editable workspace config is exposed as `chatPathLinks` → `CHAT_PATH_LINKS.json` via `server/routes/workspace.ts`, surfaced in the Config tab via `src/features/workspace/tabs/ConfigTab.tsx`, loaded in `src/App.tsx`, and parsed by `src/features/chat/chatPathLinks.ts`. The actual inline chat/markdown linkification rule lives in `src/features/markdown/inlineReferences.tsx`, where `isConfiguredPathCandidate()` currently only returns true when the token itself `startsWith(prefix)` and is longer than the prefix. With the default/configured prefix `/workspace/`, this means only direct token-leading `/workspace/...` strings are linkified. Broadening to intended `*/workspace/*` behavior cannot be done by editing `CHAT_PATH_LINKS.json` alone; it needs supporting code changes in the matcher/extractor in `src/features/markdown/inlineReferences.tsx` (and likely focused tests in `src/features/markdown/MarkdownRenderer.test.tsx`) so embedded `/workspace/` substrings can be extracted and the clickable href passed as the normalized `/workspace/...` slice rather than the entire surrounding token.

---

### Task 2: Implement broader `/workspace/` path matching cleanly

**Bead ID:** `nerve-4cgu`  
**SubAgent:** `coder`  
**Prompt:** Once ownership is known, implement the narrowest clean change so chat linkification matches any string containing `/workspace/` with valid path suffix content, equivalent in intent to `*/workspace/*`, without introducing false positives that should not be clickable.

**Folders Created/Deleted/Modified:**
- `src/features/markdown/`

**Files Created/Deleted/Modified:**
- `src/features/markdown/inlineReferences.tsx`
- `src/features/markdown/MarkdownRenderer.test.tsx`

**Status:** ✅ Complete

**Results:** Replaced the direct-prefix-only inline matcher in `src/features/markdown/inlineReferences.tsx` with a small extractor that looks for the configured anchor anywhere inside each non-whitespace token, then splits the token into plain-text prefix + linked normalized path slice. That keeps the configured `/workspace/` anchor semantics, still refuses bare `/workspace/` with no suffix, and avoids linking the surrounding token text (`file://`, `~/project`, etc.). Added focused regression coverage in `src/features/markdown/MarkdownRenderer.test.tsx` for direct `/workspace/...` linkification, embedded `file:///workspace/...`, embedded home-relative `.../workspace/...` with trailing punctuation preserved outside the link, and the negative bare-prefix case. Also ran `pnpm vitest run src/features/markdown/MarkdownRenderer.test.tsx` successfully (43 tests passed), which gives Task 3 a strong starting point even though broader dogfood validation is still pending there.

---

### Task 3: Add regression coverage and dogfood verification

**Bead ID:** `nerve-q8ug`  
**SubAgent:** `coder`  
**Prompt:** Add or update focused tests for direct `/workspace/...` matches plus embedded-prefix cases, run the relevant validation, and verify the new linkification behavior on `workhorse` in chat-facing surfaces.

**Folders Created/Deleted/Modified:**
- `src/features/markdown/`
- `src/features/file-browser/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/markdown/inlineReferences.tsx`
- `src/features/markdown/MarkdownRenderer.test.tsx`
- `.plans/2026-04-10-workspace-link-pattern-broadening.md`

**Status:** ✅ Complete

**Results:** Validated the broadened matcher on branch `workhorse`. Confirmed the repo state still matches the intended implementation-only scope: working tree changes are limited to `src/features/markdown/inlineReferences.tsx`, `src/features/markdown/MarkdownRenderer.test.tsx`, and the active `.plans/` entry. Beyond the already-passing focused renderer test, ran `pnpm vitest run src/features/markdown/MarkdownRenderer.test.tsx src/features/file-browser/MarkdownDocumentView.test.tsx` and got 48/48 tests passing across both relevant renderer/consumer suites. Also ran `pnpm exec eslint src/features/markdown/inlineReferences.tsx src/features/markdown/MarkdownRenderer.test.tsx` with a clean exit. This is enough targeted validation to treat the branch as ready for local dogfood/use without paying the cost of unrelated full-project validation.

---

## Repair Tasks

### Task 4: Remove mistaken implementation from `workhorse`

**Bead ID:** `nerve-uqt1`  
**SubAgent:** `coder`  
**Prompt:** Claim the bead, identify the exact uncommitted workspace-linkification changes currently living only on `workhorse`, back them out cleanly from `workhorse` without disturbing unrelated work, and report the resulting branch state so a clean upstream-master-based fix branch can be created next.

**Folders Created/Deleted/Modified:**
- `src/features/markdown/`

**Files Created/Deleted/Modified:**
- `src/features/markdown/inlineReferences.tsx`
- `src/features/markdown/MarkdownRenderer.test.tsx`

**Status:** ✅ Complete

**Results:** Claimed bead `nerve-uqt1`, inspected `workhorse`, and confirmed the mistaken workspace-linkification work existed only as uncommitted working-tree edits in the intended narrow scope: `src/features/markdown/inlineReferences.tsx` and `src/features/markdown/MarkdownRenderer.test.tsx` (with separate untracked `.plans/` state intentionally left alone). Backed out only those two product files with `git checkout -- ...`, leaving no product-file diff on `workhorse`. Post-revert `git status --short --branch` shows `## workhorse...origin/workhorse` with only `?? .plans/`. Verified the broadened embedded-path implementation is no longer present: `inlineReferences.tsx` is back to the original direct-prefix-only `isConfiguredPathCandidate()` matcher, and the added embedded-path/bare-prefix regression cases are gone from `MarkdownRenderer.test.tsx`. No committed unexpected product changes were found, so the branch is now clean enough for the next lane to recreate the fix properly from a fresh `upstream/master`-based branch.

---

### Task 5: Recreate the fix on a clean upstream-master-based branch

**Bead ID:** `nerve-hg9z`  
**SubAgent:** `coder`  
**Prompt:** After `workhorse` is cleaned, create a fresh bugfix branch from latest `upstream/master`, replay the narrow embedded `/workspace/...` linkification fix there, run the focused validation on that clean branch, and report the exact branch name, commits, and validation results.

**Folders Created/Deleted/Modified:**
- owning source/test folders only on the clean bugfix branch

**Files Created/Deleted/Modified:**
- `src/features/markdown/inlineReferences.tsx`
- `src/features/markdown/MarkdownRenderer.test.tsx`

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 6: Roll the clean fix branch back into `workhorse` for dogfood

**Bead ID:** `nerve-t2r6`  
**SubAgent:** `coder`  
**Prompt:** Once the new clean upstream-master-based fix branch is validated, roll it into `workhorse` using the cleanest appropriate integration method, rerun the focused validation there, and prepare the branch for local dogfood.

**Folders Created/Deleted/Modified:**
- `src/features/markdown/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/markdown/inlineReferences.tsx`
- `src/features/markdown/MarkdownRenderer.test.tsx`
- `.plans/2026-04-10-workspace-link-pattern-broadening.md`

**Status:** ✅ Complete

**Results:** Claimed bead `nerve-t2r6`, inspected repo state from the clean source branch lane, then switched to `workhorse` and rolled the canonical fix in with a clean `git cherry-pick -x 36cca92`. The cherry-pick landed without conflicts and produced `workhorse` commit `4e3c8fb` (`fix(markdown): linkify embedded workspace path slices`), scoped only to `src/features/markdown/inlineReferences.tsx` and `src/features/markdown/MarkdownRenderer.test.tsx`. Reran focused validation on `workhorse` with `npm test -- --run src/features/markdown/MarkdownRenderer.test.tsx` and got 42/42 tests passing (1 test file passed). Branch state after integration is `workhorse...origin/workhorse [ahead 1]` plus the intentionally untracked `.plans/` directory, so no `.plans`, `.beads`, or orchestration artifacts were introduced into the product commit. Manual dogfood should now verify that chat/markdown text containing embedded strings like `file:///workspace/...` or other prefixed text slices still renders a clickable link for only the `/workspace/...` portion while leaving surrounding prefix/punctuation plain text.

---

## Final Results

**Status:** ✅ Complete — ready for dogfood on `workhorse`

**What We Built:** The embedded `/workspace/...` linkification fix now exists in the correct two-step provenance chain: canonical clean source commit `36cca92` on `bugfix/workspace-inline-reference-slice`, then downstream integration onto `workhorse` as cherry-pick `4e3c8fb`. The resulting `workhorse` branch is ready for local dogfood with only the intended narrow product-file delta plus the separate untracked plan workspace.

**Commits:**
- `36cca92` - `fix(markdown): linkify embedded workspace path slices` (canonical clean source branch)
- `4e3c8fb` - `fix(markdown): linkify embedded workspace path slices` (cherry-picked onto `workhorse`)

**Lessons Learned:** For this repo, correctness includes branch provenance. Rebuilding the fix on a clean `upstream/master`-based branch first, then rolling it into `workhorse`, preserved a clean history without sacrificing the already-proven narrow implementation.

---

*Completed on 2026-04-10*
