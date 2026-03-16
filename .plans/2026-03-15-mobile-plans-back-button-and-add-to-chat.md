---
plan_id: plan-2026-03-15-mobile-plans-back-button-and-add-to-chat
bead_ids:
  - nerve-fdp
  - nerve-qn2
---
# Nerve mobile Plans navigation polish + Add to Chat concept

**Date:** 2026-03-15  
**Status:** Complete  
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
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/App.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/ChatPanel.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/InputBar.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/addToChat.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/addToChat.test.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/kanban/BeadsDetailDrawer.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/kanban/BeadsDetailDrawer.test.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/kanban/KanbanPanel.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/plans/PlansPanel.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/WorkspacePanel.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.test.tsx`

**Status:** ✅ Complete

**Results:** Replaced the misleading plan-side `Open in Nerve` CTA with an explicit `Add to Chat` action and added a matching bead-side `Add to Chat` action in the Beads detail drawer. Both now share a tiny formatter helper in `src/features/chat/addToChat.ts` so the inserted composer payloads stay consistent: plans inject `Plan context` with title + path, while beads inject `Bead context` with title + ID. I kept existing navigation behavior intact where it was already useful (`Open in Plans`, linked bead buttons, inline path/task references) and limited this slice to contextual chat injection rather than broader workflow redesign.

On the wiring side, `App` now passes a shared `addToChat` callback through the Plans and Beads surfaces into the main chat panel. `ChatPanel`/`InputBar` gained a small imperative `injectText` path so add-to-chat can append to any existing draft instead of overwriting it, resize the textarea, and focus the composer. Focused tests cover the formatter helper plus both UI entry points (`PlansTab` and `BeadsDetailDrawer`). Validation passed with `npm test -- --run src/features/chat/addToChat.test.ts src/features/workspace/tabs/PlansTab.test.tsx src/features/kanban/BeadsDetailDrawer.test.tsx` and `npm run build`. Main implementation committed as `b25203a` (`Add plan and bead context to chat composer`); this plan update documents the exact scope and validation.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Finished both scoped UX slices from this plan. The compact/mobile Plans reader keeps a persistent `Back to plans` affordance pinned at the top while reading. Separately, the old plan-side `Open in Nerve` action was replaced with an explicit `Add to Chat` flow, and beads now expose the same `Add to Chat` affordance from the Beads detail drawer. Both actions inject practical artifact context into the main composer without destroying an in-progress draft: plans add title + path, beads add title + bead ID. Existing navigation affordances such as linked bead buttons and `Open in Plans` remain intact.

**Commits:**
- `263306a` - Fix mobile Plans back affordance persistence
- `c470496` - Document mobile Plans back affordance slice
- `b25203a` - Add plan and bead context to chat composer

**Validation:**
- `npm test -- --run src/features/workspace/tabs/PlansTab.test.tsx`
- `npm test -- --run src/features/chat/addToChat.test.ts src/features/workspace/tabs/PlansTab.test.tsx src/features/kanban/BeadsDetailDrawer.test.tsx`
- `npm run build`

**Lessons Learned:** The right follow-up to the weak `Open in Nerve` label was not a bigger navigation system; it was a simple shared injection path into the composer. That kept the slice practical, preserved existing useful navigation, and made plans/beads feel like reusable chat context instead of dead-end links.

---

*Created on 2026-03-15*