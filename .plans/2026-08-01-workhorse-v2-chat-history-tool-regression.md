# Nerve Workhorse V2 Chat History Tool Regression

**Date:** 2026-08-01  
**Status:** In Progress
**Last Updated:** 2026-08-01 14:54 EDT
**Blocked Reason:** None  
**Agent:** cookie

---

## Goal

Fix the `workhorse-v2` chat regression where prior conversation scrollback disappears after an assistant reply is followed by tool use, and where a normal assistant reply can later render as internal-monologue/tool-style output.

---

## Overview

Derrick reported two regressions after moving to OpenClaw LTS and Nerve `workhorse-v2`. The highest priority bug is that scrollback/history becomes unavailable after the assistant sends a visible reply and then runs tools. The second bug is that the previously normal assistant message can later change presentation into an internal-monologue style message.

The likely area is chat event/history reconciliation: streamed assistant messages, follow-on tool events, and recovered session history should merge without truncating earlier conversation entries or changing the visible role/style of already-rendered assistant text. The fix should compare the current `workhorse-v2` behavior against the older `workhorse-v1` behavior or existing regression notes where useful, then add focused automated coverage around message ordering, message identity, and role/content-type preservation.

Before local implementation, the first executable step is to search upstream Nerve Issues/PRs and local branch history for this bug shape. If an upstream fix exists, the plan should pivot to validating and bringing that fix forward. If no upstream fix exists, but diagnosis finds credible leads in `workhorse-v2`, local experimentation should happen on a new branch named `workhorse-v3` so `workhorse-v2` stays clean and known-good.

Execution will use the standard research -> coder -> QA -> auditor loop on the `primary` subagent lane, with Beads as the repo-local execution state. Beads issues were created successfully, but dependency links failed because the remote-backed embedded Beads database is missing table `wisp_dependencies`; execution order is therefore enforced by this plan and orchestrator sequencing until the tracker schema is repaired.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Derrick's bug report in current WebChat conversation | Current OpenClaw conversation context |
| `REF-02` | Screenshot showing conversation collapsed into tool/status blocks after tool use | `/home/derrick/.openclaw/workspace/.temp/nerve-uploads/2026/08/01/image-91a3ef87.png` |
| `REF-03` | Existing changelog entries for prior chat reconciliation fixes, including infinite scroll and message merge mutation fixes | `CHANGELOG.md` |
| `REF-04` | Upstream Nerve Issues/PRs and branch history for this bug shape | Issue #334, Issue #344, PR #330, PR #342, PR #355, PR #363 |

---

## Tasks

### Task 1: Search Upstream Issues And PRs

**Bead ID:** `oc-8gp`  
**SubAgent:** `primary`  
**Role:** `research`  
**References:** `REF-01`, `REF-02`, `REF-03`, `REF-04`  
**Prompt:** Investigate whether the reported Nerve `workhorse-v2` bug shape already has a known upstream Issue, PR, commit, or branch fix. Claim bead `oc-8gp` on start with `bd update oc-8gp --claim`. Search GitHub Issues/PRs and local git branch/history for terms around chat history truncation, scrollback loss, assistant messages changing type/style, tool-use reconciliation, and internal-monologue rendering. Do not implement. Return links/SHAs if found and recommend whether to cherry-pick/merge an upstream fix or proceed locally. Close `oc-8gp` if the research is complete.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-08-01-workhorse-v2-chat-history-tool-regression.md`

**Status:** ✅ Complete

**Results:** Research found adjacent upstream leads but no exact known fix for the reported `workhorse-v2` sequence. Closest items: Issue #344 / PR #355 for `next` windowed projection undercounting, PR #330 / commit `7a44a9f52223ef0d29f43b5d9379cd27fe28ffa5` for preserving assistant history segments in a broad `next` runtime rewrite, PR #342 for reducer correctness around tool groups/hydration, and PR #363 for realtime race fixes. Recommendation: do not cherry-pick wholesale; continue local diagnosis and then branch `workhorse-v3`. Bead `oc-8gp` was closed by the research subagent.

---

### Task 2: Diagnose Chat History Reconciliation Regression

**Bead ID:** `oc-p51`  
**SubAgent:** `primary`  
**Role:** `research`  
**References:** `REF-01`, `REF-02`, `REF-03`, `REF-04`  
**Prompt:** If Task 1 does not find an upstream fix to apply, investigate the `workhorse-v2` chat rendering/reconciliation path for the regression described in bead `oc-p51`. Claim the bead on start with `bd update oc-p51 --claim`. Identify where assistant reply messages are merged with follow-on tool events or recovered history, why previous scrollback can disappear, and why assistant message presentation can change into internal-monologue/tool-style rendering. Do not implement the fix; return concrete files/functions and a recommended implementation plan with tests.

**Folders Created/Deleted/Modified:**
- None expected

**Files Created/Deleted/Modified:**
- None expected

**Status:** ✅ Complete

**Results:** Diagnosis found the symptoms are connected in practice but separate mechanically. `src/features/chat/operations/loadHistory.ts` retags any assistant followed by tool/tool-result/tool-group before the next user as `intermediate`, which changes rendering in `src/features/chat/MessageBubble.tsx`. The retagged flag is included in `src/features/chat/operations/mergeRecoveredTail.ts` identity signatures, so recovered history may fail to anchor to the existing assistant reply; in no-anchor cases the bounded recovered tail can replace the full transcript. `src/hooks/useChatMessages.ts` then windows the already-replaced buffer. Recommended fix: preserve visible assistant replies when tools happen after the reply, ignore presentation-only flags in recovery identity, and avoid replacing existing scrollback on bounded no-anchor recovery. Bead `oc-p51` was closed by the diagnosis subagent.

---

### Task 3: Create Workhorse V3 Branch And Implement Message Preservation Fix

**Bead ID:** `oc-2zh`  
**SubAgent:** `primary`  
**Role:** `coder`  
**References:** `REF-01`, `REF-02`, `REF-03`  
**Prompt:** If no upstream fix is available and Task 2 identifies credible local leads, create a new branch named `workhorse-v3` from the current `workhorse-v2` state and implement the diagnosed fix there for bead `oc-2zh`. Claim the bead on start with `bd update oc-2zh --claim`. Preserve scrollback/history when assistant-visible messages are followed by tool calls/results, and preserve the assistant message's user-visible presentation instead of converting it to internal-monologue/tool-style rendering. Add focused regression tests for the failing sequence. Run repo validation, commit, and push the `workhorse-v3` branch before handoff.

**Folders Created/Deleted/Modified:**
- `src/features/chat/operations/`

**Files Created/Deleted/Modified:**
- `src/features/chat/operations/loadHistory.ts`
- `src/features/chat/operations/loadHistory.test.ts`
- `src/features/chat/operations/mergeRecoveredTail.ts`
- `src/features/chat/operations/mergeRecoveredTail.test.ts`

**Status:** ✅ Complete

**Results:** Implemented on `workhorse-v3` in commit `b9c4886` (`Fix chat recovery preserving visible replies`) and pushed to `origin/workhorse-v3`. `tagIntermediateMessages()` now only marks pre-tool assistant narration intermediate when a tool is followed by a later assistant answer before the next user, so a visible final reply followed only by post-reply tools remains a normal assistant message. `mergeRecoveredTail()` now ignores the presentation-only `intermediate` flag in message identity, uses a looser role/text anchor when timestamp buckets differ, and preserves existing scrollback on bounded no-anchor recovery while appending clearly new recovered tail messages. Focused regressions cover final reply + post-reply tool, assistant -> tool -> assistant narration, intermediate retag recovery, loose timestamp anchoring, and no-anchor scrollback preservation. Validation passed: `npm test -- src/features/chat/operations/loadHistory.test.ts src/features/chat/operations/mergeRecoveredTail.test.ts --run` (54 tests), `npm test -- --run` (142 files / 1873 tests), `npm run lint`, `npm run build`, and `git diff --check`. Build emitted existing Vite chunk-size/dynamic-import warnings only. Orchestrator reran the focused test command successfully: 2 files / 54 tests passed. Caveat: no new hook/context test was added because the existing `useChatMessages`/`ChatContext` tests do not directly exercise this recovery refresh path; the covered pure operations are the diagnosed mutation and scrollback-loss points.

---

### Task 4: QA Reproduce And Verify

**Bead ID:** `oc-pc0`  
**SubAgent:** `primary`  
**Role:** `qa`  
**References:** `REF-01`, `REF-02`  
**Prompt:** QA bead `oc-pc0` after coder handoff. Claim the bead on start with `bd update oc-pc0 --claim`. Reproduce the reported sequence in the highest-fidelity local Nerve environment available: assistant sends a normal conversation reply, tools run afterward, and prior conversation remains scrollable while the prior assistant message keeps normal conversation styling. Run the relevant automated tests and report exact evidence.

**Folders Created/Deleted/Modified:**
- None expected

**Files Created/Deleted/Modified:**
- None expected

**Status:** ✅ Complete

**Results:** QA verified on branch `workhorse-v3`; bead `oc-pc0` was claimed successfully. Focused regression command passed: `npm test -- src/features/chat/operations/loadHistory.test.ts src/features/chat/operations/mergeRecoveredTail.test.ts --run` (2 files / 54 tests). Component-adjacent rendering validation passed: `npm test -- src/features/chat/MessageBubble.test.tsx src/features/chat/operations/loadHistory.test.ts src/features/chat/operations/mergeRecoveredTail.test.ts --run` (3 files / 59 tests), covering the `MessageBubble` path that renders `intermediate` messages differently. Harness-level sequence check passed with `npx tsx -e "..."` against the actual `tagIntermediateMessages()` and `mergeRecoveredTail()` modules: existing scrollback (`Older visible prompt`, `Older visible answer`, `Question before regression`) remained present, `Visible final reply` had `intermediate: false` before and after recovered-tail merge, and post-reply `tool`/`toolGroup` plus a new recovered tail event remained appended. Additional validation passed: `npm test -- --run` (142 files / 1873 tests) and `npm run lint`. No served full-app check was run because this repo's local app path depends on live OpenClaw gateway/session state; the operation harness plus component tests exercised the diagnosed state and styling boundary without external credentials.

---

### Task 5: Independent Audit And Closeout

**Bead ID:** `oc-apn`  
**SubAgent:** `primary`  
**Role:** `auditor`  
**References:** `REF-01`, `REF-02`, `REF-03`  
**Prompt:** Audit bead `oc-apn` independently. Claim the bead on start with `bd update oc-apn --claim`. Check the plan, beads, diff, regression tests, and QA evidence. Confirm the reported bugs are fixed without silent scope drift. If complete, close the bead directly with a clear reason; if not, leave it open and report the precise gap.

**Folders Created/Deleted/Modified:**
- None expected

**Files Created/Deleted/Modified:**
- None expected

**Status:** ✅ Complete

**Results:** Independent audit passed on `workhorse-v3` at `ba754d8` (`origin/workhorse-v3` matched local HEAD and contains functional commit `b9c4886`). `loadHistory.ts` preserves real pre-tool narration by still marking assistant -> tool/toolGroup/toolResult -> assistant sequences as `intermediate`, while leaving a visible final assistant reply followed only by post-reply tools non-intermediate. `mergeRecoveredTail.ts` no longer includes presentation-only `intermediate` in identity signatures, supports loose role/text anchoring for timestamp drift, and preserves existing scrollback on bounded no-anchor recovery by appending only clearly new recovered messages. Focused tests cover the required cases in `loadHistory.test.ts` and `mergeRecoveredTail.test.ts`; component-adjacent validation through `MessageBubble.test.tsx` confirms the rendering boundary where `intermediate` changes presentation. Auditor reran `npm test -- src/features/chat/operations/loadHistory.test.ts src/features/chat/operations/mergeRecoveredTail.test.ts src/features/chat/MessageBubble.test.tsx --run` successfully (3 files / 59 tests). QA evidence is enough for the diagnosed pure operation and rendering boundary; residual gap is only that no served full-app/live gateway reproduction was run, matching the QA caveat.

---

### Task 6: Preserve Live Assistant Canary Through All Refresh Paths

**Bead ID:** `oc-ddd`
**SubAgent:** `primary`
**Role:** `coder`
**References:** `REF-01`
**Prompt:** Claim bead `oc-ddd` on start. Derrick manually retested `workhorse-v3` after prior live-stream fixes and observed the midpoint assistant canary appears briefly, then disappears after the later tool/final reconciliation. Implement a fix so `agent.stream=assistant` bubbles remain visible across direct history refresh, recovery, final event merge, and other `applyMessageWindow()` paths until durable history contains the same assistant text. Add focused regression coverage and run validation before committing/pushing.

**Folders Created/Deleted/Modified:**
- `src/hooks/`

**Files Created/Deleted/Modified:**
- `src/hooks/useChatMessages.ts`
- `src/hooks/useChatMessages.test.ts`

**Status:** ✅ Complete

**Results:** Added a live assistant stream registry inside `useChatMessages`. Any message window application now reconciles through that registry, so a live assistant canary that was already shown is reinserted if a later history/current-turn refresh omits it. The registry drops the provisional copy once durable history includes an assistant message with the same content, preventing duplicate bubbles. Added tests for preserving a live canary through an omitting refresh and for dropping it once persisted. Validation passed: `npm test -- src/hooks/useChatMessages.test.ts src/contexts/ChatContext.subscription.test.tsx src/features/chat/operations --run` (6 files / 133 tests), `npm test -- --run` (143 files / 1887 tests), `npm run lint`, `npm run build`, and `git diff --check`. Manual retest is pending after Derrick runs `update.sh`.

---

### Task 7: Materialize Buffered Chat Commentary Before Tool Use

**Bead ID:** `oc-5x5`
**SubAgent:** `primary`
**Role:** `coder`
**References:** `REF-01`
**Prompt:** Claim bead `oc-5x5` on start. Derrick manually retested the live assistant bubble registry and the midpoint canary still disappeared. Inspect actual session history/event shape, then fix the path where commentary arrives as chat delta/stream overlay instead of durable history or `agent.stream=assistant`. The midpoint text should be committed to the visible transcript before a following tool event clears the stream overlay. Add a ChatContext regression for `chat_started -> chat_delta -> agent_tool_start`.

**Folders Created/Deleted/Modified:**
- `src/contexts/`
- `src/features/chat/operations/`

**Files Created/Deleted/Modified:**
- `src/contexts/ChatContext.tsx`
- `src/contexts/ChatContext.subscription.test.tsx`
- `src/features/chat/operations/index.ts`
- `src/features/chat/operations/streamEventHandler.ts`
- `src/features/chat/operations/streamEventHandler.test.ts`

**Status:** ✅ Complete

**Results:** Session history inspection showed the midpoint canary is not persisted as a normal assistant message; it exists in Codex local JSONL as `phase:"commentary"` and is mirrored to Nerve as transient chat stream text. Added `buildLiveAssistantStreamMessage()` and materialized the active `run.bufferText` into a provisional assistant bubble when an `agent_tool_start` follows a chat delta. Added a ChatContext regression for `chat_started -> chat_delta(midpoint) -> agent_tool_start` and pure helper tests. Validation passed: `npm test -- src/contexts/ChatContext.subscription.test.tsx src/features/chat/operations/streamEventHandler.test.ts src/hooks/useChatMessages.test.ts src/features/chat/operations --run` (6 files / 136 tests), `npm run lint`, `npm run build`, and `git diff --check`. Full suite repeated one unrelated `src/features/kanban/CreateTaskDialog.test.tsx` suite-order/timing failure; that file passed standalone (`4 passed`) after the failure.

---

## Final Results

**Status:** In Progress

**What We Built:** A focused `workhorse-v3` fix series for chat recovery and live assistant stream preservation. It preserves prior scrollback, keeps visible assistant replies in normal rendering after post-reply tool activity, keeps live assistant canary bubbles through subsequent history/current-turn refreshes until durable history supersedes them, and now materializes buffered chat commentary before a following tool event clears the stream overlay.

**Reference Check:** Matches Derrick's report: no-anchor recovery preserves existing scrollback, visible reply + post-reply tools stays non-intermediate, and true intermediate/pre-tool narration remains supported.

**Commits:** `b9c4886` (`Fix chat recovery preserving visible replies`) plus subsequent `workhorse-v3` live-stream preservation commits. Latest buffered-commentary fix is pending commit/push.

**Lessons Learned:** The regression came from two presentation/recovery interactions: broad intermediate retagging changed visible message style, and recovered-tail identity/fallback could fail to anchor then replace existing transcript state.

---

*Last updated on 2026-08-01*
