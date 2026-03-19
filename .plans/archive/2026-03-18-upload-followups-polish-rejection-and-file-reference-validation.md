---
plan_id: plan-2026-03-18-upload-followups-polish-rejection-and-file-reference-validation
bead_ids:
  - nerve-w6s
  - nerve-9cf
  - nerve-o1y
  - nerve-vxp
  - nerve-48s
  - nerve-l11
  - nerve-zb0
  - nerve-x8o
  - nerve-xlp
  - nerve-jr3
  - nerve-56i
  - nerve-373
  - nerve-swq
  - nerve-38a
  - nerve-8lp
related_bead_ids:
  - nerve-xaa
  - nerve-dqc
  - nerve-u2h
---
# Gambit OpenClaw Nerve — upload follow-ups: polish, large-file rejection, and file-reference validation

**Date:** 2026-03-18  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Follow the now-validated attachment-forwarding slice with three targeted follow-ups: fix metadata/name alignment for optimized forwarded artifacts, investigate why the attempted ~8 MB image was rejected instead of safely handled under current policy, and validate file-reference passing behavior for both the main agent and spawned subagents.

---

## Overview

Now that plain-subagent attachment forwarding is manually validated, the next work should tighten the rough edges instead of leaving the upload system in a half-understood state. The first follow-up is polish: the validated manual test proved the forwarded artifact arrived as a real `.webp`, but the manifest/display name still reported a `.png`, which means metadata coherence is lagging behind the actual optimized artifact.

The second follow-up is a more serious behavior investigation. Derrick reported that an attempted ~8 MB image was rejected when trying to use the current 32 KB inline policy path. That needs a real root-cause analysis: either the optimizer/chooser is refusing inputs earlier than intended, the shrink loop is bailing out incorrectly, the mode chooser is selecting the wrong path, or the rejection/fallback logic is not matching the intended product behavior. Investigation later confirmed the current rejection happens at the front-door inline admission gate rather than in the 32 KB optimization loop.

Derrick’s product decision for the next design pass is explicit: remove the front-door original-size admission limits for this feature path. The deciding rule should be whether the image can be transformed into a valid inline artifact (for example webp/png) that fits under the inline byte budget; if yes, send it inline, and if not, it should only be sent as a file reference. In other words, the system should care about the final optimized inline payload, not the original source file size.

The third follow-up is coverage for file-reference mode. Inline image forwarding is now proven, but file-reference behavior still needs explicit verification for both the main agent and child subagents so we know whether durable path-based handoff semantics are actually working end-to-end.

Derrick also clarified the product value behind file-reference mode: for files originating on the same desktop/host machine, pass-by-path is valuable precisely because the agent and subagents can discuss and operate on the file as a durable filesystem object from the terminal without bloating chat context. That includes system-level actions like moving files, deleting them, gitignoring them, or handing the path directly to a specific subagent. By contrast, phone/remote-origin uploads should not pretend to have those same local-path semantics; those should remain inline or staged-byte flows. Future design work should preserve true local-path semantics when the upload really comes from the local desktop, and use inline/staged representations when it does not.

---

## Tasks

### Task 1: Track the upload follow-up slice

**Bead ID:** `nerve-w6s`  
**SubAgent:** `primary`  
**Prompt:** Coordinate the post-validation upload follow-up slice in `gambit-openclaw-nerve`, keeping the metadata polish, large-file rejection investigation, and file-reference validation work linked under one active plan. Claim the bead at start, keep this plan updated as tasks progress, and close the bead when the slice is complete.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`

**Status:** ✅ Complete

**Results:** Epic used to coordinate the full upload follow-up slice through completion: large-image inline policy redesign, 512px minimum-dimension adjustment, Upload-vs-Attach-by-Path UX split, validated server-known path attachments, origin-aware transcript rendering, end-to-end file-reference validation, path-semantic forwarding to subagents, and metadata/name alignment polish.

---

### Task 2: Polish forwarded upload metadata/name alignment

**Bead ID:** `nerve-9cf`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-9cf` at start with `bd update nerve-9cf --status in_progress --json`. Investigate and fix the mismatch between manifest/display naming and the actual forwarded optimized artifact (for example `.png` in metadata vs `.webp` on the forwarded file). Keep scope tight, preserve current forwarding behavior, add focused tests if code changes are made, update this plan with actual findings/results, and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `server/lib/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`
- nearby upload metadata/manifest/forwarding files as needed

**Status:** ✅ Complete

**Results:** Tight fix implemented in the existing metadata/forwarding path without changing the validated forwarding model. In `src/features/chat/InputBar.tsx`, optimized `server_path` file-reference descriptors now rewrite their public `name` to the actual optimized artifact basename (derived from the returned optimized path), so the user-visible chip/manifest metadata no longer says e.g. `attach-me.png` while the forwarded artifact is actually `/tmp/.../attach-me-<id>.webp`. In `server/lib/subagent-spawn.ts`, forwarding now applies the same contract as a defensive backstop: when a forwarded file-reference descriptor is marked `optimization.applied === true`, the spawned attachment name and forwarded-path manifest name are canonicalized from the real local path basename before bytes are attached. That preserves the existing byte-forwarding behavior while making the forwarded attachment contract honest about the optimized artifact name/extension.

Focused coverage was updated in `src/features/chat/InputBar.test.tsx` and `server/lib/subagent-spawn.test.ts` to prove both sides of the fix: the client emits `name: 'attach-me.webp'` alongside the optimized `.webp` reference/mime metadata, and the spawn bridge forwards optimized file-reference attachments/manifests under the real `.webp` name even if an older descriptor still says `.png`. Verified with `npm test -- --run src/features/chat/InputBar.test.tsx server/lib/subagent-spawn.test.ts` (`26` tests passed).

---

### Task 3: Investigate 8 MB inline image rejection under 32 KB policy

**Bead ID:** `nerve-o1y`  
**SubAgent:** `research`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-o1y` at start with `bd update nerve-o1y --status in_progress --json`. Reproduce and inspect why the attempted ~8 MB image was rejected under the current 32 KB inline policy instead of compressing successfully or falling back appropriately. Identify the exact failure mode and owning codepath, document whether this is expected policy, a regression, or a product gap, update this plan with real findings, and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `server/lib/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`

**Status:** ✅ Complete

**Results:** Investigated the current client/server path and reproduced the boundary in code. The 32 KB setting (`inlineImageContextMaxBytes`) only governs the result of `compressImage()` once an image is already on the inline path; it is not the initial admission gate. The earlier hard gate is the 4 MB inline attachment cap from `DEFAULT_UPLOAD_FEATURE_CONFIG.inlineAttachmentMaxMb` / `config.upload.inlineAttachmentMaxMb`, enforced by `getInlineModeGuardrailError()` in `src/features/chat/uploadPolicy.ts` and checked in `InputBar` both when staging files and when switching a staged item back to inline (`src/features/chat/InputBar.tsx`, `processFiles()` and `updateAttachmentMode()`). Local repro with the current defaults showed an 8 MiB `image/png` gets `"huge.png" exceeds inline cap (4MB).` and, with two-mode enabled, defaults straight to `file_reference` instead of reaching `compressImage()`. Existing tests match this design: `uploadPolicy.test.ts` asserts large files default to `file_reference` and oversized inline attempts hit the hard guardrail, while `InputBar.test.tsx` only exercises downgrade/block behavior after compression for much smaller images that already passed the 4 MB gate. Conclusion: this is expected current behavior, not evidence of a regression in the 32 KB shrink loop. The product gap is that oversized images never enter the adaptive inline compression path, so an 8 MB image cannot be auto-shrunk-to-inline and, in inline-only configurations, is rejected before any compression or fallback logic can help. The server-side optimizer (`/api/upload-optimizer`, `server/lib/upload-optimizer.ts`) only applies to file-reference preparation and does not participate in inline admission.
---

### Task 4: Remove front-door inline image admission limits and decide inline by final optimized result

**Bead ID:** `nerve-48s`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-48s` at start with `bd update nerve-48s --status in_progress --json`. Implement Derrick’s product rule for image upload handling: remove the current original-size front-door inline admission limits, attempt inline optimization first, send inline only when the final optimized artifact fits the configured inline byte budget, and otherwise route to `file_reference` instead of rejecting based on original file size. Keep scope tight, preserve the current validated attachment-forwarding behavior, add or update focused tests, update this plan with actual implementation/results, and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`
- `src/features/chat/uploadPolicy.ts`
- `src/features/chat/image-compress.ts`
- `src/features/chat/InputBar.tsx`
- `src/features/chat/uploadPolicy.test.ts`
- `src/features/chat/InputBar.test.tsx`

**Status:** ✅ Complete

**Results:** Removed the front-door original-size inline gate for images while leaving the non-image inline cap guardrail intact. `getDefaultUploadMode()` now defaults all images to `inline` whenever inline uploads are available, and `getInlineModeGuardrailError()` no longer blocks images by original byte size. In `InputBar`, the inline-only staging path now exempts images from the old size rejection so large images still enter the adaptive inline preparation path. In `image-compress.ts`, the compressor now returns the smallest/best-effort optimized candidate instead of rejecting outright when it cannot reach the inline byte ceiling, which lets the existing preparation flow make the final decision: send inline if the optimized artifact fits `inlineImageContextMaxBytes`, otherwise downgrade to `file_reference` when a safe local path exists. Attachment-forwarding behavior was preserved because the descriptor/policy path was not changed beyond image admission and final-mode selection. Focused coverage was updated to prove: (1) large images now default to inline even when their original bytes exceed the former inline cap, (2) inline is only kept when the optimized result fits the context-safe budget, (3) over-budget optimized images downgrade to `file_reference` rather than being rejected solely due to original source size, and (4) oversized non-image files still keep the explicit inline guardrail. Verified with `npm test -- --run src/features/chat/uploadPolicy.test.ts src/features/chat/InputBar.test.tsx` (21 passing).

---

### Task 5: Lower adaptive inline image minimum dimension to 512px

**Bead ID:** `nerve-l11`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-l11` at start with `bd update nerve-l11 --status in_progress --json`. Lower the adaptive inline image minimum dimension floor from 768px to 512px so large images have more room to compress under the 32 KB inline budget before fallback. Keep scope tight, update focused tests/metadata expectations, update this plan with actual implementation/results, and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `server/lib/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`
- `src/features/chat/uploadPolicy.ts`
- `server/lib/config.ts`
- `src/features/chat/image-compress.test.ts`
- `src/features/chat/MessageBubble.uploadSummary.test.tsx`
- `src/features/chat/InputBar.test.tsx`
- `server/lib/config.test.ts`

**Status:** ✅ Complete

**Results:** Lowered the adaptive inline image minimum-dimension default from `768px` to `512px` in both client and server upload config (`src/features/chat/uploadPolicy.ts`, `server/lib/config.ts`) without changing the existing final-result product rule: inline vs `file_reference` is still decided only after optimization/compression finishes. Tightened the focused expectations that surfaced the old floor by updating the helper-policy rung test, upload summary metadata assertions, InputBar upload-preparation mocks/assertions, and the server config default test to reflect the new `512px` floor while leaving unrelated upload behavior untouched. Verified with `npm test -- --run src/features/chat/image-compress.test.ts src/features/chat/MessageBubble.uploadSummary.test.tsx src/features/chat/InputBar.test.tsx src/features/chat/uploadPolicy.test.ts server/lib/config.test.ts` (`5` files, `76` tests passed).

---

### Task 6: Fix missing file-reference fallback for browser drag-and-drop uploads

**Bead ID:** `nerve-zb0`  
**SubAgent:** `research`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-zb0` at start with `bd update nerve-zb0 --status in_progress --json`. Investigate why browser drag-and-drop image uploads in Nerve report no file-reference fallback available even when the source file exists locally (for example `~/Downloads/Chip_With_Drones_Cute.png`). Determine the exact missing path/reference capture or staging behavior, identify the owning codepath, recommend the correct fix, update this plan with real findings/results, and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `server/lib/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`
- repro notes/tests/docs only if needed

**Status:** ✅ Complete

**Results:** Investigated the browser drag/drop and file-reference fallback path in code. The failure is owned primarily by `src/features/chat/InputBar.tsx`: dropped files go through `handleDrop()` → `processFiles(e.dataTransfer.files)` (`InputBar.tsx:462-467`), which stages only plain browser `File` objects and discards the richer drag item metadata entirely. From there, Nerve decides whether file-reference mode is possible only by checking `file.path || file.webkitRelativePath` in `hasResolvableLocalPath()` and `resolveFileReference()` (`InputBar.tsx:92-112`). That assumption works only when a `File` object already carries a path-like field. In an ordinary browser drag/drop flow, there is no standard absolute local-path property on `File`, and MDN documents `webkitRelativePath` as a relative path only for directory selections made with `<input webkitdirectory>`, not as a dropped-file local filesystem path. So for a dropped image like `~/Downloads/Chip_With_Drones_Cute.png`, the browser-visible `File` usually has bytes/name/type but no usable local path; Nerve stages the bytes for inline work, sets `localPathAvailable = false`, and when adaptive inline shrinking cannot get under the context budget, `prepareInlineItem()` throws the exact “no file-reference fallback was available” error instead of downgrading (`InputBar.tsx:674-746`).

The server-side fallback path is not the cause. `/api/upload-optimizer` requires a real `path` in the request body (`server/routes/upload-optimizer.ts:7-15`) and `optimizeUploadImage()` immediately resolves and opens that path on disk (`server/lib/upload-optimizer.ts:92-137`). Subagent forwarding has the same requirement: `buildSessionsSpawnAttachments()` reads `descriptor.reference.path` directly from the local filesystem (`server/lib/subagent-spawn.ts:97-108`). In other words, Nerve’s backend/file-reference model is path-based and works only after the frontend has supplied a durable readable path.

Conclusion: this is partly a browser limitation but, more importantly, a Nerve product gap in how browser-originated drops are staged. The missing behavior is not a tiny path-capture bug; it is that the drag/drop path never creates any durable server-side reference when the browser cannot expose a local path. Recommended fix direction: add a browser-safe staging path for file-reference mode (for example, upload dropped file bytes to a local temp/staging area on the host and return a server-owned reference/path token that can back `/api/upload-optimizer` and subagent forwarding), then teach the drag/drop preparation flow to use that staged reference when `file.path` is absent. If Nerve wants to stay strictly path-only, it should explicitly surface that browser drag/drop cannot support file-reference fallback instead of implying the original OS path should have been available.
---

### Task 7: Research preserving true local-path semantics for local-origin uploads

**Bead ID:** `nerve-x8o`  
**SubAgent:** `research`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-x8o` at start with `bd update nerve-x8o --status in_progress --json`. Investigate how Nerve can preserve real filesystem path semantics when an upload truly originates from the local desktop/host machine, so the main agent and subagents can operate on the file by path without bloating chat context. Keep phone/remote-origin uploads explicitly out of scope. Identify which input surfaces can reliably expose local path semantics, where browser limitations break that model, what trustworthy detection or handoff options exist, and recommend the best next implementation direction grounded in the current codebase/runtime. Update this plan with actual findings/results and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `server/lib/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`
- research notes/tests/docs only if needed

**Status:** ✅ Complete

**Results:** Investigated the current local-path/file-reference model across the chat UI, gateway handoff, and server file surfaces. Today Nerve’s file-reference path semantics are owned by `src/features/chat/InputBar.tsx`, `src/features/chat/operations/sendMessage.ts`, `server/routes/gateway.ts`, `server/lib/subagent-spawn.ts`, `server/routes/upload-optimizer.ts`, `server/lib/upload-optimizer.ts`, and the workspace file-browser routes in `server/routes/file-browser.ts` + `server/lib/file-utils.ts`.

Current evidence says Nerve only has trustworthy true-path semantics when the server itself already knows the path. The existing file-reference descriptor is explicitly path-based: `resolveFileReference()` in `InputBar.tsx` builds `{ kind: 'local_path', path, uri }` only from `file.path || file.webkitRelativePath` (`InputBar.tsx:92-112`), and both file-reference consumers require that path to be real on the host. `/api/upload-optimizer` rejects requests without `body.path` and immediately resolves/opens the source path on disk (`server/routes/upload-optimizer.ts:7-29`, `server/lib/upload-optimizer.ts:92-145`). Subagent forwarding does the same thing by `readFile(localPath)` from `descriptor.reference.path` (`server/lib/subagent-spawn.ts:61-112`). So the backend/runtime model already assumes: if a `local_path` exists, it must be a host-readable filesystem path, not just a browser hint.

The weak point is the browser-origin capture. Nerve’s visible upload surfaces are the hidden `<input type="file">` (`InputBar.tsx:1021-1028`) and browser drag/drop (`InputBar.tsx:451-467`). Both only pass browser `File` objects into `processFiles()`. In standard web behavior, that is not a trustworthy absolute-path channel. External browser docs confirm the limits relevant to this code: the normal file input value is path-redacted (`C:\\fakepath\\...`) for security, and `File.webkitRelativePath` is only a path relative to a directory chosen via `<input webkitdirectory>`, not an absolute host path. Nerve also does not use `webkitdirectory` today. That means the current reliance on `file.path || file.webkitRelativePath` is only reliable in privileged/nonstandard runtimes that inject a `path` property, not in ordinary browser file picks or drops.

By contrast, Nerve already has one trustworthy path surface in the current runtime: the workspace file browser. `server/lib/file-utils.ts` defines a canonical server-side root via `getWorkspaceRoot()` and validates paths with `resolveWorkspacePath()` (`file-utils.ts:67-120`). `server/routes/file-browser.ts` exposes only those validated relative paths and can optionally widen the root via `FILE_BROWSER_ROOT` (`file-browser.ts:124-205`, `docs/CONFIGURATION.md` File Paths section). That means files selected via the workspace browser are server-known, host-readable paths with durable semantics; they are the cleanest current substrate for true `local_path` references. This is materially different from browser uploads, where the browser gives Nerve bytes/name/type but not a trustworthy host path.

Practical options grounded in the current codebase:
1. **Best current-runtime option:** add an explicit “attach by path” / “attach from workspace” flow backed by the existing workspace file browser and `resolveWorkspacePath()`. That preserves real host-path semantics without trusting browser `File` metadata.
2. If Derrick wants local-path semantics for files outside the default workspace, use the already-supported `FILE_BROWSER_ROOT` custom root as the server-owned picker surface rather than trying to recover absolute paths from browser uploads.
3. For ordinary browser picker/drag-drop uploads, do **not** promise true local-path semantics. Treat them as inline/staged-byte uploads unless a separate trusted host-side handoff first stages them and returns a server-owned path.
4. A later extension could add a native/host-assisted staging endpoint that writes uploaded bytes to a controlled temp area and returns a server-owned reference/path, but that would preserve a staged host path, not the original desktop path. That is a different product contract from “true filesystem path semantics.”

Recommended next move: implement a first-class server-known path attachment flow instead of trying to infer local paths from browser uploads. Concretely, add a chat attachment entrypoint that lets the user pick files from the workspace/file-browser surface (default workspace root, or `FILE_BROWSER_ROOT` when configured), then generate `file_reference` descriptors from those validated server-side paths. Keep browser picker and drag/drop on the inline/staged path unless/until there is an explicit host-assisted staging feature. This matches the current backend assumptions, preserves true path semantics where they are actually knowable, and avoids misclassifying remote/phone/browser-origin files as durable local filesystem objects.

---

### Task 8: Design origin-aware attachment UX: Upload vs Attach by Path

**Bead ID:** `nerve-xlp`  
**SubAgent:** `research`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-xlp` at start with `bd update nerve-xlp --status in_progress --json`. Design how Nerve should separate browser-origin content uploads from true server-known path attachments, so the UI honestly reflects `Upload` vs `Attach by Path` semantics instead of a misleading inline-vs-file-path toggle on a single staged item. Ground the design in the current codebase and prior findings about local-path preservation. Recommend concrete UI states, user flows, and likely implementation slices. Update this plan with actual findings/results and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `src/features/file-browser/`
- `src/features/workspace/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`
- design notes/docs only if needed

**Status:** ✅ Complete

**Results:** Reviewed the current upload/path codepaths and designed an origin-aware replacement for the current per-item inline-vs-file-reference toggle. The present UX in `src/features/chat/InputBar.tsx` stages everything from the paperclip picker, drag/drop, and paste as browser `File` objects in one shared list, then exposes a generic `Mode` selector (`Inline` / `File Reference`) on each staged item. That UI is misleading because the backend/runtime model is not actually symmetric. `resolveFileReference()` and `hasResolvableLocalPath()` only treat `file.path || file.webkitRelativePath` as a usable reference (`InputBar.tsx:86-112`), while `/api/upload-optimizer` and subagent forwarding require a real host-readable path (`server/routes/upload-optimizer.ts`, `server/lib/subagent-spawn.ts`). Prior research in `nerve-zb0` and `nerve-x8o` showed ordinary browser picker, drag/drop, and phone-origin uploads usually provide bytes/name/type but not a trustworthy absolute local path, so they should not be presented as if they can be turned into true path attachments after the fact.

Recommended product model: separate attachments by **origin contract**, not by a late per-item transport toggle. Nerve should expose two explicit entrypoints in chat: **Upload** and **Attach by Path**. **Upload** covers browser-selected files, drag/drop, and paste; these are byte-origin artifacts whose semantics are “send uploaded content.” Within that flow, Nerve can still optimize images inline and, in a future slice, optionally stage uploaded bytes onto the host for reuse, but the UI should continue to label them as uploads rather than original-path references. **Attach by Path** should only be offered through a trusted server-known path surface, grounded in the existing workspace/file-browser stack (`server/routes/file-browser.ts`, `server/lib/file-utils.ts`, `src/features/file-browser/*`). Those selections produce descriptors whose semantics are “the server can read this path directly,” which matches current `file_reference` behavior, upload optimization, and subagent forwarding.

Concrete UX recommendation:
1. Replace the current one-button paperclip flow with a small attachment menu in `InputBar`: **Upload files** and **Attach by Path**.
2. Keep drag/drop and paste mapped only to the **Upload** path; do not surface a `File Reference` option for those items.
3. Add a lightweight path-picker flow for **Attach by Path** using the existing workspace/file-browser surface (drawer/modal/popover depending available layout). Optionally support a validated manual path entry later, but only after resolving through a server endpoint similar to `/api/files/resolve`.
4. Split staged chips/cards into two explicit families: **Uploaded** and **Path Attachment**. Uploaded items may show transport outcomes like `Inline optimized` or `Uploaded as attachment`; path items may show `Server-readable path` and the resolved workspace/host path.
5. For uploads, replace the current `Mode` select with upload-specific controls only where they are honest: for example `Include inline for vision` vs `Send as uploaded file` if both behaviors remain product-relevant. Do not expose `File Reference` as a selectable mode unless the item already came from a trusted path source.
6. For path attachments, do not show inline/base64-related language. Instead show path-specific affordances such as resolved path preview, whether image optimization will create a temp derivative, and `Forward to subagents` when allowed.
7. Update error copy to be origin-aware. Example: browser upload that cannot fit inline should say it will be sent as an uploaded file (or is blocked if no upload fallback exists), not that “no file-reference fallback was available.” Reserve path-specific errors for true path attachments.
8. Update `MessageBubble` upload summaries so the rendered badges/labels distinguish `Uploaded` vs `Path` origin first, then show the delivery/preparation outcome second (for example `UPLOAD · INLINE OPT`, `UPLOAD · SENT FILE`, `PATH · FILE REF`, `PATH · REF OPT`).

Recommended implementation slices grounded in the current code:
- **Slice A — data model/origin plumbing:** add an explicit staged attachment origin (`upload` vs `server_path`) in `src/features/chat/types.ts` / `InputBar.tsx` so the UI and send path stop inferring semantics from `mode` alone.
- **Slice B — chat entrypoints:** replace the current paperclip direct file input with an attachment menu and add an `Attach by Path` launcher into the existing workspace/file-browser surface.
- **Slice C — server-known path selection:** add a chat-safe path-selection contract (likely file-browser-based) that returns validated readable paths under the current workspace/`FILE_BROWSER_ROOT` rules, then construct `file_reference` descriptors directly from that result instead of from browser `File.path` hints.
- **Slice D — upload-path cleanup:** confine drag/drop/paste/file-input items to upload semantics, remove the misleading per-item `File Reference` option for those origins, and adjust fallback/error messaging accordingly.
- **Slice E — transcript/summary polish:** update `MessageBubble` and manifest/debug metadata so users and future agent tooling can see both origin (`upload` vs `server_path`) and final handling.

Key product distinction to preserve: a local desktop file only has **true path semantics** when selected through a server-trusted path surface. A browser/phone upload may originate from a local device, but once it enters Nerve through browser `File` bytes it should be treated as uploaded content, not as a durable original filesystem object. If Derrick later wants host-assisted staging for desktop uploads, that should be presented as a new explicit contract (for example `Import to workspace`), not silently conflated with `Attach by Path`.

---

### Task 9: Implement attachment origin model plumbing

**Bead ID:** `nerve-jr3`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-jr3` at start with `bd update nerve-jr3 --status in_progress --json`. Add explicit attachment origin metadata (for example `upload` vs `server_path`) through staged-item, descriptor, and transcript/message surfaces so Nerve can distinguish browser-origin content uploads from true server-known path attachments. Keep scope tight, add focused tests, update this plan with actual implementation/results, and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `server/lib/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`
- `src/features/chat/types.ts`
- `src/features/chat/InputBar.tsx`
- `src/features/chat/MessageBubble.tsx`
- `src/features/chat/InputBar.test.tsx`
- `src/features/chat/MessageBubble.uploadSummary.test.tsx`
- `src/features/chat/operations/sendMessage.test.ts`
- `server/lib/subagent-spawn.ts`
- `server/lib/subagent-spawn.test.ts`

**Status:** ✅ Complete

**Results:** Added a first-class attachment `origin` field (`upload` | `server_path`) to the shared chat upload descriptor model, and threaded it through the current staged-upload path so browser-selected / dropped / pasted files are explicitly marked as `upload` even when they later resolve to `file_reference` transport. This keeps the data model honest for the upcoming Upload-vs-Attach-by-Path UI split without changing the already-validated forwarding behavior. The message/transcript rendering path now shows origin-aware summary counts plus per-attachment `UPLOAD` / `PATH` badges in `MessageBubble`, so post-send chat history can distinguish origin separately from transport mode (`INLINE` / `FILE_REF`). The server-side manifest parser in `subagent-spawn` was widened to recognize the new field for future consumers, but forwarding behavior remains unchanged because origin is informational only in this slice. Focused regression coverage was updated to prove origin survives manifest sanitization, optimistic message storage, staged upload preparation, transcript rendering, and manifest extraction. Verified with `npm test -- --run src/features/chat/operations/sendMessage.test.ts src/features/chat/MessageBubble.uploadSummary.test.tsx src/features/chat/InputBar.test.tsx server/lib/subagent-spawn.test.ts` (`4` files, `42` tests passed).

---

### Task 10: Split chat attachment entrypoints into Upload files and Attach by Path

**Bead ID:** `nerve-56i`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-56i` at start with `bd update nerve-56i --status in_progress --json`. Replace the current single attachment entry flow with explicit `Upload files` and `Attach by Path` actions so the chat UI matches the underlying capability model. Build on the attachment origin design and keep scope tight to the composer entrypoints/menus. Add focused tests if code changes are made, update this plan with actual implementation/results, and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`
- `src/features/chat/InputBar.tsx`
- `src/features/chat/InputBar.test.tsx`

**Status:** ✅ Complete

**Results:** Replaced the paperclip’s direct single-entry flow in `InputBar` with an attachment action menu that now exposes explicit `Upload files` and `Attach by Path` entrypoints. `Upload files` still dispatches to the existing hidden browser file input, so drag/drop, paste, staging, mode chooser behavior, and the newer `origin: 'upload'` plumbing remain unchanged for browser-origin content. `Attach by Path` now has a real composer target in the UI: it launches a lightweight placeholder dialog explaining that the path picker wiring is the next slice, instead of pretending the current browser upload flow can already produce true server-known path attachments.

This keeps scope tight to composer/menu scaffolding and deliberately does **not** implement the workspace picker yet. Focused regression coverage was updated to verify the new menu entrypoints, that `Upload files` still opens the browser picker, and that `Attach by Path` opens the placeholder handoff dialog. Verified with `npm test -- --run src/features/chat/InputBar.test.tsx src/features/chat/operations/sendMessage.test.ts src/features/chat/MessageBubble.uploadSummary.test.tsx` (`3` files, `39` tests passed).

---

### Task 11: Wire chat Attach by Path into server-known file browser picker

**Bead ID:** `nerve-373`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-373` at start with `bd update nerve-373 --status in_progress --json`. Integrate the chat attachment flow with the existing workspace/server-known file browser so users can attach validated host paths as true path references. Keep scope tight to server-known path selection and validated handoff, add focused tests where practical, update this plan with actual implementation/results, and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/chat/InputBar.tsx`
- `src/features/chat/InputBar.test.tsx`
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`

**Status:** ✅ Complete

**Results:** Replaced the Attach by Path placeholder with a real validated picker flow in `InputBar` backed by the existing file-browser APIs (`/api/files/tree` + `/api/files/resolve`). The composer now opens a workspace/server-known path dialog, lets the user browse validated directories, and stages selected files as `origin: 'server_path'` attachments with synthetic host-path-backed `File` objects whose `path` points at the validated absolute workspace location. Those staged items are forced onto `file_reference` mode, show path-aware preview metadata in the composer, and continue through the existing descriptor/send pipeline so upload-origin behavior stays unchanged. For image paths, the existing file-reference optimization flow still runs because the selected attachment carries a resolvable server path.

Focused regression coverage was updated to verify the new picker opens from the attachment menu, loads validated workspace entries, stages a selected path as a `server_path` attachment, and sends it as a true path reference through the existing descriptor pipeline. Verified with `npm test -- --run src/features/chat/InputBar.test.tsx server/routes/file-browser.test.ts` (`54` tests passed) and `npm test -- --run src/features/chat/InputBar.test.tsx src/features/chat/operations/sendMessage.test.ts src/features/chat/MessageBubble.uploadSummary.test.tsx` (`40` tests passed).

---

### Task 12: Remove misleading file-reference toggle from browser-origin uploads

**Bead ID:** `nerve-swq`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-swq` at start with `bd update nerve-swq --status in_progress --json`. Clean up browser-origin upload staging so uploaded files no longer present a misleading file-reference option, and update fallback/error copy to match upload semantics. Keep scope tight, add focused tests if needed, update this plan with actual implementation/results, and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`
- nearby upload staging / copy / tests as needed

**Status:** ✅ Complete

**Results:** Cleaned up browser-origin upload staging in `src/features/chat/InputBar.tsx` so browser-selected / dropped / pasted files now stage only as `Upload` items and no longer render the old per-item `File Reference` chooser. Browser-origin uploads now require inline upload support, reject oversized non-image uploads with explicit `Use Attach by Path` guidance, and report oversized image fallback failures honestly (`browser uploads cannot preserve a true file-reference fallback`) instead of implying the browser upload can keep a durable local-path reference. The separate Attach by Path flow remains intact for true `server_path` / `file_reference` attachments. Focused coverage in `src/features/chat/InputBar.test.tsx` was updated to assert: browser uploads do not expose file-reference controls, oversized browser uploads get Attach-by-Path guidance, browser-uploaded oversized images surface the new honest fallback copy, browser uploads stay on the inline transport path, and inline-disabled browser uploads are rejected with upload-specific guidance instead of path-reference wording. Verified with `npm test -- --run src/features/chat/InputBar.test.tsx src/features/chat/MessageBubble.uploadSummary.test.tsx` (`17` tests passed). Remaining follow-up that still belongs to `nerve-38a`: transcript/message rendering should mirror this staging distinction after send so sent messages visibly preserve `Upload` vs `Path` origin in badges/summaries.

---

### Task 13: Add origin-aware transcript and message badges for attachments

**Bead ID:** `nerve-38a`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-38a` at start with `bd update nerve-38a --status in_progress --json`. Render origin-aware badges and summaries in chat/transcripts so `Upload` vs `Attach by Path` remains visible after sending. Keep scope tight, add focused tests if needed, update this plan with actual implementation/results, and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`
- `src/features/chat/MessageBubble.tsx`
- `src/features/chat/MessageBubble.uploadSummary.test.tsx`
- `src/features/chat/operations/loadHistory.ts`
- `src/features/chat/operations/loadHistory.test.ts`

**Status:** ✅ Complete

**Results:** Updated transcript/message rendering so the sent-message badges now preserve the same user-facing distinction as the composer: attachment summaries say `via Upload` vs `via Attach by Path`, and per-file origin badges now render `UPLOAD` vs `ATTACH BY PATH` instead of the vaguer old `PATH` label. Just as importantly, `src/features/chat/operations/loadHistory.ts` now rehydrates `uploadAttachments` from the embedded `<nerve-upload-manifest>…</nerve-upload-manifest>` block on persisted user messages, strips that manifest from the displayed transcript text, and attaches the parsed descriptors back onto the `ChatMsg` so the same origin-aware chips survive after history reloads rather than only during optimistic local render. Focused coverage was updated in `src/features/chat/MessageBubble.uploadSummary.test.tsx` and `src/features/chat/operations/loadHistory.test.ts` to prove both the new labels and transcript rehydration path. Verified with `npm test -- --run src/features/chat/MessageBubble.uploadSummary.test.tsx src/features/chat/operations/loadHistory.test.ts` (`34` tests passed). This fully closes the sent-message/transcript side of the `Upload` vs `Attach by Path` UI distinction without changing attachment behavior.

---

### Task 14: Validate file-reference passing to main agent and subagents

**Bead ID:** `nerve-vxp`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-vxp` at start with `bd update nerve-vxp --status in_progress --json`. Run a focused validation of file-reference mode: confirm how references are exposed to the main agent, then confirm whether forwarded file references reach spawned subagents with the expected metadata and usable access semantics. Document exactly what was observed, including any path/access mismatches, update this plan with real verification results, and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `.plans/`
- runtime verification paths as needed

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`
- tests/docs only if needed during safe verification

**Status:** ✅ Complete

**Results:** Validated the current file-reference flow with focused runtime repro plus the existing regression suite. Observed end-to-end behavior is now explicit:

1. **What the main agent sees:** Attach by Path selections are staged as `origin: 'server_path'`, `mode: 'file_reference'` descriptors whose `reference.kind/path/uri`, `sizeBytes`, `preparation`, and forwarding policy are embedded in the outgoing `<nerve-upload-manifest>…</nerve-upload-manifest>` block (`InputBar`, `sendMessage`, `loadHistory`). In a controlled repro, the main-agent message text contained the full path-backed descriptor, and transcript rehydration restored that same metadata onto `uploadAttachments`. Focused coverage still passes for this path (`InputBar.test.tsx`, `sendMessage.test.ts`, `loadHistory.test.ts`).
2. **What forwarded subagents receive:** The subagent-forwarding bridge does successfully forward path-backed references, but it does **not** preserve file-reference semantics or descriptor metadata. `buildSessionsSpawnAttachments()` reads `descriptor.reference.path` from the local filesystem and converts the file into a plain `sessions_spawn` attachment `{ name, mimeType, encoding: 'base64', content }`. In the controlled repro, a `server_path` descriptor with `reference.path=/tmp/.../actual-source.txt` arrived at the spawn boundary only as a regular attachment named `visible-name.txt` whose bytes decoded correctly. The forwarded payload no longer included `origin`, `mode`, `reference.path`, `reference.uri`, `preparation`, or `policy` metadata.
3. **Observed path/access semantics:** Path-backed access works for the main agent because the manifest preserves the actual host path. Path-backed forwarding to subagents works only indirectly by eagerly reading that path on the parent side before spawn. The child does not receive a usable host path reference; it receives bytes. A second controlled repro with a missing `reference.path` failed at spawn-build time with `ENOENT`, confirming the parent must still have synchronous filesystem access to the referenced path when forwarding happens.
4. **Observed mismatch / remaining gap:** The current system preserves true path semantics for the main agent/transcript side, but forwarded subagents do **not** get durable file-reference metadata or local-path semantics — only file contents plus display metadata (`name`/`mimeType`). So the forwarded subagent can inspect the file as an attachment, but cannot reliably act on the original host path (move/delete/gitignore/reopen by path) unless some separate path channel is added later.

Verified with:
- `npm test -- --run src/features/chat/InputBar.test.tsx src/features/chat/operations/sendMessage.test.ts src/features/chat/operations/loadHistory.test.ts server/lib/subagent-spawn.test.ts` (`4` files, `77` tests passed)
- ad hoc `tsx` runtime repro exercising `appendUploadManifest()`, `processChatMessages()`, and `buildSessionsSpawnArgs()` with a real temp file plus a missing-path failure case.

---

## Dependencies / Preconditions

- This slice follows the completed attachment-aware subagent forwarding work:
  - `nerve-dqc` — implemented attachment-aware subagent spawn path
  - `nerve-u2h` — manual image-forwarding validation succeeded
- File-reference validation should use the current post-fix runtime and should capture both success cases and any deliberate policy boundaries.

---

### Task 15: Preserve server_path semantics when forwarding attachments to subagents

**Bead ID:** `nerve-8lp`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-8lp` at start with `bd update nerve-8lp --status in_progress --json`. Implement a path-aware forwarding path for `server_path` attachments so spawned subagents receive durable path semantics (or an explicit path metadata contract) instead of only downgraded byte attachments when the parent used Attach by Path. Ground the implementation in the validated behavior from `nerve-vxp`, keep scope tight to `server_path` forwarding, add focused tests, update this plan with actual implementation/results, and close the bead with an explicit reason when complete.

**Folders Created/Deleted/Modified:**
- `server/lib/`
- `server/routes/`
- `src/features/chat/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md`
- `server/lib/subagent-spawn.ts`
- `server/lib/subagent-spawn.test.ts`

**Status:** ✅ Complete

**Results:** Implemented the minimal forwarding-side fix in `server/lib/subagent-spawn.ts` without changing the broader upload model: subagent spawn still preserves the existing byte-attachment behavior, but now it also carries an explicit path-metadata contract for forwarded `origin: 'server_path'` / `mode: 'file_reference'` attachments. The spawn builder now extracts only forwardable server-path descriptors into a dedicated child-task manifest block, `<nerve-forwarded-server-paths>{"version":1,"attachments":[...]}</nerve-forwarded-server-paths>`, while still attaching the file bytes as the regular `sessions_spawn.attachments` payload. That means the child now receives both: (1) the prior base64 attachment for immediate content access, and (2) the original `server_path` metadata (`id`, `origin`, `mode`, `name`, `mimeType`, optional `sizeBytes`, `reference.kind/path/uri`, plus any `preparation`, `optimization`, and forwarding `policy`) embedded directly in the task text.

Scope stayed tight to `server_path` forwarding only: non-path uploads and inline/browser-upload forwarding behavior are unchanged, and the manifest is appended only when at least one forwardable `server_path` file-reference descriptor exists. Focused regression coverage was added in `server/lib/subagent-spawn.test.ts` to prove: only eligible server-path descriptors are lifted into the forwarded manifest, the explicit child-task contract preserves path metadata, regular byte attachments still flow for those same descriptors, and non-`server_path` uploads do not gain the new manifest. Verified with `npm test -- --run server/lib/subagent-spawn.test.ts` (10 passing) and `npm test -- --run server/routes/gateway.test.ts server/lib/subagent-spawn.test.ts` (27 passing).

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Completed the Upload-vs-Attach-by-Path UX split, server-known path selection, origin-aware transcript rendering, validation of current file-reference behavior, and the remaining forwarding gap: spawned subagents now receive explicit `server_path` metadata in a dedicated task manifest while still receiving the existing byte attachments for content access.

**Commits:**
- Pending

**Lessons Learned:** The cleanest narrow fix for the forwarding gap was not to replace `sessions_spawn.attachments`, but to layer an explicit path metadata contract beside them. That preserves today’s working byte-forwarding behavior while restoring the original `server_path` semantics (`reference.path`/`uri` and related metadata) for children that need to act on the same host-visible file.

---

*Updated on 2026-03-18*