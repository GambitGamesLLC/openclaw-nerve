---
plan_id: plan-2026-04-03-upload-reference-v2-phase-b-client-integration
bead_ids:
  - nerve-7cfz
  - nerve-88ch
  - nerve-w7wh
---
# Gambit OpenClaw Nerve — upload/reference v2 Phase B client integration

**Date:** 2026-04-03  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Rewire the composer and workspace-browser attachment flow in `gambit-openclaw-nerve` to consume the new server-side canonical upload/reference contract end-to-end, while preserving current descriptor/history/subagent compatibility and keeping the live deployment pinned to the stable snapshot until the branch is actually ready for dogfooding.

---

## Overview

The first Phase B slice established the server-side canonical contract and verification surface. This slice moved real client attachment actions onto that contract: browser-upload import and workspace-path attachment from the composer now both resolve through `/api/upload-reference/resolve` instead of the old split `/api/upload-stage` + `/api/files/resolve` attachment path.

The compatibility requirement held the shape of the client changes. Rather than changing downstream descriptor/history behavior, the client now consumes the canonical response, then rehydrates the same `local_path`-based outgoing descriptors, preview behavior, optimization flow, and subagent-forwarding defaults that the rest of the chat pipeline already expects. The visible dual attachment affordance remains in place for now; this slice intentionally prioritized contract adoption over UX simplification.

---

## Tasks

### Task 1: Map and rewire composer/workspace-browser client call sites to the canonical contract

**Bead ID:** `nerve-7cfz`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-7cfz` at start with `bd update nerve-7cfz --status in_progress --json`, identify the exact composer and workspace-browser call sites still using `/api/files/resolve` and `/api/upload-stage`, then rewire them to consume the new canonical upload/reference contract end-to-end with the smallest coherent client changes. Close the bead on completion with `bd close nerve-7cfz --reason "Composer/workspace-browser flows rewired to canonical contract" --json`.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/chat/InputBar.tsx`
- `.plans/2026-04-03-upload-reference-v2-phase-b-client-integration.md`

**Status:** ✅ Complete

**Results:**
- Identified the remaining attachment-flow legacy call sites in `src/features/chat/InputBar.tsx`:
  - browser uploads used `/api/upload-stage`
  - Attach by Path used `/api/files/resolve`
- Replaced both attachment-flow call sites with the canonical `/api/upload-reference/resolve` contract.
- Added small client-side helpers for:
  - importing browser-selected files into canonical workspace references
  - resolving validated workspace paths into canonical workspace references
- Kept the current visible UX intact:
  - still shows separate **Upload files** and **Attach by Path** actions
  - did **not** collapse to one paperclip flow yet
- Kept non-attachment workspace opening/reveal behavior in `App.tsx` untouched for this slice; it still uses `/api/files/resolve` because that flow needs file/directory metadata rather than canonical attachment metadata.

---

### Task 2: Preserve descriptor/history/subagent compatibility and add focused client/server tests

**Bead ID:** `nerve-88ch`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, after the rewiring path is clear, claim bead `nerve-88ch` at start with `bd update nerve-88ch --status in_progress --json`, ensure the rewired flow preserves existing manifest/history/subagent compatibility while adopting the canonical contract, and add focused tests for direct workspace references, imported external files, and workspace-browser insertion paths. Close the bead on completion with `bd close nerve-88ch --reason "Compatibility preserved and focused integration tests added" --json`.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/chat/InputBar.tsx`
- `src/features/chat/InputBar.test.tsx`
- `.plans/2026-04-03-upload-reference-v2-phase-b-client-integration.md`

**Status:** ✅ Complete

**Results:**
- Preserved outgoing attachment compatibility by continuing to emit the same downstream shapes:
  - `origin: 'upload' | 'server_path'`
  - `mode: 'file_reference'`
  - `reference.kind: 'local_path'`
  - same optimization metadata shape
  - same manifest/subagent-forwarding defaults
- Switched the source of truth for absolute paths and canonical relative paths to the canonical contract response instead of client-side path reconstruction.
- Updated focused InputBar tests so they now mock `/api/upload-reference/resolve` for both JSON and multipart flows.
- Added assertions that the attachment flow no longer hits legacy endpoints during send preparation:
  - Attach by Path path-resolution test asserts no `/api/files/resolve`
  - browser-upload send test asserts no `/api/upload-stage`
- Existing server-side focused tests for:
  - direct workspace references
  - imported external files
  continued to pass unchanged against the canonical server contract.

---

### Task 3: Verify end-to-end slice readiness and assess whether single-paperclip UX can be the next narrow step

**Bead ID:** `nerve-w7wh`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, after implementation/testing is done, claim bead `nerve-w7wh` at start with `bd update nerve-w7wh --status in_progress --json`, run the narrowest meaningful verification for the client-integration slice, summarize what passed, what still reflects legacy UX, and explicitly assess whether the branch is ready for the next single-paperclip simplification step and whether it is or is not ready for a future reversible `~/.openclaw/.env` dogfood cutover. Close the bead on completion with `bd close nerve-w7wh --reason "Client integration slice verified and next-step readiness assessed" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-03-upload-reference-v2-phase-b-client-integration.md`

**Status:** ✅ Complete

**Results:**
- Verification run:
  - `npm test -- --run src/features/chat/InputBar.test.tsx server/routes/upload-reference.test.ts server/lib/upload-reference.test.ts`
  - `npx tsc -b`
- Verification outcome:
  - targeted client tests passed
  - targeted server canonical-contract tests passed
  - TypeScript build check passed
- Legacy behavior that still remains:
  - the visible two-action attachment UX (**Upload files** vs **Attach by Path**) is still present by design
  - generic workspace open/reveal in `App.tsx` still uses `/api/files/resolve`; that is outside this attachment-contract slice
  - legacy server routes still exist for other callers / compatibility, including `upload-stage`
- Readiness assessment:
  - **Ready for the next narrow step:** yes — the next slice can safely focus on simplifying the visible attachment UX toward the later single-paperclip flow because the underlying attachment contract is now canonicalized in the composer path.
  - **Ready for future reversible `~/.openclaw/.env` dogfood cutover:** **not yet recommended**. Attachment flows are now on the canonical contract, but there is still adjacent legacy client/server surface and the UX has not yet been simplified/soak-tested. A reversible dogfood cutover should wait until the next slice lands and gets a short stability pass.

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- Rewired composer browser uploads to import through `/api/upload-reference/resolve`.
- Rewired Attach by Path to resolve canonical direct workspace references through `/api/upload-reference/resolve`.
- Preserved current descriptor/history/subagent compatibility by continuing to emit the same downstream attachment descriptor shapes.
- Updated focused tests to validate the canonical client contract path and to assert the attachment flow no longer depends on the old split endpoints.
- Documented verification results and next-step readiness.

**Commits:**
- No new commit created in this slice run.

**Lessons Learned:**
- The cleanest migration path is to swap the attachment-source contract first while leaving descriptor consumers alone.
- `App.tsx` still has a legitimate non-attachment use of `/api/files/resolve`, so not every legacy call site should be folded into the canonical attachment endpoint.
- The single-paperclip UX step is now easier to scope because the underlying composer attachment plumbing is no longer split across two server contracts.

---

*Completed on 2026-04-03*
