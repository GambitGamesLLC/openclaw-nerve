# Nerve mobile Plans overlay reader parity

**Date:** 2026-03-15  
**Status:** Draft  
**Agent:** Chip 🐱‍💻

---

## Goal

Make mobile plan reading use the same focused overlay-style presentation as the mobile Beads reader, minimizing surrounding UI and preserving a simple close affordance.

---

## Overview

The recent Plans mobile fixes made plan reading functional, but Derrick found the reading mode still wastes vertical space compared with the Beads experience. On mobile, Beads opens as a focused overlay-style drawer: the board UI drops away, the issue content owns the screen, and only a single close affordance remains in the reader chrome. Plans already hides the plan list once a plan is selected, but it still leaves the Plans header/search chrome above the reader, so the content does not yet feel like the primary surface.

This work belongs in `gambit-openclaw-nerve` because it is a mobile presentation/state issue in the top-level Plans surface. The smallest durable parity target is not a brand-new modal system. It is a reader-first mobile state inside `PlansTab` that mirrors the Beads intent: once reading begins on a compact viewport, non-reader chrome disappears, a single sticky back/close affordance remains, and all plan-reading actions stay available inside the reader itself.

### Concrete parity target

On compact/mobile viewports (`window.innerWidth <= 768` or `window.innerHeight <= 520`), selecting a plan should switch Plans into a dedicated reader state with Beads-like focus:

- **Hide while reading:**
  - the Plans list pane
  - the active/archived section headers
  - the row cards for other plans
  - the Plans search field
  - the Plans counts/header row (`Plans`, refresh, active/archived counts)
- **Keep as the only surrounding chrome:**
  - one sticky top back/close affordance that returns to the plans list
  - this affordance should stay visible while the reader scrolls
  - no duplicate search, list, or secondary navigation controls should remain above the content
- **Keep accessible inside the reader:**
  - the selected plan title, path, badges, and linked-task summary block
  - inline plan content via the markdown renderer
  - linked bead/task buttons
  - Add to Chat action
  - inline plan/task/path reference navigation from the markdown body
  - normal vertical scrolling through the plan

### Explicit non-goals for this pass

To keep the change small and durable, this parity pass should **not**:

- replace Plans with a brand-new global modal/drawer implementation
- change desktop/tablet Plans layout
- remove plan metadata/actions from the reader header
- alter Beads drawer behavior
- hide broader app chrome outside the Plans surface unless that becomes necessary for layout correctness

### Success criteria for implementation

The follow-up implementation should be considered successful when all of the following are true:

1. On compact/mobile viewports, opening a plan hides the Plans header, refresh control, counts, search field, and plan list.
2. On compact/mobile viewports, the reader still exposes a single obvious sticky back/close affordance.
3. The selected plan’s title/meta/actions and markdown body remain usable while reading.
4. Linked task buttons, Add to Chat, and inline reference navigation still work in reader mode.
5. Returning from reader mode restores the prior list/search surface without losing normal plan selection behavior.
6. Desktop/tablet Plans behavior remains materially unchanged.

---

## Tasks

### Task 1: Reproduce and define the exact mobile Plans overlay parity target

**Bead ID:** `nerve-csb`  
**SubAgent:** `research`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, inspect the current mobile Beads reader/drawer behavior and compare it against the current mobile Plans reader. Define the smallest durable parity target for Plans on mobile: what list/search/header UI should disappear while reading, what close/back control should remain, and what should still be accessible. Update this plan with the concrete target behavior and success criteria.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-mobile-plans-overlay-reader-parity.md`

**Status:** ✅ Complete

**Results:** Inspected `src/features/kanban/BeadsDetailDrawer.tsx`, `src/features/kanban/KanbanPanel.tsx`, `src/features/workspace/tabs/PlansTab.tsx`, and the existing Plans mobile tests. The concrete target is a compact/mobile reader-first Plans state that matches Beads in intent: hide all list/search/header chrome while reading, keep one sticky back/close affordance, and preserve reading actions inside the plan reader rather than in surrounding workspace chrome.

---

### Task 2: Implement mobile Plans overlay-style reader behavior

**Bead ID:** `nerve-fv7`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, implement the agreed mobile Plans reader parity behavior so selecting a plan hides unnecessary plan list/search chrome and foregrounds the plan content with a compact close/back affordance, similar to the mobile Beads experience. Keep desktop/tablet behavior sane. Update this plan with findings, files changed, validation, and results.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-mobile-plans-overlay-reader-parity.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.test.tsx`

**Status:** ✅ Complete

**Results:** Kept the fix entirely inside the existing `PlansTab` surface instead of building a new modal. The compact/mobile reader state now suppresses the surrounding Plans chrome (`Plans` header/counts, refresh control, and search field) whenever a selected plan is being read on a compact viewport, leaving the sticky `Back to plans` affordance as the only outer chrome. The selected plan header, path/badges, linked-task summary/buttons, `Add to Chat`, markdown body, and inline refs remain intact inside the reader. Desktop/tablet keeps the existing split-view behavior with the header/search still visible while previewing. Added focused regression coverage for both mobile orientations and a desktop sanity check.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Finished the mobile Plans overlay-parity pass in the existing Plans surface. On compact/mobile viewports, opening a plan now hides the surrounding Plans list/search/header chrome and leaves a single sticky `Back to plans` affordance above the reader, so the selected plan content becomes the clear primary surface. Inside the reader, the selected plan still keeps its title/path/badges, linked-task summary/buttons, `Add to Chat`, markdown body, and inline references. Desktop/tablet preview behavior remains materially unchanged.

**Validation:**
- `npm test -- --run src/features/workspace/tabs/PlansTab.test.tsx`
- `npm run build`

**Commits:**
- `2fe5706` - `fix(plans): hide mobile reader chrome`

**Lessons Learned:** The prior mobile reader-first work had already solved list hiding, so the missing parity was almost entirely about suppressing the remaining non-reader chrome at the top of `PlansTab`. Keeping the solution in the existing surface produced the intended Beads-like focus without adding another modal/drawer abstraction.

---

*Completed on 2026-03-15*