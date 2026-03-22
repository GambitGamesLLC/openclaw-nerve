# gambit-openclaw-nerve

**Date:** 2026-03-21  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Make `~/.openclaw/workspace/.temp/nerve-uploads/...` the explicitly documented canonical path for Nerve uploads, and verify whether the optimized cache path is still actively used/required in the upload flow or is now just an ephemeral implementation detail.

---

## Overview

Tonight’s live validation passes established a practical truth: the reliable artifact for subagent handoff is the staged source file under `workspace/.temp/nerve-uploads/...`. Both the earlier desktop-origin validation and the stronger mobile-origin validation succeeded by reading the staged source path directly, while the optimized cache derivative under `~/.cache/openclaw/nerve/optimized-uploads/...` was absent by the time the validation ran.

That suggests we should tighten the mental model and docs: the workspace temp path should be treated as canonical for uploads and for subagent handoff. At the same time, Derrick raised a good architectural question: is the optimized cache path still materially part of the upload pipeline, or is it now just a transient optimization artifact that may not matter after send/preparation? This slice should answer that clearly instead of leaving future sessions to infer it from anecdotal validation results.

---

## Tasks

### Task 1: Document `workspace/.temp/nerve-uploads/...` as the canonical upload path

**Bead ID:** `nerve-rp3`  
**SubAgent:** `primary`  
**Prompt:** Implement bead `nerve-rp3` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`. Start by claiming it with `bd update nerve-rp3 --status in_progress --json`. Update the appropriate Nerve docs and/or coordination docs so they explicitly state that browser/mobile uploads are canonically staged under `~/.openclaw/workspace/.temp/nerve-uploads/...` and that subagent handoff should prefer that staged path/reference. If needed, also update any plan/docs that still over-emphasize the optimized cache path. Commit any repo doc changes and close the bead with `bd close nerve-rp3 --reason "Documented workspace temp uploads as canonical Nerve upload path" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`
- relevant docs locations to be discovered

**Files Created/Deleted/Modified:**
- `.plans/2026-03-21-nerve-canonical-upload-path-and-optimized-cache-check.md`
- relevant docs files to be discovered

**Status:** ✅ Complete

**Results:** Updated `docs/ARCHITECTURE.md`, `docs/CONFIGURATION.md`, and `.env.example` so the durable upload contract is explicit: browser/mobile uploads are canonically staged under `~/.openclaw/workspace/.temp/nerve-uploads/...`, and later agent/subagent handoff should prefer that staged path/reference. Tightened the wording around `~/.cache/openclaw/nerve/optimized-uploads/...` so it is described only as an ephemeral optimization temp area rather than the durable path contract. Committed as part of `9473a09`.

---

### Task 2: Investigate whether optimized upload cache files are still part of the active contract

**Bead ID:** `nerve-3pj`  
**SubAgent:** `coder`  
**Prompt:** Implement bead `nerve-3pj` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`. Start by claiming it with `bd update nerve-3pj --status in_progress --json`. Inspect the current Nerve upload/send pipeline to determine when `~/.cache/openclaw/nerve/optimized-uploads/...` artifacts are created, whether they are expected to persist beyond preparation/send time, and whether any downstream code still depends on them as more than a transient optimization. Report the real lifecycle and recommend whether the manifest/reference model should shift to prefer the staged source path more explicitly. Update the plan with what you find, commit any repo changes if needed, and close the bead with `bd close nerve-3pj --reason "Investigated optimized upload cache lifecycle and contract" --json`.

**Folders Created/Deleted/Modified:**
- `server/lib/`
- `server/routes/`
- `src/contexts/`
- `src/features/chat/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-21-nerve-canonical-upload-path-and-optimized-cache-check.md`
- `server/lib/upload-staging.ts`
- `server/lib/upload-optimizer.ts`
- `server/routes/upload-stage.ts`
- `server/routes/upload-optimizer.ts`
- `src/features/chat/InputBar.tsx`
- `src/features/chat/operations/sendMessage.ts`
- `src/contexts/ChatContext.tsx`
- `server/lib/subagent-spawn.ts`

**Status:** ✅ Complete

**Results:** Investigated the current code path end-to-end. The real lifecycle is now clear:

1. **Creation:** browser-origin uploads are first staged by `/api/upload-stage` into `~/.openclaw/workspace/.temp/nerve-uploads/YYYY/MM/DD/...` (`server/routes/upload-stage.ts`, `server/lib/upload-staging.ts`). That staged file is the first durable path-backed artifact. For `file_reference` image sends, `InputBar.tsx` then calls `/api/upload-optimizer` with that staged/source path (or an Attach-by-Path source path). `optimizeUploadImage()` writes a derivative into `~/.cache/openclaw/nerve/optimized-uploads/...` and returns metadata for both original and optimized artifacts (`server/lib/upload-optimizer.ts`).
2. **Use:** `buildFileReferenceDescriptor()` rewrites the outgoing descriptor’s primary `reference.path` / `reference.uri` / `name` / `mimeType` / `sizeBytes` to the optimized artifact when optimization succeeds, while preserving original vs optimized metadata under `descriptor.optimization` (`src/features/chat/InputBar.tsx`). `sendMessage.ts` then embeds that descriptor into `<nerve-upload-manifest>...</nerve-upload-manifest>`, so the model-visible manifest currently advertises the optimized cache path as the active reference. Downstream subagent forwarding also preserves whichever `reference.path` is on the descriptor, and only uses `optimization.applied` as a hint to canonicalize the displayed/forwarded filename from the real path basename (`server/lib/subagent-spawn.ts`).
3. **Cleanup:** after a successful send ACK, `ChatContext.tsx` collects descriptors marked `optimization.cleanupAfterSend === true` and best-effort POSTs their current `reference.path` values to `/api/upload-optimizer/cleanup`, which deletes files only inside the optimization cache root (`src/contexts/ChatContext.tsx`, `server/routes/upload-optimizer.ts`, `server/lib/upload-optimizer.ts`). If that best-effort cleanup does not happen, stale cache files are only opportunistically reaped later by `cleanupStaleOptimizedUploads()` on future optimization requests. There is no promise that optimized cache files survive beyond preparation/send time.
4. **Contract reality:** the optimized cache path is still **used at send/preparation time** because the descriptor is currently rewritten to point at it, and that path can propagate into manifests/history/subagent-forwarded path metadata. But it is **not a durable lifecycle contract**: the same code marks it as a temp derivative, requests cleanup right after send, and only retains it via stale-cache TTL as a fallback. In other words, code still leaks the temp path into contracts, but the system behavior treats it as ephemeral.

**Recommendation:** shift the manifest/reference model to make the staged source path the canonical durable `reference.path` for browser uploads (and, more generally, the original validated source path for path-backed uploads). Keep the optimized cache artifact as explicit transient metadata — for example under `optimization.optimized` or a future send-time/forward-time field — rather than making it the primary persisted reference. That would align the contract with actual lifecycle behavior: staged/original path is the reliable handoff surface, optimized cache path is a transient implementation detail used to improve send-time payloads.
---

## Final Results

**Status:** ⚠️ Partial

**What We Built:** Completed the code-level investigation of the optimized upload cache lifecycle. The repo now has a documented finding in this plan: staged/original upload paths are the durable handoff surface, while `~/.cache/openclaw/nerve/optimized-uploads/...` remains a transient derivative that is still leaked into current manifests/references even though cleanup logic treats it as ephemeral. Documentation/code follow-up for making the staged path explicitly canonical is still pending under Task 1.

**Commits:**
- Pending (no tracked code/docs changed beyond this plan update yet)

**Lessons Learned:** The current implementation has a mismatch between behavior and contract: optimized derivatives are intentionally short-lived, but successful optimization still rewrites the outward-facing `reference.path` to the temp cache path. The clean fix direction is to keep optimization metadata explicit while restoring the staged/original path as the canonical persisted reference.

---

*Updated on 2026-03-21*
