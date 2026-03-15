# Nerve mobile Plans layout + searchable Beads/Plans surfaces

**Date:** 2026-03-15  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Fix the newly observed mobile Plans-view layout issue and design/implement searchable top-level Beads and Plans surfaces that work cleanly from mobile.

---

## Overview

The Beads → Plans mobile handoff is now working, which is good progress, but Derrick immediately found a new mobile UX problem: after opening the linked plan on mobile, the screen appears visually split into multiple stacked regions, with the middle containing the actual scrollable plan content and the other regions looking like leftover desktop drawer/panel surfaces. That suggested the mobile shell/workspace composition still needed cleanup when surfacing Plans from Beads.

Root cause for the stacked mobile presentation turned out to be the handoff flow itself, not the markdown plan renderer. When a user tapped **Open in Plans** from the Beads detail drawer, Nerve opened the compact Workspace/Plans surface from the top bar, but it did **not** exit the full Beads board view and did **not** close the Beads detail drawer first. On compact/mobile screens that left multiple shell surfaces visible at once: the Beads board remained underneath, the Beads drawer stayed open, and the Plans workspace surface opened on top. That matches Derrick’s report of multiple stacked regions with the plan content embedded in the middle.

Derrick also proposed two follow-up product improvements that fit naturally together. First, the Beads UI needs search so large repos are usable from mobile. Second, Nerve should support a top-level Plans category, optionally enabled via `.env` in `gambit-openclaw-nerve` and wired through `restore.sh`, sitting to the right of Beads. That Plans surface should have repo add/remove semantics similar to Beads, auto-discover `/.plans/` in the selected repo, allow selecting/opening plans for reading/editing, and ideally support search like the proposed Beads search.

This plan belongs in `gambit-openclaw-nerve` because the work is squarely in the Nerve UI and its runtime configuration surface, though `restore.sh` in `~/.openclaw` may need a coordinated change if we ship the env-gated top-level Plans feature.

---

## Tasks

### Task 1: Investigate and fix the mobile Plans-view stacked-layout bug

**Bead ID:** `nerve-36n`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, reproduce the mobile Plans-view layout issue Derrick described after using Beads → Open in Plans. Determine why the screen appears as multiple stacked sections on mobile, identify the shell/drawer/panel composition bug, and apply the smallest durable fix. Update this plan with exact findings, files changed, validation, and results.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-mobile-plans-layout-and-search-surfaces.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/App.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/kanban/BeadsDetailDrawer.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/kanban/BeadsDetailDrawer.test.tsx`

**Status:** ✅ Complete

**Results:**
- Reproduced the bug by tracing the Beads → Plans handoff path in compact/mobile mode.
- Identified the incorrect surviving surfaces:
  - the full Beads board view (`viewMode === 'kanban'`) remained active,
  - the Beads detail drawer remained open,
  - and the compact Workspace/Plans surface was then opened from the top bar.
- Applied the smallest durable fix in two parts:
  - `src/App.tsx`: `openPlanInWorkspace()` now switches Nerve back to `chat` view before opening the Plans surface, so the workflow leaves the Beads board shell instead of layering Plans over it.
  - `src/features/kanban/BeadsDetailDrawer.tsx`: the **Open in Plans** button now closes the Beads drawer before handing off to Plans.
- Validation:
  - `npm test -- --run src/features/kanban/BeadsDetailDrawer.test.tsx src/components/TopBar.test.tsx src/features/workspace/tabs/PlansTab.test.tsx`
  - `npm run build`
- Outcome: the mobile Beads → Plans handoff now routes cleanly into the Plans workspace without keeping the Beads board/drawer visible underneath.
- Commit: `7ae93c9` — Fix mobile Beads to Plans handoff layout.

---

### Task 2: Design/implement searchable Beads UI

**Bead ID:** `nerve-fob`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, add a Beads search capability suitable for mobile and desktop use. Decide the smallest useful search scope (for example title/id/description/labels within the selected source), implement it in the Beads UI, and update this plan with the design, files changed, validation, and results.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-mobile-plans-layout-and-search-surfaces.md`
- files to be determined by implementation

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 3: Design/implement optional top-level Plans surface with repo-scoped discovery and search

**Bead ID:** `nerve-sw6`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve` (and `~/.openclaw/workspace/scripts/restore.sh` if needed), design and implement an optional top-level Plans category enabled by env/config. It should sit to the right of Beads, support repo add/remove semantics similar to Beads, auto-populate from `/.plans/` in the selected repo, allow opening plans for reading/editing, and include search behavior similar to the Beads search where practical. Keep the implementation incremental and document the chosen scope and any follow-up cuts in this plan.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`
- `/home/derrick/.openclaw/workspace/scripts/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-mobile-plans-layout-and-search-surfaces.md`
- files to be determined by implementation

**Status:** ⏳ Pending

**Results:** Pending.

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:** Fixed the mobile Beads → Plans stacked-layout regression by making the handoff exit Beads view and close the Beads drawer before opening the Plans workspace surface.

**Commits:**
- `7ae93c9` - Fix mobile Beads to Plans handoff layout

**Lessons Learned:** Compact/mobile bugs here were caused by shell-state handoff, not markdown rendering. When opening a tool surface from another tool surface, Nerve needs to switch the owning shell state explicitly instead of layering independent panels.

---

*Updated on 2026-03-15*
