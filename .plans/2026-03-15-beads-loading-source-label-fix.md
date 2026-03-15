---
plan_id: plan-2026-03-15-beads-loading-source-label-fix
bead_ids:
  - oc-0pn
status: complete
created_at: 2026-03-15
updated_at: 2026-03-15
---

# Nerve Beads loading-source label fix

## Goal

Make the Beads loading state show the newly selected source immediately during source switches instead of briefly showing the previously loaded source label while the new board request is still in flight.

## Findings

- The loading-state polish added in `BeadsBoard.tsx` correctly renders a source label when one is provided.
- `KanbanPanel.tsx` was passing `beadsBoard?.source.label` into both `BeadsBoard` and `BeadsDetailDrawer`.
- During a source switch, `selectedSourceId` updates immediately, but `beadsBoard` still points at the previously settled response until the next `/api/beads/board` fetch completes.
- That meant the loading UI showed stale source context even though the selector had already moved to the new source.

## Changes

- Added `selectedSource` derivation in `src/features/kanban/hooks/useBeadsBoard.ts` from `sources + selectedSourceId`.
- Updated `src/features/kanban/KanbanPanel.tsx` to pass `selectedBeadsSource?.label ?? beadsBoard?.source.label` into the Beads board and Beads detail drawer.
- Added focused regression coverage in `src/features/kanban/hooks/useBeadsBoard.test.tsx` to verify selected-source metadata updates immediately while a board request is still in flight.

## Validation

- `npm test -- --run src/features/kanban/hooks/useBeadsBoard.test.tsx src/features/kanban/BeadsBoard.test.tsx` ✅
- `npm run build` ✅

## Commits

- Pending
