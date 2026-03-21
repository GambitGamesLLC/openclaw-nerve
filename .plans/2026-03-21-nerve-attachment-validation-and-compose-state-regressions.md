---
plan_id: plan-2026-03-21-nerve-attachment-validation-and-compose-state-regressions
bead_ids:
  - nerve-5hh
  - nerve-gzn
---
# gambit-openclaw-nerve

**Date:** 2026-03-21  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Validate that post-checkbox-removal attachment handoff still works for both inline and path-reference images, and fix the newly reported Nerve compose-state / file-picker UX regressions around window mode changes and smaller desktop layouts.

---

## Overview

We have a clean handoff from the previous session: the visible `pass to subagents` checkbox was removed, forwarding now defaults internally, and the remaining open validation bead is `nerve-5hh`. Derrick has now provided a proper mixed attachment test payload where both the inline image and the path-reference image are intended to be forwardable, which makes this the right moment to re-run the human-facing validation slice.

There is also a newly discovered desktop UX problem cluster in Nerve: switching between regular windowed mode and fullscreen-windowed mode appears to wipe in-progress chat state, including typed text and selected files; separately, the desktop path-selection screen can hide submit/cancel affordances in smaller window sizes. Together these create a bad failure mode because the likely recovery action (resizing / changing window mode) can itself erase the pending message.

This plan keeps those as two explicit execution tracks: one validation track that proves whether a subagent can still describe both attachment types after the UI simplification, and one bug track focused on reproducing, fixing, and validating the compose-state and path-picker layout problems.

---

## Tasks

### Task 1: Validate inline + path-reference subagent image handoff after checkbox removal

**Bead ID:** `nerve-5hh`  
**SubAgent:** `primary`  
**Prompt:** Implement bead `nerve-5hh` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`. Start by claiming it with `bd update nerve-5hh --status in_progress --json`. Use the mixed attachment handoff Derrick provided on 2026-03-21: one inline PNG (`Butter-Emoji-240x240.png`) and one path-reference PNG (`avatar-a5c4e416.png` at `/home/derrick/.cache/openclaw/nerve/optimized-uploads/avatar-a5c4e416.png`). Validate whether a spawned subagent can still receive enough usable image context to describe both assets now that the visible checkbox has been removed from the UI. Record exactly what was forwarded, what had to be reconstructed, whether the subagent could accurately describe both images, and any remaining caveats. Close the bead with `bd close nerve-5hh --reason "Validated post-removal mixed attachment handoff behavior" --json` when done.

**Folders Created/Deleted/Modified:**
- `.plans/`
- any validation/log artifact locations worth keeping

**Files Created/Deleted/Modified:**
- `.plans/2026-03-21-nerve-attachment-validation-and-compose-state-regressions.md`
- any durable validation notes/artifacts deemed worth keeping in-repo

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 2: Fix compose-state loss on window mode changes and small-window path-picker affordances

**Bead ID:** `nerve-gzn`  
**SubAgent:** `coder`  
**Prompt:** Implement bead `nerve-gzn` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`. Start by claiming it with `bd update nerve-gzn --status in_progress --json`. Reproduce Derrick’s reported regressions: (1) switching between regular windowed mode and fullscreen-windowed mode clears in-progress composer text and selected files, and (2) in smaller desktop window sizes the file path selection screen hides submit/cancel controls. Fix the bugs, add coverage where practical, and explicitly validate the combined workflow so resizing/window-mode changes do not destroy the user’s in-progress message while the path picker remains actionable in constrained layouts. Close the bead with `bd close nerve-gzn --reason "Fixed compose-state persistence and small-window path-picker UX regressions" --json` when done.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/chat/InputBar.tsx`
- `src/features/chat/InputBar.test.tsx`
- `.plans/2026-03-21-nerve-attachment-validation-and-compose-state-regressions.md`

**Status:** ✅ Complete

**Results:** Reproduced the compose wipe as a remount problem: when the app crosses the compact-layout breakpoint during window-size / window-mode changes, the desktop and compact layout branches swap and `ChatPanel -> InputBar` remounts, which drops the in-progress uncontrolled textarea value plus local attachment state. Fixed by adding an in-memory composer snapshot inside `InputBar` that restores the current draft text, staged attachments, attachment error state, and path-picker context after remounts. Also reworked the Attach by Path dialog shell to use a viewport-bounded flex column with a scrollable body and fixed footer so the close/refresh/attach actions stay reachable in constrained desktop windows. Added regression coverage for remount persistence and the constrained path-picker shell, validated with `npm test -- --run src/features/chat/InputBar.test.tsx` and `npm run build`, and committed the ready changes in `ce48fe6` (`Fix composer remount persistence and path picker layout`).

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:** Task 2 is complete: Nerve now preserves the in-progress composer draft and staged attachments across layout-remount scenarios caused by window-size / window-mode changes, and the Attach by Path dialog keeps its footer actions reachable in smaller desktop windows. Task 1 remains open as a separate validation track.

**Commits:**
- Pending

**Lessons Learned:** Layout breakpoint swaps can behave like hard unmounts for local UI state. For chat composers that stage browser `File` objects, preserving state in a parent or module-level store is safer than relying on uncontrolled DOM state alone.

---

*Drafted on 2026-03-21*
