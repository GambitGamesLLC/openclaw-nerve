---
plan_id: plan-2026-03-17-inline-budget-and-subagent-forwarding-followup
bead_ids:
  - nerve-2iz
  - nerve-s7s
---
# gambit-openclaw-nerve

**Date:** 2026-03-17  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Lower Nerve’s inline image context ceiling to 32 KB so inline vision stays useful without ballooning chat context, then trace why inline attachment data still does not reach subagents even when forwarding is enabled.

---

## Overview

Live testing confirmed the current inline guardrail is preventing catastrophic raw-image injection, but the configured inline context cap is still too large for comfortable model-context use. The current runtime metadata showed `contextSafetyMaxBytes=128000` and the successful adaptive-shrink result landed at `base64Bytes=127252`, which is still expensive enough to noticeably inflate the active session.

The immediate change requested by Derrick is to tighten the upper bound to 32 KB. Earlier source inspection already showed the relevant source-side knob as `NERVE_INLINE_IMAGE_CONTEXT_MAX_BYTES`, and the deployment pattern in this repo indicates the effective value is likely enforced through `workspace/scripts/restore.sh` into the repo/server `.env` defaults. So this slice needs both source/config changes and restore-managed default changes.

A second live finding is that even with `policy.forwardToSubagents=true`, the spawned subagent still received no image attachment and no upload metadata. Prior work fixed the Nerve UI policy generation so inline attachments can be marked forwardable, but the handoff still appears broken downstream. After the cap change lands, we should trace whether that gap is in Nerve message construction, OpenClaw routing, or subagent session handoff semantics.

---

## Tasks

### Task 1: Lower inline image context cap to 32 KB and align restore-managed defaults

**Bead ID:** `nerve-2iz`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-2iz` at start with `bd update nerve-2iz --status in_progress --json` and close it on completion with `bd close nerve-2iz --reason "Done" --json` if fully resolved. Lower the inline image context-safe ceiling from 128000 bytes to 32768 bytes in the actual source/config path, and update any restore-managed env/default wiring so `restore.sh` does not overwrite the new intended value. Verify where `inlineTargetBytes` is derived and ensure it still tracks the new cap sensibly. Run the targeted tests or checks needed to prove the new 32 KB cap is surfaced correctly in runtime/UI metadata. Report exact files changed, exact constants/env keys touched, and the verification commands/results.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/`
- `/home/derrick/.openclaw/workspace/scripts/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-inline-budget-and-subagent-forwarding-followup.md`
- source/config files to be determined by implementation
- `/home/derrick/.openclaw/workspace/scripts/restore.sh` if restore-managed defaults are involved

**Status:** ✅ Complete

**Results:** Completed in `projects/gambit-openclaw-nerve` plus the restore-managed workspace script. I lowered the source defaults for `NERVE_INLINE_IMAGE_CONTEXT_MAX_BYTES` from `128000` to `32768` in both `server/lib/config.ts` and `src/features/chat/uploadPolicy.ts`, added the documented env example line in `.env.example`, and updated the live repo `.env` to `NERVE_INLINE_IMAGE_CONTEXT_MAX_BYTES='32768'` so the current runtime picks up the new cap immediately. I also updated `~/workspace/scripts/restore.sh` so future restore runs will continue enforcing `NERVE_INLINE_IMAGE_CONTEXT_MAX_BYTES=32768` instead of leaving the old/default behavior in place.

`inlineTargetBytes` still derives in `src/features/chat/InputBar.tsx` as `Math.floor(uploadConfig.inlineImageContextMaxBytes * 0.9)`, so with the new 32 KB cap it naturally tracks to `29491` bytes (~28.8 KB) without extra code changes. Targeted verification passed with `HOST=127.0.0.1 npm test -- server/lib/config.test.ts server/routes/upload-config.test.ts src/features/chat/InputBar.test.tsx src/features/chat/MessageBubble.uploadSummary.test.tsx` (`4` files, `66` tests passed). Those checks proved the runtime config surface now reports `inlineImageContextMaxBytes=32768`, the client passes `contextMaxBytes: 32768` and `contextTargetBytes: 29491` into compression, and the UI metadata renders `cap 32.0 KB / target 28.8 KB`.

---

### Task 2: Trace missing inline attachment forwarding into subagents

**Bead ID:** `nerve-s7s`  
**SubAgent:** `research`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-s7s` at start with `bd update nerve-s7s --status in_progress --json` and close it on completion with `bd close nerve-s7s --reason "Done" --json` if fully resolved. Investigate why a main-session message with inline upload metadata and `policy.forwardToSubagents=true` still arrives to a spawned subagent with no attachment object and no image metadata. Use the existing repo context plus any relevant local OpenClaw docs/source references to determine whether the missing handoff is expected current platform behavior, a Nerve payload-construction gap, or a runtime routing bug outside this repo. Report the exact boundary where the data disappears and recommend the next safe implementation slice.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- repo/docs paths as needed for investigation

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-inline-budget-and-subagent-forwarding-followup.md`
- no code changes required; this slice ended as runtime-bound investigation only

**Status:** ✅ Complete

**Results:** Investigation completed with no Nerve code changes required.

What actually happened:
- Confirmed Nerve still sends the upload only to the **main session** via `src/features/chat/operations/sendMessage.ts`: it appends `<nerve-upload-manifest>…</nerve-upload-manifest>` into the outgoing user text and passes image bytes in `chat.send.attachments` for that same main-session turn.
- Confirmed the Nerve subagent launcher in `src/contexts/SessionContext.tsx` does **not** forward prior-turn attachments or manifest data. It sends a fresh plain-text `[spawn-subagent]` command to `agent:main:main` containing only `task`, optional `label`, `model`, and `thinking`.
- Cross-checked local OpenClaw runtime source. `projects/openclaw/src/agents/subagent-spawn.ts` and `projects/openclaw/src/agents/tools/sessions-spawn-tool.ts` support subagent attachments only when the caller explicitly supplies `sessions_spawn.attachments` / `spawnSubagentDirect(...attachments...)`.
- Searched the local OpenClaw source/docs for `forwardToSubagents`, `nerve-upload-manifest`, and `uploadAttachments`; there is currently no runtime consumer that reads Nerve’s forwarding-policy metadata and re-materializes those uploads into the spawned child session.

Exact boundary where data disappears:
- The attachment bytes + metadata survive the **browser → main-session** handoff.
- They disappear at the **main-agent/subagent spawn boundary**: when the main session spawns a child, the runtime builds a new subagent task message from the requested task text and optional explicit `sessions_spawn.attachments`, but it does not inspect or inherit the parent turn’s Nerve upload manifest or `policy.forwardToSubagents` flag.

Conclusion:
- This is **expected current platform behavior / an unimplemented runtime handoff feature outside this repo**, not a remaining Nerve payload-construction bug in `gambit-openclaw-nerve`, and not evidence of a lower-level routing corruption bug.
- Nerve is currently only expressing forwarding intent in metadata visible to the main session. The OpenClaw runtime has explicit attachment plumbing for spawned subagents, but nothing bridges Nerve upload-manifest intent into that attachment channel automatically.

Recommended next safe implementation slice:
1. Implement the bridge in OpenClaw runtime (not Nerve): when a main-session turn spawns a subagent, inspect the triggering turn for forwardable upload-manifest entries and explicitly map them into `sessions_spawn.attachments` / `spawnSubagentDirect.attachments`.
2. Start with a narrow image-only slice for inline uploads marked `policy.forwardToSubagents=true`, preserving existing opt-in semantics and byte limits.
3. Add end-to-end coverage proving a Nerve-origin inline image reaches the child as explicit spawned attachments (receipt present + materialized files), while non-forwarded uploads remain excluded.
4. Only after that bridge exists should Nerve grow any UX that promises actual subagent attachment delivery beyond “intent recorded.”

---

## Final Results

**Status:** In Progress

**What We Built:**
- Planned the requested follow-up slice.
- Completed Task 1 / bead `nerve-2iz`: lowered the source and restore-managed inline image context cap to 32 KB via `NERVE_INLINE_IMAGE_CONTEXT_MAX_BYTES=32768`.
- Verified `inlineTargetBytes` still derives from `Math.floor(uploadConfig.inlineImageContextMaxBytes * 0.9)`, which now yields `29491` bytes (~28.8 KB), and confirmed the new cap is surfaced in runtime/UI metadata.
- Traced the subagent-forwarding gap to the runtime boundary between the main-session turn and `sessions_spawn` / `spawnSubagentDirect`, where Nerve-origin upload metadata is no longer consulted.
- Created execution beads:
  - `nerve-2iz`
  - `nerve-s7s`

**Commits:**
- None yet.

**Lessons Learned:**
- The current 125 KB inline ceiling is safe against the old catastrophic failure mode but still too expensive as an everyday prompt payload.
- `policy.forwardToSubagents=true` currently records forwarding intent for the main-session turn, but today there is no OpenClaw runtime bridge that converts that intent into explicit spawned-subagent attachments.

---

*Created on 2026-03-17*