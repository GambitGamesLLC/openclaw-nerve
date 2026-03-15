---
plan_id: plan-2026-03-14-nerve-manual-integration-pass-and-bead-hygiene
bead_ids:
  - nerve-010
  - nerve-533
  - nerve-ip6
  - nerve-bkb
---
# Gambit OpenClaw Nerve — manual integration pass and Bead hygiene

**Date:** 2026-03-14  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Run a real manual Nerve/Beads integration walkthrough to find actual bugs or polish gaps, while also cleaning up stale repo-local Beads that no longer represent live execution work.

---

## Overview

The Beads/Nerve linkage stack is now in a good technical place: durable plan-side identity, metadata-first bead-side resolution, explicit moved/missing/archive-aware states, manual repair for stale metadata, and a compact Plans-side reverse-navigation polish layer. What remains is no longer obvious feature work — it is validation through real usage.

That makes this the right time for a manual pass. Rather than inventing more speculative polish work, we should exercise the real flows Derrick will use: board → drawer → plan, plan → linked task, moved/missing/archive-aware states where possible, and metadata-repair behavior. Any bugs, awkward transitions, or missing context we find should become concrete repo-local Beads so the next work is driven by actual product friction instead of guesswork.

At the same time, the repo-local Beads ledger has accumulated a few stale umbrella/admin issues from finished execution waves. Because `bd ready --json` is currently empty and the shipped work has already been committed/pushed, we can likely clean up those stale Beads safely in parallel with the manual product pass. The principle is simple: keep active/deferred work queryable, but close superseded epics/admin beads that no longer represent actionable execution.

Execution is now authorized. Repo-local execution Beads are created as `nerve-3iu` (epic), `nerve-010` (manual walkthrough), `nerve-533` (Bead hygiene cleanup), `nerve-ip6` (implement only worthwhile fixes if found), and `nerve-bkb` (final verification/commit/push). Current dependency shape: the implementation bead waits on the walkthrough, and the final bead waits on both hygiene cleanup and implementation/finding resolution.

---

## Proposed Tasks

### Task 1: Manual Nerve/Beads integration walkthrough and issue capture

**Bead ID:** `nerve-010`  
**SubAgent:** `research`  
**Prompt:** Run a real manual walkthrough of the current Nerve/Beads integration in `gambit-openclaw-nerve`. Focus on real user flows: Beads board → detail drawer → linked plan, plan → linked task navigation, linked-task context panel usefulness, moved/missing/archive-aware behavior where practical, and manual metadata repair behavior. Capture only concrete bugs/polish issues that are worth tracking as repo-local Beads. Update this living plan with findings and suggested follow-up tasks.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-manual-integration-pass-and-bead-hygiene.md`

**Status:** ✅ Complete

**Results:** Ran a live integration pass against the current repo server (`PORT=3180`) and the repo-local Beads/Plans APIs for `gambit-openclaw-nerve`, focusing on the current shipped linkage path rather than older background state. Exercised these flows:
- `Beads board → detail drawer → linked plan` using live issues such as `nerve-010`, `nerve-533`, `nerve-cq2`, and `nerve-giq`; active linked-plan resolution, title/path/status surfacing, and openable plan targets all resolved correctly.
- `Plans list/read → linked task surfacing` for the current plan and prior completed plans; current plan frontmatter/backlinks were materialized correctly (`plan_id` + `bead_ids` now present and returned by `/api/plans`).
- `Linked-task context panel usefulness` using the current plan’s live content and linked bead set.
- `Moved/missing/archive-aware` and `manual metadata repair` only where practical from live repo state; there were no naturally occurring archived/moved/missing or `metadataNeedsWrite=true` cases in the current repo data, so those states could not be meaningfully exercised without manufacturing fixture state.

Concrete finding worth tracking:
- **Linked-task context panel is too generic when a plan mentions bead IDs before the task sections.** For the current plan, all four linked beads (`nerve-010`, `nerve-533`, `nerve-ip6`, `nerve-bkb`) resolve to the same overview sentence snippet (`Execution is now authorized...`) instead of task-specific context. That makes the Plans-side “Linked tasks” panel much less useful for navigation/context, even though the underlying bead links are present and valid.

Suggested follow-up tasks / Beads:
- `Polish linked-task context extraction so each bead prefers its task section/header/prompt block over the first incidental mention elsewhere in the plan.`
- Optional tiny verification follow-up only if the above lands: `Re-run the manual plan → linked task pass and confirm each linked bead shows distinct task-specific context.`

No other concrete Beads/Plans integration bug showed up in the live current-repo pass. The main board → drawer → plan linkage path is in good shape.

---

### Task 2: Audit and clean stale Beads ledger state

**Bead ID:** `nerve-533`  
**SubAgent:** `primary`  
**Prompt:** Review the currently open repo-local Beads in `gambit-openclaw-nerve` and separate active/deferred work from stale umbrella/admin leftovers. Safely close or retitle/update the stale ones so the ledger matches reality, while preserving any truly deferred work Derrick may still want. Update this living plan with exactly which Beads were cleaned up and why.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-manual-integration-pass-and-bead-hygiene.md`
- repo-local Beads state under `.beads/`

**Status:** ✅ Complete

**Results:** Audited open repo-local Beads and removed stale umbrella/admin leftovers while preserving meaningful deferred work.

Closed as stale/superseded:
- `nerve-73h` (Linkage migration polish epic) — superseded by shipped + verified wave (`nerve-s8k`).
- `nerve-42d` (Linkage repair and migration helpers epic) — superseded by shipped + verified helper wave (`nerve-595`).
- `nerve-7zv` (Plan linkage slice 2 epic) — slice already completed/verified (`nerve-q8g`).
- `nerve-1sl` (Multi-rig verification/follow-up epic) — superseded by completed slices plus explicit deferred blocker tracking (`nerve-673`).
- `nerve-ly9` (Nerve usability pass and polish epic) — completed polish wave; epic left open as stale umbrella residue.
- `nerve-251` (Verify/commit/push Nerve usability polish) — stale admin leftover with all prerequisites already closed/shipped.
- `nerve-4ka` (Post-slice-2 linkage repair/migration helpers) — duplicate deferred scope consolidated under `nerve-1w9`.

Intentionally preserved:
- `nerve-673` — still a real external/gating blocker for Cookie/Byte terminal verification.
- `nerve-1w9` — still a meaningful deferred umbrella for non-blocking post-polish follow-up if real workflow pain appears.
- Active execution beads for this plan (`nerve-3iu`, `nerve-010`, `nerve-ip6`, `nerve-bkb`) were left intact.

Net result: open ledger now reflects active execution + intentional deferred work instead of historical umbrella/admin leftovers.

---

### Task 3: Convert real findings into execution Beads and implement only the worthwhile fixes

**Bead ID:** `nerve-ip6`  
**SubAgent:** `coder`  
**Prompt:** If the manual walkthrough found concrete bugs or worthwhile polish issues, convert the validated findings into a compact implementation slice and ship only the highest-value fixes. If the walkthrough finds no meaningful issues, do not invent work; instead update the plan to reflect that the current integration is in a good stopping state.

**Folders Created/Deleted/Modified:**
- `src/features/workspace/tabs/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/workspace/tabs/PlansTab.tsx`
- `src/features/workspace/tabs/PlansTab.test.tsx`
- `.plans/2026-03-14-nerve-manual-integration-pass-and-bead-hygiene.md`

**Status:** ✅ Complete

**Results:** Implemented the single validated worthwhile fix from the manual pass: linked-task context extraction in `PlansTab` now prefers task-local context around each bead’s `**Bead ID:**` block instead of the first incidental string match in the document.

Scope and behavior changes:
- Updated the linked-bead context helper to anchor on `**Bead ID:**` lines containing the bead ID when present.
- From that anchor, context now prefers the local task `###` section header (with fallback to prompt/anchor), so each bead resolves to its own task snippet in the Linked tasks panel.
- Kept existing panel UI and one-click `onOpenTask(beadId)` behavior intact; this is extraction logic only.

Validation run:
- `npm run test -- src/features/workspace/tabs/PlansTab.test.tsx` ✅
- `npm run build` ✅

Focused regression coverage added:
- Added a test case with early generic bead mentions plus later task-specific `**Bead ID:**` blocks.
- Verified linked-task snippets now resolve to distinct task-local context per bead and do not collapse to the shared generic overview line.

---

### Task 4: Verify, commit, and push

**Bead ID:** `nerve-bkb`  
**SubAgent:** `primary`  
**Prompt:** Verify the manual-pass outcome and any resulting Bead cleanup / bugfix work, ensure this living plan reflects what actually happened, then commit and push the durable repo changes to `master`.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `src/features/workspace/tabs/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-manual-integration-pass-and-bead-hygiene.md`
- `.plans/2026-03-14-nerve-linkage-migration-polish.md`
- `.plans/2026-03-14-nerve-linkage-repair-and-migration-helpers.md`
- `.plans/2026-03-14-nerve-plan-linkage-slice-2.md`
- `src/features/workspace/tabs/PlansTab.tsx`
- `src/features/workspace/tabs/PlansTab.test.tsx`

**Status:** ✅ Complete

**Results:** Verified repo state and shipped outcomes from Tasks 1–3, reran confidence checks (`npm run test -- src/features/workspace/tabs/PlansTab.test.tsx`, `npm run build`), confirmed SSH `origin` remote, then committed durable code+plan linkage updates in `c59d20d` (`fix(plans): anchor linked task context to bead sections`). This task also finalizes this living plan and pushes both commits to `origin/master`.

---

## Initial Recommendation

Recommended execution order:

1. **Manual integration walkthrough first**
   - find real bugs/paper cuts before inventing more polish work
2. **Bead hygiene cleanup second**
   - close stale epics/admin beads once we confirm what remains truly active/deferred
3. **Only implement fixes if the walkthrough produces real issues**
   - no speculative churn
4. **Then verify/commit/push once with a clean ledger and any justified fixes**

Likely stale candidates to review during Task 2:
- old umbrella epics for already-completed linkage waves
- older verify/push beads superseded by later completed slices
- preserve `nerve-673` as intentionally deferred/external-blocked
- preserve `nerve-1w9` only if the manual pass still suggests it has value

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- Completed a manual Beads/Plans integration pass and captured one real bug worth fixing.
- Cleaned stale Beads umbrella/admin leftovers while preserving real deferred and blocked work.
- Shipped a focused linked-task context extraction fix so each linked bead in Plans resolves to task-local context instead of generic early mentions.
- Added/landed plan frontmatter (`plan_id`, `bead_ids`) on older linkage-wave plans to keep linkage metadata durable and explicit.

**Commits:**
- `c59d20d` — fix(plans): anchor linked task context to bead sections

**Lessons Learned:**
- Manual walkthroughs continue to find higher-value polish work than speculative follow-ons.
- Bead IDs are often mentioned in overview prose; extraction should bias to the task block (`**Bead ID:**`) for useful context.
- Periodic Beads ledger hygiene keeps `bd ready` meaningful and avoids stale umbrella/admin noise.

**Follow-up / Deferred:**
- `nerve-673` remains intentionally blocked on external multi-rig terminal verification (Cookie/Byte).
- `nerve-1w9` remains intentionally deferred for future workflow-driven linkage follow-up.

---

*Completed on 2026-03-14*
