---
plan_id: plan-2026-03-17-attachment-aware-subagent-spawn
bead_ids:
  - nerve-xaa
  - nerve-dqc
  - nerve-u2h
---
# Gambit OpenClaw Nerve — attachment-aware subagent spawn

**Date:** 2026-03-17  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Update Nerve’s subagent launch path so uploaded attachments, especially images, can use the existing OpenClaw `sessions_spawn` attachment-forwarding support already present for `runtime="subagent"` in the currently pinned OpenClaw release.

---

## Overview

Today’s research narrowed the problem sharply. Upstream OpenClaw already supports attachment/image forwarding for normal `sessions_spawn` subagents in the local pinned tag (`v2026.3.8`), so a Nerve-only workaround that bypasses that capability is no longer the preferred path. Upstream Nerve, however, does not appear to have the required integration glue.

The root issue is in Nerve’s spawn flow. The current implementation in `src/contexts/SessionContext.tsx` sends a text control message beginning with `[spawn-subagent]` through `chat.send`, then watches for a new subagent session. That path does not pass attachment payloads into `sessions_spawn`, so uploaded images never reach the child even though the underlying OpenClaw runtime can support it.

Implemented on 2026-03-18: the plain-subagent launch path now goes through a dedicated HTTP bridge at `POST /api/gateway/session-spawn`, which invokes gateway `sessions_spawn` directly with `runtime: "subagent"`. The bridge converts forwardable Nerve upload descriptors into OpenClaw attachment payloads, including reading file-reference uploads from disk and preserving inline base64 uploads. As a compatibility fallback, it also recognizes an embedded `<nerve-upload-manifest>` in the task text, strips that manifest back out of the prompt, and promotes any forwardable descriptors into `sessions_spawn.attachments`. The client-side `SessionContext` spawn flow now calls this route instead of sending the text-only `[spawn-subagent]` control message, while still polling `sessions.list` afterward so the sidebar behavior remains unchanged.

---

## Tasks

### Task 1: Track the overall subagent-spawn integration slice

**Bead ID:** `nerve-xaa`  
**SubAgent:** `primary`  
**Prompt:** Coordinate the Nerve subagent-spawn integration slice so attachment-aware spawning work and its validation stay linked. Keep this epic updated as implementation and validation tasks move.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-17-attachment-aware-subagent-spawn.md`

**Status:** ✅ Complete

**Results:** Epic coordinated the implementation + validation slice through completion: attachment-aware plain-subagent spawning landed, runtime validation succeeded, and the plan now serves as the completed record of that work.

---

### Task 2: Implement attachment-aware Nerve subagent spawn path

**Bead ID:** `nerve-dqc`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-dqc` at start with `bd update nerve-dqc --status in_progress --json`. Replace or augment the current text-only `[spawn-subagent]` launch flow in `src/contexts/SessionContext.tsx` so Nerve can invoke attachment-aware OpenClaw `sessions_spawn` semantics for `runtime="subagent"`, preserving uploaded attachment payloads for spawned children. Preserve existing non-attachment spawn behavior, keep scope tight, add focused tests, update this plan with actual implementation details, and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `server/lib/`
- `server/routes/`
- `src/contexts/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-17-attachment-aware-subagent-spawn.md`
- `server/lib/subagent-spawn.ts`
- `server/lib/subagent-spawn.test.ts`
- `server/routes/gateway.ts`
- `server/routes/gateway.test.ts`
- `src/contexts/SessionContext.tsx`

**Status:** ✅ Complete

**Results:** Replaced the text-only `[spawn-subagent]` launch path with a direct `sessions_spawn` bridge. The new server helper builds attachment-aware spawn args from forwardable upload descriptors, upgrades embedded Nerve upload manifests when present, and leaves non-attachment spawns working through the same codepath. Added focused unit and route coverage plus a successful `npm run build:server` verification pass.

---

### Task 3: Validate end-to-end image forwarding from Nerve to spawned subagent

**Bead ID:** `nerve-u2h`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-u2h` at start with `bd update nerve-u2h --status in_progress --json`. After `nerve-dqc` is complete, run an end-to-end validation that an uploaded image from Nerve reaches the spawned plain subagent with the expected metadata/content behavior. Document exactly what was observed, note any remaining gaps, update this plan with real verification results, and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `.plans/`
- runtime verification paths as needed

**Files Created/Deleted/Modified:**
- `.plans/2026-03-17-attachment-aware-subagent-spawn.md`
- tests/docs only if needed during safe verification

**Status:** ✅ Complete

**Results:** Manual retry succeeded once `sessions_spawn.attachments` was enabled in OpenClaw config and the gateway was restarted. A verification subagent received a real image attachment, visually interpreted the image contents, and separately confirmed the manifest metadata was also visible as prompt text. The child specifically observed a futuristic robotic cat with hovering drones in a neon cyberpunk scene and could distinguish that vision-derived description from manifest-only fields like declared name/MIME/size/processing metadata. Important nuance: the actual delivered file observed by the child was `Chip_With_Drones_Realistic.webp` at 32270 bytes, while the manifest `name` field still said `Chip_With_Drones_Realistic.png`; MIME/container alignment on the actual forwarded artifact was `image/webp`. This task depended on `nerve-dqc`. Validation outcome: attachment forwarding works for the tested manual subagent path.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Implemented the Nerve-side plain-subagent spawn bridge to OpenClaw `sessions_spawn`, including attachment forwarding for opted-in uploads and compatibility parsing for embedded Nerve upload manifests. Manual end-to-end validation confirmed that a spawned subagent can receive a real forwarded image attachment, visually interpret it, and distinguish attachment-derived content from manifest-only prompt text.

**Commits:**
- Pending

**Lessons Learned:** The decisive move was separating plain subagent support from ACP support; once that was clear, the blocker shifted from OpenClaw versioning to Nerve integration. Once Nerve used direct `sessions_spawn` instead of the text control message, both attachment and non-attachment launches could share one tighter codepath.

---

*Planned on 2026-03-17*