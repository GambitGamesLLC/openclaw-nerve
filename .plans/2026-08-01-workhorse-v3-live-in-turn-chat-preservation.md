# Workhorse V3 Live In-Turn Chat Preservation

**Date:** 2026-08-01  
**Status:** In Progress  
**Last Updated:** 2026-08-01 11:51 EDT  
**Blocked Reason:** None  
**Agent:** cookie

---

## Goal

Fix the remaining Nerve `workhorse-v3` regression where assistant messages emitted between tool calls during the same live turn disappear or render as non-chat internals.

---

## Overview

Derrick manually confirmed that the first `workhorse-v3` fix improved scrollback recovery, but the live reply-then-tools canary still failed: the visible midpoint assistant message was never shown as a normal chat message, and the temporary tool-call UI disappeared from chat history.

This follow-up stays on `workhorse-v3` and targets the live/current-turn reducer or grouping path, not the previously patched recovered-tail merge path. The fix should preserve user-visible assistant text even when the same turn later emits tool calls, while keeping true internal/thinking/tool-only state visually distinct.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Derrick's manual retest report after applying `workhorse-v3` | Current WebChat conversation |
| `REF-02` | Existing recovered-history fix for scrollback and post-reply tools | `src/features/chat/operations/loadHistory.ts`, `src/features/chat/operations/mergeRecoveredTail.ts` |

---

## Tasks

### Task 1: Diagnose And Fix Live In-Turn Preservation

**Bead ID:** `oc-z0o`  
**SubAgent:** `primary`  
**Role:** `coder`  
**References:** `REF-01`, `REF-02`  
**Prompt:** Diagnose and fix the live/current-turn Nerve chat path where assistant text emitted between tool calls disappears or is rendered as internal/non-chat state. Claim the assigned bead on start. Keep work on `workhorse-v3`. Add focused regression coverage for the live event/reducer/message grouping path. Run relevant tests, commit, and push to `origin/workhorse-v3`.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`

**Files Created/Deleted/Modified:**
- `src/features/chat/operations/loadHistory.ts`
- `src/features/chat/operations/loadHistory.test.ts`
- `.plans/2026-08-01-workhorse-v3-live-in-turn-chat-preservation.md`

**Status:** ✅ Complete

**Results:** Removed the heuristic that inferred `intermediate` styling from surrounding tool calls. Normal assistant text emitted before, between, or after tool calls now remains normal visible chat unless it is explicitly marked otherwise. Added focused tagger and full `processChatMessages()` pipeline regressions for the live canary shape. Validation passed: focused chat tests (61), full suite (142 files / 1875 tests), `npm run lint`, `npm run build`, and `git diff --check`.

### Task 2: QA And Audit

**Bead ID:** `Pending`  
**SubAgent:** `primary`  
**Role:** `qa` / `auditor`  
**References:** `REF-01`, `REF-02`  
**Prompt:** Verify the live in-turn assistant message preservation fix on `workhorse-v3`, including tests that cover assistant text between tool calls. Independently audit the diff, validation output, and plan. Close the bead only if the fix is ready for Derrick to apply with `update.sh`.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`

**Files Created/Deleted/Modified:**
- `Pending`

**Status:** ✅ Complete

**Results:** Independent auditor verified the behavior and focused regression coverage, but initially failed handoff because the fix was still only in the working tree and not ready for `update.sh`. Heartbeat housekeeping confirmed the blocker was handoff-only, reran focused validation (`npm test -- src/features/chat/operations/loadHistory.test.ts`: 47 passed) and `git diff --check`, then prepared the fix for commit/push.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Removed inferred intermediate styling from nearby tool calls so assistant text before, between, or after tool calls remains normal visible chat unless it is explicitly marked as thinking/internal. Added focused regressions for the live canary shape through both `tagIntermediateMessages()` and the full `processChatMessages()` pipeline.

**Reference Check:** `REF-01` is covered by a `tool/text/tool/text` regression that preserves the midpoint assistant text as normal chat. `REF-02` remains compatible because explicit thinking/internal markers and recovered-history fixes are preserved.

**Commits:**
- `917d31e` - Preserve live assistant messages around tools

**Lessons Learned:** The recovered-history fix and the live current-turn path share presentation tagging assumptions, but they fail at different points. Treat heuristic presentation flags as volatile UI state, not durable message identity.
