# Nerve Plans selection highlight follow-up

**Date:** 2026-03-15  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Fix the Plans surface so the visible selected/highlighted plan matches the actual plan the user taps, especially in the `gambit-openclaw-nerve` plans view on mobile.

---

## Overview

After the mobile Plans reader fixes and Add to Chat improvements, Derrick found one more UI inconsistency in the top-level Plans surface. The first plan in the list appeared to stay selected/highlighted even after tapping another plan.

The issue turned out not to be stale row styling by itself. It was a state-sync bug between externally requested plan selection (`requestedPlanPath`) and local manual selection inside `PlansTab`. Once an external request had opened a plan, the effect watching `requestedPlanPath` re-ran on every `selectedPath` change and reloaded the originally requested plan, so manual taps could appear to “stick” on the first/highlighted item.

---

## Tasks

### Task 1: Reproduce and fix stale plan-list selection/highlight state

**Bead ID:** `nerve-24q`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, reproduce the Plans-surface issue where the first plan appears selected/highlighted and tapping another plan does not visibly update the highlight. Determine whether the problem is stale selected-plan state, stale active styling, or mobile-reader/list state divergence, then apply the smallest durable fix. Update this plan with findings, files changed, validation, and results.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-plans-selection-highlight-followup.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.test.tsx`

**Status:** ✅ Complete

**Results:**
- Reproduced the bug via code-path analysis around `requestedPlanPath` + `selectedPath` interactions in `PlansTab`.
- Confirmed this was a state divergence issue, not just stale CSS/active styling.
- Applied a minimal fix: treat an external requested-plan selection as a one-shot sync per source/path instead of reapplying it every time `selectedPath` changes.
- Added a regression test proving that after an externally requested plan opens, manually tapping another plan keeps that manually selected plan visible instead of snapping back.
- Validation passed:
  - `npm test -- --run src/features/workspace/tabs/PlansTab.test.tsx`
  - `npm run build`
- Commit recorded below and pushed to `main`.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** A durable fix for the Plans selection/highlight bug by preventing stale `requestedPlanPath` state from overriding manual plan selection after the initial external open.

**Commits:**
- `b634995` - Fix Plans selection highlight state after requested opens

**Lessons Learned:** In mixed controlled/uncontrolled selection flows, external navigation props should usually behave like one-shot synchronization events unless the parent explicitly changes them again. Rebinding them to local selection changes causes the UI to look like styling is stale when the real bug is state being reapplied.

---

*Completed on 2026-03-15*
