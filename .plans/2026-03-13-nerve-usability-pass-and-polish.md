# Gambit OpenClaw Nerve — usability pass and polish

**Date:** 2026-03-13  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Run a real usability pass on the recently shipped workflow surfaces in `gambit-openclaw-nerve`, turn concrete findings into repo-local Beads and plan updates, then execute the highest-value polish work with SubAgents.

---

## Overview

Yesterday’s workflow-surface wave shipped the major building blocks: first-class `/.plans/` browsing, conservative clickable bead/plan/path references, workspace-first path opening, richer Beads metadata, and a quieter but still first-class Closed lane. The right next move is not another broad feature wave; it is a real connected-session usability pass that exercises those surfaces the way Derrick will actually use them.

This plan keeps the work grounded in observed behavior and aligned with our repo-local orchestration standard. We already have a concrete first batch of usability findings from Derrick’s real usage: Beads should become the primary top-level workflow surface via env-controlled mode switches; native tasks should be optionally fully hidden; column visibility should be a first-class show/hide behavior across the whole Beads board with remembered global UI state; the last-viewed Beads project should be restored by default; tracked Beads/project roots should become manageable from inside Nerve instead of requiring `.env` edits; and the bead↔plan flow still needs live verification with archive-aware plan resolution. We will capture and refine those findings in-plan, translate the worthwhile work into repo-local Beads so execution state is queryable, dependency-aware, and durable before implementation begins, then execute the best polish items with SubAgents against those bead IDs, update this living plan after each completed step with what actually happened, verify with tests/build/browser checks, and commit/push the finished work to `master`.

---

## Confirmed Findings / Scope Inputs

- Add env-controlled workflow mode so the top nav says `Beads` and defaults to the Beads experience instead of native tasks.
- Add a second env-controlled mode to fully hide the native task tracker, allowing Nerve deployments to switch between native tasks and Beads without code changes.
- Make show/hide behavior a first-class capability for Beads columns generally, not just a special case for `Closed`.
- Remove the `Keep active work front-and-center while preserving fast access to closed issues.` helper copy from the Closed column.
- Persist column visibility state across app restarts as a global UI preference.
- Add an in-app way to manage tracked Beads/project roots instead of requiring `.env` edits.
- Restore the last-viewed Beads/project by default when reopening Nerve.
- Live-verify the bead→plan viewing flow inside Nerve, including plan movement from `/.plans/` to `/.plans/archive/`.

---

## Tasks

### Task 1: Consolidate usage findings and validate gaps live

**Bead ID:** `nerve-9ly`  
**SubAgent:** `research`  
**Prompt:** Using the real local Nerve app in `gambit-openclaw-nerve`, consolidate the concrete usability findings Derrick already reported and validate the remaining gaps live. Focus especially on: env-driven Beads-vs-native-task mode switching, fully hiding native tasks, whole-column show/hide behavior and persistence, last-viewed project restoration, in-app tracked-project management, and live bead→plan viewing including archived-plan resolution. Capture only actionable findings, confirm whether each item is already supported or still missing, and write the results back into this living plan so follow-up work can be turned into repo-local Beads cleanly. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Validated usability findings and documented actionable gaps" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `docs/` (only if a short findings note becomes useful)

**Files Created/Deleted/Modified:**
- `.plans/2026-03-13-nerve-usability-pass-and-polish.md`
- optional findings note if needed

**Status:** ✅ Complete

**Results:** Validated via repo inspection plus a live run of the local Nerve UI on `http://127.0.0.1:3080`. Current state:
- **Missing:** env-driven Beads-vs-native-task mode switching. The top nav still says `Tasks`, `App.tsx` persists only `chat | kanban`, `KanbanPanel.tsx` hard-defaults internal board mode to native (`'kanban'`), and `server/lib/config.ts` exposes Beads source env vars but no workflow-mode / native-hide env controls.
- **Missing:** fully hiding native tasks. In the live UI the Tasks screen still exposes both `Native` and `Beads` buttons, and the native task board remains the default after reload.
- **Partially supported:** whole-column show/hide exists only for `Closed`. `BeadsBoard.tsx` provides a dedicated Closed collapse rail and helper copy, but there is no equivalent show/hide behavior for To Do / In Progress / Done.
- **Missing:** column visibility persistence. `BeadsBoard.tsx` keeps `showClosed` in component state only; no `localStorage`/settings persistence exists, and a reload returned the board to the default/native path instead of preserving the visible-column state.
- **Missing:** last-viewed project restoration. `useBeadsBoard.ts` restores the configured default Beads source from `/api/beads/sources`, but does not persist the user’s last selected source; on refresh the app returned to native tasks and the default source instead of the last Beads project.
- **Missing:** in-app tracked-project management. Live UI only offers a source dropdown; configured sources still come from env/server config (`NERVE_BEADS_SOURCES`, `NERVE_BEADS_DEFAULT_SOURCE`, `NERVE_BEADS_PROJECTS_ROOT`) with no add/remove/edit flow in the app.
- **Supported on the plans side:** repo-local plan browsing already includes active + archived grouping, clickable bead IDs inside plan content, and archived-plan discovery/resolution via `server/lib/plans.ts` + `PlansTab.tsx`.
- **Still missing on the bead side:** live bead→plan viewing from the Beads board/drawer. `BeadsDetailDrawer.tsx` renders issue metadata only and has no linked-plan surface; `openTaskInBoard` in `App.tsx` routes plan bead clicks into the board shell, but current Kanban initialization only auto-opens native tasks, not a Beads issue or its linked plan.
- **Implementation-shaping note:** the work cleanly splits into four slices already represented by the follow-up beads: workflow shell env controls (`nerve-gic`), board-wide column visibility persistence (`nerve-usz`), tracked-project + last-viewed source persistence (`nerve-wc4`), and archive-safe bead→plan surfacing from Beads cards/drawers (`nerve-37r`).

---

### Task 2: Convert confirmed gaps into execution Beads and update plan

**Bead ID:** `nerve-ly9`  
**SubAgent:** `primary`  
**Prompt:** Review the validated findings, create a clean repo-local Beads set for the concrete follow-up work, add dependencies/priorities where appropriate, and update this living plan with the resulting bead IDs, execution order, and any scope cuts needed to keep the pass sharp. Expect at least these themes unless validation proves one already solved: env-driven navigation/task-mode switching, native-task hiding, board-wide column visibility persistence, tracked-project management UI, last-viewed project restoration, and archive-safe bead→plan viewing. Keep the bead set focused and actionable rather than exploding into trivia. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Created follow-up Beads and updated plan" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-13-nerve-usability-pass-and-polish.md`
- repo-local Beads state under `.beads/`

**Status:** ✅ Complete

**Results:** Created and wired the repo-local follow-up Beads set: `nerve-ly9` (epic), `nerve-9ly` (validation), `nerve-gic` (env-driven Beads-first nav + native-task hiding), `nerve-usz` (board-wide column visibility persistence), `nerve-wc4` (tracked project management + last-viewed project restore), `nerve-37r` (archive-aware bead→plan viewing), and `nerve-251` (final verification / commit / push). Because Beads in this repo cannot depend directly on an epic, the real execution flow is wired between the task beads themselves, with `nerve-9ly` unblocking the implementation tasks and `nerve-251` waiting on the implementation set.

---

### Task 3: Execute highest-value Beads/project usability fixes

**Bead ID:** `nerve-gic`, `nerve-usz`, `nerve-wc4`, `nerve-37r`  
**SubAgent:** `coder`  
**Prompt:** Implement the highest-value usability fix(es) selected from the repo-local Beads created by this plan. Prioritize the user-facing workflow shell first: env-driven `Beads` navigation/default behavior, optional full hiding of native tasks, board-wide column visibility + persisted UI state, tracked-project management in the UI, restoration of the last-viewed Beads project, and any missing archive-safe bead→plan viewing behavior proven by validation. Work in small, reviewable slices: claim the assigned implementation bead(s), make the code/test changes, run targeted tests plus build, update this living plan with what actually changed, and close each completed bead with a concrete reason. If the findings reveal multiple independent fixes, prefer sequencing them by user impact and dependency order rather than batching unrelated churn into one change. Do not start implementation until the findings have been converted into concrete bead IDs and linked back into this plan.

**Folders Created/Deleted/Modified:**
- `src/`
- `src/components/`
- `src/features/command-palette/`
- `src/features/kanban/`
- `src/features/workspace/`
- `server/lib/`
- `server/routes/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/App.tsx`
- `src/components/TopBar.tsx`
- `src/features/command-palette/commands.ts`
- `src/features/kanban/beads.ts`
- `src/features/kanban/KanbanHeader.tsx`
- `src/features/kanban/KanbanPanel.tsx`
- `src/features/kanban/BeadsBoard.tsx`
- `src/features/kanban/KanbanHeader.test.tsx`
- `src/features/kanban/BeadsBoard.test.tsx`
- `src/features/workspace/WorkspacePanel.tsx`
- `src/features/workspace/WorkspaceTabs.tsx`
- `src/features/workspace/WorkspaceTabs.test.tsx`
- `server/lib/config.ts`
- `server/lib/config.test.ts`
- `server/lib/beads-board.ts`
- `server/lib/beads-board.test.ts`
- `server/lib/beads-sources.ts`
- `server/routes/beads.ts`
- `server/routes/beads.test.ts`
- `server/routes/server-info.ts`
- `.plans/2026-03-13-nerve-usability-pass-and-polish.md`

**Status:** 🔄 In Progress

**Results:** Completed the first implementation slice for `nerve-gic`.
- Added conservative env-driven workflow-shell config in `server/lib/config.ts` using `NERVE_WORKFLOW_PRIMARY=native|beads` plus `NERVE_HIDE_NATIVE_TASKS=true|false`. The derived config exposes `navigationLabel`, `defaultBoardMode`, and `hideNativeTasks` so the UI can stay backward-compatible by default while switching into Beads-first mode without code changes.
- Extended `/api/server-info` in `server/routes/server-info.ts` to return the workflow-shell config, then taught `src/App.tsx` to fetch it on mount and pass it through to the top bar, workspace panel, command palette, and Kanban panel.
- Updated the workflow UI so the top-level nav can say `Beads` instead of `Tasks` (`src/components/TopBar.tsx`, `src/features/workspace/WorkspaceTabs.tsx`, `src/features/workspace/WorkspacePanel.tsx`, `src/features/command-palette/commands.ts`).
- Updated the board shell so Beads-first mode defaults the in-board experience to the Beads board while preserving native-task access when allowed; when `NERVE_HIDE_NATIVE_TASKS=true`, the Native/Beads toggle is removed and `KanbanPanel` stays pinned to Beads mode (`src/features/kanban/KanbanPanel.tsx`, `src/features/kanban/KanbanHeader.tsx`, `src/features/kanban/beads.ts`).
- Added focused regression coverage for the new env parsing and UI behavior in `server/lib/config.test.ts`, `src/features/kanban/KanbanHeader.test.tsx`, and `src/features/workspace/WorkspaceTabs.test.tsx`.
- Verification run for this slice:
  - `npm test -- --run server/lib/config.test.ts src/features/kanban/KanbanHeader.test.tsx src/features/workspace/WorkspaceTabs.test.tsx`
  - `npm run build`
- Completed the second implementation slice for `nerve-usz`.
  - Reworked `src/features/kanban/BeadsBoard.tsx` so every major Beads column (`To Do`, `In Progress`, `Done`, `Closed`) now has the same first-class show/hide control, instead of treating `Closed` as a one-off special case.
  - Removed the old Closed helper copy (`Keep active work front-and-center while preserving fast access to closed issues.`) and replaced the prior special collapsed-rail UX with a conservative shared column-visibility control row plus a simple empty-state when every column is hidden.
  - Added global UI-preference persistence in `localStorage` under a single board-wide key, so column visibility survives app restarts regardless of the selected Beads source/project. The default remains conservative: `Closed` starts hidden only when closed items exist, unless the user has already chosen a different persisted preference.
  - Added focused regression coverage in `src/features/kanban/BeadsBoard.test.tsx` for default Closed behavior, first-class visibility toggles across all columns, and persisted visibility across remounts.
  - Verification run for this slice:
    - `npm test -- --run src/features/kanban/BeadsBoard.test.tsx`
    - `npm run build`
- Completed the third implementation slice for `nerve-wc4`.
  - Finished the server-side managed-source registry in `server/lib/beads-sources.ts`: env-configured Beads sources are merged with app-added sources, persisted globally in `~/.nerve/beads-sources.json`, constrained to `~/.openclaw` or the configured projects root, and the last-viewed source id is stored separately so reopen defaults restore the user’s most recent Beads project/source instead of only the env default.
  - Wired the API surface in `server/routes/beads.ts` and the adapter layer in `server/lib/beads-board.ts` so `/api/beads/sources` returns the merged safe DTO list plus `lastSourceId`, `POST /api/beads/sources` adds tracked roots, `DELETE /api/beads/sources/:id` removes only app-managed entries, and `POST /api/beads/selection` persists the current Beads source selection without exposing filesystem paths to the client.
  - Verified the client path is coherent in `src/features/kanban/hooks/useBeadsBoard.ts`, `src/features/kanban/KanbanHeader.tsx`, `src/features/kanban/KanbanPanel.tsx`, and `src/features/kanban/beads.ts`: the Beads header exposes a visible `Manage sources` affordance, users can add/remove tracked project roots in-app, the selected source is persisted best-effort on change, and reopening the board restores the previously viewed source from server-backed global state.
  - Added explicit persistence/compatibility regression coverage in `server/lib/beads-sources.test.ts`, alongside the existing route/UI tests in `server/routes/beads.test.ts` and `src/features/kanban/KanbanHeader.test.tsx`, so the core `nerve-wc4` behaviors are asserted directly instead of only transitively.
  - Verification run for this slice:
    - `npm test -- --run server/lib/beads-sources.test.ts server/lib/config.test.ts server/lib/beads-board.test.ts server/routes/beads.test.ts src/features/kanban/KanbanHeader.test.tsx src/features/kanban/BeadsBoard.test.tsx src/features/workspace/WorkspaceTabs.test.tsx`
    - `npm run build`
- Completed the fourth implementation slice for `nerve-37r`.
  - Added archive-aware linked-plan resolution on the server by teaching `server/lib/plans.ts` to find the current repo-local plan for a bead id and threading that metadata through the existing Beads board adapter in `server/lib/beads-board.ts`. The Beads card DTO now carries a conservative `linkedPlan` summary (`path`, `title`, `archived`, `status`, `updatedAt`) instead of inventing a second plan document API.
  - Extended the client normalization path in `src/features/kanban/beads.ts` + `src/features/kanban/types.ts` so Beads cards retain linked-plan metadata all the way into the existing drawer surface.
  - Reused the existing Plans surface rather than building a duplicate viewer: `src/features/kanban/BeadsDetailDrawer.tsx` now shows a linked-plan section with archived/status badges and an `Open in Plans` action, `src/App.tsx` + `src/features/workspace/WorkspacePanel.tsx` can switch the shared workspace panel to the Plans tab on request, and `src/features/workspace/tabs/PlansTab.tsx` honors an externally requested plan path so archived plan links resolve cleanly after plan moves from `/.plans/` to `/.plans/archive/`.
  - Tightened board handoff behavior in `src/features/kanban/KanbanPanel.tsx` so bead clicks coming from plan references can open the matching Beads issue drawer directly, even when the overall workflow shell would otherwise start on native tasks.
  - Added focused regression coverage across server/client/UI layers in `server/lib/plans.test.ts`, `server/lib/beads-board.test.ts`, `src/features/kanban/beads.test.ts`, `src/features/kanban/BeadsDetailDrawer.test.tsx`, and `src/features/workspace/tabs/PlansTab.test.tsx`.
  - Verification run for this slice:
    - `npm test -- --run server/lib/plans.test.ts server/lib/beads-board.test.ts src/features/kanban/beads.test.ts src/features/kanban/BeadsDetailDrawer.test.tsx src/features/workspace/tabs/PlansTab.test.tsx`
    - `npm run build`
- Notes:
  - Compatibility is preserved when the new env vars are unset: nav labels remain `Tasks`, the board still defaults to native tasks, and maintainers can continue using the native tracker.
  - `nerve-usz` touched exactly these product files: `src/features/kanban/BeadsBoard.tsx`, `src/features/kanban/BeadsBoard.test.tsx`, and this living plan.
  - `nerve-wc4` touched these files: `server/lib/beads-sources.ts`, `server/lib/beads-sources.test.ts`, `server/lib/beads-board.ts`, `server/routes/beads.ts`, `server/routes/beads.test.ts`, `src/features/kanban/beads.ts`, `src/features/kanban/hooks/useBeadsBoard.ts`, `src/features/kanban/KanbanHeader.tsx`, `src/features/kanban/KanbanHeader.test.tsx`, `src/features/kanban/KanbanPanel.tsx`, and this living plan.
  - `nerve-37r` touched these files: `server/lib/plans.ts`, `server/lib/plans.test.ts`, `server/lib/beads-board.ts`, `server/lib/beads-board.test.ts`, `src/features/kanban/types.ts`, `src/features/kanban/beads.ts`, `src/features/kanban/beads.test.ts`, `src/features/kanban/BeadsDetailDrawer.tsx`, `src/features/kanban/BeadsDetailDrawer.test.tsx`, `src/features/kanban/KanbanPanel.tsx`, `src/App.tsx`, `src/features/workspace/WorkspacePanel.tsx`, `src/features/workspace/tabs/PlansTab.tsx`, `src/features/workspace/tabs/PlansTab.test.tsx`, and this living plan.
  - Limit: this slice verified the archive-aware bead→plan flow through targeted automated server/client/UI tests and full build, but did not add a separate live-browser walkthrough in this subagent because the requested work was narrowly scoped to `nerve-37r` and the existing automated coverage now spans the full handoff path.

---

### Task 4: Verify, commit, and push

**Bead ID:** `nerve-251`  
**SubAgent:** `primary`  
**Prompt:** Verify the completed usability-polish work in `gambit-openclaw-nerve` by checking the relevant files, running the appropriate tests/build, and confirming this living plan reflects the actual outcome. Then commit the durable repo changes and push to `master`. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Verified, committed, and pushed usability polish work" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`
- relevant source/test folders based on executed work

**Files Created/Deleted/Modified:**
- `.plans/2026-03-13-nerve-usability-pass-and-polish.md`
- relevant source/test files based on executed work

**Status:** ⏳ Pending

**Results:** Pending.

---

## Execution Gate

Execution is now authorized and the repo-local Beads have been created. Current order:

1. `nerve-9ly` — validate the reported findings live and confirm remaining gaps.
2. `nerve-gic`, `nerve-usz`, `nerve-wc4`, `nerve-37r` — implement the confirmed follow-up work in dependency-aware slices.
3. `nerve-251` — verify, commit, and push to `master`.

The epic grouping bead for the overall effort is `nerve-ly9`. Beads in this repo cannot depend on an epic directly, so execution dependencies are wired between the real task beads instead.

---

## Final Results

**Status:** ⏳ Pending

**What We Built:** Pending.

**Commits:**
- Pending

**Lessons Learned:** Pending.

---

*Started on 2026-03-13*