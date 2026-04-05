---
plan_id: plan-2026-04-04-generic-workspace-path-links-feature
bead_ids:
  - Pending
---
# gambit-openclaw-nerve

**Date:** 2026-04-04  
**Status:** Draft  
**Agent:** Chip 🐱‍💻

---

## Goal

Build and validate a generic Nerve feature where chat-mentioned paths are linkified via configurable match patterns, then clicking a matched workspace path focuses/opens the matching workspace item. After local validation, prepare the upstream issue/PR only once we are satisfied with the implementation.

---

## Overview

We want the stronger primitive, not another Beads/Plans-only special case. The feature should support configurable chat path-linkification patterns, render matched strings as clickable links, and route clicks into Nerve’s existing safe workspace open/reveal behavior. That gives us one reusable path-linking mechanism that local Beads/Plans conventions can build on top of without leaking those conventions into upstream core logic.

The current preferred detection strategy is intentionally simple: upstream should support a configurable pattern file or equivalent config surface, and our local deployment can prefer absolute workspace-rooted paths as the main house style. A narrow default like matching absolute paths containing `/workspace/` is much more defensible upstream than broad heuristic matching or workspace-wide indexing. Pattern matching should decide only whether text becomes clickable; the existing resolver remains the source of truth for whether a clicked path is valid, in-bounds, excluded, a file, or a folder.

The click semantics are explicit. For both folders and files, clicking a linked path should focus the item in the left workspace sidebar as if the user selected it there manually. If the path resolves to a supported file type, Nerve should also open that file in a new primary-area tab using the existing file-view path. If the file type is unsupported, Nerve should still focus/reveal it in the sidebar but should not open a pointless tab.

We already know most of the safe open/reveal behavior exists. The likely implementation work is in configurable match-pattern loading, chat-side linkification against those patterns, and plumbing click handlers from chat rendering into the existing path-opening flow. We should implement this locally first, test it thoroughly, and only then write the maintainer-facing upstream issue and PR from a position of confidence.

---

## Tasks

### Task 1: Design the configurable pattern-matching architecture and technical approach

**Bead ID:** `nerve-v06x`  
**SubAgent:** `research`  
**Prompt:** Audit the current path-linking/open-path behavior in `gambit-openclaw-nerve` and produce an implementation plan for configurable chat-rendered path links. Define the config surface (pattern file or equivalent), pattern semantics for v1, default matching strategy centered on absolute `/workspace/`-anchored paths, excluded contexts (inline code, fenced code, existing markdown links), trust-boundary requirements, click behavior for files vs folders vs unsupported files, and the minimum code surfaces to change. Claim bead `nerve-v06x` on start with `bd update nerve-v06x --status in_progress --json` and close it on completion with `bd close nerve-v06x --reason "Designed configurable chat path-link architecture" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `src/`
- `server/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-04-generic-workspace-path-links-feature.md`
- likely `src/features/chat/...`
- likely `src/components/...`
- likely path reference/linkification helpers

**Status:** ✅ Complete

**Results:** Audited the current stack and settled on a conservative v1 architecture: add a workspace-editable `CHAT_PATH_LINKS.json` config surface (via the existing workspace config plumbing), use simple prefix-based matching rather than regex/glob semantics, default to `/workspace/`-anchored absolute path matching, preserve existing exclusions for inline code/fenced code/markdown links/URLs, and keep `/api/files/resolve` as the sole authority for path validity and file-vs-folder behavior. Chat currently lacks `onOpenPath` wiring, and the resolver will need a small normalization step to accept `/workspace/...` aliases and translate them to workspace-relative paths.

---

### Task 2: Implement configurable chat path-link matching and workspace open behavior

**Bead ID:** `nerve-2w17`  
**SubAgent:** `coder`  
**Prompt:** Implement configurable clickable chat path links using the approved design. Add a path-match configuration surface, ship a conservative default centered on absolute `/workspace/`-anchored paths, and reuse existing safe open/reveal behavior instead of inventing a parallel path-opening stack. Ensure clicks focus the item in the workspace sidebar; supported files should open in a primary-area tab, while unsupported files should remain reveal-only. Preserve existing behavior for existing markdown links, inline code, and code fences, and do not leak Gambit-specific Beads/Plans conventions into upstream-oriented core behavior. Claim bead `nerve-2w17` on start with `bd update nerve-2w17 --status in_progress --json` and close it on completion with `bd close nerve-2w17 --reason "Implemented configurable chat path-link feature" --json`.

**Folders Created/Deleted/Modified:**
- `src/`
- `server/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-04-generic-workspace-path-links-feature.md`
- `src/features/chat/chatPathLinks.ts`
- `src/features/chat/ChatPanel.tsx`
- `src/features/chat/MessageBubble.tsx`
- `src/features/markdown/MarkdownRenderer.tsx`
- `src/features/markdown/inlineReferences.tsx`
- `src/features/workspace/tabs/ConfigTab.tsx`
- `src/App.tsx`
- `server/routes/workspace.ts`
- `server/routes/file-browser.ts`
- `src/features/markdown/MarkdownRenderer.references.test.tsx`
- `server/routes/file-browser.test.ts`

**Status:** ✅ Complete

**Results:** Implemented configurable chat path-linking with a new workspace-editable `CHAT_PATH_LINKS.json` config surface exposed as `chatPathLinks`. V1 matching is simple prefix-based detection with a conservative default of `/workspace/`. Chat now threads `onOpenPath` through the render stack, and `/api/files/resolve` now normalizes `/workspace/...` aliases to workspace-relative paths before validation. Supported files open in tabs while still revealing in the file tree; directories and unsupported files remain reveal-only. Validation passed for targeted tests and `npm run build`; repo-wide `npm run lint` still reports pre-existing unrelated failures, and the new slice-specific lint issue encountered during implementation was fixed.

---

### Task 3: Test and dogfood the configurable path-link feature locally

**Bead ID:** `nerve-ub4v`  
**SubAgent:** `primary`  
**Prompt:** Validate the configurable chat path-linking feature locally. Before manual dogfood, ensure the implementation is committed/pushed to the branch referenced by `~/.openclaw/.env` so `update.sh` + `restore.sh` can deploy it. Then run lint/build/tests as available and manually verify representative cases in Nerve: absolute workspace-rooted file paths, absolute workspace-rooted folder paths, supported files, unsupported files, mixed punctuation, nonexistent paths, excluded paths, inline code, fenced code, and existing markdown links. If the config surface supports custom patterns, verify that adding/removing a pattern changes linkification behavior as intended. Document what passed, what failed, and any follow-up fixes required. Claim bead `nerve-ub4v` on start with `bd update nerve-ub4v --status in_progress --json` and close it on completion with `bd close nerve-ub4v --reason "Validated configurable chat path-link feature locally" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`
- test directories as needed

**Files Created/Deleted/Modified:**
- `.plans/2026-04-04-generic-workspace-path-links-feature.md`
- any test files or snapshots created during validation

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 4: Refine until we are satisfied, then prepare upstream artifacts and local convention follow-up

**Bead ID:** `nerve-80f8`  
**SubAgent:** `primary`  
**Prompt:** Based on local validation results, make any small follow-up fixes needed to reach a clean, upstream-ready state. Then draft the maintainer-facing issue framing and PR framing for the configurable chat path-link feature, explicitly keeping upstream defaults conservative and generic. Also note the separate local follow-up to prefer absolute workspace-rooted paths in agent-generated chat so the feature catches intended references reliably. Claim bead `nerve-80f8` on start with `bd update nerve-80f8 --status in_progress --json` and close it on completion with `bd close nerve-80f8 --reason "Refined feature and prepared upstream framing" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `src/`
- tests/docs as needed

**Files Created/Deleted/Modified:**
- `.plans/2026-04-04-generic-workspace-path-links-feature.md`
- implementation/test files as needed
- optional draft issue/PR notes

**Status:** ⏳ Pending

**Results:** Pending.

---

## Final Results

**Status:** ⏳ Pending

**What We Built:** Pending.

**Commits:**
- Pending.

**Lessons Learned:** Pending.

---

*Last updated on 2026-04-04*
