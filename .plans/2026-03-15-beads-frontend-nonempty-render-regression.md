---
plan_id: plan-2026-03-15-beads-frontend-nonempty-render-regression
bead_ids:
  - nerve-4as
---
# Nerve Beads frontend non-empty render regression

**Date:** 2026-03-15  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Fix the Nerve Beads UI so it renders non-empty repo boards instead of showing a false empty state when the backend returns valid populated Beads board payloads.

---

## Overview

The restore-layer source bootstrap bug was fixed and rerun, and the live service now has sane `NERVE_BEADS_DEFAULT_SOURCE` and non-colliding source ids. However, the live Beads page still shows `No Beads issues in this source` for `~/.openclaw` and other known-good repos.

Live verification on the running app narrowed this further: the Nerve service logs and direct API checks show `/api/beads/board?sourceId=openclaw` and `/api/beads/board?sourceId=gambit-openclaw-nerve` both return populated boards, but the browser UI renders all four board counts as `0` and shows the empty-state message anyway. That moves the bug squarely into the frontend normalization/render path (or an adjacent client-state transform) rather than restore config or server-side Beads loading.

---

## Tasks

### Task 1: Isolate the frontend normalization/render bug for populated Beads boards

**Bead ID:** `nerve-4as`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-4as` at start with `bd update nerve-4as --status in_progress --json`, then trace the client Beads board fetch/normalization/render path to determine why the UI shows zero-count columns and an empty-state message when `/api/beads/board?sourceId=openclaw` returns populated data. Focus on the client types, normalization helpers, hooks, empty-state conditions, and any transforms between fetched JSON and rendered columns/items. Fix the owning layer, add/update tests, validate against the live repro if practical, update this plan with exact findings/results, then close the bead with `bd close nerve-4as --reason "Fixed Beads frontend non-empty render regression" --json`.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/kanban/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-beads-frontend-nonempty-render-regression.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/kanban/hooks/useBeadsBoard.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/kanban/hooks/useBeadsBoard.test.tsx`

**Status:** ✅ Complete

**Results:**
- Traced the live client path through:
  - `src/features/kanban/hooks/useBeadsBoard.ts`
  - `src/features/kanban/beads.ts`
  - `src/features/kanban/KanbanPanel.tsx`
  - `src/features/kanban/BeadsBoard.tsx`
- Confirmed the fetched board payloads were already valid and populated in both Node-side and browser-side direct fetches for `sourceId=openclaw` and `sourceId=gambit-openclaw-nerve`.
- Used live browser introspection against the running app and found the actual failing layer was **client request lifecycle**, not normalization:
  - the hook state had `selectedSourceId='openclaw'` but `board=null`, `error=null`, and `loading=false`
  - the Beads board requests were taking longer than the 5-second silent refresh interval
  - every silent poll called `fetchBoard(..., { silent: true })`, which unconditionally aborted the currently in-flight board request and started a new one
  - because the initial board fetch never finished, `board` stayed `null`, `columnCounts` stayed zeroed, and `hasAnyTasks` stayed false, which produced the false empty state
- Applied the smallest durable fix in `useBeadsBoard.ts`:
  - track the source id of the active board request
  - when a silent refresh fires for the **same source** while a board load is already in flight, skip the poll instead of aborting the active request
  - continue aborting/replacing the request for explicit source changes, retries, and other non-silent reloads
- Added a focused hook test in `useBeadsBoard.test.tsx` that reproduces the starvation case: a slow initial board fetch plus the 5-second silent poll. The test now verifies the in-flight request is not aborted and the board eventually renders populated counts.
- Validation:
  - `npx vitest run src/features/kanban/hooks/useBeadsBoard.test.tsx src/features/kanban/beads.test.ts` ✅
  - `npm run build` ✅
  - live browser refresh after rebuilding `dist/` showed the Beads UI rendering non-empty counts for `~/.openclaw`: `To Do 1`, `In Progress 1`, `Done 1`, `Closed 20`, with cards visible instead of the empty-state message ✅
- Commit hash: `6006954` (`Fix Beads board poll starvation`)

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Fixed the Beads frontend false-empty regression by preventing the 5-second silent board poll from aborting the current in-flight board load for the same source. Slow but valid Beads board responses now complete, populate hook state, and render real board counts/cards instead of the empty-state warning.

**Commits:**
- `6006954` - Fix Beads board poll starvation

**Lessons Learned:** A correct payload can still render as empty when client polling logic starves the initial load. Silent refreshers need overlap protection or they can create a perpetual abort loop that looks like a normalization/render bug.

---

*Completed on 2026-03-15*