---
plan_id: plan-2026-03-14-nerve-plan-linkage-slice-2
bead_ids:
  - nerve-4ah
  - nerve-lgw
  - nerve-z1k
  - nerve-q8g
---
# Gambit OpenClaw Nerve — plan linkage slice 2

**Date:** 2026-03-14  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Implement the second Nerve bead↔plan linkage slice by adding bead-side `metadata.plan` linkage and resolved-state behavior so bead→plan navigation no longer depends only on plan backlinks.

---

## Overview

Slice 1 shipped the missing repo-local linkage substrate: active plans now maintain stable `plan_id` values and populated `bead_ids`, and Nerve can surface linked plan identity through the existing archive-aware resolver/viewer path. That moved the system from “viewer exists but live links are null” to “repo-local plans can resolve from maintained backlinks.”

Slice 2 should move the linkage model closer to the originally documented design in `docs/BEAD-PLAN-LINKAGE.md`: bead metadata becomes the authoritative bead→plan pointer, while plan frontmatter remains the stable file identity and reverse-lookup index. In practice, this means adding a safe write/maintenance path for `metadata.plan`, teaching the resolver to classify results more explicitly (`active`, `archived`, `moved`, `missing`, and possibly `legacy_path_only` if still useful), and surfacing those states clearly in the Beads detail drawer without overloading board cards.

This should stay focused. The goal is not to build a full plan editor or a broad migration framework. The goal is to make bead-first navigation durable when plans move, archive, or drift, and to leave behind a clean follow-up surface for later repair tools if needed.

---

## Proposed Tasks

### Task 1: Validate current linkage behavior and scope the exact slice-2 gap

**Bead ID:** `nerve-4ah`  
**SubAgent:** `research`  
**Prompt:** Review the current post-slice-1 linkage implementation in `gambit-openclaw-nerve` and compare it against `docs/BEAD-PLAN-LINKAGE.md`. Confirm what already exists, what is still missing for bead-side authoritative linkage, and which resolved states should be implemented now versus deferred. Update this living plan with a sharp scope recommendation for slice 2.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `docs/` (read-only unless a tiny clarification is truly necessary)

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-plan-linkage-slice-2.md`

**Status:** ✅ Complete

**Results:** Validated the post-slice-1 implementation against `docs/BEAD-PLAN-LINKAGE.md`.

What already exists after slice 1:
- `server/lib/plans.ts` now maintains durable plan-side linkage data on touched active plans by ensuring `plan_id` and `bead_ids` frontmatter.
- `findRepoPlanByBeadId()` resolves linked plans from plan-side backlinks and prefers active plans over archived matches.
- `server/lib/beads-board.ts` enriches Beads cards with a `linkedPlan` summary derived from that plan-side lookup.
- `src/features/kanban/BeadsDetailDrawer.tsx` already renders drawer-level linked-plan UI and can open the resolved plan in the Plans surface.
- `archived` is already effectively represented via `linkedPlan.archived`; `active` is effectively represented by a non-archived linked plan.

What is still missing for bead-side authoritative linkage:
- There is no bead-side `metadata.plan = { plan_id, path, title }` write path; linkage is still inferred from plan backlinks, not stored on the bead.
- There is no metadata-first resolver that tries `plan.path`, validates `plan_id`, and falls back to `plan_id` recovery when the path drifts.
- There is no explicit resolved-state model beyond `linkedPlan` present/null plus `archived` boolean.
- `moved`, `missing`, and `legacy_path_only` are not exposed in server DTOs or drawer UX.
- Because the bead does not carry last-known plan identity/path, broken or moved links cannot preserve useful degraded context.

Recommended exact scope for slice 2:
1. Add bead-authoritative linkage support by reading/parsing bead `metadata.plan` in the Beads adapter/resolver path.
2. Introduce a resolver result model that returns plan summary plus resolved state.
3. Implement now: `active`, `archived`, `moved`, and `missing`.
4. Keep the current plan-side `bead_ids` lookup only as a compatibility fallback / secondary index while metadata is absent.
5. Update the Beads DTO + drawer UI so users can distinguish active vs archived vs moved vs missing and still open recovered moved plans.

Resolved-state recommendation now vs defer:
- Implement now: `active`, `archived`, `moved`, `missing`.
- Defer: explicit `legacy_path_only`. It only becomes meaningful once metadata-based links exist but point to frontmatter-less files; that is better handled later as repair/migration tooling.
- Defer broader repair tools: one-click metadata refresh, reverse lookup from plan pages via `bead_ids`, and migration helpers for legacy plans.

Scope recommendation: keep slice 2 focused on resolver/data-contract/drawer behavior needed for durable bead-first navigation. Do not bundle plan editing UI, broad historical migration, or generalized repair tooling.

Task 2 is unblocked.

---

### Task 2: Create execution Beads for slice 2

**Bead ID:** `nerve-lgw`  
**SubAgent:** `primary`  
**Prompt:** Convert the validated slice-2 scope into a compact repo-local Beads set. Keep the main implementation path focused on bead `metadata.plan` write/maintenance plus archive/move-aware resolution and drawer surfacing. Split optional/deferred work into separate beads only if it truly should not block the core path. Update this living plan with the real bead IDs and execution order.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-plan-linkage-slice-2.md`
- repo-local Beads state under `.beads/`

**Status:** ✅ Complete

**Results:** Converted validated scope into a tight execution bead set.

Beads updated/created:
- Updated `nerve-z1k` (Task 3 implementation bead) with explicit core acceptance criteria:
  - implement now: bead `metadata.plan` write/maintenance
  - resolver states: `active`, `archived`, `moved`, `missing`
  - DTO + drawer surfacing for moved/missing
  - compatibility fallback via existing `bead_ids` lookup
  - deferred items explicitly out of scope
- Created `nerve-4ka` (deferred follow-up chore): post-slice-2 repair/migration helpers (`legacy_path_only` user-facing state, metadata refresh/repair, reverse lookup from plan pages, broader migration helpers).

Execution order after this task:
- Core path (blocking chain): `nerve-4ah` → `nerve-lgw` → `nerve-z1k` → `nerve-q8g`
- Deferred/non-blocking follow-up: `nerve-4ka` depends on `nerve-q8g`

Scope cuts locked for slice 2 implementation:
- no user-facing `legacy_path_only` state in this slice
- no one-click metadata repair tool in this slice
- no reverse lookup/migration helper work in this slice

Task 3 (`nerve-z1k`) is now unblocked and ready for coding.

---

### Task 3: Implement slice 2

**Bead ID:** `nerve-z1k`  
**SubAgent:** `coder`  
**Prompt:** Implement the slice-2 bead↔plan linkage path in Nerve. Focus on bead-side `metadata.plan` write/maintenance, explicit resolution states, and clear drawer-level UX for active/archived/moved/missing plan links. Keep `bead_ids` lookup as compatibility fallback. Reuse the existing slice-1 substrate and keep the change minimal but durable. Implementation order: (1) metadata-aware resolver path + state model, (2) DTO wiring, (3) drawer surfacing for moved/missing. Do not implement deferred items (`legacy_path_only` UX state, one-click repair, reverse lookup helpers, broad migration tooling). Run targeted tests and a build, then update this living plan with exact files changed, validation, and scope notes.

**Folders Created/Deleted/Modified:**
- `server/`
- `src/`
- `.plans/`
- optional `docs/` only if a tiny contract clarification is required

**Files Created/Deleted/Modified:**
- `server/lib/plans.ts`
- `server/lib/plans.test.ts`
- `server/lib/beads-board.ts`
- `server/lib/beads-board.test.ts`
- `src/features/kanban/types.ts`
- `src/features/kanban/beads.ts`
- `src/features/kanban/beads.test.ts`
- `src/features/kanban/BeadsDetailDrawer.tsx`
- `src/features/kanban/BeadsDetailDrawer.test.tsx`
- `.plans/2026-03-14-nerve-plan-linkage-slice-2.md`

**Status:** ✅ Complete

**Results:** Implemented the scoped slice-2 core path on top of slice 1.

What shipped in Task 3:
- Added metadata-first plan resolution in `server/lib/plans.ts` via `resolveRepoPlanLinkForBead()` with explicit states:
  - `active`
  - `archived`
  - `moved` (path drift recovered by stable `plan_id`)
  - `missing` (metadata exists but no plan can be resolved)
- Kept plan-side `bead_ids` lookup as compatibility fallback when bead metadata is absent.
- Added metadata maintenance intent in the resolver (`metadataNeedsWrite` + `metadataToWrite`) so recovered/fallback links can be normalized to canonical `{ plan_id, path, title }` values.
- Updated Beads board projection (`server/lib/beads-board.ts`) to:
  - read bead `metadata.plan` when present,
  - resolve linked plans via metadata-first path,
  - surface resolver state in DTO (`resolution`, `movedFromPath`, `lastKnownPath`),
  - perform conservative best-effort metadata writes via `bd update --set-metadata plan.*=... --json` when resolver indicates stale/missing metadata.
- Updated client contracts and mapping (`src/features/kanban/types.ts`, `src/features/kanban/beads.ts`) for new linked-plan state fields.
- Updated drawer UX (`BeadsDetailDrawer.tsx`) to clearly surface moved/missing context:
  - explicit state badge,
  - moved path context (`Last known path`),
  - missing path context without opening a non-resolved path,
  - keep open action available for resolvable moved/active/archived plans.

Validation run:
- `npm test -- server/lib/plans.test.ts server/lib/beads-board.test.ts src/features/kanban/beads.test.ts src/features/kanban/BeadsDetailDrawer.test.tsx`
- `npm run build`
- Result: all targeted tests passed; build succeeded.

Scope notes (explicitly deferred and not implemented here):
- no user-facing `legacy_path_only` resolver state
- no one-click metadata refresh/repair action
- no reverse lookup UX from plan pages
- no broad migration helper tooling

---

### Task 4: Verify, commit, and push

**Bead ID:** `nerve-q8g`  
**SubAgent:** `primary`  
**Prompt:** Verify the completed slice-2 linkage work, ensure this living plan reflects what actually happened, then commit and push the durable repo changes to `master`. Record the final commit hashes, final status, and any remaining deferred follow-up.

**Folders Created/Deleted/Modified:**
- `.plans/`
- relevant source/test folders based on executed work

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-plan-linkage-slice-2.md`
- relevant source/test files based on executed work

**Status:** ✅ Complete

**Results:** Verified slice-2 linkage implementation state, reran targeted tests and production build, confirmed SSH `origin` remote for push, committed durable implementation changes, and finalized this living plan with actual outcomes and deferred follow-up.

Verification performed in this task:
- `git status --short` and branch/remote inspection (`master`, SSH `origin`)
- `npm test -- server/lib/plans.test.ts server/lib/beads-board.test.ts src/features/kanban/beads.test.ts src/features/kanban/BeadsDetailDrawer.test.tsx`
- `npm run build`
- Result: all targeted tests passed and build succeeded.

---

Execution is now authorized. Repo-local execution Beads are: `nerve-7zv` (epic), `nerve-4ah` (slice-2 validation), `nerve-lgw` (execution Beads / plan update), `nerve-z1k` (slice-2 implementation), `nerve-q8g` (final verification/commit/push), and `nerve-4ka` (explicit deferred follow-up).

Execution order:
- Core implementation chain: `nerve-4ah` → `nerve-lgw` → `nerve-z1k` → `nerve-q8g`
- Deferred chain (non-blocking for Task 3): `nerve-q8g` → `nerve-4ka`

## Initial Recommendation

My recommendation is that slice 2 should center on three concrete outcomes:

1. **Authoritative bead metadata link**
   - write and maintain `metadata.plan = { plan_id, path, title }` for intentionally linked beads
2. **Resolver state model**
   - classify links as `active`, `archived`, `moved`, or `missing`
3. **Drawer-level recovery UX**
   - show the resolved state clearly and, when applicable, expose a safe metadata-refresh/repair action or at least last-known-path context

What I would *not* put into slice 2 unless validation proves it trivial:
- full editing UI for plans
- heuristic auto-linking across arbitrary plans
- broad historical migration across every archived plan in the repo
- cross-repo linkage

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Delivered slice-2 bead↔plan linkage durability with metadata-first resolution and explicit link states (`active`, `archived`, `moved`, `missing`), preserved plan-side `bead_ids` fallback compatibility, added conservative metadata refresh writes for stale links, and surfaced moved/missing context in the Beads detail drawer with updated DTO/client contracts and coverage.

**Commits:**
- `732927e` — Implement metadata-first slice-2 bead-plan linkage
- `a22aadd` — Finalize slice-2 linkage plan results and verification

**Lessons Learned:** Keep the core linkage contract narrow (metadata-first resolver + explicit states + drawer surfacing) and split migration/repair helpers into a follow-up bead to preserve delivery confidence and reviewability.

**Deferred Follow-up:**
- `nerve-4ka` — Post-slice-2 linkage repair and migration helpers (non-blocking)

---

*Completed on 2026-03-14*
