---
plan_id: plan-2026-03-16-desktop-plans-drawer-and-sticky-add-to-chat
bead_ids:
  - nerve-jk4
  - nerve-aqg
  - nerve-zap
---
# Desktop Plans drawer UX and sticky Add to Chat actions

**Date:** 2026-03-16  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Finish the current Plans viewer polish in `gambit-openclaw-nerve` by making the desktop Plans reader behave like the Beads drawer, fixing the sticky header gap/regression, and verifying the mobile Plans reading flow still behaves correctly.

---

## Overview

We already have local in-progress source changes in the repo for this UX slice, and memory from earlier today confirms the intended direction: desktop Plans should use a Beads-style drawer, mobile should keep the focused full-screen reading flow, and `Add to Chat` should live in the sticky reader header for both Plans and Beads. Source: `memory/2026-03-16.md#L94-L116`.

The open Beads now map pretty cleanly to the remaining work. `nerve-jk4` tracks the desktop full-height drawer behavior, `nerve-aqg` tracks the flush/sticky header gap fix, and `nerve-zap` tracks mobile verification after the open-behavior change. The repo currently has uncommitted changes in the exact Plans/Beads files we expect, so the next move is not to rediscover the problem from scratch — it is to verify the current diff, finish any missing fixes, validate behavior, then update the plan and close the Beads that are truly done.

This work belongs in `gambit-openclaw-nerve` because it is strictly Nerve UI behavior in the Plans and Beads surfaces. The plan for this pass is: verify the current implementation state, finish/fix whatever is still off, run focused validation, then do one live behavior pass so we can close the open Beads with confidence instead of hand-waving.

---

## Tasks

### Task 1: Verify and finish desktop full-height Plans drawer behavior

**Bead ID:** `nerve-jk4`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-jk4` with `bd update nerve-jk4 --status in_progress --json` when you start. Inspect the current uncommitted Plans drawer changes in `PlansTab.tsx`, `PlansPanel.tsx`, and related tests. Finish any missing implementation needed so the desktop Plans reader matches the Beads-style full-height drawer behavior while preserving mobile’s focused/full-screen reader flow. Run focused tests and any build validation needed, then close `nerve-jk4` with `bd close nerve-jk4 --reason "Implemented and verified desktop full-height Plans drawer behavior" --json` only if validation passes. Report exact files changed, commands run, and any remaining gaps.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-16-desktop-plans-drawer-and-sticky-add-to-chat.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/plans/PlansPanel.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.test.tsx`

**Status:** ✅ Complete

**Results:** Re-claimed via `bd update nerve-jk4 --status in_progress --json` and compared Plans drawer placement against `BeadsDetailDrawer`. Root cause: `PlansTab` rendered the desktop drawer as `absolute` (`absolute inset-y-0 right-0`) inside a `relative flex-1` content container below the Plans chrome/search block, so its top boundary was scoped to the list/content region instead of the app viewport. Implemented the minimal durable fix by switching the desktop drawer + scrim to viewport-level `fixed` placement (`fixed top-0 right-0 h-full` and `fixed inset-0`) while keeping the existing drawer-mode reader content/sticky header/actions unchanged. Added/updated test assertion to lock the placement contract. Validation passed (`PlansTab` + `BeadsDetailDrawer` focused tests and `npm run build`). Closed with `bd close nerve-jk4 --reason "Moved desktop Plans drawer/overlay to fixed viewport-level positioning so it mounts above panel content scope and spans full app height; verified via focused Plans/Beads tests and npm run build." --json`.

---

### Task 2: Fix the Plans reader sticky header gap and keep Add to Chat flush in the header

**Bead ID:** `nerve-aqg`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-aqg` with `bd update nerve-aqg --status in_progress --json` when you start. Inspect the current Plans reader header structure and finish the fix so the sticky header sits flush at the top of the panel with no visible gap or content bleed-through while scrolling. Preserve the sticky `Add to Chat` placement in the header and ensure the Beads drawer header still behaves correctly after the related changes. Run focused tests and close `nerve-aqg` with `bd close nerve-aqg --reason "Fixed Plans reader sticky header gap and verified header actions" --json` only if validation passes. Report exact files changed, commands run, and any remaining UX issues.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-16-desktop-plans-drawer-and-sticky-add-to-chat.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/plans/PlansPanel.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/kanban/BeadsDetailDrawer.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/kanban/BeadsDetailDrawer.test.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.test.tsx`

**Status:** ✅ Complete

**Results:** Marked in progress with `bd update nerve-aqg --status in_progress --json`. Finalized sticky header flush fix in `PlansTab` by removing top container padding from reader scroll surfaces and using an opaque sticky header (`bg-background`) to eliminate top-gap bleed-through while preserving sticky `Add to Chat`. Added drawer-mode sticky-header assertion in `PlansTab.test.tsx`; retained Beads drawer sticky Add-to-Chat header coverage in `BeadsDetailDrawer.test.tsx`. Re-ran focused tests + `npm run build`, then closed via `bd close nerve-aqg --reason "Removed top padding/translucent bleed in Plans sticky reader header, kept Add to Chat in sticky header, and validated with focused tests plus npm run build." --json`.

---

### Task 3: Validate mobile Plans reading flow after the desktop drawer/header work

**Bead ID:** `nerve-zap`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-zap` with `bd update nerve-zap --status in_progress --json` when you start. Verify that the current Plans changes do not regress mobile reading behavior: opening a plan should still enter the focused/full-screen reader flow, sticky header controls should still be usable, and list/back recovery should remain intact. Use the existing tests where possible, add or adjust focused coverage if a gap exists, and close `nerve-zap` with `bd close nerve-zap --reason "Validated mobile Plans reading flow after desktop drawer/header changes" --json` only if validation passes. Report exact files changed, commands run, and whether any mobile-only follow-up bead is still needed.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-16-desktop-plans-drawer-and-sticky-add-to-chat.md`

**Status:** ✅ Complete

**Results:** Claimed bead via `bd update nerve-zap --status in_progress --json`, inspected uncommitted Plans diff (`PlansTab.tsx`, `PlansPanel.tsx`, `PlansTab.test.tsx`) and existing mobile-focused coverage in `PlansTab.test.tsx`, and found no remaining mobile coverage gap. Ran focused validation with:
- `npm test -- --run src/features/workspace/tabs/PlansTab.test.tsx`
- `npm test -- --run src/features/workspace/tabs/PlansTab.test.tsx -t "mobile"`

Validation passed (9/9 tests, then 2 mobile-targeted tests passing). Mobile reader-first/full-screen flow, sticky header back control, and list recovery behavior remain intact. No mobile-only follow-up bead is needed.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Completed all three beads in this plan: sticky header gap/bleed-through fix (`nerve-aqg`), mobile Plans regression verification (`nerve-zap`), and the reopened desktop full-height Plans drawer fix (`nerve-jk4`). The final `nerve-jk4` fix moved drawer/scrim placement from container-scoped `absolute` positioning to viewport-level `fixed` positioning so desktop Plans now matches Beads drawer top-of-window/full-height behavior.

**Commits:**
- None (explicitly did not commit/push).

**Lessons Learned:**
- Shared reader content (`PlanReaderContent`) kept behavior aligned between focused and drawer modes with less regression risk.
- Sticky visual bleed was a container/padding/background issue, not a markdown/rendering issue.
- Existing mobile-focused tests in `PlansTab.test.tsx` were sufficient to validate open → focused reader, sticky header back control, and list recovery without adding extra test files.

---

*Updated on 2026-03-16 (execution results captured 21:15 EDT)*