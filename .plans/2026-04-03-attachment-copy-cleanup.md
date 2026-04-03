# Gambit OpenClaw Nerve — attachment copy cleanup

**Date:** 2026-04-03  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Remove leftover transitional attachment wording such as `inline context budget not used` from the cleaned `feature/upload-reference-v2` branch so the user-facing attachment model reflects canonical workspace references only.

---

## Overview

Dogfood confirmed that the branch now behaves the way we want: workspace files send as direct workspace references, external uploads send as canonical staged workspace references, and optimization baggage is gone. Derrick spotted one remaining piece of transition-era copy in attachment preparation metadata: `Sent as file reference; inline context budget not used.`

That wording still teaches an old transport-decision model the branch is no longer trying to expose. The stabilization slice here should remove or simplify that copy, audit nearby attachment wording for similar implementation-history leaks, and verify that the attachment UI/history still reads cleanly while preserving the underlying canonical reference semantics.

---

## Tasks

### Task 1: Remove transitional inline-budget wording from attachment preparation text

**Bead ID:** `nerve-c4ik`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-c4ik` at start with `bd update nerve-c4ik --status in_progress --json`, remove or simplify attachment preparation copy that still mentions `inline context budget not used` or similar transition-era transport wording while preserving the canonical attachment/reference behavior, update this plan with exact files touched, and close the bead on completion with `bd close nerve-c4ik --reason "Transitional inline-budget wording removed from attachment copy" --json`.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `server/` if needed
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/chat/InputBar.tsx`
- `.plans/2026-04-03-attachment-copy-cleanup.md`

**Status:** ✅ Complete

**Results:** Removed the transition-era preparation reason `Sent as file reference; inline context budget not used.` so file-reference attachments now use the simpler canonical copy `Sent as file reference.` Updated the nearby attach-by-path dialog description in `InputBar.tsx` to remove `workspace / server-known` and `instead of a browser upload` transport framing in favor of a direct workspace-file-reference description. No attachment behavior changed; this was wording-only cleanup.

---

### Task 2: Audit adjacent attachment wording for the same old transport model leakage

**Bead ID:** `nerve-5kpv`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, after the primary wording cleanup is clear, claim bead `nerve-5kpv` at start with `bd update nerve-5kpv --status in_progress --json`, audit adjacent attachment wording in manifests/UI/tests for other copy that still leaks the old inline-vs-path mental model, clean up any narrow obvious cases that belong with this slice, update this plan with exact files touched, and close the bead on completion with `bd close nerve-5kpv --reason "Adjacent attachment wording cleaned up" --json`.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- test files as needed
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/chat/InputBar.tsx`
- `.plans/2026-04-03-attachment-copy-cleanup.md`

**Status:** ✅ Complete

**Results:** Ran a targeted adjacent-wording audit across the attachment UI/tests/manifests for old inline-vs-path leakage. The only narrow obvious cleanup that belonged in this slice was the attach-by-path dialog description in `InputBar.tsx`, which now describes attaching a validated workspace file directly as a file reference instead of contrasting it with browser uploads. No additional manifest or test wording needed changes for this slice.

---

### Task 3: Verify attachment copy still reads cleanly after the cleanup

**Bead ID:** `nerve-g6ie`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, after implementation/testing is done, claim bead `nerve-g6ie` at start with `bd update nerve-g6ie --status in_progress --json`, run focused verification for the attachment copy cleanup, summarize what changed, confirm the cleaned branch still presents canonical path-backed attachments without inline-budget wording, update this plan with exact verification results, and close the bead on completion with `bd close nerve-g6ie --reason "Attachment copy cleanup verified" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-03-attachment-copy-cleanup.md`

**Status:** ✅ Complete

**Results:** Verified the wording-only cleanup with two focused checks: (1) a targeted residual string audit over `src/` confirmed the removed phrases `inline context budget not used`, `workspace / server-known`, and `instead of a browser upload` no longer appear in the attachment UI path; (2) `npm test -- --run src/features/chat/InputBar.test.tsx` passed (`16/16` tests). The test run still emits pre-existing React `act(...)` warnings, but no failures. Diff review confirmed attachment behavior stayed canonical/path-backed: only the file-reference reason string and attach-by-path dialog copy changed.

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- Removed the leftover file-reference preparation copy `Sent as file reference; inline context budget not used.` so canonical path-backed attachments now simply say `Sent as file reference.`
- Cleaned the adjacent attach-by-path dialog copy so it describes attaching a validated workspace file directly as a file reference instead of using transition-era transport framing.
- Verified the branch still presents canonical path-backed attachments without the old inline-budget wording.

**Commits:**
- No new commit created in this subagent run; branch HEAD remained `198cf85` on `feature/upload-reference-v2`.

**Lessons Learned:**
- For this branch, deleting leftover transport-explanation copy is cleaner than replacing it with new explanation; the product model is already path-reference-first.
- A small residual-string audit plus focused `InputBar` coverage is enough validation for this wording-only slice.

---

*Completed on 2026-04-03*