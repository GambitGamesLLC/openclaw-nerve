# Gambit OpenClaw Nerve — Beads board Closed column

**Date:** 2026-03-12  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Extend the Nerve Beads board so `closed` is represented as a first-class column instead of being flattened into the existing Done flow.

---

## Overview

The current Beads board integration in `gambit-openclaw-nerve` is working end-to-end and has been verified live against the `~/.openclaw` Beads source. However, the current v1 projection intentionally compresses Beads into a simplified three-column model: To Do, In Progress, and Done.

That simplification is now leaking. Real Beads lifecycle state distinguishes between work that is effectively done/resolved and work that is actually closed, and the current adapter behavior encourages awkward verification data such as using `resolved` just to make an item appear in the Done column. If Nerve is going to treat Beads as a first-rate task system, the board should represent `closed` explicitly.

This pass should stay narrowly scoped. We do not need to redesign the full Beads UX yet. The goal is to evolve the current Beads board from three columns to four columns, teach the backend adapter to include actually closed issues in the returned board data, update the frontend rendering/counts, and then verify the live UI using real sample issues in `~/.openclaw`.

---

## Tasks

### Task 1: Update the Beads board backend model to include Closed

**Bead ID:** `nerve-79c`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, update the server-side Beads board adapter and API model so the board can represent four columns: To Do, In Progress, Done, and Closed. Ensure actually closed Beads issues are included in the data returned to the UI instead of being silently excluded by the current query path. Keep the mapping logic Beads-native and update/add focused tests.

**Folders Created/Deleted/Modified:**
- `server/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `server/lib/beads-board.ts`
- `server/lib/beads-board.test.ts`
- `server/routes/beads.ts` (if needed)
- `server/routes/beads.test.ts` (if needed)
- `.plans/2026-03-12-beads-board-add-closed-column.md`

**Status:** ✅ Complete

**Results:** Updated `server/lib/beads-board.ts` to use a four-column Beads-native model (`todo`, `in_progress`, `done`, `closed`) and switched the adapter query to `bd list --all --json` so genuinely closed issues are included instead of filtered out. Refreshed focused adapter and route tests to cover the Closed column and the `--all` query path. Tests: `npm test -- --run server/lib/beads-board.test.ts server/routes/beads.test.ts`.

---

### Task 2: Update the Beads board frontend to render the Closed column

**Bead ID:** `nerve-bo0`  
**SubAgent:** `coder`  
**Prompt:** After the backend model supports Closed, update the frontend Beads board in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve` to render four columns: To Do, In Progress, Done, and Closed. Update counts, normalization, card plumbing, and any related tests while keeping the existing Native-vs-Beads mode separation intact.

**Folders Created/Deleted/Modified:**
- `src/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/kanban/BeadsBoard.tsx`
- `src/features/kanban/beads.ts`
- `src/features/kanban/beads.test.ts`
- `src/features/kanban/hooks/useBeadsBoard.ts`
- `src/features/kanban/KanbanHeader.tsx` (if needed)
- `src/features/kanban/KanbanPanel.tsx` (if needed)
- `.plans/2026-03-12-beads-board-add-closed-column.md`

**Status:** ✅ Complete

**Results:** Updated the Beads frontend normalization/hooks/header/board rendering to keep separate `done` and `closed` columns end-to-end while still reusing existing read-only Kanban cards. Added Closed counts in the Beads header and rendered a fourth Closed lane in the board. Tests/builds: `npm test -- --run src/features/kanban/beads.test.ts` and `npm run build`.

---

### Task 3: Verify live behavior with real openclaw Beads data

**Bead ID:** `nerve-j93`  
**SubAgent:** `primary`  
**Prompt:** After the code changes land, verify the live Nerve deployment on this machine shows the new Closed column for the `~/.openclaw` Beads source. Use the existing verification issues in `/home/derrick/.openclaw` and create or adjust sample issues only if needed to ensure all four columns render meaningfully. Confirm API payload shape, UI counts, and visible cards for To Do, In Progress, Done, and Closed.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/`
- `projects/gambit-openclaw-nerve/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-12-beads-board-add-closed-column.md`
- only any Beads runtime state in `/home/derrick/.openclaw/.beads/` if verification data must be adjusted

**Status:** ✅ Complete

**Results:** Restarted the local Nerve server on `127.0.0.1:3080` so live verification used the rebuilt `server-dist/`. Confirmed `/api/beads/board?sourceId=openclaw` now returns four columns with the expected counts (`todo=1`, `in_progress=1`, `done=1`, `closed=9`) and visible cards in each lane. Verified the live UI in Beads mode shows the Closed stat chip and a rendered Closed column for the `~/.openclaw` source; captured browser evidence after widening the viewport so the Closed lane is visible.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Extended the Beads board backend and frontend from a three-column simplification to a Beads-native four-column model, then verified the live `~/.openclaw` board renders To Do, In Progress, Done, and Closed with matching API/UI counts.

**Commits:**
- `aeef182` - Add Closed column support to Beads board

**Lessons Learned:** The backend needed `bd list --all --json` to surface truly closed work, and the frontend was cleaner once it tracked Beads columns directly instead of collapsing everything into Kanban status buckets.

---

*Completed on 2026-03-12*
