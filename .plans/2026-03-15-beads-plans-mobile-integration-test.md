---
plan_id: plan-2026-03-15-beads-plans-mobile-integration-test
bead_ids:
  - nerve-v0i
  - nerve-dfw
  - nerve-5j5
---
# Nerve Beads + Plans mobile integration test

**Date:** 2026-03-15  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Run a focused end-to-end test of the Nerve Beads + Plans integration that Derrick can exercise from mobile, then fix any issues the test uncovers.

---

## Overview

We’ve spent this session fixing several Beads-view problems in `gambit-openclaw-nerve`: source bootstrap, false empty-state starvation, loading-state UX, and stale loading labels. The next useful step is a deliberate integration test that exercises the parts Derrick can verify comfortably from mobile: Beads source selection, board loading, linked plan navigation, and any visible plan/bead relationship surfaces.

This plan belongs in `gambit-openclaw-nerve` because the behavior under test is the Nerve UI and its Beads/Plans integration. The test should be operator-friendly: create or pick a controlled Beads item + linked plan state, verify the expected navigation/labels/state in the UI, and leave behind a clear record of what passed, what failed, and any follow-up fixes.

---

## Tasks

### Task 1: Define the mobile-friendly Beads + Plans integration test flow

**Bead ID:** `nerve-v0i`  
**SubAgent:** `research`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, define a concise end-to-end Beads + Plans integration test that Derrick can run from mobile. Identify the specific UI flow to exercise (for example source selection, board load, linked plan navigation, reverse navigation, or linked task context), the exact expected outcomes, and any test data/setup needed. Update this plan with the concrete test flow and success criteria.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-beads-plans-mobile-integration-test.md`

**Status:** ✅ Complete

**Results:** Chose the shortest practical Beads→Plans→Beads loop that is already supported by Nerve’s current UI and easy to tap through from mobile: start on the Beads board, confirm the `gambit-openclaw-nerve` Beads source, open bead `nerve-v0i`, use the linked-plan affordance to jump into `.plans/2026-03-15-beads-plans-mobile-integration-test.md`, then use the linked bead chips in Plans to jump back to a board task. This validates source selection, board hydration, linked-plan resolution, plan loading, and reverse navigation without needing code changes.

#### Mobile test flow (operator version)

1. **Start in Nerve → Beads Board**
   - If Nerve opens in chat, switch to the **Beads** view / board.
   - In the Beads source dropdown, select the source for **`gambit-openclaw-nerve`**.
   - Wait for the board to finish loading and show columns/items.

2. **Open the primary bead target**
   - In the board, open bead **`nerve-v0i`** (`Define mobile-friendly Beads+Plans integration test flow`).
   - Expected in the drawer:
     - a **Linked plan** section is visible
     - title/path resolves to **`.plans/2026-03-15-beads-plans-mobile-integration-test.md`**
     - the plan is not shown as missing
     - **Open in Plans** is available

3. **Jump from bead → plan**
   - Tap **Open in Plans**.
   - Expected result:
     - workspace switches to the **Plans** tab
     - the selected plan is **`Nerve Beads + Plans mobile integration test`**
     - the header/path matches **`.plans/2026-03-15-beads-plans-mobile-integration-test.md`**
     - linked bead badges/chips include **`nerve-v0i`** and **`nerve-dfw`**

4. **Jump from plan → bead**
   - In the plan header’s **Linked tasks** block, tap **`nerve-dfw`** (or `nerve-v0i` if that’s easier).
   - Expected result:
     - Nerve returns to the **Beads** board
     - the tapped bead opens in the detail drawer
     - drawer title / bead ID match the tapped linked bead

5. **Optional quick cross-check inside plan content**
   - While still in the plan preview, tap any inline bead reference if visible.
   - Expected result: it behaves like the linked task chips and opens that bead on the Beads board.

#### Success criteria

- The Beads source selector can switch to the `gambit-openclaw-nerve` repo from mobile.
- The Beads board loads real issues for that source instead of an empty/error state.
- Bead `nerve-v0i` resolves a linked plan and exposes **Open in Plans**.
- Opening the linked plan lands on the correct plan file in the Plans tab.
- The plan surface shows linked bead context for `nerve-v0i` / `nerve-dfw`.
- Tapping a linked bead from the plan returns to the Beads board and opens the correct bead drawer.
- No step requires desktop-only affordances such as hover, multi-select, or precise drag interactions.

---

### Task 2: Prepare/verify the Beads + Plans test state in Nerve

**Bead ID:** `nerve-dfw`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, prepare or verify the exact Beads + Plans test state required for the mobile integration flow. If existing linked plan/bead data is sufficient, document it; if a small controlled state tweak is required, make the minimal safe change. Update this plan with the chosen test target, relevant bead IDs/plan path, and what Derrick should open in the UI.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-beads-plans-mobile-integration-test.md`
- additional files only if required by the test setup

**Status:** ✅ Complete

**Results:** Verified that the planned mobile flow already has sufficient repo-local linkage state for a controlled Beads → Plans → Beads test. Exact targets are now locked:
- **Beads source to select:** `gambit-openclaw-nerve`
- **Primary bead to open from the board:** `nerve-v0i`
- **Plan target opened from that bead:** `.plans/2026-03-15-beads-plans-mobile-integration-test.md` (`plan-2026-03-15-beads-plans-mobile-integration-test`)
- **Reverse-navigation bead chips to tap from the plan:** prefer `nerve-dfw`; `nerve-v0i` also remains valid

State verification notes:
- The target plan already declares the needed linked bead IDs in frontmatter, so the Plans tab can surface the linked-task chips needed for the return trip to Beads.
- `nerve-v0i` currently has no bead-side `metadata.plan` payload in Beads storage, so this linkage resolves through the repo plan’s `bead_ids` fallback rather than bead-authored metadata. That is acceptable for this planned mobile verification flow because the current Nerve resolver explicitly supports `bead_ids` fallback.
- No product bug was found that blocks the mobile test-state setup.

Minimal safe tweak made:
- Removed a stale `Pending` entry from this plan’s `bead_ids` frontmatter so the Plans "Linked tasks" block only shows real bead IDs during mobile testing instead of a bogus chip.

What Derrick should open in the UI:
1. Nerve → **Beads** board
2. Source dropdown → **`gambit-openclaw-nerve`**
3. Open bead **`nerve-v0i`**
4. In the bead drawer, use **Open in Plans** for **`.plans/2026-03-15-beads-plans-mobile-integration-test.md`**
5. In the plan header’s **Linked tasks** block, tap **`nerve-dfw`** (preferred) or **`nerve-v0i`** to return to Beads.

---

### Task 3: Run the integration test, fix issues found, and document outcomes

**Bead ID:** `nerve-5j5`  
**SubAgent:** `coder`  
**Prompt:** Execute the planned Beads + Plans integration test workflow with Derrick. If the test uncovers a real Nerve defect, apply the smallest durable fix, validate it, and update this plan with exact outcomes. Record what passed, what failed, and any commits produced.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-beads-plans-mobile-integration-test.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/App.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/components/TopBar.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/components/TopBar.test.tsx`

**Status:** ✅ Complete

**Results:** Reproduced the failure by tracing the shipped Beads → Plans open path through the client instead of finding a resolver miss. The linked plan for bead `nerve-v0i` is resolvable: the current repo-local plan `.plans/2026-03-15-beads-plans-mobile-integration-test.md` is discoverable from the bead context via the supported `bead_ids` fallback path, and the existing Beads drawer `Open in Plans` button correctly calls the app-level `onOpenPlan(planPath)` handler.

Root cause:
- On desktop, `openPlanInWorkspace()` is enough because the Workspace panel is already visible in the right-hand column.
- On compact/mobile layout, the Workspace surface lives inside the TopBar dropdown and was not being auto-opened.
- Result: tapping `Open in Plans` updated hidden state (`requestedWorkspaceTab='plans'`, `requestedPlanPath=<target>`) but produced no visible navigation change, which matches Derrick’s report that the tap seemed to do nothing.

Fix shipped:
- Added a monotonic `workspaceOpenRequest` signal in `src/App.tsx` whenever Beads requests a plan open.
- Threaded that request into `src/components/TopBar.tsx`.
- In compact/mobile mode, TopBar now auto-opens the Workspace dropdown when a workspace-open request arrives, so the already-requested Plans tab + plan path become visible immediately.
- This keeps desktop behavior unchanged and only patches the hidden-surface problem on mobile.

Validation:
- Targeted tests passed: `npm test -- --run src/components/TopBar.test.tsx src/features/kanban/BeadsDetailDrawer.test.tsx src/features/workspace/tabs/PlansTab.test.tsx`
- Production build passed: `npm run build`
- Added regression coverage in `src/components/TopBar.test.tsx` to prove a compact-layout workspace-open request makes the Workspace panel visibly open.
- Live browser verification against `http://127.0.0.1:3080/` was limited because the local Nerve instance was sitting at the gateway connect screen, but the UI-level reproduction/fix path is now covered by component behavior and matches the mobile layout architecture exactly.

**Commits:**
- `822d222` - Fix mobile Open in Plans workspace handoff

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Confirmed that bead `nerve-v0i` can resolve and open the intended plan target `.plans/2026-03-15-beads-plans-mobile-integration-test.md`, identified the real failure as a compact/mobile visibility bug rather than a linkage bug, and shipped a small fix so `Open in Plans` now opens the Workspace surface automatically on mobile-sized layouts. The Beads → Plans → Beads integration path remains resolver-compatible with `bead_ids` fallback, and the formerly invisible mobile transition is now explicit and test-covered.

**Commits:**
- `822d222` - Fix mobile Open in Plans workspace handoff

**Lessons Learned:** The Beads→Plans stack itself was healthy: linked-plan resolution, drawer CTA wiring, and plan-path handoff were already correct. The failure lived one layer higher in shell orchestration: mobile hides Workspace behind a dropdown, so request-driven navigation needs to surface that container as part of the action. For this flow, the highest-value regression test is therefore a compact-layout shell test, not another linkage-resolver test.

---

*Created on 2026-03-15*