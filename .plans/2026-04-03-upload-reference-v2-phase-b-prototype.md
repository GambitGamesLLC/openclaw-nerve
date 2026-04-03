---
plan_id: plan-2026-04-03-upload-reference-v2-phase-b-prototype
bead_ids:
  - nerve-ba0n
  - nerve-j8s8
  - nerve-zgjc
---
# Gambit OpenClaw Nerve — upload/reference v2 Phase B prototype

**Date:** 2026-04-03  
**Status:** Partial  
**Agent:** Chip 🐱‍💻

---

## Goal

Implement the first Phase B upload/reference v2 prototype slice in `gambit-openclaw-nerve`: the server-side canonical resolution/import contract and its validation/tests, while keeping the live deployment pinned to the current stable snapshot until the prototype is proven ready for dogfooding.

---

## Overview

Phase A established the product/UX spec, technical contract, upstream slicing plan, and the eventual reversible `~/.openclaw/.env` branch-switch process for dogfooding. Phase B starts with the most architecture-heavy and reviewable slice: the canonical resolution/import contract. That means we deliberately avoid changing the chat composer affordance or the live deployment target in the first pass.

The working theory is that if the server can reliably normalize a user-selected item into either a direct canonical workspace reference or an imported canonical staged reference, then the rest of the UI can be simplified on top of a stable contract. So this execution pass will create the prototype branch, audit the relevant attachment code paths, implement/tighten the contract, add focused tests, and then assess whether the branch is mature enough for the future `.env` cutover.

---

## Tasks

### Task 1: Create the prototype branch and map the current attachment-resolution flow

**Bead ID:** `nerve-ba0n`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-ba0n` at start with `bd update nerve-ba0n --status in_progress --json`, create or verify the prototype branch for upload/reference v2 work, inspect the current attachment-resolution/import pipeline, and summarize the concrete files/functions/interfaces that must change for the server-side contract slice. Close the bead on completion with `bd close nerve-ba0n --reason "Prototype branch created and resolution flow mapped" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`
- repo working tree as needed

**Files Created/Deleted/Modified:**
- `.plans/2026-04-03-upload-reference-v2-phase-b-prototype.md`
- code/test files to be determined by implementation

**Status:** ✅ Complete

**Results:** Prototype branch `feature/upload-reference-v2` created from `snapshot/2026-03-22-origin-master-stable`. Current split flow mapped as follows:
- `server/routes/file-browser.ts` → `GET /api/files/resolve` validates a workspace-relative path via `server/lib/file-utils.ts::resolveWorkspacePath()` and returns the canonical workspace-relative path used by the current Attach-by-Path UI.
- `src/features/chat/InputBar.tsx::attachSelectedServerPath()` consumes `/api/files/resolve`, rebuilds an absolute path with `buildAbsoluteWorkspacePath()`, wraps it in `createServerPathBackedFile()`, and stages a `StagedAttachment` with `origin: 'server_path'` + `mode: 'file_reference'`.
- `src/features/chat/InputBar.tsx::stageBrowserUploads()` posts browser-selected `File` objects to `POST /api/upload-stage`.
- `server/routes/upload-stage.ts` delegates to `server/lib/upload-staging.ts::stageUploadFile()` which imports uploaded bytes into the canonical staging root under `~/.openclaw/workspace/.temp/nerve-uploads/...` and returns absolute staged file metadata.
- `src/features/chat/InputBar.tsx::buildFileReferenceDescriptor()` turns either staged uploads or direct workspace files into `UploadAttachmentDescriptor` values (current shared interface in `src/features/chat/types.ts`) using `resolveFileReference()` plus optional `optimizeFileReference()` metadata.
- `src/features/chat/operations/sendMessage.ts::appendUploadManifest()` serializes those descriptors into the transcript payload, and `server/lib/subagent-spawn.ts` later forwards `file_reference` descriptors to child runs using the same path-first semantics.

This confirmed the right Phase B slice: add a server-owned canonical resolution/import contract above the existing `/api/files/resolve` + `/api/upload-stage` split without touching the composer simplification yet.

---

### Task 2: Implement the canonical resolution/import contract and focused tests

**Bead ID:** `nerve-j8s8`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, after Task 1 context is clear, claim bead `nerve-j8s8` at start with `bd update nerve-j8s8 --status in_progress --json`, implement/tighten the upload/reference v2 server-side contract so a selected item resolves to either a direct canonical workspace reference or an imported canonical staged reference, add trust-boundary checks and focused regression tests, and close the bead on completion with `bd close nerve-j8s8 --reason "Canonical resolution/import contract implemented and tested" --json`.

**Folders Created/Deleted/Modified:**
- `server/lib/`
- `server/routes/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `server/lib/upload-reference.ts`
- `server/lib/upload-reference.test.ts`
- `server/routes/upload-reference.ts`
- `server/routes/upload-reference.test.ts`
- `server/app.ts`
- `.plans/2026-04-03-upload-reference-v2-phase-b-prototype.md`

**Status:** ✅ Complete

**Results:** Implemented the first server-owned canonical resolution/import contract slice without changing the existing two-entry composer UX:
- Added `server/lib/upload-reference.ts` with two trust-boundary-enforced outcomes:
  - `direct_workspace_reference` via `resolveDirectWorkspaceReference(relativePath)`
  - `imported_workspace_reference` via `importExternalUploadToCanonicalReference({ originalName, mimeType, bytes })`
- The helper normalizes every successful result to the same contract shape: `kind`, `canonicalPath` (workspace-relative primary reference), `absolutePath`, `uri`, `mimeType`, `sizeBytes`, and `originalName`.
- Direct-path resolution reuses `resolveWorkspacePath()` so traversal, exclusions, and symlink escapes are rejected by the server before any canonical reference is emitted.
- Imported uploads still stage through `stageUploadFile()`, but the new contract now re-validates the staged output against `getWorkspaceRoot()` so a misconfigured staging root outside the workspace is rejected instead of silently becoming a non-canonical reference.
- Added `server/routes/upload-reference.ts` exposing `POST /api/upload-reference/resolve` as the server contract surface for JSON workspace paths now and multipart upload imports next. Current focused route coverage exercises the JSON/direct-reference path; helper coverage exercises imported-upload canonicalization and staging-root trust failures.
- Kept the current composer code (`InputBar.tsx`, `sendMessage.ts`, existing descriptor shapes) untouched for this slice, per Phase B boundaries. No `~/.openclaw/.env`, `update.sh`, or `restore.sh` changes.

Focused regression coverage added:
- `server/routes/upload-reference.test.ts` verifies canonical direct resolution and symlink-escape rejection.
- `server/lib/upload-reference.test.ts` verifies imported uploads land under canonical staged workspace paths and that staging-root escape is rejected.

---

### Task 3: Verify the prototype slice and decide readiness for future dogfood cutover

**Bead ID:** `nerve-zgjc`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, after implementation is done, claim bead `nerve-zgjc` at start with `bd update nerve-zgjc --status in_progress --json`, run the relevant tests/build verification for the resolution/import contract slice, summarize what passed, what remains before composer work, and explicitly state whether the branch is or is not ready for the future reversible `~/.openclaw/.env` cutover. Close the bead on completion with `bd close nerve-zgjc --reason "Prototype slice verified and dogfood readiness assessed" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-03-upload-reference-v2-phase-b-prototype.md`

**Status:** ✅ Complete

**Results:** Verification run completed on `feature/upload-reference-v2` (HEAD `9aca6e92d74db07e671e0e391e7766a03876c574`):
- `npm test -- server/routes/upload-reference.test.ts server/lib/upload-reference.test.ts server/routes/upload-stage.test.ts server/routes/upload-optimizer.test.ts server/lib/subagent-spawn.test.ts`
  - Result: **pass** (`5` files, `19` tests)
  - Notes: existing config warnings appeared in HOME-isolated tests because repo-local Beads source env points outside the temp workspace; no functional failures.
- `npm run build:server`
  - Result: **pass**

Dogfood readiness assessment for future reversible `~/.openclaw/.env` cutover: **not ready yet**.

Why not ready yet:
- The new canonical server contract exists, but the live composer still uses the old split `/api/files/resolve` + `/api/upload-stage` path and still exposes separate `Upload files` / `Attach by Path` entrypoints.
- The transcript/UI layer still renders legacy `origin` semantics (`upload` vs `server_path`) rather than the future v2 direct/imported mental model.
- The new multipart route surface is present, but this slice intentionally did not rewire the client to rely on it end-to-end or run human/browser validation against the actual deployed Nerve instance.
- No reversible `.env` branch switch was attempted, per plan boundaries.

Conservative readiness call: the branch is **ready for the next implementation slice**, not for live dogfood cutover yet.

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:**
- Created/verified the prototype branch `feature/upload-reference-v2`.
- Mapped the current attachment-resolution/import pipeline and documented the concrete handoff points between `file-browser`, `upload-stage`, `InputBar`, manifest serialization, and subagent forwarding.
- Added a new server-side canonical contract layer in `server/lib/upload-reference.ts` plus `POST /api/upload-reference/resolve` in `server/routes/upload-reference.ts`.
- The new contract guarantees one of two canonical outcomes for this slice:
  - `direct_workspace_reference`
  - `imported_workspace_reference`
- Added focused regression tests for canonical direct resolution, staged import canonicalization, symlink escape rejection, and staging-root trust-boundary rejection.
- Verified the slice with targeted Vitest coverage plus a server build.

**Commits:**
- None in this run. Current base commit remains `9aca6e92d74db07e671e0e391e7766a03876c574` on `feature/upload-reference-v2`.

**Lessons Learned:**
- The smallest coherent Phase B slice is a server-owned canonicalization layer that sits above the current split UI flow; this lets the composer refactor happen later against a stable contract.
- Trust-boundary checks need to cover both direct-path resolution and imported staging output; otherwise a staging-root config mistake could silently violate the v2 invariant.
- Dogfood cutover should wait until the client actually consumes the new contract end-to-end and the user-visible attachment model is simplified enough to match the Phase A spec.

**Recommended Next Slice:**
- Rewire the composer/workspace-browser integration to consume the new canonical contract end-to-end while preserving current descriptor compatibility for history/subagent forwarding.
- After that, collapse the dual attach affordance into the single-paperclip v2 UX and run human/browser validation before any reversible `~/.openclaw/.env` cutover.

---

*Updated on 2026-04-03*