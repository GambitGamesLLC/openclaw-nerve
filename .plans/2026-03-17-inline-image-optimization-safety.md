---
plan_id: plan-2026-03-17-inline-image-optimization-safety
bead_ids:
  - Pending
  - nerve-98y
  - nerve-giy
  - nerve-718
---
# gambit-openclaw-nerve

**Date:** 2026-03-17  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Extend the new upload optimization/safety work so inline image uploads no longer bypass the guardrails and blow up model context.

---

## Overview

Today’s follow-up confirmed that the completed optimization slice only applies to file-reference image artifacts. Inline image uploads still follow the old path, which means a large image can be injected into model-facing payloads without the resize/recompression protections added for file-reference mode. Derrick reproduced the practical consequence immediately: context jumped back to roughly 287k and the session died.

This slice should close that gap without disturbing the parts of the new upload flow that already work. The safest approach is to trace the inline-image descriptor/build path, identify where inline payloads are assembled for `chat.send`, and apply equivalent optimization or policy gating before model-facing payload construction. The implementation may reuse the optimizer pipeline directly, or may choose a different inline-specific strategy if that produces a cleaner payload contract, but the end result must be that oversized inline images no longer enter model context unbounded.

We also need to preserve observability. Whatever safety path we add should make it visible in metadata or UI/state whether an inline upload was optimized, transformed, downgraded to file-reference mode, or blocked. After implementation, we should run a focused live verification using Nerve UI with a deliberately large image so we can confirm the context-budget behavior is materially improved before calling the slice done.

---

## Tasks

### Task 1: Trace inline image payload path and define the safest insertion point

**Bead ID:** `nerve-98y`  
**SubAgent:** `primary`
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, inspect the full inline-image upload path from staging through descriptor generation to `chat.send`, identify exactly where oversized inline images currently bypass optimization, and recommend the safest insertion point for inline guardrails. Claim the bead at start and close it at completion.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- repo files as needed during investigation

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-inline-image-optimization-safety.md`
- repo files as needed during investigation

**Status:** ✅ Complete

**Results:** Traced the full inline path and identified the exact bypass.

- Config enters the client through `server/routes/upload-config.ts` and is loaded in `src/features/chat/InputBar.tsx:220-249`.
- Staging happens in `src/features/chat/InputBar.tsx:370-434` via `processFiles()`, which chooses `inline` vs `file_reference` with `getDefaultUploadMode()` from `src/features/chat/uploadPolicy.ts`.
- Inline-only pre-send checks are currently limited to the raw file-size guardrail from `getInlineModeGuardrailError()` (`src/features/chat/uploadPolicy.ts`) and the mode-switch/send checks in `src/features/chat/InputBar.tsx:480-497` and `624-631`.
- On send, the branch in `src/features/chat/InputBar.tsx:641-650` is the split point:
  - `inline` calls `buildInlineAttachment()` (`530-551`), which only runs client-side `compressImage()` from `src/features/chat/image-compress.ts` and returns base64 image bytes.
  - `inline` then calls `buildInlineDescriptor()` (`553-569`), which embeds that same base64 into `descriptor.inline.base64` and records `base64Bytes`.
  - `file_reference` calls `buildFileReferenceDescriptor()` (`571-613`), which is the only path that invokes `optimizeFileReference()` and therefore `/api/upload-optimizer`.
- The optimization pipeline itself lives in `server/lib/upload-optimizer.ts:92-145` and is only reached from `server/routes/upload-optimizer.ts` via the file-reference flow. It resizes/re-encodes local-path images with Sharp and emits optimized artifact metadata.
- Payload assembly happens in `src/features/chat/operations/sendMessage.ts:43-57` and `109-135`:
  - `appendUploadManifest()` serializes descriptors into `<nerve-upload-manifest>...</nerve-upload-manifest>`.
  - `sanitizeUploadDescriptor()` may blank `descriptor.inline.base64` in the manifest text when `exposeInlineBase64ToAgent` is false, but this does **not** affect RPC attachments.
  - `sendChatMessage()` still sends inline images as `rpcParams.attachments = images.map({ mimeType, content })` (`128-133`), where `content` is the inline base64 produced earlier.

**Exact bypass:** oversized inline images bypass the new optimization pipeline at the `handleSend()` inline branch in `src/features/chat/InputBar.tsx:641-646`. That branch never calls `buildFileReferenceDescriptor()` or `/api/upload-optimizer`; it directly converts the staged file into base64 and hands those bytes to `chat.send` attachments. File-reference images get Sharp-based resize/recompression and derivative cleanup metadata; inline images do not.

**Safest insertion point:** add inline guardrails in the client send-preparation layer immediately before `inlineAttachments.push()` / `descriptors.push()` in the inline branch of `src/features/chat/InputBar.tsx:641-646` (most likely by replacing `buildInlineAttachment()` with a shared inline-preparation helper that can enforce dimension/byte limits and optionally reuse the optimizer/fallback strategy).

Why this is the safest spot:
- It is the last place where the original `File` object, chosen upload mode, and upload config are all available together.
- It runs before base64 is copied into both model-facing channels: `images[]` for RPC attachments and `descriptor.inline.base64` for the manifest.
- It keeps mode-specific policy local to the existing branch point instead of trying to retrofit safety after payload construction.
- Later hooks like `sendChatMessage()` are too late for true optimization because they only see already-encoded strings, not the source file/local path needed by the current Sharp pipeline.
- Server-only interception would also be too late to prevent the client from assembling and transmitting the large inline attachment payload in the first place.

**Follow-on implementation implication:** Task 2 should introduce an inline preparation path that either (a) reuses the optimizer/fallback logic before inline bytes are assembled, or (b) blocks/downgrades oversized inline images to file-reference mode with explicit metadata/UI feedback. No fix was implemented in this task.

---

### Task 2: Implement inline image optimization/safety behavior

**Bead ID:** `nerve-giy`  
**SubAgent:** `coder`
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, implement the approved inline-image safety/optimization path so large inline images no longer blow up model context. Reuse the existing optimizer pipeline when appropriate, add env/config/test coverage, surface enough metadata to debug what happened to each image, and preserve the existing two-mode upload UX unless a safer fallback is required. Claim the bead at start and close it at completion.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- repo files as needed during implementation
- temp/cache paths as needed by implementation

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-inline-image-optimization-safety.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/InputBar.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/MessageBubble.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/types.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/uploadPolicy.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/InputBar.test.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/MessageBubble.uploadSummary.test.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/server/lib/config.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/server/lib/config.test.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/server/routes/upload-config.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/server/routes/upload-config.test.ts`

**Status:** ✅ Complete

**Results:** Implemented a scoped inline-image context-safety layer in `src/features/chat/InputBar.tsx` at the exact send-prep branch identified in Task 1.

- Added a second inline image guardrail that evaluates the compressed inline payload immediately before inline attachments/descriptors are pushed, instead of relying only on the raw-file inline cap.
- Added new env/config controls and client exposure for:
  - `NERVE_INLINE_IMAGE_CONTEXT_MAX_BYTES` (default `128000`)
  - `NERVE_INLINE_IMAGE_AUTO_DOWNGRADE_TO_FILE_REFERENCE` (default `true`)
- Inline images now behave as follows during send prep:
  - safe compressed images still go out inline
  - oversized compressed inline images auto-downgrade to file-reference mode when `file_reference` is enabled and a resolvable local path exists
  - downgraded images reuse the existing file-reference optimizer path rather than inventing a second derivative path
  - images that still exceed the inline context budget without a safe fallback are blocked with a composer error instead of being sent into model-facing payloads
- Added descriptor-level preparation/debug metadata so the system can distinguish inline-ready, inline-optimized, file-reference-ready, and downgraded attachments.
- Updated the upload summary UI so optimistic/user messages now show debug badges and details for inline optimization, auto file-reference downgrade, inline payload bytes vs cap, and file-reference optimization deltas.
- Kept the existing file-reference optimization path intact; no regression to the Sharp-based server optimizer flow was introduced.

**Verification:**
- `npm test -- --run src/features/chat/InputBar.test.tsx src/features/chat/MessageBubble.uploadSummary.test.tsx src/features/chat/uploadPolicy.test.ts src/features/chat/operations/sendMessage.test.ts server/routes/upload-config.test.ts server/lib/config.test.ts`
- `npx eslint src/features/chat/InputBar.tsx src/features/chat/MessageBubble.tsx src/features/chat/types.ts src/features/chat/uploadPolicy.ts server/lib/config.ts server/routes/upload-config.ts src/features/chat/InputBar.test.tsx src/features/chat/MessageBubble.uploadSummary.test.tsx server/routes/upload-config.test.ts server/lib/config.test.ts`

**Notes:**
- The repo-wide `npm run lint` still reports unrelated pre-existing failures outside this slice, so targeted `npx eslint ...` was used to verify the changed files cleanly.
- A live end-to-end UI pass with a deliberately large image is still required in Task 3 to confirm the real runtime context-budget behavior.

---

### Task 3: Live-verify inline image behavior with a large test image

**Bead ID:** `nerve-718`  
**SubAgent:** `primary`
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, perform a live verification pass for the inline-image safety work using a deliberately large test image in Nerve UI. Confirm the image no longer injects an unbounded payload into model context, record observed optimization/fallback behavior, and verify the user-visible experience is sane. Claim the bead at start and close it at completion.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- repo/runtime inspection paths as needed during verification

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-inline-image-optimization-safety.md`
- repo files only if a safe verification-time fix is required

**Status:** ⚠️ Partial

**Results:** Live operator verification produced the expected safety behavior for the original failure mode: the same large inline image no longer reached model context unbounded. Instead, Nerve blocked send with a clear composer error: `"Chip_With_Drones_Cute.png" exceeded the inline context-safe budget after compression (126 KB > 125 KB). It was blocked because file-reference fallback is unavailable for this attachment.` This confirms the new inline guardrail works and prevents context-window blowups. The remaining gap is fallback coverage: for at least this browser/webchat-origin attachment path, Nerve could not auto-downgrade to `file_reference`, so the UX is fail-closed rather than seamless auto-recovery. Next slice should add a browser-safe staging/fallback path so oversized inline images can be converted into file-reference uploads even when no reusable local file path is available.

---

## Final Results

**Status:** ⏳ Pending

**What We Built:** Pending.

**Commits:**
- Pending.

**Lessons Learned:** Pending.

---

*Created on 2026-03-17*