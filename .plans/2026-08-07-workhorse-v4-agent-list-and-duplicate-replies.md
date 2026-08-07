# Nerve Workhorse v4 State Reconciliation Bugs

**Date:** 2026-08-07  
**Status:** Blocked  
**Last Updated:** 2026-08-07 14:55 EDT  
**Blocked Reason:** Upstream refresh ceremony completed; waiting for Derrick to re-examine the baseline and choose/confirm the next bug-prioritization direction before starting Task 2.
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

**Results:** Bead created and unblocked. Execution started after Derrick confirmed `execute`. Spawned visible OpenClaw subagent `agent:main:subagent:2f8591ee-dffc-46aa-a738-3b3407d84b76` for the `primary` research role. Subagent completed the ceremony and closed `oc-bys`. `workhorse-v4` was rebuilt from latest `upstream/master` `312e273` and pushed to `origin/workhorse-v4` at `5d15105`. The only carried-forward `workhorse-v3`/`workhorse-v2` patch was the protocol-v4 gateway handshake because upstream `master` still negotiates protocol 3 while upstream `next` contains the same protocol-v4 direction. The older `workhorse-v3` chat-preservation patches were deferred because upstream `next` now has a larger chat runtime/reducer/replay-buffer line that likely supersedes or conflicts with component-level preservation patches. No stale Agents pruning fix was found in `workhorse-v3`. Targeted vitest for `server/lib/gateway-rpc.test.ts` and `src/hooks/useWebSocket.test.ts` passed, and `npm run build` passed. The remaining blocker is Derrick's requested checkpoint before prioritizing the rest of the bug plan.

---

### Task 2: Branch and Investigation Baseline

**Bead ID:** `oc-vcz`  
**SubAgent:** `primary` (for `research` workflow role)  
**Role:** `research`  
**References:** `REF-01`, `REF-02`, `REF-03`, `REF-04`, `REF-05`, `REF-06`, `REF-07`, `REF-08`  
**Prompt:** On branch `workhorse-v4` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. This task must wait until Task 1's upstream refresh ceremony has completed and Derrick has re-examined the situation. Inspect `REF-01`, `REF-06`, and `REF-07` as proof screenshots. Treat `REF-08` as the primary investigation framing. Investigate Nerve's authoritative session/message history source, full history/session refetch triggers, optimistic-message lifecycle, WebSocket/live gateway event handling, heartbeat event persistence, compaction/checkpoint handling, tool/system/internal event rendering filters, and Agents panel state derivation/pruning. Determine whether normal assistant messages, heartbeat messages, system/compaction messages, tool events, and user messages have stable OpenClaw IDs/types/source metadata and whether Nerve merges by stable identity or by content/timestamp/index. Compare `workhorse-v3`, `workhorse-v2`, and `master` when useful. Do not make code changes. Report files/functions implicated, root-cause hypothesis, suggested reducer/adapter-level fixes, targeted tests, and risks. Do not close the bead unless the investigation is complete.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-08-07-workhorse-v4-agent-list-and-duplicate-replies.md`

**Status:** ⏳ Pending, waiting on checkpoint

**Results:** Earlier draft branch `workhorse-v4` was created locally from `workhorse-v3`, but Derrick requested the final `workhorse-v4` baseline be rebuilt or updated from latest upstream `master` first. Task 1 completed that ceremony. Investigation is now technically unblocked in Beads, but intentionally paused until Derrick re-examines the ceremony result and confirms the next prioritization direction.

---

### Task 3: Implement State Reconciliation Fixes

**Bead ID:** `oc-324`  
**SubAgent:** `primary` (for `coder` workflow role)  
**Role:** `coder`  
**References:** `REF-01`, `REF-02`, `REF-05`, `REF-06`, `REF-07`, `REF-08`  
**Prompt:** On branch `workhorse-v4` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. Inspect `REF-01`, `REF-06`, and `REF-07` as proof screenshots and use `REF-08` as the required behavior framing. Implement focused reducer/adapter/source-of-truth fixes for stale/dead Agents entries, duplicate live heartbeat/message rendering, final posted message loss, delayed/reordered optimistic user messages during compaction/history refresh, and internal `NO_REPLY` or memory-flush turns leaking into operator chat. Preserve legitimate realtime streaming from `workhorse-v3`; avoid arbitrary delays and component-specific hacks unless the investigation proves the component owns the bug. Add or update focused tests for stable message identity, optimistic/live/history merges, heartbeat persistence, internal event filtering, out-of-order event protection, and Agents reconciliation/pruning. Run relevant automated validation, including at least targeted tests and `npm run build` unless a blocker is documented. Commit and push the implementation to `origin/workhorse-v4` unless blocked. Do not run the workspace updater without `--skip-gateway-restart` / `--no-gateway-restart`.

**Folders Created/Deleted/Modified:**
- `src/`
- `server/`

**Files Created/Deleted/Modified:**
- `Pending investigation`

**Status:** ⏳ Pending

**Results:** Not started.

---

### Task 4: Real Session and Visual QA on Running Nerve

**Bead ID:** `oc-dz8`  
**SubAgent:** `primary` (for `qa` workflow role)  
**Role:** `qa`  
**References:** `REF-01`, `REF-05`, `REF-06`, `REF-07`, `REF-08`  
**Prompt:** On branch `workhorse-v4` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. Inspect `REF-01`, `REF-06`, and `REF-07` as proof screenshots and use `REF-08` for acceptance behavior. Verify the implemented fixes in the highest-fidelity running Nerve environment available, using a real OpenClaw session when practical. Use desktop-control screenshot workflow when direct CLI/programmatic checks are insufficient. If the installed Nerve must be updated, use `/home/derrick/.openclaw/workspace/scripts/update.sh --skip-gateway-restart` or the equivalent no-gateway-restart flag; do not refresh the OpenClaw Gateway. Validate: a user message sent immediately before/around compaction never disappears or arrives visibly late; a heartbeat/operator progress message appears once and one durable copy remains after completion/history refresh; internal `NO_REPLY`/memory-flush responses are not rendered as operator chat; multiple spawned/finished/archived subagents make the Agents panel converge to OpenClaw's actual state; refresh/reconnect reconstructs the same visible state. Capture before/after or final screenshots where useful. Report evidence and close the bead only if QA passes.

**Folders Created/Deleted/Modified:**
- `None expected`

**Files Created/Deleted/Modified:**
- `None expected, except test artifacts if needed`

**Status:** ⏳ Pending

**Results:** Not started.

---

### Task 5: Independent Audit and Wrap-up

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

**What We Built:** Active plan, Beads, and a refreshed `workhorse-v4` branch based on latest upstream `master`. The plan was expanded after Derrick supplied GPT-assisted debugging context that reframed the symptoms as one state identity/reconciliation problem, then modified to add an upstream refresh ceremony before prioritizing the rest of the bug work. The ceremony completed and produced a pushed `workhorse-v4` baseline containing only the still-needed protocol-v4 gateway handshake patch.

**Reference Check:** `REF-01`, `REF-06`, and `REF-07` inspected and captured in plan. `REF-05` inspected for the required no-gateway-restart flag. `REF-08` incorporated as the main investigation and acceptance framing.

**Commits:**
- `5d15105` - Carry protocol v4 gateway handshake to workhorse-v4
- `8c32b92` - Document workhorse v4 ceremony checkpoint

**Lessons Learned:** Pending execution.

---

*Completed on Pending*
