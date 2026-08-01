# Workhorse V3 Live In-Turn Chat Preservation

**Date:** 2026-08-01  
**Status:** Complete  
**Last Updated:** 2026-08-01 13:48 EDT
**Blocked Reason:** None  
**Agent:** cookie

---

## Goal

Fix the remaining Nerve `workhorse-v3` regression where assistant messages emitted between tool calls during the same live turn disappear or render as non-chat internals.

---

## Overview

Derrick manually confirmed that the first `workhorse-v3` fix improved scrollback recovery, but the live reply-then-tools canary still failed: the visible midpoint assistant message was never shown as a normal chat message, and the temporary tool-call UI disappeared from chat history.

This follow-up stays on `workhorse-v3` and targets the live/current-turn reducer or grouping path, not the previously patched recovered-tail merge path. The fix should preserve user-visible assistant text even when the same turn later emits tool calls, while keeping true internal/thinking/tool-only state visually distinct.

Derrick retested after pulling and updating `workhorse-v3`, fully closing and reopening Cookie's Nerve app on Chip, and rerunning the canary. The midpoint message still did not appear. That narrowed the remaining issue to `agent.stream === assistant` events: the live subscription path treated them as status-only streaming indicators and never materialized renderable assistant text into the chat message buffer.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Derrick's manual retest report after applying `workhorse-v3` | Current WebChat conversation |
| `REF-02` | Existing recovered-history fix for scrollback and post-reply tools | `src/features/chat/operations/loadHistory.ts`, `src/features/chat/operations/mergeRecoveredTail.ts` |
| `REF-03` | Failed retest after fully closing/reopening Cookie Nerve app and running tool → message → tool canary | Current WebChat conversation, 2026-08-01 13:43 EDT |

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

### Task 3: Preserve Agent Assistant Stream Text

**Bead ID:** `oc-u7o`
**SubAgent:** `primary`
**Role:** `coder`
**References:** `REF-03`
**Prompt:** Fix the remaining live canary failure on `workhorse-v3` where `agent.stream === assistant` text emitted between tool events is treated as status only and never appears as a normal chat bubble. Claim bead `oc-u7o`, keep the change focused, add regression coverage, run relevant validation, commit, and push to `origin/workhorse-v3`.

**Folders Created/Deleted/Modified:**
- `src/contexts/`
- `src/features/chat/operations/`

**Files Created/Deleted/Modified:**
- `src/contexts/ChatContext.tsx`
- `src/features/chat/operations/streamEventHandler.ts`
- `src/features/chat/operations/streamEventHandler.test.ts`
- `src/features/chat/operations/index.ts`
- `.plans/2026-08-01-workhorse-v3-live-in-turn-chat-preservation.md`

**Status:** ✅ Complete

**Results:** Added extraction/rendering for visible `agent.stream === assistant` payload text and wired `ChatContext` to upsert it into the chat buffer as a normal assistant message. Empty/internal control messages remain hidden. Tool start/result and final/abort/error events clear the active assistant stream segment so separate assistant messages in one turn do not collapse together. Validation passed: stream handler test (47), full chat operations test suite (125), `npm run lint`, `npm run build`, and `git diff --check`.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Removed inferred intermediate styling from nearby tool calls so assistant text before, between, or after tool calls remains normal visible chat unless it is explicitly marked as thinking/internal. Added focused regressions for the live canary shape through both `tagIntermediateMessages()` and the full `processChatMessages()` pipeline. After Derrick's reopened-app retest still failed, added live `agent.stream === assistant` rendering so assistant commentary emitted between tool events is materialized into the visible chat buffer instead of being treated as status-only.

**Reference Check:** `REF-01` is covered by a `tool/text/tool/text` regression that preserves the midpoint assistant text as normal chat. `REF-02` remains compatible because explicit thinking/internal markers and recovered-history fixes are preserved. `REF-03` is covered by agent assistant stream extraction/rendering tests and the live `ChatContext` wiring that appends/upserts those messages before later tool events can erase them.

**Commits:**
- `d683045` - Preserve live assistant messages around tools
- `470598b` - Record live chat preservation commit
- `Pending` - Preserve agent assistant stream messages

**Lessons Learned:** The recovered-history fix and the live current-turn path share presentation tagging assumptions, but they fail at different points. Treat heuristic presentation flags as volatile UI state, not durable message identity.
