---
plan_id: plan-2026-03-17-inline-manifest-base64-leak-investigation
bead_ids:
  - nerve-5gz
  - nerve-137
---
# gambit-openclaw-nerve

**Date:** 2026-03-17  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Determine why Nerve still leaked massive inline image payload data into agent-visible context after the adaptive inline shrink pass succeeded, then fix the leak so inline uploads stay safe without bloating token context.

---

## Overview

The prior slice proved that adaptive browser-side shrinking can reduce a large image to roughly the configured inline context cap and keep the upload in `inline` mode. However, Derrick observed the same practical failure pattern afterward: session compaction around ~294k tokens and loss of continuity. That means "optimized inline succeeded" was not sufficient protection.

Initial inspection points to a likely manifest/context leak rather than a failure of the shrinker itself. The current client send path appends a `<nerve-upload-manifest>` block to the message text via `appendUploadManifest()` in `src/features/chat/operations/sendMessage.ts`. `sanitizeUploadDescriptor()` only blanks `descriptor.inline.base64` when inline-base64 exposure is disabled, but it does **not** strip `inline.previewUrl`, which is a `data:` URL containing the same image payload encoded in base64. In the current repo `.env`, `NERVE_UPLOAD_EXPOSE_INLINE_BASE64_TO_AGENT='true'`, which would additionally expose `inline.base64` directly. Either way, the manifest can still include a huge model-visible blob even when the inline payload was "optimized".

So the likely root cause is not that the browser used the original 8 MB source bytes after shrinking. It is that agent-visible manifest text still includes large inline image bytes (and possibly duplicates them through both `base64` and `previewUrl`). This slice should verify the exact leak path, patch the manifest sanitization/descriptor contract, and re-test the same image flow.

---

## Tasks

### Task 1: Verify the exact inline manifest leak path and enumerate all agent-visible payload surfaces

**Bead ID:** `nerve-5gz`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, inspect the inline upload send path and confirm every place inline image bytes can still reach agent-visible context after adaptive shrinking. Specifically verify the roles of `inline.base64`, `inline.previewUrl`, manifest serialization, optimistic message state, and RPC attachments. Distinguish between optimized bytes and original bytes. Claim the bead at start and close it at completion.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- repo files as needed during investigation

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-inline-manifest-base64-leak-investigation.md`
- repo files as needed during investigation

**Status:** ✅ Complete

**Results:** Verified the exact leak path and closed bead `nerve-5gz`.

Key findings:
- Agent-visible message text includes the upload manifest because `sendChatMessage()` appends `appendUploadManifest(text, uploadPayload)` into the outgoing `message` field in `src/features/chat/operations/sendMessage.ts`.
- RPC image attachments are a separate transport channel; they are sent via `attachments` and are not the same thing as manifest text.
- `inline.base64` is conditionally included in the manifest text when `manifest.exposeInlineBase64ToAgent` is enabled.
- The active leak is broader than that: `sanitizeUploadDescriptor()` strips `inline.base64` only when exposure is disabled, but it does **not** strip `inline.previewUrl`.
- For inline images, `inline.previewUrl` is populated from `attachment.preview`, which is a `data:` URL created from the compressed/optimized inline payload in the browser send-prep path.
- That means the manifest can still embed a large base64-bearing `data:image/...` URL directly into model-visible message text even when `inline.base64` is blanked.
- The leaked payload is the **optimized/shrunk inline payload**, not the original 8 MB source image.
- In the current repo `.env`, `NERVE_UPLOAD_EXPOSE_INLINE_BASE64_TO_AGENT='true'`, which would additionally expose `inline.base64` itself unless changed.

Minimal safe patch surface:
- `src/features/chat/operations/sendMessage.ts`
- `src/features/chat/operations/sendMessage.test.ts`

Recommended implementation:
- extend manifest sanitization to strip `inline.previewUrl` as well as `inline.base64`
- add tests asserting there is no `data:image/` preview URL in appended manifest text by default
- keep dimensions/byte counts/outcome metadata intact for debugging
- leave RPC `attachments` transport unchanged, since that channel is separate and required for actual image delivery.

---

### Task 2: Remove inline image byte leakage from the manifest while preserving useful metadata/debug visibility

**Bead ID:** `nerve-137`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, patch the upload manifest/descriptor path so agent-visible message text never includes inline image payload bytes or data URLs unless explicitly intended for a narrowly scoped debug mode. Preserve safe metadata such as dimensions, byte counts, outcomes, and fallback reasons. Add/update tests covering `inline.base64` and `inline.previewUrl` sanitization. Claim the bead at start and close it at completion.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `src/features/chat/operations/`
- `src/features/chat/`
- `server/` if config/docs need adjustment

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-inline-manifest-base64-leak-investigation.md`
- `src/features/chat/operations/sendMessage.ts`
- `src/features/chat/operations/sendMessage.test.ts`
- other repo files as needed

**Status:** ✅ Complete

**Results:** Implemented the minimal safe patch and closed bead `nerve-137`.

Changes made:
- `src/features/chat/operations/sendMessage.ts`
  - tightened `sanitizeUploadDescriptor()` so inline manifest entries always strip `inline.previewUrl`
  - `inline.base64` now remains hidden by default and is only preserved when explicit base64 exposure is enabled
  - non-byte metadata remains intact, including `base64Bytes`, `compressed`, and preparation/debug metadata
- `src/features/chat/operations/sendMessage.test.ts`
  - added coverage asserting no `data:image/...` preview URL leaks into appended manifest text by default
  - asserted inline base64 stays hidden by default
  - asserted useful metadata remains present
  - asserted explicit debug-mode base64 exposure still does not leak `previewUrl`

Targeted verification reported clean:
- `npx vitest run src/features/chat/operations/sendMessage.test.ts`
- `npx eslint src/features/chat/operations/sendMessage.ts src/features/chat/operations/sendMessage.test.ts`
- `npx tsc -p tsconfig.json --noEmit`

Behavior after patch:
- default manifest behavior:
  - `inline.base64` => empty string
  - `inline.previewUrl` => omitted
  - safe metadata remains present
- explicit base64 debug behavior:
  - `inline.base64` => preserved
  - `inline.previewUrl` => still omitted

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- Verified that the compaction-causing leak lived in the agent-visible upload manifest, not in failure of the adaptive shrinker.
- Confirmed the manifest could leak optimized inline image payload bytes through `inline.previewUrl` data URLs, and optionally through `inline.base64` when enabled.
- Patched manifest sanitization so inline preview data URLs are never embedded into agent-visible message text, while keeping useful metadata for debugging.
- Added targeted regression tests to lock that behavior in.

**Commits:**
- Pending.

**Lessons Learned:**
- Safe inline transport is not enough if a parallel text manifest can still serialize the same payload into model-visible context.
- Any manifest sanitizer for binary-bearing descriptors should treat all byte-carrying fields as suspicious, not just the most obvious one.

---

*Created on 2026-03-17*
