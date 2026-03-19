---
plan_id: plan-2026-03-17-adaptive-inline-image-shrinking
bead_ids:
  - nerve-jsf
  - nerve-i0m
  - nerve-ak9
---
# gambit-openclaw-nerve

**Date:** 2026-03-17  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Add adaptive in-browser inline image shrinking so oversized inline uploads iteratively reduce dimensions until they fit the model-safe payload budget, with file-reference fallback only as a secondary path.

---

## Overview

The previous slice fixed the dangerous failure mode: oversized inline images no longer explode model context. Instead, they are blocked once the compressed inline payload exceeds the configured context-safe budget. Live testing with the original large image proved that the guardrail works, but it also exposed an ergonomic gap for browser-origin attachments: drag-and-drop uploads in the web UI may not have a reusable local-path-based file-reference fallback, so the current behavior is safe but abrupt.

Derrick proposed the better primary recovery path: keep the work in the browser session and adaptively shrink the inline image until the resulting model-facing payload fits under the configured inline context cap. That keeps the UX fast, avoids unnecessary round-trips, and directly targets the real constraint — final inline payload bytes — instead of assuming filesystem-path-backed fallback is always available.

This slice should preserve the existing two-mode upload model while improving inline resilience. The implementation should iteratively recompress/rescale in the browser, stepping max dimension downward until the encoded inline payload fits or a configured minimum dimension is reached. If the image still cannot fit at the minimum acceptable size, Nerve should then try file-reference fallback when available, and only block as the final safety behavior. We also need enough metadata/UI visibility to show what resolution was chosen and whether the image fit inline after adaptive shrinking.

---

## Tasks

### Task 1: Define adaptive inline shrinking policy and insertion points

**Bead ID:** `nerve-jsf`  
**SubAgent:** `primary`
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, inspect the current inline image compression/send-prep flow and define the exact adaptive shrinking policy for browser-side inline uploads. Recommend step-down behavior, config/env surface, minimum dimension handling, fallback order, and the precise insertion points in the code. Claim the bead at start and close it at completion.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- repo files as needed during investigation

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-adaptive-inline-image-shrinking.md`
- repo files as needed during investigation

**Status:** ✅ Complete

**Results:**
Current code path findings:
- Browser inline preparation starts in `src/features/chat/InputBar.tsx` via `buildInlineAttachment()` (`compressImage(item.file)`) and `prepareInlineItem()`.
- `compressImage()` in `src/features/chat/image-compress.ts` is currently a fixed three-step heuristic: clamp to `1024px`, encode once, retry at lower quality, then retry once at `50%` dimensions. It optimizes for an old `~350 KB` transport budget, not the actual inline context budget.
- After compression, `prepareInlineItem()` compares final base64 bytes against `uploadConfig.inlineImageContextMaxBytes` (default `128_000` from `src/features/chat/uploadPolicy.ts` / `server/lib/config.ts`). If still oversized, it skips any further inline attempt and either auto-downgrades to file-reference when `hasResolvableLocalPath(file)` is true or throws.
- Browser drag/drop/paste uploads may not expose a reusable local path (`hasResolvableLocalPath()` / `resolveFileReference()` in `InputBar.tsx`), so current fallback can be unavailable even though the image could likely fit with additional shrinking.
- Existing metadata/UI already has the right rendering surface: `UploadPreparationMetadata` + `UploadAttachmentDescriptor` in `src/features/chat/types.ts`, user-visible chips in `src/features/chat/MessageBubble.tsx`, and manifest sanitization in `src/features/chat/operations/sendMessage.ts`.

Recommended adaptive inline shrinking policy:
- **Primary target:** make inline images fit `inlineImageContextMaxBytes` (not the old `MAX_COMPRESSED_BYTES` transport heuristic).
- **Byte-budget target:** aim for `<= 90%` of `inlineImageContextMaxBytes` on success, but treat `<= inlineImageContextMaxBytes` as acceptable. This gives a small safety cushion without forcing unnecessary extra iterations.
- **Step-down strategy:**
  1. Start from the current configured max dimension (`uploadConfig.imageOptimizationMaxDimension`, default `2048`) capped by the source image size; preserve aspect ratio.
  2. Encode once at the configured visual target (`image/webp` unless alpha requires PNG preservation, matching current behavior intent).
  3. If over budget, first reduce lossy quality in controlled steps (recommended: `82 → 74 → 66`).
  4. If still over budget, reset quality to the normal target for the next dimension rung and reduce max dimension by `~15%` per rung (multiply by `0.85`, rounded) until the minimum dimension is reached.
  5. Re-run encode/measure after each rung; stop at first result `<= inlineImageContextMaxBytes`.
- **Minimum dimension handling:** add a new config/env surfaced to client and server for browser inline shrinking minimum dimension, default `768px`, clamped to something sane (recommended server clamp `256..4096`). Do not upscale smaller sources; if either image side is already below the current rung, only shrink when the larger side still exceeds the rung.
- **Fallback order:**
  1. Adaptive inline shrink attempts.
  2. If still oversized at min dimension and `inlineImageAutoDowngradeToFileReference && fileReferenceEnabled && hasResolvableLocalPath(file)`, downgrade to file reference using the existing `buildFileReferenceDescriptor()` path.
  3. Otherwise block with the existing safety error, but mention that adaptive shrinking already reached the minimum inline size.
- **Metadata/debug visibility:** extend `UploadPreparationMetadata` to record the actual adaptive result and failure envelope for user/debug rendering. Recommended new fields: `adaptiveInlineAttempted`, `adaptiveInlineIterations`, `adaptiveInlineTargetBytes`, `adaptiveInlineFinalBytes`, `adaptiveInlineChosenWidth`, `adaptiveInlineChosenHeight`, `adaptiveInlineMinDimension`, `adaptiveInlineFallbackReason`. Surface concise chips/text in `MessageBubble.tsx` such as `inline payload: 111 KB / cap 125 KB • 896×672 • 4 steps` and for downgrade `adaptive inline hit min 768px; fell back to file_ref`.
- **Manifest/debug expectation:** keep `sendMessage.ts` behavior unchanged — inline base64 remains stripped from the manifest unless `exposeInlineBase64ToAgent` is enabled. New adaptive metadata should still be included in the sanitized descriptor so the agent and UI can see what happened without exposing bytes.

Exact insertion points for the implementation bead:
- `src/features/chat/image-compress.ts`
  - Replace the fixed heuristic with an adaptive encoder that accepts runtime policy inputs (context byte budget, max dimension, min dimension, preferred quality ladder) and returns both the image payload and attempt metadata.
  - Recommended API shape: `compressImage(file, policy): Promise<{ base64, mimeType, preview, width, height, bytes, attempts, strategy }>`.
- `src/features/chat/InputBar.tsx`
  - In `buildInlineAttachment()` pass the runtime policy derived from `uploadConfig` into `compressImage()`.
  - In `prepareInlineItem()` stop treating the first oversize result as final. Instead, rely on `compressImage()` to exhaust adaptive inline attempts before this function decides success vs file-ref downgrade vs block.
  - Copy returned attempt metadata into `UploadPreparationMetadata.reason` / new fields for both success and downgrade cases.
- `src/features/chat/types.ts`
  - Extend `UploadPreparationMetadata` with the adaptive inline fields above.
- `src/features/chat/MessageBubble.tsx`
  - Render the chosen inline dimensions/iterations and explicit min-dimension fallback reason using the existing attachment summary block.
- `src/features/chat/uploadPolicy.ts`
  - Add `inlineImageShrinkMinDimension` to `UploadFeatureConfig` + defaults.
- `server/lib/config.ts` and `server/routes/upload-config.ts`
  - Add `NERVE_INLINE_IMAGE_SHRINK_MIN_DIMENSION` to server config and return it from `/api/upload-config` so the browser uses the same policy source as other upload settings.
- Tests to update/add around the same code path:
  - `src/features/chat/InputBar.test.tsx` for inline-fit-after-extra-shrinking, min-dimension downgrade, and min-dimension block when no file-ref path exists.
  - `src/features/chat/MessageBubble.uploadSummary.test.tsx` for new metadata text.
  - `server/routes/upload-config.test.ts` and `server/lib/config.test.ts` for the new config surface.

Implementation note:
- Keep default mode selection in `src/features/chat/uploadPolicy.ts` unchanged for this slice. The change belongs in the inline preparation path, not in chooser/default routing. Existing file-reference optimization (`server/lib/upload-optimizer.ts`) should remain the secondary path for explicit file-ref selections or adaptive-inline exhaustion.

---

### Task 2: Implement adaptive in-browser inline image shrinking

**Bead ID:** `nerve-i0m`  
**SubAgent:** `coder`
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, implement adaptive in-browser inline image shrinking so oversized inline uploads iteratively reduce dimensions until the encoded inline payload fits under the configured context-safe limit or reaches a configured minimum dimension. Preserve aspect ratio, prefer inline success first, keep file-reference fallback as a secondary path, add metadata/UI visibility for the chosen inline result, and add/update tests/config/docs. Claim the bead at start and close it at completion.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `src/features/chat/`
- `server/lib/`
- `server/routes/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-adaptive-inline-image-shrinking.md`
- `src/features/chat/image-compress.ts`
- `src/features/chat/image-compress.test.ts`
- `src/features/chat/InputBar.tsx`
- `src/features/chat/InputBar.test.tsx`
- `src/features/chat/MessageBubble.tsx`
- `src/features/chat/MessageBubble.uploadSummary.test.tsx`
- `src/features/chat/types.ts`
- `src/features/chat/uploadPolicy.ts`
- `server/lib/config.ts`
- `server/lib/config.test.ts`
- `server/routes/upload-config.ts`
- `server/routes/upload-config.test.ts`

**Status:** ✅ Complete

**Results:**
Implemented the adaptive inline shrinking path in the browser send-prep flow.
- Replaced the old fixed `1024px / retry quality / half-size once` compressor in `src/features/chat/image-compress.ts` with a policy-driven adaptive encoder that:
  - starts from `uploadConfig.imageOptimizationMaxDimension` capped by source size,
  - targets `90%` of `inlineImageContextMaxBytes` while accepting any result `<= inlineImageContextMaxBytes`,
  - tries the quality ladder `82 → 74 → 66` per dimension rung for lossy images,
  - resets to normal quality on each new rung and reduces max dimension by about `15%` until the configured minimum,
  - preserves aspect ratio,
  - preserves alpha by keeping PNG output when transparency is detected,
  - returns chosen dimensions, byte count, min dimension, target bytes, and iteration count.
- Threaded the new policy through `src/features/chat/InputBar.tsx` so inline image preparation now prefers adaptive inline success first, only falls back to file reference after the minimum dimension is reached, and otherwise blocks with a clearer min-dimension-specific error.
- Added `inlineImageShrinkMinDimension` to client/server upload config (`src/features/chat/uploadPolicy.ts`, `server/lib/config.ts`, `server/routes/upload-config.ts`) and exposed env support via `NERVE_INLINE_IMAGE_SHRINK_MIN_DIMENSION`.
- Extended upload preparation metadata in `src/features/chat/types.ts` and rendered it in `src/features/chat/MessageBubble.tsx`, including target/cap bytes, chosen dimensions, iteration count, minimum dimension, and fallback reason.
- Added/updated tests in:
  - `src/features/chat/image-compress.test.ts`
  - `src/features/chat/InputBar.test.tsx`
  - `src/features/chat/MessageBubble.uploadSummary.test.tsx`
  - `server/lib/config.test.ts`
  - `server/routes/upload-config.test.ts`
- Verification run:
  - `npm test -- --run src/features/chat/image-compress.test.ts src/features/chat/InputBar.test.tsx src/features/chat/MessageBubble.uploadSummary.test.tsx server/lib/config.test.ts server/routes/upload-config.test.ts`
  - `npx eslint src/features/chat/image-compress.ts src/features/chat/image-compress.test.ts src/features/chat/InputBar.tsx src/features/chat/InputBar.test.tsx src/features/chat/MessageBubble.tsx src/features/chat/MessageBubble.uploadSummary.test.tsx src/features/chat/types.ts src/features/chat/uploadPolicy.ts server/lib/config.ts server/lib/config.test.ts server/routes/upload-config.ts server/routes/upload-config.test.ts`
  - `npx tsc -b && npx tsc -p config/tsconfig.server.json --noEmit`
- Note for follow-up: live UI validation with the original oversized image still remains for Task 3.

---

### Task 3: Live-verify adaptive shrinking with the original large image

**Bead ID:** `nerve-ak9`  
**SubAgent:** `primary`
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, perform a live verification pass using the original large inline test image in Nerve UI. Confirm adaptive shrinking keeps the message safe, record the chosen resolution/byte result, verify user-visible metadata/UX, and note whether fallback/block behavior still occurs at the configured minimum dimension. Claim the bead at start and close it at completion.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- repo/runtime inspection paths as needed during verification

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-adaptive-inline-image-shrinking.md`
- repo files only if a safe verification-time fix is required

**Status:** ✅ Complete

**Results:** Live operator retest with the original large image succeeded in the exact browser-origin inline path that previously failed. After `update.sh` + `restore.sh`, Nerve kept the upload in `inline` mode with subagent forwarding enabled and adaptively shrank it until it fit the context-safe budget without needing file-reference fallback. Observed manifest/preparation details:
- `mode: inline`
- `policy.forwardToSubagents: true`
- optimized inline output MIME: `image/webp`
- original source MIME: `image/png`
- original size: `8,048,154` bytes
- final inline base64 bytes: `127,252`
- context safety cap: `128,000` bytes (~125 KB)
- preparation outcome: `optimized_inline`
- reason: `Adaptive inline shrink fit within the context-safe budget (124 KB <= 125 KB).`
- chosen dimensions: `1741 x 1741`
- adaptive iterations: `6`
- configured minimum dimension: `768`
- `localPathAvailable: false`
- `finalMode: inline`

This confirms the new browser-side adaptive shrinker solved the real regression: the same drag-and-drop browser upload no longer explodes context, no longer fails immediately due to missing file-reference fallback, and now finds a safe inline payload while preserving forwarding intent for subagents.

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- Defined and implemented a browser-side adaptive inline image shrinking policy for large image uploads.
- Replaced the old one-shot inline compression heuristic with iterative quality/dimension step-down behavior tied to the actual context-safe inline byte budget.
- Added `inlineImageShrinkMinDimension` config plumbing and surfaced richer inline preparation metadata in the UI.
- Live-verified the original problematic image in the Nerve web UI: it stayed inline, fit the budget after adaptive shrinking, and preserved subagent-forwarding intent.

**Commits:**
- Pending.

**Lessons Learned:**
- Browser-origin drag/drop uploads should not depend on local-path-backed file-reference fallback for safety; the browser path needs its own budget-aware adaptive strategy.
- The real constraint is final model-facing inline payload bytes, so the adaptive loop belongs in inline preparation, not just in generic transport compression.

---

*Created on 2026-03-17*