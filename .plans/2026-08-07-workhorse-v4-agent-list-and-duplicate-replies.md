# Nerve Workhorse v4 State Reconciliation Bugs

**Date:** 2026-08-07  
**Status:** In Progress  
**Last Updated:** 2026-08-07 16:21 EDT  
**Blocked Reason:** None
**Agent:** byte

---

## Goal

Create `workhorse-v4` for the Nerve fork and fix UI/state-reconciliation regressions that make Nerve diverge from OpenClaw's live session truth: stale/dead agents, duplicate/disappearing heartbeat or assistant messages, delayed/reordered optimistic user messages during compaction, and internal compaction responses leaking into chat.

---

## Overview

This work should produce a fresh `workhorse-v4` branch based on the latest upstream Nerve `master`, then selectively reapply or replace still-relevant bug fixes from `workhorse-v3`. `workhorse-v2` is closer to older upstream `master`; `workhorse-v3` contains prior Nerve/OpenClaw bug-fix attempts and should be treated as a comparison/reference branch, not automatically as the new base. The fleet can remain on `workhorse-v3` while `workhorse-v4` is rebuilt and tested safely.

The stale Agents-list bug appears visual/stateful in Nerve because OpenClaw dashboard cleanup already removes the dead agents. The implementation should compare Nerve's agent/session cache, Gateway data refresh path, and frontend list derivation against the live OpenClaw source of truth, then remove stale entries deterministically instead of preserving old cached children forever. The supplied screenshots show Byte's subagent list retaining many idle zombie sessions that should no longer be visible.

The chat bug has two visible parts: Nerve can render the same live heartbeat/message twice while it is being written, and then swallow/drop the posted final message from the persisted UI. The implementation should inspect the live streaming path, history refresh path, and prior `workhorse-v3` preservation commits so the UI keeps legitimate in-progress/live bubbles, suppresses duplicate copies of the same assistant message, and preserves the final posted heartbeat/message after completion.

The newer context from Derrick's GPT debugging session broadens the investigation from two isolated symptoms into a single source-of-truth problem. Treat optimistic user messages, WebSocket/live gateway events, heartbeat events, compaction/checkpoint events, tool events, and canonical session-history refetches as competing writers until proven otherwise. The preferred fix belongs in Nerve's gateway adapter/event reducer/state merge layer, not in component-specific timing hacks.

Validation should prove that Nerve remains trustworthy during heavy OpenClaw Codex activity: user messages remain visible when compaction starts, heartbeat-originated operator messages appear once and persist after refresh, internal `NO_REPLY` or memory-flush turns are not rendered as normal assistant chat, and the Agents panel converges to the same active/current subagents shown by OpenClaw after spawn/finish/archive/reconnect flows.

Before prioritizing or implementing the remaining bug fixes, pause after the upstream refresh ceremony and report the result to Derrick. That checkpoint should say whether latest upstream `master` already includes promising fixes, which `workhorse-v3` changes still appear useful, which ones are redundant or risky, and what the new `workhorse-v4` baseline contains.

Runtime deployment must use the workspace updater path with the gateway restart skipped. Do not run `/home/derrick/.openclaw/workspace/scripts/update.sh` directly in a way that refreshes the OpenClaw Gateway. Use its `--skip-gateway-restart` / `--no-gateway-restart` flag if an installed Nerve update is needed for visual QA.

After Derrick re-examined the upstream-refresh checkpoint, execution is now prioritized as separate rollback-friendly slices. Each bug class should land as its own commit where practical so we can revert, branch, or upstream the fixes independently later. The first operational slice points the local Nerve deployment at `workhorse-v4` and runs the safe updater. The first research slice maps the reducer/source-of-truth problem. Implementation should then proceed in this order: chat message identity and history merge, internal compaction/`NO_REPLY` filtering, Agents-panel reconciliation, regression tests, then real-session visual QA and independent audit.

Likely code hot spots from the current `workhorse-v4` baseline:
- Chat state/load/stream merge: `src/hooks/useChatMessages.ts`, `src/hooks/useChatStreaming.ts`, `src/hooks/useChatRecovery.ts`, `src/features/chat/operations/loadHistory.ts`, `src/features/chat/operations/streamEventHandler.ts`, `src/features/chat/operations/realtimeState.ts`, `src/features/chat/operations/mergeRecoveredTail.ts`, `src/features/chat/operations/sendMessage.ts`, `src/features/chat/ChatPanel.tsx`, and `src/features/chat/MessageBubble.tsx`.
- Gateway/live event path: `src/hooks/useWebSocket.ts`, `src/hooks/useDashboardData.ts`, `src/hooks/useServerEvents.ts`, `server/routes/gateway.ts`, `server/lib/gateway-rpc.ts`, and `server/lib/gateway-client.ts`.
- Sessions/Agents list path: `src/features/sessions/SessionList.tsx`, `src/features/sessions/SessionNode.tsx`, `src/features/sessions/sessionTree.ts`, `src/features/sessions/sessionKeys.ts`, `src/features/sessions/statusUtils.ts`, `server/routes/sessions.ts`, and gateway calls to `sessions.list`, `sessions.get`, `subagents`, or `sessions_history`.
- Tests to extend: `src/features/chat/operations/loadHistory.test.ts`, `src/features/chat/operations/streamEventHandler.test.ts`, `src/features/chat/operations/mergeRecoveredTail.test.ts`, `src/hooks/useWebSocket.test.ts`, `src/hooks/useDashboardData.test.ts`, `src/features/sessions/sessionTree.test.ts`, `src/features/sessions/SessionList.test.tsx`, and `server/routes/sessions.test.ts`.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | User-provided screenshot showing stale/dead Agents entries in Nerve | `/home/derrick/.openclaw/workspace/.temp/nerve-uploads/2026/08/07/image-4e116c82.png` |
| `REF-02` | Current baseline branch with previous Nerve/OpenClaw bug-fix attempts | `gambit-openclaw-nerve:workhorse-v3` |
| `REF-03` | Older branch closer to upstream master for comparison | `gambit-openclaw-nerve:workhorse-v2` |
| `REF-04` | Upstream-like branch for comparison | `gambit-openclaw-nerve:master` |
| `REF-05` | Required deployment/update constraint | `/home/derrick/.openclaw/workspace/scripts/update.sh` (`--skip-gateway-restart` / `--no-gateway-restart`) |
| `REF-06` | Additional stale/zombie Agents-list screenshot | `/home/derrick/.openclaw/workspace/.temp/nerve-uploads/2026/08/07/image-cda7a5c4.png` |
| `REF-07` | Screenshot showing doubled live heartbeat message and final-message loss | `/home/derrick/.openclaw/workspace/.temp/nerve-uploads/2026/08/07/image-bbe53a6b.png` |
| `REF-08` | Derrick/GPT investigation prompt reframing the bugs as a state identity/reconciliation problem | Current WebChat conversation, 2026-08-07 |

---

## Tasks

### Task 1: Upstream Refresh and Workhorse v3 Triage Ceremony

**Bead ID:** `oc-bys`  
**SubAgent:** `primary` (for `research` workflow role)  
**Role:** `research`  
**References:** `REF-02`, `REF-03`, `REF-04`, `REF-08`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. Fetch the latest upstream Nerve `master`, rebuild or update local `workhorse-v4` so it is based on the latest upstream `master`, and compare latest `master` against `workhorse-v3`, `workhorse-v2`, and the existing `workhorse-v4` draft state. Inspect recent upstream commits for promising fixes related to Nerve message/session reconciliation, stale Agents/subagents, live gateway events, heartbeat or progress messages, compaction/checkpoint handling, optimistic messages, history refetch, and filtering internal/system turns. Identify which `workhorse-v3` fixes are still needed on top of latest upstream, which are now redundant, and which conflict with upstream direction. Apply or stage only the clearly still-needed `workhorse-v3` fixes if safe; if a decision is needed, document it instead of guessing. Do not proceed into the remaining bug-fix implementation tasks. Report the new baseline, upstream findings, carried-forward changes, conflicts/risks, and recommended next priorities. Commit and push the branch only if the ceremony produced a coherent baseline; otherwise leave clear notes and keep the bead open.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-08-07-workhorse-v4-agent-list-and-duplicate-replies.md`
- `Pending upstream refresh findings`

**Status:** ✅ Complete

**Results:** Bead created and unblocked. Execution started after Derrick confirmed `execute`. Spawned visible OpenClaw subagent `agent:main:subagent:2f8591ee-dffc-46aa-a738-3b3407d84b76` for the `primary` research role. Subagent completed the ceremony and closed `oc-bys`. `workhorse-v4` was rebuilt from latest `upstream/master` `312e273`; the code checkpoint was pushed to `origin/workhorse-v4` at `5d15105`, and plan/checkpoint documentation was pushed afterward at branch tip `28f6780`. Orchestrator verification confirmed `upstream/master` is an ancestor of `HEAD`, `origin/workhorse-v4` matches local `HEAD`, and the only code delta from `upstream/master` is the protocol-v4 gateway handshake in `server/lib/gateway-rpc.ts` and `src/hooks/useWebSocket.ts`. The only carried-forward `workhorse-v3`/`workhorse-v2` patch was the protocol-v4 gateway handshake because upstream `master` still negotiates protocol 3 while upstream `next` contains the same protocol-v4 direction. The older `workhorse-v3` chat-preservation patches were deferred because upstream `next` now has a larger chat runtime/reducer/replay-buffer line that likely supersedes or conflicts with component-level preservation patches. No stale Agents pruning fix was found in `workhorse-v3`. Targeted vitest for `server/lib/gateway-rpc.test.ts` and `src/hooks/useWebSocket.test.ts` passed, and `npm run build` passed. The remaining blocker is Derrick's requested checkpoint before prioritizing the rest of the bug plan.

---

### Task 2: Point Local Nerve Deployment at Workhorse v4

**Bead ID:** `oc-kn6`  
**SubAgent:** `primary` (for `coder` workflow role)  
**Role:** `coder`  
**References:** `REF-05`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. Confirm the repo is on `workhorse-v4` and pushed. Update `/home/derrick/.openclaw/.env` so `NERVE_DEPLOY_BRANCH=workhorse-v4` while preserving all unrelated env lines and secrets. Then run `/home/derrick/.openclaw/workspace/scripts/update.sh --skip-gateway-restart` or the equivalent no-gateway-restart flag. Do not restart or refresh the OpenClaw Gateway. Verify Nerve remains installed/runnable and report the deployed branch/commit plus any updater warnings. Close the bead only after the safe updater call completes.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/.env`

**Status:** ✅ Complete

**Results:** Completed by orchestrator. Updated `/home/derrick/.openclaw/.env` from `NERVE_DEPLOY_BRANCH=workhorse-v3` to `NERVE_DEPLOY_BRANCH=workhorse-v4`. Ran `/home/derrick/.openclaw/workspace/scripts/update.sh --skip-gateway-restart`; updater confirmed `Nerve branch: workhorse-v4`, synced Nerve to `origin/workhorse-v4`, skipped the OpenClaw Gateway restart by flag, restarted the Nerve service, and reported `Update Summary: SUCCESS`. Post-update Nerve health check at `http://127.0.0.1:3080/health` returned `{"status":"ok","gateway":"ok"}`. Bead `oc-kn6` closed.

---

### Task 3: Branch and Investigation Baseline

**Bead ID:** `oc-vcz`  
**SubAgent:** `primary` (for `research` workflow role)  
**Role:** `research`  
**References:** `REF-01`, `REF-02`, `REF-03`, `REF-04`, `REF-05`, `REF-06`, `REF-07`, `REF-08`  
**Prompt:** On branch `workhorse-v4` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. This task must wait until Task 1's upstream refresh ceremony has completed and Derrick has re-examined the situation. Inspect `REF-01`, `REF-06`, and `REF-07` as proof screenshots. Treat `REF-08` as the primary investigation framing. Investigate Nerve's authoritative session/message history source, full history/session refetch triggers, optimistic-message lifecycle, WebSocket/live gateway event handling, heartbeat event persistence, compaction/checkpoint handling, tool/system/internal event rendering filters, and Agents panel state derivation/pruning. Determine whether normal assistant messages, heartbeat messages, system/compaction messages, tool events, and user messages have stable OpenClaw IDs/types/source metadata and whether Nerve merges by stable identity or by content/timestamp/index. Compare `workhorse-v3`, `workhorse-v2`, and `master` when useful. Do not make code changes. Report files/functions implicated, root-cause hypothesis, suggested reducer/adapter-level fixes, targeted tests, and risks. Do not close the bead unless the investigation is complete.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-08-07-workhorse-v4-agent-list-and-duplicate-replies.md`

**Status:** ✅ Complete

**Results:** Earlier draft branch `workhorse-v4` was created locally from `workhorse-v3`, but Derrick requested the final `workhorse-v4` baseline be rebuilt or updated from latest upstream `master` first. Task 1 completed that ceremony. Derrick then re-examined the ceremony result and authorized prioritizing the bugs, splitting fixes into separate commits, and deploying local Nerve on `workhorse-v4` for iteration. Bead `oc-vcz` was moved from blocked back to open with that note. Spawned visible OpenClaw subagent `agent:main:subagent:f04fac34-b08e-4661-80f2-ef68c6e3b226` for the `primary` research role with instructions to claim `oc-vcz`, inspect the listed hot spots and screenshots, update bead notes, and close the bead only when investigation is complete. Subagent completed and closed `oc-vcz`.

Key findings: Nerve treats gateway `chat.history` as authoritative, but the `ChatMessage`/`ChatMsg` path discards durable OpenClaw transcript identity and generates UI-only ids. Optimistic send, live gateway events, streaming assistant output, recovery/history refetch, subagent polling, and tool-result delayed refreshes are competing writers that merge via generated ids plus content/timestamp/index heuristics. This explains duplicate heartbeat/operator messages, disappearing optimistic messages after refetch, and stale/out-of-order overwrite risk. The Agents panel has a similar reconciliation problem: `SessionContext.listAuthoritativeSessions()` merges full `sessions.list`, hidden cron sessions, and `sessions.list({spawnedBy})`; stale spawnedBy/session-store supplements can keep dead children visible after the authoritative full list has dropped them. Evidence gap: local JSONL transcript rows have stable ids, but implementation should sample the live `chat.history` wire shape to confirm whether the gateway forwards or strips those ids before Nerve sees them.

---

### Task 4: Fix Chat Message Identity and History Merge

**Bead ID:** `oc-xcm`  
**SubAgent:** `primary` (for `coder` workflow role)  
**Role:** `coder`  
**References:** `REF-07`, `REF-08`  
**Prompt:** On branch `workhorse-v4` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. Use the investigation results from `oc-vcz`. Fix duplicate/disappearing chat by making optimistic user messages, live gateway events, streaming assistant output, heartbeat/operator messages, and canonical history refreshes merge by stable identity instead of content/timestamp/index or wholesale replacement. Preserve realtime streaming and avoid arbitrary delays. Add focused tests where practical. Commit this slice separately and push.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `src/hooks/`

**Files Created/Deleted/Modified:**
- `src/types.ts`
- `src/features/chat/types.ts`
- `src/features/chat/operations/loadHistory.ts`
- `src/features/chat/operations/loadHistory.test.ts`
- `src/features/chat/operations/mergeRecoveredTail.ts`
- `src/features/chat/operations/mergeRecoveredTail.test.ts`
- `src/features/chat/operations/sendMessage.ts`
- `src/hooks/useChatMessages.ts`
- `src/hooks/useChatMessages.test.ts`
- `src/contexts/ChatContext.tsx`
- `src/contexts/ChatContext.subscription.test.tsx`

**Status:** ✅ Complete

**Results:** Created as the highest-priority rollback-friendly implementation slice. Spawned visible OpenClaw subagent `agent:main:subagent:d4407e8e-a5e1-41e1-a71f-1ed7b074a401` for the `primary` coder role with instructions to claim `oc-xcm`, sample live `chat.history` shape without exposing secrets, preserve or derive stable message ids in the adapter/reducer path, keep the write scope focused to chat identity/history merge, add targeted tests, run validation, commit separately, and push `origin/workhorse-v4`. Subagent completed the slice and closed `oc-xcm`. Commit `ad01882` was pushed to `origin/workhorse-v4`. Live `chat.history` sampling confirmed the gateway forwards `__openclaw` identity metadata (`mirrorIdentity`, `id`, `recordTimestampMs`, `seq`) plus fields such as `idempotencyKey` and `toolCallId` on relevant rows. The implementation adds durable `sourceId` / `alternateSourceIds` fields, preserves or derives stable message ids, makes optimistic user sends use the same idempotency identity sent through `chat.send`, and updates final/history/recovery/subagent-poll merges to reconcile by stable identity while preserving pending/newer local state. Validation passed: `npm test -- --run src/features/chat/operations/loadHistory.test.ts src/features/chat/operations/mergeRecoveredTail.test.ts src/hooks/useChatMessages.test.ts src/features/chat/operations/sendMessage.test.ts src/contexts/ChatContext.subscription.test.tsx` (82 tests), and `npm run build` passed with existing Vite chunk/dynamic-import warnings. Full real-session visual QA remains covered by `oc-dz8`; internal compaction/NO_REPLY filtering and Agents panel pruning remain separate beads.

---

### Task 5: Filter Internal Compaction and No-Reply Turns

**Bead ID:** `oc-83k`  
**SubAgent:** `primary` (for `coder` workflow role)  
**Role:** `coder`  
**References:** `REF-08`  
**Prompt:** On branch `workhorse-v4` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. Use the investigation results from `oc-vcz`. Ensure internal/system compaction, memory-flush, and `NO_REPLY` turns are not rendered as normal operator chat while legitimate assistant/operator progress messages remain visible. Prefer adapter/reducer-level filtering over component-specific hiding. Add focused tests where practical. Commit this slice separately and push.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `src/hooks/`
- `server/`

**Files Created/Deleted/Modified:**
- `src/features/chat/operations/loadHistory.ts`
- `src/features/chat/operations/loadHistory.test.ts`

**Status:** ✅ Complete

**Results:** Created as a separate high-priority slice because it may be upstreamed independently from generic message dedupe. Spawned visible OpenClaw subagent `agent:main:subagent:e8dfbcb7-41d5-4e48-b259-fcdc062145af` for the `primary` coder role with instructions to claim `oc-83k`, preserve the stable identity semantics from `ad01882`, implement adapter/reducer-level filtering for internal/system compaction, memory-flush, and `NO_REPLY` turns without hiding legitimate operator progress messages, add focused tests, run validation, commit separately, push `origin/workhorse-v4`, and close the bead only when complete. Subagent completed the slice and closed `oc-83k`. Commit `bf5dddc` was pushed to `origin/workhorse-v4`. The adapter-level filter now suppresses internal metadata-marked rows, exact `NO_REPLY` / `HEARTBEAT_OK` silent replies, JSON silent reply envelopes, compaction/checkpoint/memory-flush status rows, pure runtime-context blocks, and existing wake bundles, while preserving legitimate assistant/operator progress messages that mention compaction or memory. Orchestrator review verified the commit, bead closure, branch push state, and code scope. Validation passed locally after handoff: `npm test -- --run src/features/chat/operations/loadHistory.test.ts src/features/chat/operations/mergeRecoveredTail.test.ts src/hooks/useChatMessages.test.ts src/features/chat/operations/streamEventHandler.test.ts src/contexts/ChatContext.subscription.test.tsx` (106 tests), and `npm run build` passed with existing Vite dynamic-import/chunk-size warnings.

---

### Task 6: Reconcile Agents Panel With Live Sessions

**Bead ID:** `oc-904`  
**SubAgent:** `primary` (for `coder` workflow role)  
**Role:** `coder`  
**References:** `REF-01`, `REF-06`, `REF-08`  
**Prompt:** On branch `workhorse-v4` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. Use the investigation results from `oc-vcz`. Fix the Agents/Subagents listing so it converges to OpenClaw's current live session truth, pruning stale/dead cached entries without hiding active or recently relevant sessions. Inspect `sessions.list`, `subagents`, session tree derivation, hidden/cron session filtering, and cache/reconnect behavior. Add focused tests where practical. Commit this slice separately and push.

**Folders Created/Deleted/Modified:**
- `src/features/sessions/`
- `src/hooks/`
- `server/routes/`

**Files Created/Deleted/Modified:**
- `src/contexts/SessionContext.tsx`
- `src/features/sessions/sessionReconciliation.ts`
- `src/features/sessions/sessionReconciliation.test.ts`

**Status:** ✅ Complete

**Results:** Created as a separate slice because stale Agents cleanup has no known `workhorse-v3` patch and is likely independent of chat message merging. Spawned visible OpenClaw subagent `agent:main:subagent:b77eaacd-58ae-4fe3-b1e3-73c10d97d31c` for the `primary` coder role with instructions to claim `oc-904`, inspect the sessions/Agents source-of-truth and merge paths, implement reconciliation/pruning without arbitrary delays or visual-only hiding, add focused tests, run validation, commit separately, push `origin/workhorse-v4`, and close the bead only when complete. Subagent completed the slice and closed `oc-904`. Commit `4456816` was pushed to `origin/workhorse-v4`. The implementation introduces `sessionReconciliation.ts` so full `sessions.list` plus hidden cron sessions remain the base truth, while `spawnedBy` supplements are admitted only when they carry a positive live signal such as `busy`, `processing`, or live/running state. Terminal/archived cache-only children are pruned, and terminal rows still shown by the full authoritative list are preserved. Orchestrator review verified the commit, bead closure, branch push state, code scope, and residual risk that active children with no state fields must appear in the full base list rather than supplement-only data. Validation passed locally after handoff: `npm test -- --run src/features/sessions/sessionReconciliation.test.ts src/contexts/SessionContext.test.tsx src/features/sessions/sessionTree.test.ts` (49 tests), and `npm run build` passed with existing Vite dynamic-import/chunk-size warnings.

---

### Task 7: Add Regression Tests for Reconciliation

**Bead ID:** `oc-8xt`  
**SubAgent:** `primary` (for `coder` workflow role)  
**Role:** `coder`  
**References:** `REF-01`, `REF-06`, `REF-07`, `REF-08`  
**Prompt:** On branch `workhorse-v4` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. After the focused implementation slices, add or tighten regression tests for stable message identity, optimistic/live/history merges, heartbeat persistence, internal event filtering, out-of-order refetch protection, and Agents reconciliation/pruning. Run relevant targeted tests and `npm run build`. Commit this test slice separately and push, unless tests were already committed with each implementation slice and the bead can be closed with evidence.

**Folders Created/Deleted/Modified:**
- `src/`
- `server/`

**Files Created/Deleted/Modified:**
- `Pending investigation`

**Status:** ✅ Complete

**Results:** Created as a test-hardening slice dependent on the three focused bug-fix beads. Original umbrella implementation bead `oc-324` was closed as superseded by `oc-xcm`, `oc-83k`, `oc-904`, and `oc-8xt`. No extra test-only commit was needed because regression coverage landed with the three implementation commits: `ad01882` covered stable chat identity, optimistic/history alias merging, send idempotency, stream/recovery merge behavior, and out-of-order refresh preservation; `bf5dddc` covered internal `NO_REPLY` / `HEARTBEAT_OK`, compaction/status, metadata-marked, runtime-context, and wake-bundle filtering while preserving real progress text; `4456816` covered live supplemental spawned sessions, terminal supplement pruning, base-list preservation, and unknown-state pruning. Orchestrator ran the combined regression suite `npm test -- --run src/features/chat/operations/loadHistory.test.ts src/features/chat/operations/mergeRecoveredTail.test.ts src/features/chat/operations/sendMessage.test.ts src/features/chat/operations/streamEventHandler.test.ts src/hooks/useChatMessages.test.ts src/contexts/ChatContext.subscription.test.tsx src/features/sessions/sessionReconciliation.test.ts src/contexts/SessionContext.test.tsx src/features/sessions/sessionTree.test.ts`; it passed with 177 tests. Bead `oc-8xt` closed with that evidence.

---

### Task 8: Real Session and Visual QA on Running Nerve

**Bead ID:** `oc-dz8`  
**SubAgent:** `primary` (for `qa` workflow role)  
**Role:** `qa`  
**References:** `REF-01`, `REF-05`, `REF-06`, `REF-07`, `REF-08`  
**Prompt:** On branch `workhorse-v4` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. Inspect `REF-01`, `REF-06`, and `REF-07` as proof screenshots and use `REF-08` for acceptance behavior. Verify the implemented fixes in the highest-fidelity running Nerve environment available, using a real OpenClaw session when practical. Use desktop-control screenshot workflow when direct CLI/programmatic checks are insufficient. If the installed Nerve must be updated, use `/home/derrick/.openclaw/workspace/scripts/update.sh --skip-gateway-restart` or the equivalent no-gateway-restart flag; do not refresh the OpenClaw Gateway. Validate: a user message sent immediately before/around compaction never disappears or arrives visibly late; a heartbeat/operator progress message appears once and one durable copy remains after completion/history refresh; internal `NO_REPLY`/memory-flush responses are not rendered as operator chat; multiple spawned/finished/archived subagents make the Agents panel converge to OpenClaw's actual state; refresh/reconnect reconstructs the same visible state. Capture before/after or final screenshots where useful. Report evidence and close the bead only if QA passes.

**Folders Created/Deleted/Modified:**
- `None expected`

**Files Created/Deleted/Modified:**
- `None expected, except test artifacts if needed`

**Status:** ❌ Failed

**Results:** Preconditions complete. After implementation and regression slices landed, orchestrator ran `/home/derrick/.openclaw/workspace/scripts/update.sh --skip-gateway-restart` with `/home/derrick/.openclaw/.env` still set to `NERVE_DEPLOY_BRANCH=workhorse-v4`. The updater confirmed `Nerve branch: workhorse-v4`, synced to `origin/workhorse-v4` at `4456816`, skipped the OpenClaw Gateway restart by flag, restarted the Nerve service, and reported `Update Summary: SUCCESS`. Post-update health check at `http://127.0.0.1:3080/health` returned `{"status":"ok","gateway":"ok"}` after the service finished listening. Spawned visible OpenClaw subagent `agent:main:subagent:5eadc554-b930-47e0-8899-93a924955ab9` for the `primary` QA role with instructions to claim `oc-dz8`, use the desktop-control skill and proof screenshots, inspect running Nerve at `http://127.0.0.1:3080`, compare Agents against live OpenClaw truth where practical, verify chat/heartbeat/internal-turn behavior, capture evidence, and close the bead only if QA passes or evidence-limited gaps are documented. QA reported FAIL/BLOCKED on Agents convergence: live `sessions.list {spawnedBy:'agent:main:main', limit:1000}` returned only 4 current spawned children, but running Nerve still rendered 164 session rows after Refresh sessions and hard reload, including old entries such as `2oj5 Windows bytecode E2E repair coder`, `Subagent d2398493`, and `APEX-*` sessions. Evidence lives under `/home/derrick/.openclaw/workspace/.temp/nerve-qa/oc-dz8/`. Chat acceptance was not completed because Agents convergence remained a blocking failure.

---

### Task 8A: Fix Agents Panel QA Failure

**Bead ID:** `oc-z2r`  
**SubAgent:** `primary` (for `coder` workflow role)  
**Role:** `coder`  
**References:** `REF-01`, `REF-06`, `REF-08`  
**Prompt:** On branch `workhorse-v4` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. Use the failed QA evidence from `oc-dz8`: live `sessions.list {spawnedBy:'agent:main:main', limit:1000}` returned 4 current spawned children, but running Nerve still rendered 164 stale session rows after Refresh sessions and hard reload. Investigate why the prior `sessionReconciliation.ts` fix did not affect the rendered Agents panel source of truth, then fix the remaining Agents panel/session list path so it converges to live OpenClaw session truth. Keep the fix rollback-friendly as a separate commit, add or adjust targeted tests, run validation and `npm run build`, push `origin/workhorse-v4`, and close the bead only when complete.

**Folders Created/Deleted/Modified:**
- `src/features/sessions/`
- `src/hooks/`
- `server/routes/`

**Files Created/Deleted/Modified:**
- `Pending retry investigation`

**Status:** ⏳ In Progress

**Results:** Created after real-session QA found the first Agents reconciliation fix was insufficient. Spawned visible OpenClaw subagent `agent:main:subagent:156a9c15-ff2f-4766-b215-3ed61301a4ee` for the `primary` coder role with instructions to claim `oc-z2r`, inspect the real QA evidence, find the actual source feeding the stale `164 active sessions` Agents panel, fix it as a separate rollback-friendly commit, add targeted tests, run validation/build, push `origin/workhorse-v4`, update bead notes, and close `oc-z2r` only when complete.

---

### Task 9: Independent Audit and Wrap-up

**Bead ID:** `oc-2cg`  
**SubAgent:** `primary` (for `auditor` workflow role)  
**Role:** `auditor`  
**References:** `REF-01`, `REF-02`, `REF-05`, `REF-06`, `REF-07`, `REF-08`  
**Prompt:** On branch `workhorse-v4` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. Inspect `REF-01`, `REF-06`, and `REF-07` as proof screenshots and audit against `REF-08`. Independently audit the diff, bead notes, plan, tests, build output, and QA evidence. Confirm that stale/dead Agents entries are fixed without hiding live agents, duplicate live heartbeat/message rendering is prevented, final posted heartbeat/message content is preserved after completion/history refresh, optimistic user messages survive compaction/refetch ordering, internal compaction/no-reply turns are filtered from operator chat, and refresh/reconnect reconstructs trustworthy state. Verify commits are on `workhorse-v4` and pushed. Close the bead only if the work is actually done; otherwise report exact gaps.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-08-07-workhorse-v4-agent-list-and-duplicate-replies.md`

**Status:** ⏳ Pending

**Results:** Not started.

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:** Active plan, Beads, and a refreshed `workhorse-v4` branch based on latest upstream `master`. The plan was expanded after Derrick supplied GPT-assisted debugging context that reframed the symptoms as one state identity/reconciliation problem, then modified to add an upstream refresh ceremony before prioritizing the rest of the bug work. The ceremony completed and produced a pushed `workhorse-v4` baseline containing only the still-needed protocol-v4 gateway handshake patch plus plan/checkpoint documentation.

**Reference Check:** `REF-01`, `REF-06`, and `REF-07` inspected and captured in plan. `REF-05` inspected for the required no-gateway-restart flag. `REF-08` incorporated as the main investigation and acceptance framing.

**Commits:**
- `5d15105` - Carry protocol v4 gateway handshake to workhorse-v4
- `8c32b92` - Document workhorse v4 ceremony checkpoint
- `28f6780` - Record workhorse v4 checkpoint commit
- `f025046` - Record verified workhorse v4 checkpoint
- `ad01882` - Fix chat message identity merging
- `bf5dddc` - Filter internal chat control turns
- `4456816` - Prune stale spawned session supplements

**Lessons Learned:** Pending execution.

---

*Completed on Pending*
