# Diagnose Root-Workspace Bead Links Resolving to "Bead not found"

**Date:** 2026-04-08  
**Status:** Draft  
**Agent:** Chip 🐱‍💻

---

## Goal

Diagnose and fix why explicit `bead:` links in markdown under the workspace root now resolve into the in-app bead viewer, but fail lookup with `Bead not found` for valid-looking bead IDs such as `virtra-apex-docs-id2`.

---

## Overview

The latest dogfood result is progress: markdown `bead:` links are no longer escaping to the browser. They now route into Nerve’s bead viewer correctly. The remaining failure is at the data-resolution layer: clicking a root-workspace markdown bead link like `bead:virtra-apex-docs-id2` opens the bead viewer, but the viewer reports `Could not load bead virtra-apex-docs-id2` / `Bead not found: virtra-apex-docs-id2`.

That suggests the routing/UI handoff is functioning, but the lookup context or Beads backend query is using the wrong repo/project scope, the wrong bead source, or a mismatched ID namespace. We need to determine whether the bead exists in a different repo/project Beads store, whether Nerve is querying only the current repo-local Beads database, or whether root-workspace markdown links need a cross-repo lookup/path-aware resolution rule.

---

## Tasks

### Task 1: Reproduce the lookup failure and trace the bead resolution path

**Bead ID:** `nerve-orl6`  
**SubAgent:** `research`  
**Prompt:** Investigate why a root-workspace markdown link like `bead:virtra-apex-docs-id2` opens the bead viewer but then fails with `Bead not found`. Check where that bead actually exists, which repo/project Beads store owns it, and what lookup path Nerve uses when opening a bead by ID from the current UI context.

**Folders Created/Deleted/Modified:**
- `.plans/`
- Beads-related client/server lookup paths as needed for inspection

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-diagnose-root-workspace-bead-not-found.md`

**Status:** ✅ Complete

**Results:** Diagnosis completed on `feature/bead-viewer`.

- Verified the linked dogfood markdown source at `/home/derrick/.openclaw/workspace/bead-link-dogfood.md` contains `bead:virtra-apex-docs-id2`.
- Verified `virtra-apex-docs-id2` is a valid bead in the VirTra Apex docs repo Beads store, not in Nerve’s repo-local Beads store:
  - exists in `/home/derrick/.openclaw/workspace/projects/virtra-apex-docs/.beads`
  - `bd context --json` there reports repo root `/home/derrick/.openclaw/workspace/projects/virtra-apex-docs`, database `virtra_apex_docs`, project id `540ea59f-8c24-453a-baae-4c14c7fe2cc5`
  - `bd show virtra-apex-docs-id2 --json` succeeds there
  - the same `bd show virtra-apex-docs-id2 --json` fails from `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve` because that repo’s `.beads` does not contain the bead
- Traced the Nerve lookup path on `feature/bead-viewer`:
  1. `src/features/markdown/MarkdownRenderer.tsx` intercepts `bead:` links and calls `onOpenBeadId(decodeBeadLinkHref(href))`
  2. `src/App.tsx` `openBeadId()` opens a bead tab with id `bead:<beadId>`
  3. `src/features/beads/BeadViewerTab.tsx` calls `useBeadDetail(beadId)`
  4. `src/features/beads/useBeadDetail.ts` fetches `/api/beads/<id>`
  5. `server/routes/beads.ts` calls `getBeadDetail(beadId)` with no repo override
  6. `server/lib/beads.ts` defaults `repoRoot = process.cwd()` and runs `bd show <id> --json` with `cwd: repoRoot`
- Root cause: the bead viewer server lookup is repo-local-only. It ignores the source markdown file path and does not resolve across repos or root-workspace Beads contexts. This is not an invalid bead ID.
- Narrowest likely fix path: teach the `/api/beads/:id` lookup to resolve bead context beyond `process.cwd()` — ideally by passing a repo/workspace context derived from the opened document path, or by adding a bounded cross-repo/root-workspace bead resolution layer that can map `virtra-apex-docs-*` (or otherwise discover the owning repo) before calling `bd show`.

---

### Task 2: Implement the narrowest correct fix for cross-context bead lookup

**Bead ID:** `nerve-ix5j`  
**SubAgent:** `coder`  
**Prompt:** Based on the diagnosis, implement the narrowest correct fix so valid bead IDs referenced from root-workspace markdown resolve to the correct Beads source and open in the viewer instead of failing with `Bead not found`. Preserve the existing in-app routing behavior and add focused tests.

**Folders Created/Deleted/Modified:**
- `.plans/`
- exact client/server Beads lookup files needed by the fix

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-diagnose-root-workspace-bead-not-found.md`
- exact code/test files needed by the fix

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 3: Verify dogfood behavior and document the corrected lookup model

**Bead ID:** `nerve-rf0t`  
**SubAgent:** `primary`  
**Prompt:** Verify the fixed behavior for root-workspace markdown bead links, document the exact cause and corrected lookup model, and record any limitations or remaining edge cases in this plan.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-diagnose-root-workspace-bead-not-found.md`

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

*Drafted on 2026-04-08*
