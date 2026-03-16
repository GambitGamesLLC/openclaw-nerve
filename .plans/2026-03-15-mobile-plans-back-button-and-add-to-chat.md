# Nerve mobile Plans navigation polish + Add to Chat concept

**Date:** 2026-03-15  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Polish the mobile Plans reading flow with a persistent return affordance and replace/refine the current low-value `Open in Nerve` behavior into a more useful `Add to Chat` style workflow for plans and beads.

---

## Overview

The new top-level Plans surface is now usable on mobile and Beads ↔ Plans navigation feels good, but Derrick identified two follow-up UX issues. First, `Back to plans` is currently easy to lose while reading a long plan because it lives at the top of the reader flow; on mobile it should likely be sticky or floating so users can return to the list without a long upward scroll. Second, the current `Open in Nerve` action on plans appears to just drop the user back into chat without doing useful work, which makes the label/intent misleading.

A better interaction model may be an `Add to Chat` affordance for plans and beads that injects the full repo-relative path or bead ID into the composer in the main Nerve chat/editor surface, making it easy to ask Chip to act on a selected artifact. This plan treats that as a product design + implementation slice in `gambit-openclaw-nerve`.

---

## Tasks

### Task 1: Add a persistent mobile `Back to plans` affordance

**Bead ID:** `nerve-fdp`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, improve the mobile Plans reader flow so returning to the plan list does not require scrolling back to the top. Implement the smallest durable sticky/floating/mobile-friendly `Back to plans` affordance, validate it on compact/mobile layouts, and update this plan with files changed, validation, and results.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-mobile-plans-back-button-and-add-to-chat.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.test.tsx`

**Status:** ✅ Complete

**Results:** Implemented the smallest durable mobile-only persistence improvement in the existing compact Plans reader flow instead of inventing a new navigation pattern. `PlansTab` already switched phone-sized viewports into a reader-first mode with a `Back to plans` control, but that control scrolled away with the document. I changed the compact/mobile reader header so the back affordance now lives inside a sticky top bar with a light backdrop and compact pill button styling, which keeps return navigation reachable while reading long plans without affecting desktop/tablet split-view behavior. Added a focused regression assertion in `PlansTab.test.tsx` to lock in the sticky compact-reader container (`sticky top-0`) alongside the existing portrait/landscape mobile behavior coverage. Validation passed with `npm test -- --run src/features/workspace/tabs/PlansTab.test.tsx` and `npm run build`. Commit hash recorded in Final Results.

---

### Task 2: Replace/refine `Open in Nerve` into useful chat injection behavior

**Bead ID:** `nerve-qn2`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, investigate the current intent and implementation of the `Open in Nerve` action on plans. Then implement the smallest useful version of an `Add to Chat` style flow for plans and beads: inject human-usable context into the main chat composer so Derrick can ask Chip to act on the selected artifact. For plans, add the plan title plus the full plan path/link target; for beads, add the bead title plus the bead ID. Update labels/behavior so the action is self-explanatory, add tests where appropriate, and update this plan with scope, validation, and results.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-mobile-plans-back-button-and-add-to-chat.md`
- files to be determined by implementation

**Status:** ⏳ Pending

**Results:** Pending.

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:** Completed the scoped back-affordance slice only. The compact/mobile Plans reader now keeps a persistent `Back to plans` control pinned at the top of the scrolling reader so long plans do not strand the user far from the list. Desktop/tablet behavior remains the existing split view. The separate `Add to Chat` / `Open in Nerve` refinement remains intentionally untouched in this slice.

**Commits:**
- Pending commit hash for the back-affordance change.

**Lessons Learned:** The prior mobile reader fix solved the large layout bug, but the next real usability pain lived one level lower: the return control existed yet was not durable during long scroll sessions. The smallest good fix was to make the existing compact-reader affordance sticky rather than add another floating action or duplicate navigation control.

---

*Created on 2026-03-15*