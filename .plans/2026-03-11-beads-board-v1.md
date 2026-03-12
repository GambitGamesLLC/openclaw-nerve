# Beads Board V1 for Nerve

**Date:** 2026-03-11  
**Status:** In Progress  
**Agent:** Byte 🐈‍⬛

---

## Goal

Make Nerve capable of rendering Beads as a first-class board source with a simple three-column model: To Do, In Progress, and Done.

---

## Overview

This plan keeps scope tight. Instead of forcing the existing Nerve-native Kanban workflow model onto Beads, Nerve should gain a Beads-backed board mode with explicit source selection. The first implementation should focus on correct data-source boundaries, repo selection from env-configured sources, and a stable board rendering path.

The board should be able to point at either the common orchestration repo (`~/.openclaw`) or selected project repos under `~/workspace/projects/`. Dependencies and blocked-state visualization are important, but they are follow-up enhancements rather than v1 blockers. For v1, they can remain implicit in the Beads data while the UI renders the simpler three-column board.

---

## Tasks

### Task 1: Define overall Beads board epic

**Bead ID:** `nerve-10x`  
**SubAgent:** `primary`
**Prompt:** Treat this epic as the coordination umbrella for the Beads board v1 work in `gambit-openclaw-nerve`. Use the child task beads below as the executable units.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-11-beads-board-v1.md`
- `.beads/*`

**Status:** ⏳ Pending

**Results:** Planning umbrella only.

---

### Task 2: Add env-configured Beads source registry

**Bead ID:** `nerve-ddk`  
**SubAgent:** `coder`
**Prompt:** Implement env/config handling for allowed Beads sources in `gambit-openclaw-nerve`. The system should support labeled repo roots, a default source, and safe source resolution so the UI can choose `~/.openclaw` or configured repos under `~/workspace/projects/` without freeform path entry.

**Folders Created/Deleted/Modified:**
- `server/`
- `docs/`

**Files Created/Deleted/Modified:**
- `server/**/*`
- `.env.example`
- `docs/**/*`

**Status:** ✅ Complete

**Results:** Added a Beads source registry to `server/lib/config.ts` with a built-in `openclaw` source, env-configured project sources via `NERVE_BEADS_SOURCES`, a validated `NERVE_BEADS_DEFAULT_SOURCE`, and helper resolvers for future API/UI use. Source roots are normalized and constrained to either `~/.openclaw` or the configured projects root (`NERVE_BEADS_PROJECTS_ROOT`, defaulting to `~/.openclaw/workspace/projects`). Updated `.env.example` and `docs/CONFIGURATION.md` to document the new config shape. Validated with `npx vitest run server/lib/config.test.ts` and `npm run build:server`.

---

### Task 3: Add server-side Beads board adapter and API

**Bead ID:** `nerve-z7s`  
**SubAgent:** `coder`
**Prompt:** After `nerve-ddk` is complete, add a server-side Beads adapter that shells out to `bd` for the selected source repo, normalizes results into a board DTO, and exposes endpoints for Beads sources and Beads board data. Keep the data model simple and Beads-native enough for a three-column board.

**Folders Created/Deleted/Modified:**
- `server/`
- `docs/`

**Files Created/Deleted/Modified:**
- `server/app.ts`
- `server/lib/beads-board.ts`
- `server/lib/beads-board.test.ts`
- `server/routes/beads.ts`
- `server/routes/beads.test.ts`
- `docs/API.md`

**Status:** ✅ Complete

**Results:** Added a backend-only Beads adapter in `server/lib/beads-board.ts` that resolves the selected source via `resolveBeadsSource(sourceId)`, shells out to `bd list --json` inside the configured repo root, and projects Beads issues into a stable three-column DTO (`todo`, `in_progress`, `done`). Added `GET /api/beads/sources` for safe source discovery and `GET /api/beads/board?sourceId=<id>` for board data, mounted without changing the native Kanban routes. Added focused adapter/route tests covering source resolution, safe DTOs, `bd` invocation in the resolved repo, invalid source rejection, and API responses. Documented the new endpoints in `docs/API.md`. Validated with `npx vitest run server/lib/config.test.ts server/lib/beads-board.test.ts server/routes/beads.test.ts` and `npm run build:server`.

---

### Task 4: Add frontend Beads board mode with source selector

**Bead ID:** `nerve-19r`  
**SubAgent:** `coder`
**Prompt:** After `nerve-z7s` is complete, add a frontend Beads board mode with a source selector and three columns: To Do, In Progress, Done. Reuse as much of the existing board rendering as possible without pretending the Beads backend is the same as the Nerve-native Kanban store.

**Folders Created/Deleted/Modified:**
- `src/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/kanban/KanbanPanel.tsx`
- `src/features/kanban/KanbanHeader.tsx`
- `src/features/kanban/KanbanCard.tsx`
- `src/features/kanban/BeadsBoard.tsx`
- `src/features/kanban/beads.ts`
- `src/features/kanban/beads.test.ts`
- `src/features/kanban/hooks/useBeadsBoard.ts`
- `.plans/2026-03-11-beads-board-v1.md`

**Status:** ✅ Complete

**Results:** Added a distinct frontend Beads board path without changing the native Kanban data model. `KanbanPanel` now exposes a board-mode switch (`Native` / `Beads`) in the header, keeps the existing Kanban workflow/edit drawer intact for native mode, and swaps in a Beads-specific hook plus read-only three-column board when Beads mode is selected. The Beads hook loads `/api/beads/sources`, resolves the default source id, fetches `/api/beads/board?sourceId=<id>`, silently refreshes on an interval, and normalizes Beads DTOs into the existing card shape so the UI can reuse `KanbanCard` styling. Added a small `sortable={false}` path to `KanbanCard` so Beads cards render with the same visuals but without drag/drop semantics. Validated with `npm test -- --run src/features/kanban/beads.test.ts` and `npm run build`.

---

### Task 5: Expose Beads metadata in card/detail UI

**Bead ID:** `nerve-cld`  
**SubAgent:** `coder`
**Prompt:** After `nerve-z7s` is complete, improve the Beads card/detail view to surface repo source, labels, assignee, and future-facing hooks for dependency/blocked indicators, while keeping the initial UI simple.

**Folders Created/Deleted/Modified:**
- `src/`

**Files Created/Deleted/Modified:**
- `src/**/*`

**Status:** ⏳ Pending

**Results:** Depends on `nerve-z7s`.

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:** Created the repo-local planning and Beads structure for the Beads board v1 work, completed the Beads source-registry foundation, added the backend Beads board adapter/API for safe source discovery plus three-column board projection, and finished the frontend Beads board mode with a mode toggle plus source selector. Richer Beads metadata/detail behavior remains for `nerve-cld`.

**Commits:**
- None yet

**Lessons Learned:** For repo-owned work, both `.plans/` and `.beads/` should live at the repo root so planning and execution state stay with the codebase they describe. Keeping source selection server-side via configured ids avoids letting the UI smuggle arbitrary filesystem paths into the backend.

---

*Completed on 2026-03-11*
