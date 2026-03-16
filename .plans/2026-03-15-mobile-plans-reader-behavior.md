# Nerve mobile Plans reader behavior fixes

**Date:** 2026-03-15  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Fix the new mobile top-level Plans behavior so selecting a plan gives a readable full-plan experience on phones in portrait and landscape.

---

## Overview

The new top-level Plans surface is now visible on mobile, which confirms the feature flag and shell wiring are alive. Derrick’s first pass surfaced two concrete mobile usability bugs. In portrait, tapping a plan leaves the screen split into two stacked rows, with the plan list still occupying the top portion and the selected plan confined to the lower portion; this makes reading difficult on a phone. In landscape, tapping a plan appears to do nothing, suggesting the selection/open behavior is either hidden, failing to route, or rendering into a non-visible region.

This work belongs in `gambit-openclaw-nerve` because it is a mobile layout and interaction bug in the new top-level Plans surface. The likely fix area is the Plans panel shell/layout logic rather than server-side plan discovery. The goal is to make phone behavior simple: tapping a plan should foreground the plan content as the primary view, and the plan list should not keep stealing valuable vertical space on compact screens unless the user intentionally navigates back.

---

## Tasks

### Task 1: Reproduce and fix portrait/landscape mobile Plans open behavior

**Bead ID:** `nerve-3bo`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, reproduce the new top-level Plans mobile bugs Derrick reported: (1) portrait opens a split two-row view with the plan list still visible, and (2) landscape tapping a plan appears to do nothing. Identify the compact/mobile layout and selection behavior causing this, then apply the smallest durable fix so plan selection foregrounds the readable plan view on phones in both orientations. Update this plan with findings, files changed, validation, and results.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-mobile-plans-reader-behavior.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.test.tsx`

**Status:** ✅ Complete

**Results:** Reproduced the failure in the top-level Plans surface by inspecting the shared `PlansTab` layout: the reader always rendered as a fixed two-row split (`grid-rows-[minmax(220px,38%)_minmax(0,1fr)]`), so mobile taps never truly foregrounded the selected plan. On portrait phones that left the list pinned above the reader; on landscape phones the short viewport squeezed the lower reader pane enough that selection could look like a no-op. Fixed this by making compact plan viewports (`<=768px` wide or `<=520px` tall) switch to a reader-first flow: tapping a plan opens a full-height reader pane with a Back-to-plans control, while desktop/tablet layouts keep the existing split view. Added targeted portrait and landscape viewport tests, plus kept the existing desktop interaction coverage. Validation passed with `npm test -- --run src/features/workspace/tabs/PlansTab.test.tsx` and `npm run build`.

---

### Task 2: Validate the improved mobile reading flow and document follow-ups

**Bead ID:** `nerve-zap`  
**SubAgent:** `coder`  
**Prompt:** After the mobile Plans reader fix, validate the portrait and landscape reading flow, document the exact expected mobile behavior, and record any follow-up cuts that should remain out of scope for this slice. Update this plan with final validation and outcomes.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-mobile-plans-reader-behavior.md`
- files to be determined if more fixes/tests are needed

**Status:** ✅ Complete

**Results:** Validation was folded into `nerve-3bo` once the root cause was isolated in `PlansTab`. We verified the compact reader-first flow in both portrait and landscape mobile-sized viewports via targeted tests, confirmed desktop behavior still works with the existing coverage, and did not need an extra follow-up code slice for this bug.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** The top-level Plans surface now uses a reader-first mobile flow on phone-sized viewports. On compact portrait and landscape screens, tapping a plan hides the list and foregrounds the selected plan with a Back-to-plans affordance; on larger screens, the existing split list/reader layout remains intact.

**Commits:**
- `7392ec2` - Fix mobile plans reader flow

**Lessons Learned:** Reusing the desktop split-pane layout inside the shared tab worked functionally, but it was the wrong interaction model for phone-height viewports. For surfaces that can appear both embedded and top-level, the shared component needs its own compact-selection behavior instead of assuming the surrounding shell will handle responsive foregrounding.

---

*Created on 2026-03-15*