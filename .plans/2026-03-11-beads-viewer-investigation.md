---
plan_id: plan-2026-03-11-beads-viewer-investigation
bead_ids:
  - oc-1nh
  - Pending
---
# Beads-Compatible Viewer Investigation for openclaw-nerve

**Date:** 2026-03-11  
**Status:** In Progress  
**Agent:** Byte 🐈‍⬛

---

## Goal

Clone `https://github.com/GambitGamesLLC/openclaw-nerve` into `~/workspace/projects/gambit-openclaw-nerve` and investigate what would be required to turn its Kanban board into a Beads-compatible viewer that can point at either `~/.openclaw/` or repos under `~/workspace/projects/`.

---

## Overview

The goal is not to implement the Beads integration yet, but to understand the current board architecture and identify the adaptation path. We need to know how the Kanban board currently sources its task data, what abstractions already exist around task state, and what UI/data model changes would be required to render Beads as cards without losing repo context.

Because this touches a project repo (`gambit-openclaw-nerve`) but is still an investigation rather than implementation, the plan will document the findings and proposed integration approach. If the repo is a clean enough fit, the next step would be to create implementation beads in the repo itself.

---

## Tasks

### Task 1: Clone the repo and inspect project structure

**Bead ID:** `oc-1nh`  
**SubAgent:** `primary`
**Prompt:** Clone `https://github.com/GambitGamesLLC/openclaw-nerve` into `~/workspace/projects/gambit-openclaw-nerve`, inspect the project structure, and identify where the Kanban board UI and data-fetching logic live.

**Folders Created/Deleted/Modified:**
- `projects/gambit-openclaw-nerve/`

**Files Created/Deleted/Modified:**
- project files under `projects/gambit-openclaw-nerve/`

**Status:** ✅ Complete

**Results:** Cloned the repo successfully. The Kanban frontend lives under `src/features/kanban/` with `KanbanPanel.tsx`, `KanbanBoard.tsx`, `KanbanCard.tsx`, `TaskDetailDrawer.tsx`, and hooks like `hooks/useKanban.ts` and `hooks/useProposals.ts`. The backend API lives under `server/routes/kanban.ts`. The task store lives in `server/lib/kanban-store.ts` and persists to JSON under `server/data/kanban/tasks.json` (with audit log beside it).

---

### Task 2: Map current Kanban data model to potential Beads viewer model

**Bead ID:** `Pending`  
**SubAgent:** `primary`
**Prompt:** Analyze the current task/card model, API boundaries, and state flow, then compare them to what a Beads-backed viewer would need to support.

**Folders Created/Deleted/Modified:**
- `projects/gambit-openclaw-nerve/`

**Files Created/Deleted/Modified:**
- investigation notes only

**Status:** ✅ Complete

**Results:** The current board is tightly coupled to a Nerve-specific JSON task model: `KanbanTask` has `status`, `priority`, `columnOrder`, `run`, `result`, `feedback`, `model`, `thinking`, and proposal/workflow fields. The frontend expects `/api/kanban/tasks` to return a full flat task list that it groups into the fixed columns `backlog`, `todo`, `in-progress`, `review`, `done` (with `cancelled` hidden). The server store is a singleton `KanbanStore` with in-process JSON persistence, CAS-style versions, workflow transitions (`execute`, `approve`, `reject`, `abort`, `completeRun`), and proposal support. A Beads viewer would need an adapter layer that maps Beads issues/dependencies into this view model or a new parallel board model; direct reuse of the current store is not enough because the existing store assumes it owns canonical task state and execution lifecycle.

---

### Task 3: Summarize implementation options

**Bead ID:** `Pending`  
**SubAgent:** `primary`
**Prompt:** Produce a concise recommendation for how to make the Kanban board a Beads-compatible viewer, including repo selection, data source shape, likely backend/frontend changes, and key risks.

**Folders Created/Deleted/Modified:**
- `plans/openclaw-nerve/`

**Files Created/Deleted/Modified:**
- `plans/openclaw-nerve/2026-03-11-beads-viewer-investigation.md`

**Status:** ✅ Complete

**Results:** Best path: keep the current Kanban implementation for Nerve-native tasks, and add a new backend source mode for Beads-backed boards. Introduce a server-side Beads adapter that shells out to `bd` (likely `bd ready`, `bd blocked`, `bd list --json`, `bd show`, and dependency commands) for a selected repo root, then normalize the results into a viewer-specific board DTO. Add repo selection/config so the board can point at `~/.openclaw/` or a repo under `~/workspace/projects/`. Prefer making Beads view initially read-only plus a minimal set of safe actions (refresh, open bead, maybe claim/close) instead of trying to force Beads into the full Nerve execute/approve/reject lifecycle on day one. Biggest risks: Beads does not natively use the same column model as Nerve, repo selection must be explicit and safe, and polling shell commands for every refresh may require caching or server-side watch logic.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Cloned `gambit-openclaw-nerve`, mapped the current Kanban board architecture, and identified a practical Beads viewer strategy: add a Beads-backed source adapter and repo selector rather than replacing the current JSON workflow engine outright.

**Commits:**
- None yet

**Lessons Learned:** The current Kanban board is a workflow system, not just a renderer. Beads integration should start as a viewer/adapter layer with safe repo selection and limited actions, then grow toward richer mutations only after the data-source boundary is clean.

---

*Completed on 2026-03-11*
