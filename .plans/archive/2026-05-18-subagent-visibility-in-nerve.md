# Gambit OpenClaw Nerve

**Date:** 2026-05-18  
**Status:** In Progress  
**Agent:** Byte 🐈‍⬛

---

## Goal

Determine what changes Nerve would need so spawned subagents reliably appear in the Nerve UI across all supported spawn modes.

---

## Overview

This is an investigation-first pass focused on the visibility pipeline rather than implementation. The main question is whether Nerve is only rendering a subset of sessions/subagents because of backend query filters, session-kind assumptions, missing event wiring, or UX/state logic that excludes certain spawn modes.

The plan is to trace the full path from spawn creation to UI display: how subagents/sessions are created, how Nerve fetches or subscribes to them, what metadata distinguishes persistent thread sessions vs one-shot runs vs ACP sessions, and where those categories may be dropped. Once that map is clear, we can propose the smallest reliable change set to guarantee visibility, plus any validation coverage needed to keep it from regressing.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Nerve session/subagent list UI and related data flow | `/workspace/projects/gambit-openclaw-nerve/src/contexts/SessionContext.tsx` |
| `REF-02` | OpenClaw session/subagent spawning and listing behavior | `/workspace/projects/openclaw/src/gateway/session-utils.ts` |

---

## Tasks

### Task 1: Trace current Nerve subagent/session visibility pipeline

**Bead ID:** `oc-8pe`  
**SubAgent:** `primary` (for `research` workflow role)  
**Role:** `research`  
**References:** `REF-01`, `REF-02`  
**Prompt:** Inspect the Nerve repo and the relevant OpenClaw session/subagent APIs. Identify every codepath that determines whether a spawned subagent/session appears in the Nerve UI. Include any filters by session kind, runtime, mode, label, thread state, activity state, or event source. Claim the bead on start. Do not change code. Produce a concise diagnosis with exact files/functions and note which spawn modes are currently included vs excluded.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-05-18-subagent-visibility-in-nerve.md`

**Status:** ✅ Complete

**Results:** Traced the visibility pipeline. The primary gates are `src/contexts/SessionContext.tsx` (`listAuthoritativeSessions()` and event-driven refresh), `src/features/sessions/sessionTree.ts` (sidebar lineage filtering), `src/features/sessions/sessionKeys.ts` (recognized key shapes and parent inference), and `/workspace/projects/openclaw/src/gateway/session-utils.ts` plus `/workspace/projects/openclaw/src/gateway/sessions-patch.ts` (exact `spawnedBy` semantics and subagent-only support). Native `agent:<id>:subagent:<uuid>` sessions are modeled end-to-end; ACP `agent:<id>:acp:<uuid>` and some persistent/thread-bound child session modes are not first-class and can be excluded or become fragile when lineage depends on unrecognized key shapes or missing parent metadata. Hidden follow-up: guaranteeing visibility for all spawned sessions likely requires coordinated Nerve + OpenClaw changes rather than a one-file UI fix.

---

### Task 2: Propose the minimal reliable Nerve changes

**Bead ID:** `oc-0ar`  
**SubAgent:** `primary` (for `research` workflow role)  
**Role:** `research`  
**References:** `REF-01`, `REF-02`  
**Prompt:** Based on the diagnosis, propose the minimal change set needed so subagents always show up in Nerve regardless of supported spawn mode. Cover backend/API, frontend query/state, and real-time update considerations. Include validation ideas and call out any ambiguity about intended UX (for example, whether short-lived completed runs should remain visible, and for how long). Claim the bead on start. Do not change code.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-05-18-subagent-visibility-in-nerve.md`

**Status:** ✅ Complete

**Results:** Proposed a minimal pragmatic fix and a cleaner long-term model. Minimal path: expose explicit parent linkage in OpenClaw `sessions.list`, persist that linkage for ACP/custom children, and make Nerve recurse child discovery rather than only querying children of top-level roots. Most important files called out were `/workspace/projects/openclaw/src/gateway/session-utils.types.ts`, `/workspace/projects/openclaw/src/gateway/session-utils.ts`, `/workspace/projects/openclaw/src/gateway/sessions-patch.ts`, `/workspace/projects/openclaw/src/auto-reply/reply/commands-acp/lifecycle.ts`, and `/workspace/projects/gambit-openclaw-nerve/src/contexts/SessionContext.tsx`. Key product constraint: true guarantee is impossible for `cleanup:"delete"` short-lived runs unless product semantics change to retain tombstones/recent-run records or delay deletion long enough for UI visibility.

---

### Task 3: Run a live Nerve visibility check with a Nerve-friendly ephemeral subagent

**Bead ID:** `oc-e2t`  
**SubAgent:** `primary` (for `coder` workflow role)  
**Role:** `coder`  
**References:** `REF-01`, `REF-02`  
**Prompt:** Spawn a native OpenClaw subagent with the settings most likely to be Nerve-friendly for visibility testing: `runtime:"subagent"`, `mode:"run"`, `cleanup:"keep"`, plus a human-recognizable label. The subagent should do a tiny harmless task and report back. Record whether Derrick can see it in Nerve and use that result to refine the band-aid recommendation for agent instructions.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-05-18-subagent-visibility-in-nerve.md`

**Status:** ✅ Complete

**Results:** Spawned a live test child with `runtime:"subagent"`, `mode:"run"`, `cleanup:"keep"`, label `nerve-visibility-check-native-run-keep`, and session key `agent:main:subagent:4c6cbaa7-29ac-46fa-8f15-71b3c854f42a`. The subagent completed successfully and returned a short identity summary. Remaining external validation is Derrick's observation of whether that session appeared in Nerve and whether it nested under the expected parent.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** A traced diagnosis of why some spawned sessions fail to appear in Nerve, plus a recommended change set to make visibility reliable across supported spawn modes.

**Reference Check:** `REF-01` and `REF-02` were both used. The diagnosis ties Nerve visibility to explicit session discovery, lineage inference, and sidebar filtering, then connects that to OpenClaw’s current `sessions.list` row shape and subagent-only parent-link semantics.

**Commits:**
- Pending

**Lessons Learned:** The real issue is not just UI filtering. Nerve already knows how to place arbitrary child sessions when explicit parent linkage exists; the larger gap is that OpenClaw does not consistently expose/persist that linkage for all spawned child types, especially ACP. Also, `cleanup:"delete"` cannot be made literally guaranteed without a retention/tombstone product decision.

---

*Completed on 2026-05-18*
