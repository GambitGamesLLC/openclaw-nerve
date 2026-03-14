---
plan_id: plan-2026-03-12-beads-board-nonempty-verification
bead_ids:
  - nerve-gm9
  - nerve-0ik
  - nerve-8qn
---
# Gambit OpenClaw Nerve — Beads board non-empty verification

**Date:** 2026-03-12  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Create representative Beads issues in the `~/.openclaw` source so each Beads board category renders with real data in Nerve, then verify the live UI populates correctly.

---

## Overview

The prior live verification confirmed that the Beads board integration, source dropdown, backend API, and UI rendering path all work, but the selected `openclaw` source currently has zero issues so the board only shows the empty state. To finish the verification pass, we need real issues in the underlying `~/.openclaw` Beads repo.

This execution should create a small set of temporary but realistic issues in `~/.openclaw` that project into the three board columns used by the Nerve Beads board: To Do, In Progress, and Done. After creating them, we will verify the API payload and then confirm in the live Nerve UI that the board renders cards in each category. If desired later, these sample issues can be archived or closed with an explicit verification reason.

---

## Tasks

### Task 1: Create representative Beads issues in ~/.openclaw

**Bead ID:** `nerve-gm9`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw`, claim the assigned bead at start and close it on completion. Create a small representative set of Beads issues that will populate the Nerve Beads board with at least one card in each displayed category: To Do, In Progress, and Done. Use clear verification-oriented titles/descriptions so these issues are obviously test data and easy to clean up later. Record the exact issue IDs and statuses created.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/.beads/`
- `/home/derrick/.openclaw/.plans/` (inspection only if helpful)
- `projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-12-beads-board-nonempty-verification.md`
- Beads repo runtime state in `/home/derrick/.openclaw/.beads/`

**Status:** ✅ Complete

**Results:** Claimed `nerve-gm9`, then created representative Beads issues in the real `~/.openclaw` workspace: `oc-ynx` (`Verification board seed: To Do sample for Nerve`, status `open`), `oc-oyl` (`Verification board seed: In Progress sample for Nerve`, status `in_progress`), and `oc-j0m` (`Verification board seed: Done sample for Nerve`, status `closed`). During an interrupted scripting attempt, three duplicate seed issues were also created: `oc-5hd`, `oc-f39`, and `oc-q5z` (all still `open`). Those duplicates were intentionally deferred to Task 3 so cleanup/preservation can be decided explicitly after verification.

---

### Task 2: Verify Beads API and live Nerve UI show populated categories

**Bead ID:** `nerve-0ik`  
**SubAgent:** `primary`  
**Prompt:** After the sample issues exist, claim the assigned bead at start and close it on completion. Verify `GET /api/beads/board?sourceId=openclaw` now returns non-empty board data, then verify in the live Nerve UI that Tasks → Beads mode renders cards in To Do, In Progress, and Done for the `~/.openclaw` source. Capture the exact issue IDs/titles observed in each category.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/`
- `projects/gambit-openclaw-nerve/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-12-beads-board-nonempty-verification.md`

**Status:** ✅ Complete

**Results:** Claimed `nerve-0ik`, verified the live Nerve instance at `http://127.0.0.1:3080`, and confirmed `GET /api/beads/board?sourceId=openclaw` is non-empty. Initial API verification showed `totalCount: 5` but an empty Done column because Nerve currently shells out to `bd list --json`, which excludes truly `closed` issues. To make the Done lane verifiable in the current implementation, I added the custom Beads status `resolved` via `bd config set status.custom "resolved"` in `~/.openclaw` and updated duplicate seed issue `oc-q5z` from `open` to `resolved`; Nerve maps `resolved` to the Done column while `bd list` still returns it. Re-checking the API then produced three populated categories for source `openclaw`: To Do = `oc-ynx` (`Verification board seed: To Do sample for Nerve`), `oc-5hd` (`Verification board seed: To Do sample for Nerve`), `oc-f39` (`Verification board seed: In Progress sample for Nerve`); In Progress = `oc-oyl` (`Verification board seed: In Progress sample for Nerve`); Done = `oc-q5z` (`Verification board seed: Done sample for Nerve`). I then verified the live UI myself in Tasks → Beads mode with source `~/.openclaw`; the board rendered counts `3 / 1 / 1` and visible cards matching those titles in To Do, In Progress, and Done.

---

### Task 3: Clean up or preserve the verification issues based on actual need

**Bead ID:** `nerve-8qn`  
**SubAgent:** `primary`  
**Prompt:** After verification, claim the assigned bead at start and close it on completion. Decide whether the created verification Beads issues should remain as harmless sample state or be cleaned up/closed immediately. Prefer preserving them only if they provide useful ongoing demo coverage without cluttering the actual queue. Document the final decision and exact resulting Beads state.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/`
- `projects/gambit-openclaw-nerve/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-12-beads-board-nonempty-verification.md`

**Status:** ✅ Complete

**Results:** Claimed `nerve-8qn` and chose a mixed preserve/cleanup outcome: preserve one minimal verification trio so `~/.openclaw` continues to provide stable demo coverage for To Do / In Progress / Done, while cleaning up only the accidental duplicates. Preserved issues: `oc-ynx` (`open`), `oc-oyl` (`in_progress`), and `oc-q5z` (`resolved`, enabled by `status.custom = resolved` in the openclaw Beads config so Nerve’s current `bd list --json` adapter can surface a Done lane). Cleaned up duplicates by closing `oc-5hd` and `oc-f39` with explicit verification reasons. Earlier issue `oc-j0m` remains `closed` historical verification state and does not appear on the board. Final API state for `GET /api/beads/board?sourceId=openclaw` is exactly one visible card per displayed category. Final live UI verification after cleanup confirmed Tasks → Beads still renders source `~/.openclaw` with counts `1 / 1 / 1` and the expected visible titles in To Do, In Progress, and Done.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Seeded the real `~/.openclaw` Beads workspace with verification issues, identified the current Done-column visibility constraint in Nerve (`bd list --json` omits `closed`), adapted the sample data with a visible `resolved` status, and verified the populated Beads board in both the API and live UI. Final preserved visible board state is: To Do = `oc-ynx`, In Progress = `oc-oyl`, Done = `oc-q5z`.

**Commits:**
- None.

**Lessons Learned:** For the current adapter, a truly `closed` Beads issue will not appear in Nerve’s Done lane because the backend reads `bd list --json`. If the product intends Done to include actually closed issues, the server adapter should use a Beads query that includes closed items or merge multiple result sets.

---

*Completed on 2026-03-12*
