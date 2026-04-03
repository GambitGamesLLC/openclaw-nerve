---
plan_id: plan-2026-04-03-remove-optimization-from-upload-reference-v2-implementation
bead_ids:
  - nerve-44mg
  - nerve-9flm
  - nerve-rt99
---
# Gambit OpenClaw Nerve — remove optimization from upload/reference v2 implementation

**Date:** 2026-04-03  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Remove image/file optimization behavior from `feature/upload-reference-v2` so the branch cleanly represents canonical attachment/reference behavior only, while preserving direct workspace references, imported canonical staging for external uploads, transcript/history persistence, and subagent forwarding of canonical path-backed attachments.

---

## Overview

The planning pass confirmed that optimization was still materially coupled into the branch through client send-time optimizer calls, post-send cleanup hooks, server routes/libs/config, descriptor metadata, transcript/debug UI, and multiple tests. Derrick explicitly wanted optimization out of this branch so the eventual feature/PR says one simple thing: Nerve attachments resolve to durable canonical workspace references.

Implementation removed the optimizer send/cleanup path first, then shrank the surrounding branch surface so canonical upload/reference behavior is the only story left in the code, config, route wiring, docs, and tests. Focused verification then confirmed the validated dogfood behaviors still hold without any optimization detour.

---

## Tasks

### Task 1: Remove optimizer usage from the attachment path

**Bead ID:** `nerve-44mg`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-44mg` at start with `bd update nerve-44mg --status in_progress --json`, remove optimizer usage from the upload/reference v2 attachment path (client send path, post-send cleanup hooks, and optimizer route wiring) while preserving canonical file-reference behavior, update this plan with exact files touched, and close the bead on completion with `bd close nerve-44mg --reason "Optimizer usage removed from upload/reference v2 attachment path" --json`.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `src/contexts/`
- `server/routes/`
- `server/lib/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/chat/InputBar.tsx`
- `src/contexts/ChatContext.tsx`
- `server/app.ts`
- `server/routes/upload-optimizer.ts` (deleted)
- `server/lib/upload-optimizer.ts` (deleted)
- `.plans/2026-04-03-remove-optimization-from-upload-reference-v2-implementation.md`

**Status:** ✅ Complete

**Results:** Removed the client-side `/api/upload-optimizer` call path from `InputBar`, stopped post-send optimizer cleanup from `ChatContext`, and removed optimizer route/lib wiring from the server app so file-reference attachments now stay canonical end-to-end with no optimization detour.

---

### Task 2: Shrink config, descriptor, UI, and tests to canonical-reference scope

**Bead ID:** `nerve-9flm`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, after Task 1 is clear, claim bead `nerve-9flm` at start with `bd update nerve-9flm --status in_progress --json`, remove optimization-specific config/env surface, descriptor fields, transcript/debug UI, and test expectations so this branch describes canonical-reference behavior only. Update this plan with exact files touched and close the bead on completion with `bd close nerve-9flm --reason "Config, descriptor, UI, and tests shrunk to canonical-reference scope" --json`.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `server/`
- `docs/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/chat/types.ts`
- `src/features/chat/uploadPolicy.ts`
- `src/features/chat/MessageBubble.tsx`
- `src/features/chat/InputBar.test.tsx`
- `src/features/chat/MessageBubble.uploadSummary.test.tsx`
- `src/features/chat/operations/loadHistory.test.ts`
- `src/features/chat/operations/sendMessage.test.ts`
- `server/routes/upload-config.ts`
- `server/routes/upload-config.test.ts`
- `server/routes/gateway.ts`
- `server/routes/gateway.test.ts`
- `server/lib/config.ts`
- `server/lib/config.test.ts`
- `server/lib/subagent-spawn.ts`
- `server/lib/subagent-spawn.test.ts`
- `server/routes/upload-optimizer.test.ts` (deleted)
- `server/lib/upload-optimizer.test.ts` (deleted)
- `docs/CONFIGURATION.md`
- `.plans/2026-04-03-remove-optimization-from-upload-reference-v2-implementation.md`

**Status:** ✅ Complete

**Results:** Removed optimization-only config/env surface, deleted optimization metadata from upload descriptors and forwarding payloads, simplified transcript/debug attachment rendering to canonical/reference concerns, and rewrote tests/docs so the branch describes canonical staged uploads + workspace references only.

---

### Task 3: Verify attachment flow after optimization detachment

**Bead ID:** `nerve-rt99`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, after implementation/testing is done, claim bead `nerve-rt99` at start with `bd update nerve-rt99 --status in_progress --json`, run focused verification proving the branch still supports canonical staged uploads, direct workspace file references, directory context insertion, transcript/history persistence, and subagent forwarding without optimization. Update this plan with exact verification results and close the bead on completion with `bd close nerve-rt99 --reason "Attachment flow verified after optimization detachment" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-03-remove-optimization-from-upload-reference-v2-implementation.md`

**Status:** ✅ Complete

**Results:** Focused verification passed via:
- `npm test -- --run src/features/chat/InputBar.test.tsx src/features/chat/operations/loadHistory.test.ts src/features/chat/operations/sendMessage.test.ts src/features/chat/MessageBubble.uploadSummary.test.tsx server/lib/subagent-spawn.test.ts server/routes/upload-config.test.ts server/routes/gateway.test.ts server/lib/config.test.ts`
  - Result: `8 passed`, `153 passed`.
  - Coverage of the requested behaviors:
    - paperclip/browser uploads still stage into canonical workspace temp references
    - workspace file Add to chat still yields direct workspace file references
    - workspace directory Add to chat still injects structured workspace context into the draft
    - transcript/history still persists and reloads canonical attachment/reference metadata
    - subagent forwarding still emits canonical local-path manifests/attachments without optimization metadata
- `npm run build`
  - Result: passed (`tsc -b`, `vite build`, `build:server`).

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- Removed the optimizer detour from upload/reference v2 so staged browser uploads and workspace path attachments stay canonical file references.
- Removed optimization-specific config, descriptor, forwarding, UI, route, and documentation surface so the branch tells a single canonical-reference story.
- Verified the maintained behaviors Derrick cared about: canonical staged uploads, direct workspace path references, directory draft context insertion, transcript/history persistence, and canonical subagent forwarding semantics.

**Commits:**
- Current branch head during verification: `9a5b03a` (`feature/upload-reference-v2`)
- No new commit was created in this subagent run.

**Lessons Learned:**
- The canonical attachment model gets much easier to reason about once derivative artifact handling and cleanup are no longer mixed into the same branch.
- Subagent forwarding is cleaner when descriptor naming comes from canonical attachment intent rather than temp derivative artifacts.

---

*Planned on 2026-04-03 · Completed on 2026-04-03*