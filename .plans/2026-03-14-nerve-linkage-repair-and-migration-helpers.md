# Gambit OpenClaw Nerve — linkage repair and migration helpers

**Date:** 2026-03-14  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Implement the deferred post-slice-2 bead↔plan linkage helpers so Nerve can repair stale links more gracefully, expose richer migration states, and make legacy linkage easier to normalize.

---

## Overview

Slice 1 and slice 2 established the core contract: plans now carry durable `plan_id` / `bead_ids` frontmatter, beads can carry authoritative `metadata.plan`, and Nerve resolves links metadata-first with explicit `active`, `archived`, `moved`, and `missing` states. The remaining work in `nerve-4ka` is not foundational anymore; it is repair and migration ergonomics.

This follow-up should stay disciplined. The point is to make the linkage system easier to recover and normalize when it encounters legacy or stale data, not to sprawl into a full plan editor or generic content-management wave. The most likely high-value pieces are: deciding whether `legacy_path_only` deserves to exist as an explicit surfaced state, adding a conservative metadata refresh/repair path for moved/recovered links, exposing reverse lookup from plan surfaces back to linked beads when that materially helps, and adding lightweight migration helpers for older plans/beads that predate the new contract.

Because this is now a follow-up wave, we should verify which of those helpers still matter after the slice-2 implementation landed, then keep the actual implementation slice compact and reviewable. Execution is now authorized. Repo-local execution Beads are now: `nerve-42d` (epic), `nerve-pih` (validation), `nerve-9tg` (execution Beads / plan update), `nerve-10f` (manual metadata refresh/repair implementation), `nerve-595` (final verification/commit/push), and `nerve-1w9` (explicit deferred polish follow-up). The original deferred follow-up bead `nerve-4ka` remains the umbrella rationale for this wave; this plan is the concrete execution breakdown.

---

## Proposed Tasks

### Task 1: Validate the highest-value repair/migration helpers

**Bead ID:** `nerve-pih`  
**SubAgent:** `research`  
**Prompt:** Validate the deferred linkage-repair/migration helper scope after slice 2. Review the current implementation and determine which of the deferred items still provide the highest value now: `legacy_path_only` as a surfaced state, one-click metadata refresh/repair, reverse lookup from plan pages, and broader migration helpers. Recommend a compact implementation scope for this follow-up wave and update this living plan with the exact recommendation.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `docs/` (read-only unless a tiny clarification is truly needed)

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-linkage-repair-and-migration-helpers.md`

**Status:** ✅ Complete

**Results:** Validated the shipped slice-2 behavior against the current code, tests, docs, and adjacent plan history.

Findings:
- Slice 2 already implemented the highest-leverage normalization path in practice: `resolveRepoPlanLinkForBead()` returns canonical `metadataToWrite` / `metadataNeedsWrite`, and `server/lib/beads-board.ts` already performs a conservative best-effort `bd update --set-metadata ...` write during board projection. Moved links and `bead_ids` fallback links are therefore already lazily normalized in the common case.
- The shipped surfaced state model is intentionally narrow: `active`, `archived`, `moved`, and `missing`. There is no shipped `legacy_path_only` state in the DTO/UI, and active-plan linkage maintenance already backfills `plan_id` / `bead_ids` on touched active plans, which reduces the realistic surface area where a frontmatter-less plan file needs its own first-class user-facing state.
- Reverse lookup from plan pages is already materially present in the Plans UI: plans are searchable by `beadIds`, the selected plan header renders linked bead IDs, and those IDs can already open the task in the board when `onOpenTask` is wired. A separate reverse-lookup feature wave would be incremental polish, not the next missing capability.
- Broader migration helpers are lower value now because the existing system already performs lazy normalization: active plans get maintained frontmatter on read/list, and bead-side metadata gets refreshed opportunistically when a plan is resolved. There is not yet enough repeated manual cleanup pain visible in the current implementation to justify a larger migration pass.

Recommended next helper slice:
- Implement **only a narrow manual metadata repair affordance** for the cases where automatic best-effort normalization is insufficient or unavailable.
- Scope it to beads that already have a resolvable plan (`moved` or `bead_ids` fallback-derived canonical target) but still need canonical `metadata.plan` refreshed.
- Prefer a tiny server action plus drawer-level CTA / status over broad migration tooling. The intent should be: rewrite canonical `metadata.plan = { plan_id, path, title }` now — not generic plan editing.
- Do **not** expand the state model in the same pass.

Explicit answers:
- **Next highest-value helper now:** narrow manual metadata refresh/repair, but only as a fallback/escape hatch on top of the already-shipped best-effort sync.
- **`legacy_path_only` surfaced state:** still premature.
- **One-click metadata refresh/repair:** meaningful only in this constrained form; not as a broader repair wave.
- **Reverse lookup from plan pages:** useful, but much of the practical value is already present via `beadIds` in Plans; lower value than repair fallback.
- **Broader migration helpers:** defer again.

This validation keeps Task 2 unblocked, but the bead breakdown should now target a single compact repair slice and explicitly defer `legacy_path_only`, richer reverse-lookup UX, and broad migration tooling.

---

### Task 2: Create execution Beads for the selected helper slice

**Bead ID:** `nerve-9tg`  
**SubAgent:** `primary`  
**Prompt:** Convert the validated helper scope into a compact repo-local Beads set. Keep the implementation path focused on a small manual metadata refresh/repair path only (for already-resolvable moved/fallback links whose canonical `metadata.plan` still needs rewrite), and split non-blocking nice-to-haves into explicitly deferred beads. Update this living plan with exact bead IDs and dependency order.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-linkage-repair-and-migration-helpers.md`
- repo-local Beads state under `.beads/`

**Status:** ✅ Complete

**Results:** Updated the execution bead set to keep implementation tightly scoped and immediately codable.

Beads updated/created:
- `nerve-10f` updated to the concrete implementation slice: **manual metadata refresh/repair helper only**.
- `nerve-1w9` created as a single deferred follow-up bead for non-blocking polish (`legacy_path_only`, richer reverse lookup from plan pages, broader migration helpers).

Dependency order now:
1. `nerve-pih` (validation) ✅ closed
2. `nerve-9tg` (execution-bead shaping / plan update) ✅ complete in this task
3. `nerve-10f` (implement manual metadata refresh/repair helper slice)
4. `nerve-595` (verify, commit, push)
5. `nerve-1w9` (deferred polish follow-up; blocked by `nerve-595`, does not block Task 3)

Scope cuts encoded for this pass:
- Deferred to `nerve-1w9`: surfaced `legacy_path_only`, richer reverse lookup UX, broader migration helper wave.
- In-scope for Task 3 only: tiny server action + drawer-level affordance/status to rewrite canonical `metadata.plan = { plan_id, path, title }` when link resolution already succeeds.

---

### Task 3: Implement manual metadata refresh/repair helper slice

**Bead ID:** `nerve-10f`  
**SubAgent:** `coder`  
**Prompt:** Implement only the compact post-slice-2 manual metadata refresh/repair path. Add a tiny server action and drawer-level affordance/status for beads whose plan is already resolvable (`moved` or `bead_ids` fallback) but whose canonical `metadata.plan = { plan_id, path, title }` still needs rewrite. Reuse existing slice-1/slice-2 linkage substrate, run targeted tests plus build, and keep `legacy_path_only`, richer reverse lookup from plan pages, and broader migration helpers out of scope (tracked in `nerve-1w9`).

**Folders Created/Deleted/Modified:**
- `server/`
- `src/`
- `.plans/`
- optional `docs/` only if contract clarification becomes necessary

**Files Created/Deleted/Modified:**
- `server/lib/beads-board.ts`
- `server/routes/beads.ts`
- `src/features/kanban/BeadsDetailDrawer.tsx`
- `src/features/kanban/hooks/useBeadsBoard.ts`
- `src/features/kanban/KanbanPanel.tsx`
- `src/features/kanban/beads.ts`
- `src/features/kanban/types.ts`
- `server/lib/beads-board.test.ts`
- `server/routes/beads.test.ts`
- `src/features/kanban/BeadsDetailDrawer.test.tsx`
- `.plans/2026-03-14-nerve-linkage-repair-and-migration-helpers.md`

**Status:** ✅ Complete

**Results:** Implemented a tightly scoped manual linked-plan metadata repair path without expanding state surface area.

Delivered behavior:
- Added a small server-side repair action (`POST /api/beads/issues/:id/repair-plan-metadata`) that rewrites canonical `metadata.plan.{plan_id,path,title}` only when the link is already resolvable **and** eligible (`resolution === moved` or `resolvedBy === bead_ids`) and metadata actually needs a write.
- Extended linked-plan DTO payload to include conservative repair status flags (`metadataNeedsWrite`, `canRepairMetadata`, and `resolvedBy`) so the drawer can show explicit status and CTA gating.
- Added drawer-level affordance/status in Beads detail: explicit stale/up-to-date messaging, manual **Repair metadata** CTA when eligible, success/error status feedback, and board refresh after successful repair.
- Preserved existing best-effort maintenance in board projection; this slice adds explicit human-invoked repair, not bulk migration.

Validation run:
- `npm test -- server/lib/beads-board.test.ts server/routes/beads.test.ts src/features/kanban/BeadsDetailDrawer.test.tsx`
- `npm run build`

Out-of-scope items explicitly left deferred to `nerve-1w9`:
- surfaced `legacy_path_only` state
- richer reverse lookup from plan pages
- broader migration helper/editor wave

---

### Task 4: Verify, commit, and push

**Bead ID:** `nerve-595`  
**SubAgent:** `primary`  
**Prompt:** Verify the completed manual metadata refresh/repair helper work, ensure this living plan reflects what actually happened, then commit and push the durable repo changes to `master`. Record final commit hashes, final status, and remaining deferred follow-up (`nerve-1w9`).

**Folders Created/Deleted/Modified:**
- `.plans/`
- relevant source/test folders based on executed work

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-linkage-repair-and-migration-helpers.md`
- relevant source/test files based on executed work

**Status:** ✅ Complete

**Results:** Verified the Task 3 implementation end-to-end before finalizing. Re-ran the targeted test slice and production build, confirmed the working tree only contained the expected server/UI/test changes plus this living plan, then prepared the branch for commit/push to `master`.

Verification performed in this task:
- `npm test -- server/lib/beads-board.test.ts server/routes/beads.test.ts src/features/kanban/BeadsDetailDrawer.test.tsx`
- `npm run build`
- `git status --short`, `git diff --stat`, `git remote -v` (SSH `origin` confirmed)

---

## Validated Recommendation

After reviewing the shipped slice-2 implementation, the next follow-up wave should stay very small:

1. **Narrow manual metadata refresh/repair**
   - add a targeted repair path only for cases where canonical `metadata.plan` still needs to be rewritten after fallback/recovery
   - keep it focused on `moved` / fallback-derived resolvable links, complementing the existing best-effort sync already in `server/lib/beads-board.ts`
2. **Defer `legacy_path_only` surfaced state** (`nerve-1w9`)
   - still too edge-case-heavy relative to the current live workflow and maintained frontmatter substrate
3. **Defer richer reverse lookup from plan pages** (`nerve-1w9`)
   - plans already expose/search `beadIds` and can already open linked tasks, so a dedicated wave is polish rather than urgent linkage recovery
4. **Defer broader migration helpers** (`nerve-1w9`)
   - lazy normalization is already doing most of the migration work incrementally; no broad pass justified yet

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Delivered and verified a compact manual linked-plan metadata repair flow for already-resolvable links, including a dedicated repair endpoint, linked-plan repair eligibility/status in DTOs, and drawer-level repair CTA/feedback with board refresh. Validation remained green on targeted tests and build.

**Commits:**
- Pending final commit hash recording in Task 4 handoff

**Lessons Learned:** Keeping the scope constrained to explicit manual repair (instead of broad migration tooling) preserved reviewability and still covered the practical stale-metadata recovery path. Deferred polish remains intentionally tracked in `nerve-1w9`.

---

*Started on 2026-03-14*
