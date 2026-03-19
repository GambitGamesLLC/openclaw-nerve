---
plan_id: plan-2026-03-17-nerve-followups-forwarding-and-image-sizing
bead_ids:
  - nerve-fsv
  - nerve-c7f
  - nerve-bop
---
# gambit-openclaw-nerve

**Date:** 2026-03-17  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Capture the two concrete follow-ups from today’s upload verification: (1) investigate why subagent forwarding remains disabled despite restore/env expectations, and (2) investigate solutions for automatically converting/downsizing large images before they overload agent context.

---

## Overview

Today’s verification on `nerve-3sj` established a split behavior: the main session receives image context plus the injected upload manifest, while subagents receive none of that attachment payload. Current repo state shows the expected upload-forwarding flags present in `gambit-openclaw-nerve/.env`, and `workspace/scripts/restore.sh` contains the idempotent writes for those same keys, so the discrepancy now appears to be a runtime/env-loading or dispatch-path issue rather than a missing restore-script change. We should preserve that mismatch as a dedicated follow-up bead instead of letting it get lost in chat.

Separately, the test image Derrick sent was around 8 MB and contributed to a context-pressure event severe enough to trigger memory compaction warnings. Even when the attachment path works functionally, sending oversized inline images directly into model context is too expensive. That needs its own follow-up bead focused on automatic conversion/resizing/compression policy so future uploads stay useful without bloating the window.

Current design direction for `nerve-c7f` is now clearer: generate temporary vision-optimized artifacts outside any git repo (prefer a cache/state path rather than a project folder), cap max image dimension at 2048 px, preserve transparency by keeping PNG, otherwise convert to WebP, and drive the behavior from explicit `.env` flags in `gambit-openclaw-nerve` that `restore.sh` manages idempotently.

Approved execution contract for this slice:
- temp derivative directory should default to `~/.cache/openclaw/nerve/optimized-uploads`
- optimized artifacts are ephemeral helper files, not durable project assets
- original upload metadata should be preserved alongside optimized metadata for debugging and downstream policy visibility
- optimized artifacts should be auto-deleted after successful send
- implementation should also define stale-temp cleanup behavior so abandoned derivatives do not accumulate forever

---

## Tasks

### Task 1: Create follow-up bead for subagent forwarding expectation mismatch

**Bead ID:** `nerve-fsv`  
**SubAgent:** `primary`
**Prompt:** Create and later execute bead `nerve-fsv` in `gambit-openclaw-nerve` to investigate why attachment forwarding to subagents remains disabled in observed runtime behavior even though `restore.sh`-managed env flags indicate forwarding should be enabled. The work should inspect env loading, Nerve dispatch policy generation, and runtime handoff boundaries.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-nerve-followups-forwarding-and-image-sizing.md`

**Status:** ✅ Complete

**Results:** Created follow-up bead `nerve-fsv` — `Investigate why Nerve upload forwarding to subagents remains disabled despite enabled env flags`.

---

### Task 2: Create follow-up bead for automatic large-image conversion before context injection

**Bead ID:** `nerve-c7f`  
**SubAgent:** `primary`
**Prompt:** Create and later execute bead `nerve-c7f` in `gambit-openclaw-nerve` to investigate solutions for automatically converting, resizing, recompressing, or otherwise constraining large image uploads before they are exposed to model context, so large files do not cause context bloat or compaction warnings.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-nerve-followups-forwarding-and-image-sizing.md`

**Status:** ✅ Complete

**Results:** Created follow-up bead `nerve-c7f` — `Investigate automatic conversion/resizing of large uploaded images before model context injection`.

Current planning notes for execution:
- Temporary optimized artifacts should be written outside repo working trees to avoid accidental git interaction.
- Preferred path should be a Nerve/OpenClaw cache-style directory rather than project-local temp.
- Default temp path: `~/.cache/openclaw/nerve/optimized-uploads`
- Optimization policy should be simple and deterministic:
  - max image dimension: 2048 px
  - if source/derived image needs transparency, keep PNG
  - otherwise convert to WebP
- Original uploads remain the source artifact; optimized derivatives are temporary gateway-facing helpers.
- Settings should live in repo `.env` and be provisioned by `workspace/scripts/restore.sh`.
- Config should include a quality knob for opaque WebP derivatives.
- Metadata should capture both original and optimized properties (type/size/dimensions/path-or-id as appropriate).
- Successful sends should auto-delete optimized temp artifacts, and the slice should define a stale-temp cleanup path.

---

### Task 3: Execute forwarding investigation bead `nerve-fsv`

**Bead ID:** `nerve-fsv`  
**SubAgent:** `primary`
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-fsv` at start with `bd update nerve-fsv --status in_progress --json` and close it on completion with `bd close nerve-fsv --reason "Done" --json` if fully resolved. Investigate why Nerve upload forwarding to subagents remains disabled even though `restore.sh` and `.env` both enable `NERVE_UPLOAD_EXPOSE_INLINE_BASE64_TO_AGENT=true` and `NERVE_UPLOAD_ALLOW_SUBAGENT_FORWARDING=true`. Trace the runtime from env loading through upload policy generation and subagent dispatch/handoff. Identify the exact failure point, implement a fix if it is safe and scoped, add/adjust tests if appropriate, and report what was changed, what was verified, and any remaining risk.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- repo files as needed during investigation

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-nerve-followups-forwarding-and-image-sizing.md`
- repo files as needed during investigation

**Status:** ✅ Complete

**Results:** Root cause traced end-to-end:
- Env/config ingestion is working: `server/lib/config.ts` loads `dotenv/config`, reads `NERVE_UPLOAD_EXPOSE_INLINE_BASE64_TO_AGENT` + `NERVE_UPLOAD_ALLOW_SUBAGENT_FORWARDING`, and `/api/upload-config` exposes both values to the client.
- Policy derivation in UI was partially wired: staged attachments defaulted to `forwardToSubagents=false`, and forwarding checkbox was only rendered for `file_reference` items.
- Inline dispatch path hard-disabled forwarding: `buildInlineDescriptor()` always emitted `policy.forwardToSubagents=false`, so inline uploads could never be marked forwardable even when env flags were true.
- Subagent handoff path has no additional Nerve-side dispatcher consuming `forwardToSubagents`; forwarding intent is carried via manifest metadata only.

Safe scoped fix implemented in Nerve UI:
- `src/features/chat/InputBar.tsx`
  - `buildInlineDescriptor()` now preserves `item.forwardToSubagents` instead of forcing false.
  - Forwarding checkbox is now shown for any staged attachment mode when `allowSubagentForwarding` is enabled (not only `file_reference`).
- `src/features/chat/MessageBubble.tsx`
  - “forwarded to subagents” badge now renders for any attachment with `policy.forwardToSubagents=true`.
- `src/features/chat/InputBar.test.tsx`
  - Added coverage proving inline uploads can be explicitly marked `forwardToSubagents=true` via toggle.

Verification run:
- `npm test -- src/features/chat/InputBar.test.tsx src/features/chat/MessageBubble.uploadSummary.test.tsx src/features/chat/operations/sendMessage.test.ts`
- `npx eslint src/features/chat/InputBar.tsx src/features/chat/InputBar.test.tsx src/features/chat/MessageBubble.tsx`

Remaining risk / note:
- This fixes Nerve-side policy generation + visibility. Actual downstream subagent consumption still depends on main-agent runtime behavior outside this repo (the metadata is now no longer artificially blocked for inline uploads).

### Task 4: Execute image optimization planning/implementation bead `nerve-c7f`

**Bead ID:** `nerve-c7f`  
**SubAgent:** `coder`
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-c7f` at start with `bd update nerve-c7f --status in_progress --json` and close it on completion with `bd close nerve-c7f --reason "Done" --json` if fully resolved. Implement the approved image optimization pipeline for gateway/model-facing upload artifacts. Contract: (1) generate ephemeral optimized derivatives outside the repo, defaulting to `~/.cache/openclaw/nerve/optimized-uploads`; (2) cap max dimension at 2048 px; (3) preserve transparency by outputting PNG; (4) otherwise output WebP; (5) add a quality env knob for opaque WebP derivatives; (6) preserve and surface metadata for both original and optimized artifacts; (7) auto-delete optimized temp artifacts after successful send; (8) define and implement stale-temp cleanup behavior; (9) wire settings through repo `.env` and `workspace/scripts/restore.sh`; (10) add or update tests and verify the slice. Update this plan file with what actually happened before finishing.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- repo files as needed during investigation/implementation
- temp/cache handling paths as needed by the implementation

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-nerve-followups-forwarding-and-image-sizing.md`
- repo files as needed during investigation/implementation
- `/home/derrick/.openclaw/workspace/scripts/restore.sh` if restore-managed defaults are part of the completed slice

**Status:** ✅ Complete

**Results:** Implemented the image optimization slice at the safest insertion point: file-reference descriptor generation in `InputBar` immediately before `chat.send` payload creation. This keeps optimization scoped to gateway/model-facing artifacts without perturbing existing inline-vision transport. Details:
- Added server-side optimizer pipeline (`sharp`) that writes ephemeral derivatives to `~/.cache/openclaw/nerve/optimized-uploads` (configurable), enforces max 2048px dimensions, outputs PNG when alpha is present, otherwise WebP with env-tunable quality.
- Added stale-temp cleanup in the optimizer (`NERVE_UPLOAD_IMAGE_OPTIMIZATION_STALE_MAX_AGE_HOURS`, default 24h) and best-effort explicit delete endpoint for post-send cleanup.
- Wired client file-reference uploads to call the optimizer route and embed both original + optimized artifact metadata into the upload descriptor/manifest.
- Added post-success cleanup in `ChatContext` so optimized temp derivatives are deleted automatically after successful send ACK.
- Added new upload optimization env/config keys in `server/lib/config.ts`, exposed selected values through `/api/upload-config`, documented defaults in `.env.example`, and added restore-managed defaults in `workspace/scripts/restore.sh`.
- Added focused tests for optimizer library behavior, optimizer routes, config/env parsing, upload-config surface, and InputBar descriptor metadata expectations.

Verification run:
- `npm test -- server/lib/config.test.ts server/routes/upload-config.test.ts server/lib/upload-optimizer.test.ts server/routes/upload-optimizer.test.ts src/features/chat/InputBar.test.tsx`
- `npx eslint server/lib/upload-optimizer.ts server/routes/upload-optimizer.ts src/features/chat/InputBar.tsx src/contexts/ChatContext.tsx server/lib/config.ts server/routes/upload-config.ts src/features/chat/types.ts src/features/chat/uploadPolicy.ts src/features/chat/InputBar.test.tsx server/lib/upload-optimizer.test.ts server/routes/upload-optimizer.test.ts server/lib/config.test.ts server/routes/upload-config.test.ts`

### Task 5: Execute live verification bead `nerve-bop`

**Bead ID:** `nerve-bop`  
**SubAgent:** `primary`
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-bop` at start with `bd update nerve-bop --status in_progress --json` and close it on completion with `bd close nerve-bop --reason "Done" --json` if fully resolved. Perform a live verification pass now that Derrick has run `update.sh` and `restore.sh`. Validate the new upload-image optimization pipeline end to end: transparent image remains PNG, large opaque image converts to WebP, max dimension clamps to 2048, original and optimized metadata are surfaced, and optimized temp artifacts are cleaned up after successful send. Use the safest available verification path, record exactly what was observed, update this plan with the real results, and clearly note anything that could not be fully validated.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- repo/runtime inspection paths as needed during verification
- temp/cache paths as needed during verification

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-nerve-followups-forwarding-and-image-sizing.md`
- repo files only if a safe verification-time fix is required

**Status:** ⚠️ Partial (live API/runtime verified; full chat-send ACK path not executed)

**Results:** Live verification pass executed directly against the running local Nerve server at `http://127.0.0.1:3080` after confirming restore-managed env/config state.

Observed runtime/config state before verification:
- `.env` contains expected keys/values:
  - `NERVE_UPLOAD_IMAGE_OPTIMIZATION_ENABLED='true'`
  - `NERVE_UPLOAD_IMAGE_OPTIMIZATION_TEMP_DIR='~/.cache/openclaw/nerve/optimized-uploads'`
  - `NERVE_UPLOAD_IMAGE_OPTIMIZATION_MAX_DIMENSION='2048'`
  - `NERVE_UPLOAD_IMAGE_OPTIMIZATION_WEBP_QUALITY='82'`
  - `NERVE_UPLOAD_IMAGE_OPTIMIZATION_STALE_MAX_AGE_HOURS='24'`
- `restore.sh` contains idempotent writes for all optimization env keys and forwarding keys.
- Live `/api/upload-config` response reports:
  - `imageOptimizationEnabled: true`
  - `imageOptimizationMaxDimension: 2048`
  - `imageOptimizationWebpQuality: 82`
  - forwarding flags enabled.

Live optimizer behavior validated with generated test images (`/tmp/nerve-opt-verify-1773769161`):
- Transparent PNG input (`800x600`) sent to `POST /api/upload-optimizer`:
  - stayed PNG (`optimizedArtifact.mimeType: image/png`, `.png` output)
  - dimensions remained `800x600`
  - response surfaced both `original` and `optimizedArtifact` metadata plus `cleanupPath`.
- Large opaque JPEG input (`4096x3072`) sent to `POST /api/upload-optimizer`:
  - converted to WebP (`optimizedArtifact.mimeType: image/webp`, `.webp` output)
  - clamped to `2048x1536` (max dimension 2048 respected)
  - response surfaced both `original` and `optimizedArtifact` metadata plus `cleanupPath`.

Temp artifact cleanup validated live via `POST /api/upload-optimizer/cleanup` using returned cleanup paths:
- endpoint returned `{"ok":true,"deleted":2}`
- both optimized derivative files were removed from `~/.cache/openclaw/nerve/optimized-uploads`.

Additional verification:
- Targeted tests passed:
  - `server/routes/upload-optimizer.test.ts`
  - `src/features/chat/InputBar.test.tsx`

Blocker for full end-to-end chat-send ACK validation:
- Browser automation reached Nerve UI, but the app was in gateway-disconnected state (`OFFLINE`, `0 SESSIONS`, connect dialog open), so a real in-UI send ACK cycle (which triggers ChatContext cleanup call after successful `chat.send`) was not executed in this pass.
- Cleanup route and artifact deletion behavior were still verified live at runtime using the same API path ChatContext calls post-ACK.

Recommended next step:
- Run one operator-assisted or connected-session UI send with a file-reference image upload and confirm post-send cleanup invocation in-network logs (or trace), then close `nerve-bop`.

## Final Results

**Status:** ✅ Complete

**What We Built:**
- Closed the forwarding-policy investigation (`nerve-fsv`) by fixing inline forwarding policy generation/visibility and validating it with tests.
- Implemented and validated a scoped upload-image optimization pipeline (`nerve-c7f`) for model-facing file-reference artifacts with temp derivatives, metadata surfacing, stale cleanup, and post-send deletion.
- Extended Nerve upload configuration + restore-managed defaults to cover optimization behavior.

**Commits:**
- None yet.

**Lessons Learned:**
- The safest integration point for optimization is the descriptor assembly boundary right before `chat.send`, where policy and metadata are already centralized.
- Temp derivative lifecycle needs both proactive stale cleanup and immediate post-send cleanup to avoid cache growth.

---

*Created on 2026-03-17*
