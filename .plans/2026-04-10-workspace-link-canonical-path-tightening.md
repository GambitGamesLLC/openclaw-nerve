# gambit-openclaw-nerve — tighten workspace link matching to canonical paths only

**Date:** 2026-04-10  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Tighten the workspace linkification follow-up so valid workspace-rooted links resolve consistently, while preventing accidental promotion of malformed or unrelated path tails. This now includes both canonical `/workspace/...` references and real host-local absolute paths rooted inside the actual workspace such as `/home/derrick/.openclaw/workspace/...` when they can be normalized to a valid workspace target.

---

## Overview

Dogfood shows the recent wrapper and `file:///workspace/...` improvements are mostly working, but there is still one important mismatch between rendering and intent: some longer paths that contain the real workspace root are being partially promoted or inconsistently resolved. Derrick clarified with a screenshot that a full host-local absolute path like `/home/derrick/.openclaw/workspace/projects/...` is actually a desired valid link target when it points inside the real workspace and successfully opens the file.

So the product rule is not “canonical `/workspace/...` only.” The real boundary is: allow links that can be confidently normalized to a valid path inside the workspace root, including both `/workspace/...` references and absolute host-local paths rooted at `/home/derrick/.openclaw/workspace/...`. What we still want to eliminate is accidental tail-promotion or malformed partial matching where only some interior `workspace/...` fragment becomes clickable without a reliable normalized target.

Because the source of truth for this feature remains `bugfix/workspace-inline-reference-slice`, the follow-up belongs there first. We should implement and validate the tightened normalization/matching behavior on that canonical branch, then roll the clean result into `workhorse` for another dogfood pass.

---

## Tasks

### Task 1: Define the canonical-vs-noncanonical matching boundary

**Bead ID:** `nerve-skp6`  
**SubAgent:** `primary`  
**Prompt:** Confirm the exact rule that distinguishes valid workspace-rooted references from malformed or accidentally promoted path tails. Produce a concrete contract covering what should still link (`/workspace/...`, `file:///workspace/...`, approved wrappers, and absolute host-local paths rooted inside the real workspace such as `/home/derrick/.openclaw/workspace/...`) and what must no longer be promoted (malformed partial tails, unrelated prefixes, and path text that cannot be confidently normalized to a real workspace target).

**Folders Created/Deleted/Modified:**
- `.plans/`
- source/test files only for inspection

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-workspace-link-canonical-path-tightening.md`

**Status:** ✅ Complete

**Results:** Confirmed on the canonical source branch (`bugfix/workspace-inline-reference-slice`, tip `a04876e`) that the current inline matcher still accepts the first configured `/workspace/` slice found anywhere inside a token. That behavior is exactly what allows accidental promotion of malformed tails such as a host-absolute path being reduced to only its interior `/workspace/...` suffix.

Recommended contract for follow-up implementation:
- Accept a token as an inline workspace path only when the entire token is a recognized workspace-rooted form, or when the entire token is wrapped by one balanced approved wrapper pair (`'...'`, `"..."`, `` `...` ``, `<...>`).
- Recognized plain forms are:
  - `/workspace/<descendant>`
  - `file:///workspace/<descendant>`
  - `/home/derrick/.openclaw/workspace/<descendant>` (more generally: an absolute host path whose prefix is the actual workspace root and whose normalized target remains inside that root)
- Bare roots do not linkify: `/workspace/`, `file:///workspace/`, and `/home/derrick/.openclaw/workspace` should remain plain text.
- Clickable visible text should preserve the original matched text exactly, including approved balanced wrappers when present.
- Internal open targets should normalize to the canonical `/workspace/<descendant>` form before calling the open handler. Examples:
  - visible `/workspace/src/App.tsx` → open `/workspace/src/App.tsx`
  - visible `file:///workspace/src/App.tsx` → open `/workspace/src/App.tsx`
  - visible `'/workspace/src/App.tsx'` → open `/workspace/src/App.tsx`
  - visible `/home/derrick/.openclaw/workspace/src/App.tsx` → open `/workspace/src/App.tsx`
  - visible `'/home/derrick/.openclaw/workspace/src/App.tsx'` → open `/workspace/src/App.tsx`
- Do **not** promote interior substrings anymore. These should stay plain text unless the full token itself is canonical: `path=/workspace/src/App.tsx`, `foo/home/derrick/.openclaw/workspace/src/App.tsx`, `/tmp/workspace/src/App.tsx`, or any other token that merely contains `workspace/...` as a tail.
- Avoid ambiguous expansions for now: no support yet for arbitrary `file:///home/.../.openclaw/workspace/...` host-file URIs, no Windows drive-letter forms, no fuzzy matching based only on the segment name `workspace`, and no unmatched-wrapper fallback that turns only the inner suffix into a link.

Implication for Task 2: implement normalization/matching on the canonical branch so inline matching becomes start-anchored (or balanced-wrapper-anchored), add positive tests for full host-absolute workspace-rooted paths, add negative tests for accidental interior-tail promotion, and extend `/api/files/resolve` normalization so a real absolute path under the workspace root resolves the same as its canonical `/workspace/...` equivalent.

---

### Task 2: Implement the tightening on the canonical branch

**Bead ID:** `nerve-3a5n`  
**SubAgent:** `coder`  
**Prompt:** Apply the narrowest clean fix on `bugfix/workspace-inline-reference-slice` so valid workspace-rooted absolute paths normalize and link consistently as full links, while malformed or accidentally promoted tails stop becoming clickable. Preserve the recently-added `/workspace/...`, `file:///workspace/...`, and wrapper behaviors.

**Folders Created/Deleted/Modified:**
- `src/features/markdown/`

**Files Created/Deleted/Modified:**
- likely `src/features/markdown/inlineReferences.tsx`
- likely `src/features/markdown/MarkdownRenderer.test.tsx`
- possibly `src/features/markdown/MarkdownRenderer.tsx` only if needed

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 3: Validate on the canonical branch before integration

**Bead ID:** `nerve-3nn2`  
**SubAgent:** `coder`  
**Prompt:** Run focused validation on `bugfix/workspace-inline-reference-slice`, specifically covering canonical positives and non-canonical negatives, and confirm the branch is still clean/upstream-master-based before any roll-forward into `workhorse`.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `src/features/markdown/`
- `server/routes/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-workspace-link-canonical-path-tightening.md`
- `src/features/markdown/MarkdownRenderer.test.tsx`
- `src/features/markdown/MarkdownRenderer.tsx`
- `src/features/markdown/inlineReferences.tsx`
- `server/routes/file-browser.ts`
- `server/routes/file-browser.test.ts`

**Status:** ✅ Complete

**Results:** Validated on `bugfix/workspace-inline-reference-slice` at `6cf2616` (`Tighten workspace-rooted inline path matching`). Focused checks run:
- `npm test -- --run src/features/markdown/MarkdownRenderer.test.tsx server/routes/file-browser.test.ts` ✅ (93 tests passed: 40 markdown, 53 file-browser)
- `npx tsc --noEmit` ✅

Git/base validation:
- branch is `bugfix/workspace-inline-reference-slice`
- `git merge-base HEAD upstream/master` equals `git rev-parse upstream/master` (`a5f7973eedd218a124759b27fe2c58d5c096b5eb`), so the branch is cleanly based on current `upstream/master`
- branch tip is `6cf2616`
- `git diff --name-only upstream/master...HEAD` is limited to the intended markdown/file-browser files; no `.plans` or `.beads` entries appear in the branch diff
- working tree is not fully clean because the local `.plans/` directory is untracked for planning notes, but that noise is outside the code diff and should not be rolled into integration commits

Conclusion: the canonical follow-up is behaving as intended and is justified for roll-forward into `workhorse`, provided the eventual integration commit excludes local `.plans/` artifacts.

---

### Task 4: Roll the validated tightening into `workhorse`

**Bead ID:** `nerve-gluc`  
**SubAgent:** `coder`  
**Prompt:** Once the canonical branch passes validation, roll the tightening fix into `workhorse`, rerun the minimum focused validation there, and prepare a final dogfood set that proves canonical links still work while non-canonical absolute/local paths no longer promote.

**Folders Created/Deleted/Modified:**
- integration branch only after canonical validation

**Files Created/Deleted/Modified:**
- `server/routes/file-browser.test.ts`
- `server/routes/file-browser.ts`
- `src/features/markdown/MarkdownRenderer.test.tsx`
- `src/features/markdown/inlineReferences.tsx`
- `.plans/2026-04-10-workspace-link-canonical-path-tightening.md`

**Status:** ✅ Complete

**Results:** Rolled the validated follow-up onto `workhorse` by cherry-picking canonical commit `6cf2616` with provenance (`git cherry-pick -x 6cf2616`), producing new `workhorse` commit `5435706` (`Tighten workspace-rooted inline path matching`). The pick applied cleanly with no manual conflict resolution.

Focused validation rerun on `workhorse`:
- `npm test -- --run src/features/markdown/MarkdownRenderer.test.tsx server/routes/file-browser.test.ts` ✅ (105 tests passed: 49 markdown, 56 file-browser)
- `npx tsc --noEmit` ✅

Readiness/handoff notes:
- `workhorse` is now ahead of `origin/workhorse` by 5 commits at `5435706`
- branch diff for the integration commit remains limited to the intended markdown/file-browser files
- local `.plans/` remains untracked for orchestration only and must stay out of any product-branch commit/push
- ready for Derrick’s next dogfood pass after manual `update.sh` + `restore.sh`

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Tightened workspace-rooted inline matching so only full recognized workspace-rooted tokens linkify, while real host-local absolute paths rooted under `/home/derrick/.openclaw/workspace/...` still normalize to canonical `/workspace/...` targets. The validated canonical follow-up was then rolled cleanly into `workhorse` for the next dogfood pass.

**Commits:**
- `6cf2616` - Tighten workspace-rooted inline path matching (canonical validated source)
- `5435706` - Tighten workspace-rooted inline path matching (clean `workhorse` cherry-pick of `6cf2616`)

**Lessons Learned:** When `workhorse` already contains earlier slice equivalents under different SHAs, the cleanest roll-forward is a single `-x` cherry-pick of the validated incremental follow-up. Focused markdown/file-browser tests plus a `tsc --noEmit` pass are enough to justify the next dogfood handoff without rerunning unrelated repo coverage.

---

*Created on 2026-04-10*
