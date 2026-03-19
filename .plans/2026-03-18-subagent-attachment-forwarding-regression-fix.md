---
plan_id: plan-2026-03-18-subagent-attachment-forwarding-regression-fix
bead_ids:
  - nerve-jg1
  - nerve-nkq
---
# gambit-openclaw-nerve

**Date:** 2026-03-18  
**Status:** Draft  
**Agent:** Chip 🐱‍💻

---

## Goal

Fix the Nerve regression where attachments marked `forwardToSubagents: true` reach the main agent correctly but do not reach spawned subagents with bytes or forwarding metadata.

---

## Overview

Live human testing on Chip established that the current Nerve attachment stack is healthy for the main-agent path: file-reference attachments arrive with the expected manifest metadata, inline uploads can be adaptively shrunk to fit the context-safe budget, and mixed attachment sets are visible to the main assistant as expected.

The remaining real defect is in the Nerve → subagent handoff path. A live mixed payload containing both a `server_path` / `file_reference` image and an `upload` / `inline` image, both marked `policy.forwardToSubagents: true`, was delivered to the main assistant correctly but produced no forwarded bytes, no `<nerve-upload-manifest>`, and no `<nerve-forwarded-server-paths>` block in the child context. That makes the next session’s work very focused: trace the forwarding bridge, repair child delivery semantics, and re-run the live Nerve validation until the child can observe both bytes and metadata.

---

## Tasks

### Task 1: Fix mixed attachment forwarding from Nerve into spawned subagents

**Bead ID:** `nerve-jg1`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-jg1` at start with `bd update nerve-jg1 --status in_progress --json`. Investigate the live regression where Nerve messages containing a mixed attachment set (`server_path/file_reference` + `upload/inline`) with `policy.forwardToSubagents: true` reach the main agent correctly but do not forward any attachment bytes or metadata blocks into spawned subagents. Trace the Nerve -> sessions_spawn handoff path, identify the exact drop point for bytes and manifest/path metadata, implement the smallest safe fix, add/adjust tests where practical, and summarize exactly what changed and what still needs live verification. Do not commit. Close the bead only when the code-side fix and local verification are complete.

**Folders Created/Deleted/Modified:**
- `src/`
- `server/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-subagent-attachment-forwarding-regression-fix.md`
- Nerve attachment/dispatch files as needed for the fix
- Tests as needed for the fix

**Status:** ⏳ Pending

**Results:** Pending next session. Live reproduction already captured: a mixed payload containing one `server_path/file_reference` avatar image and one `upload/inline` image, both with `policy.forwardToSubagents: true`, reached the main agent correctly but produced no forwarded bytes, no `<nerve-upload-manifest>`, and no `<nerve-forwarded-server-paths>` block in the child context.

### Task 2: Re-run live Nerve validation for subagent forwarding after the fix

**Bead ID:** `nerve-nkq`  
**SubAgent:** `primary`  
**Prompt:** After `nerve-jg1` is fixed, rerun live Nerve validation on Chip with a mixed forwarded attachment payload. Confirm the main agent still receives the expected attachments and metadata, then spawn a subagent and verify that the child now receives the relevant image bytes and the expected forwarding metadata blocks, including any preserved path semantics for file-reference attachments. Leave the bead open if any part of the live verification still fails.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-subagent-attachment-forwarding-regression-fix.md`
- `.plans/2026-03-18-nerve-human-ui-validation-pass.md`

**Status:** ⏳ Pending

**Results:** Pending.

---

## Final Results

**Status:** ⏳ Pending

**What We Built:** Pending. Handoff target for next session is now clear: the main-agent path is healthy, but mixed forwarded attachment sets are still being dropped before child-session context delivery.

**Commits:**
- Pending.

**Lessons Learned:** Fresh human testing should happen before code surgery when attachment/runtime behavior is in doubt; it narrowed the problem from a broad upload suspicion to a specific subagent-forwarding bridge failure.

---

*Completed on Pending*
