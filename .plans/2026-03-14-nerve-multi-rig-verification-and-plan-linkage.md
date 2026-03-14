---
plan_id: plan-2026-03-14-nerve-multi-rig-verification-and-plan-linkage
bead_ids:
  - nerve-639
  - nerve-cq2
  - nerve-giq
  - nerve-cvx
---
# Gambit OpenClaw Nerve — multi-rig verification and plan linkage follow-up

**Date:** 2026-03-14  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Verify that the recent Nerve Beads UI workflow changes behave correctly across the terminal-driven Nerve setups associated with Chip, Cookie, and Byte, then begin the next implementation slice for plan linkage.

---

## Overview

The last Nerve usability/polish wave appears to have completed the main implementation slices for Beads-first workflow mode, native-task hiding, board-wide column visibility persistence, managed Beads sources, last-viewed source restore, and archive-aware bead→plan viewing. What remains is to verify that these changes really hold up in the actual multi-rig workflow Derrick cares about, not just in one local repo/build.

This follow-up should start with a terminal-centric cross-rig verification pass. The goal is to confirm that the same Nerve UI behavior is reachable and coherent for the Chip, Cookie, and Byte environments, and to document any rig-specific drift such as stale deployments, env mismatches, or differing Nerve config. Once that verification is done, the next engineering slice is plan linkage itself: moving from the current read-only/archive-aware bead→plan surfacing toward a clearer, more durable linkage workflow inside Nerve.

Because this is new work, the plan stays explicit and repo-local. Derrick has confirmed execution. Repo-local execution Beads are now: `nerve-1sl` (epic), `nerve-639` (cross-rig verification), `nerve-cq2` (findings → execution Beads/plan update), `nerve-giq` (plan-linkage slice 1: durable bead IDs + identity), `nerve-673` (Cookie/Byte SSH-gating remediation + deferred parity verification), and `nerve-cvx` (final verification/commit/push for the implementation path). Primary execution path is `nerve-639` → `nerve-cq2` → `nerve-giq` → `nerve-cvx`, with `nerve-673` intentionally split as a parallel/non-blocking follow-up so access gating does not stall linkage implementation.

---

## Proposed Tasks

### Task 1: Cross-rig terminal verification for Chip / Cookie / Byte

**Bead ID:** `nerve-639`  
**SubAgent:** `research`  
**Prompt:** Verify the recent Nerve Beads UI workflow changes across the terminal-accessible Nerve environments for Chip, Cookie, and Byte. Use safe terminal-first inspection to determine whether each rig is on the expected code/config, whether the relevant Nerve UI behavior is available, and whether there are any environment mismatches affecting Beads-first workflow mode, source management, column visibility persistence, or bead→plan viewing. Claim the bead at start, document findings per rig, and close the bead with a concrete verification summary.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-multi-rig-verification-and-plan-linkage.md`

**Status:** ✅ Complete

**Results:** Terminal-first verification completed with a mixed outcome. **Chip** (the local `derrick-Surface-Pro-8` rig) is running Nerve from this repo on `master` at `3e4caa724f62f586347cd91b91fe34c360d70116`, and the live `/api/server-info` response confirms the expected Beads-first shell state is active (`primarySurface=beads`, `prefersBeads=true`, `hideNativeTasks=true`, `navigationLabel=Beads`, `defaultBoardMode=beads`). The live `/api/beads/sources` response also shows the restore-generated source registry is loaded, the managed last-viewed source selection persists correctly via `/api/beads/selection`, and the tracked project list includes `gambit-openclaw-nerve`. Targeted vitest coverage for workflow tab labeling, native-task hiding, source management, last-source persistence, board-wide column visibility persistence, and archive-aware plan lookup all passed locally.

**Per-rig findings:**
- **Chip** (`derrick-Surface-Pro-8`, local): **current / verified**. Live server process is running on port `3080` from this repo. Env inspection shows `NERVE_WORKFLOW_PRIMARY='beads'` and `NERVE_HIDE_NATIVE_TASKS='true'`. The source registry is populated from `NERVE_BEADS_SOURCES`, and selection persistence worked in the running server when switched to `gambit-openclaw-nerve` and restored to the prior source.
- **Cookie** (`derrick-Alienware-Aurora-R13`, SSH alias `cookie`): **blocked from direct verification**. The rig is online in Tailscale, but terminal access is currently gated by a Tailscale SSH additional-check/login flow, so I could not safely inspect its deployed repo, env, or running Nerve process from this session.
- **Byte** (`derrick-samsung-book`, SSH alias `byte`): **blocked from direct verification** for the same reason as Cookie. The rig is online in Tailscale, but SSH currently diverts to a Tailscale SSH additional-check/login flow before command execution.

**Implementation-shaping notes:**
- The shipped code path for bead→plan linking is present and tested, but the live `gambit-openclaw-nerve` board payload currently returns `linkedPlan: null` for its beads because the repo’s active plan files do not yet carry YAML `bead_ids` frontmatter. In other words, the bead→plan viewing machinery exists, but this repo’s current plan data is not yet feeding it.
- The repo-local plans API currently lists plans successfully, but all discovered plans report empty `beadIds` for the same reason above; this is likely the next concrete linkage gap to address.
- Task 2 is unblocked: it now has enough evidence to create focused remediation/planning beads for (a) cross-rig access/deployment verification follow-up on Cookie/Byte and (b) durable bead↔plan identity/link population in repo-local plans.

---

### Task 2: Turn verification findings into repo-local execution Beads

**Bead ID:** `nerve-cq2`  
**SubAgent:** `primary`  
**Prompt:** Convert the cross-rig verification findings into a focused repo-local Beads set for any remediation work plus the first concrete plan-linkage implementation slice. Keep the bead set dependency-aware and compact. Claim the bead at start, create/update the repo-local Beads, wire dependencies, update this plan with the final bead IDs and execution order, then close the bead.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-multi-rig-verification-and-plan-linkage.md`
- repo-local Beads state under `.beads/`

**Status:** ✅ Complete

**Results:** Converted findings into a compact dependency-aware next-phase Beads set and updated scope/ordering:
- Updated `nerve-giq` title + description to define **plan-linkage slice 1** explicitly: durable YAML `bead_ids` population plus linkage identity/backlink handling, while preserving existing archive-aware resolver behavior.
- Created `nerve-673` for the Cookie/Byte Tailscale SSH additional-check/login blocker so cross-rig parity remediation is tracked but does **not** block core linkage implementation.
- Added dependency `nerve-673` → `nerve-cq2` so blocker follow-up starts after this planning pass, in parallel with `nerve-giq`.
- Kept primary implementation chain as `nerve-cq2` → `nerve-giq` → `nerve-cvx` to keep Task 3 immediately actionable.

---

### Task 3: Implement plan-linkage slice 1 (durable bead IDs + identity)

**Bead ID:** `nerve-giq`  
**SubAgent:** `coder`  
**Prompt:** Implement `nerve-giq` as the first concrete plan-linkage slice. Build directly on the existing archive-aware bead→plan resolver/viewing path; do not reimplement it. Deliver durable linkage data population and identity safety by: (1) populating/maintaining YAML `bead_ids` frontmatter for repo plan files consumed by Nerve, (2) adding/using durable linkage identity/backlink metadata so plan linkage survives normal plan-file movement/renames where possible, and (3) covering the write/update path with targeted tests. Claim `nerve-giq` at start, keep changes reviewable, run targeted tests + build, update this living plan with exact results, and close the bead with a concrete reason.

**Folders Created/Deleted/Modified:**
- `src/`
- `server/`
- `docs/` (if design notes need refinement)
- `.plans/`

**Files Created/Deleted/Modified:**
- `server/lib/plans.ts`
- `server/lib/plans.test.ts`
- `server/lib/beads-board.ts`
- `src/features/kanban/beads.ts`
- `src/features/kanban/types.ts`
- `src/features/kanban/BeadsDetailDrawer.tsx`
- `.plans/2026-03-11-beads-board-502-triage.md`
- `.plans/2026-03-11-beads-board-v1.md`
- `.plans/2026-03-12-beads-board-add-closed-column.md`
- `.plans/2026-03-12-beads-board-live-verification.md`
- `.plans/2026-03-12-beads-board-nonempty-verification.md`
- `.plans/2026-03-12-beads-metadata-pass.md`
- `.plans/2026-03-12-beads-rich-sample-verification.md`
- `.plans/2026-03-12-nerve-beads-board-fix.md`
- `.plans/2026-03-12-nerve-workflow-surface-enhancements.md`
- `.plans/2026-03-13-nerve-usability-pass-and-polish.md`
- `.plans/2026-03-14-nerve-multi-rig-verification-and-plan-linkage.md`

**Status:** ✅ Complete

**Results:** Implemented linkage-durability slice 1 as a conservative server-side/backlink migration pass plus identity surfacing:
- Added automatic frontmatter maintenance for active repo-local plans in `server/lib/plans.ts`. On list/read, active plans now get a stable `plan_id` if missing and a maintained `bead_ids` list inferred from `**Bead ID:**` task sections (merged with existing `bead_ids`). Archived plans are intentionally read-only.
- Added durable linkage identity surfacing by threading `planId` through the server Beads linked-plan DTO and frontend Beads linked-plan types/drawer display.
- Backfilled active repo plan files with `plan_id` + `bead_ids` frontmatter so live bead→plan resolution has real backlink data immediately in this repo.
- Extended plans tests to cover the write/update path (frontmatter enrichment, archived non-mutation, and identity assignment).

**Validation:**
- `npm test -- server/lib/plans.test.ts server/lib/beads-board.test.ts src/features/kanban/beads.test.ts src/features/kanban/BeadsDetailDrawer.test.tsx` ✅
- `npm run build` ✅

**Scope notes:**
- Kept archive-aware resolver behavior intact and extended around it (no replacement).
- Did not implement bead `metadata.plan` write-back/repair in this slice; that remains follow-up work for `nerve-cvx`/later beads.

---

### Task 4: Verify, commit, and push

**Bead ID:** `nerve-cvx`  
**SubAgent:** `primary`  
**Prompt:** Verify the completed multi-rig verification and plan-linkage work in `gambit-openclaw-nerve`, ensure this living plan reflects what actually happened, then commit and push the durable repo changes to `master`. Claim the bead at start and close it when verification/commit/push are complete.

**Folders Created/Deleted/Modified:**
- `.plans/`
- relevant source/test folders based on executed work

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-multi-rig-verification-and-plan-linkage.md`
- relevant source/test files based on executed work

**Status:** ✅ Complete

**Results:** Verified the implementation path end-to-end in this repo before finalizing: re-ran targeted tests for plans/beads linkage and the Beads drawer (`npm test -- server/lib/plans.test.ts server/lib/beads-board.test.ts src/features/kanban/beads.test.ts src/features/kanban/BeadsDetailDrawer.test.tsx`) and re-ran full production build (`npm run build`), both passing. Confirmed Git remote uses SSH for `origin`. Committed the durable linkage implementation/backfill changes on `master` as `4b91636` (`Add durable plan linkage IDs and linked-plan identity`), then finalized this living plan with the actual outcome and follow-up notes.

---

## Notes / Current Context

- Prior plan `2026-03-13-nerve-usability-pass-and-polish.md` already records implementation progress for:
  - Beads-first env workflow mode / native-task hiding
  - board-wide column visibility persistence
  - managed Beads sources + last-viewed source restoration
  - archive-aware bead→plan viewing from the Beads drawer into the Plans surface
- That means this plan should treat cross-rig verification as the first order of business, then scope the next plan-linkage increment from the actual current code rather than restarting from the older design note.

### Execution order (updated after Task 2)

1. `nerve-639` ✅ complete — established current multi-rig findings baseline.
2. `nerve-cq2` ✅ complete — translated findings into focused execution beads/dependencies.
3. `nerve-giq` ✅ complete — implemented plan-linkage slice 1 (durable `bead_ids` + identity/backlink handling).
4. `nerve-cvx` ✅ complete — verified implementation path output, committed, and pushed to `master`.

Parallel/non-blocking remediation track:
- `nerve-673` — resolve Cookie/Byte Tailscale SSH gating and finish parity verification; tracked separately so it does not block `nerve-giq`.

### Scope cuts from Task 2

- Explicitly deferred Cookie/Byte SSH-access remediation and cross-rig parity completion to `nerve-673`.
- Kept Task 3 narrowly focused on durable linkage data population/identity handling so implementation can start immediately.

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- Completed and documented terminal-first multi-rig verification outcomes: Chip verified live; Cookie/Byte verification blocked by Tailscale SSH additional-check/login gating.
- Split the Cookie/Byte access/parity follow-up into non-blocking bead `nerve-673` so linkage delivery could proceed without stalling.
- Implemented plan-linkage slice 1 durability in Nerve by auto-maintaining active-plan frontmatter (`plan_id`, `bead_ids`), surfacing linked `planId` in Beads linked-plan payload/UI, and backfilling active plan files with durable linkage metadata.
- Verified the delivered slice with targeted tests plus full build before final commit/push.

**Commits:**
- `4b91636` - Add durable plan linkage IDs and linked-plan identity

**Lessons Learned:**
- Backfilling and maintaining `bead_ids` in active plan frontmatter is the most reliable way to make bead→plan linkage immediately useful in live repos without requiring manual metadata upkeep.
- Cross-rig verification should explicitly model access-gating as its own tracked follow-up (`nerve-673`) so operational blockers do not delay product-surface linkage work.

---

*Started on 2026-03-14*  
*Completed on 2026-03-14*
