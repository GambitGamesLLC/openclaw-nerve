---
plan_id: plan-2026-03-15-beads-loading-state-polish
bead_ids:
  - oc-0hj
status: complete
created_at: 2026-03-15
updated_at: 2026-03-15
---

# Nerve Beads loading-state polish

## Goal

Make the Beads board show an explicit non-blank loading state while board data is being fetched so slow loads do not look broken.

## Findings

- The false empty-state starvation bug was already fixed in `useBeadsBoard.ts`.
- `BeadsBoard.tsx` still rendered only bare skeleton columns during `loading`, which could read as a blank/ambiguous board rather than an intentional loading state.
- The smallest durable fix belongs in the Beads board component itself so any caller that passes `loading` gets a clearer UX without changing fetch behavior.

## Changes

- Added a dedicated `BeadsLoadingState` in `src/features/kanban/BeadsBoard.tsx`.
- The loading state now shows:
  - a spinning `LoaderCircle`
  - explicit copy: `Loading Beads board…`
  - supporting text explaining that issues/counts are being fetched
  - the current source label when available
  - the existing skeleton columns behind the status card so the board shape remains visible
- Added a focused regression test in `src/features/kanban/BeadsBoard.test.tsx` asserting the explicit loading status/copy renders instead of a blank board.

## Validation

- `npm test -- --run src/features/kanban/BeadsBoard.test.tsx` ✅
- `npm run build` ✅

## Commits

- `3cffec1` - Add explicit Beads board loading state
