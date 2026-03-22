---
plan_id: plan-2026-03-22-nerve-canonical-reference-path-followup
bead_ids:
  - nerve-6jz
  - nerve-xw0
---
# gambit-openclaw-nerve

**Date:** 2026-03-22  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Make Nerve emit the durable staged upload path as the primary outgoing `reference.path`, while preserving any optimized-cache artifact only as explicit metadata.

---

## Overview

Yesterday’s upload staging work established a clear contract that the canonical durable upload lives under `~/.openclaw/workspace/.temp/nerve-uploads/...`, while the optimizer’s cache under `~/.cache/openclaw/nerve/optimized-uploads/...` is a transient derivative. The remaining follow-up is to align the outgoing manifest/reference model with that contract so downstream tools, agents, and humans see the durable path first instead of an ephemeral optimization artifact.

This should be treated as a product-contract cleanup, not just a refactor. We want to preserve the useful distinction between canonical staged source and optimized derivative, but the optimized derivative should no longer masquerade as the main file reference. The implementation should keep enough metadata for consumers to understand when an optimized artifact exists, and validation should confirm the new outgoing shape works with real staged uploads without regressing the chat/upload surfaces that were fixed yesterday.

---

## Tasks

### Task 1: Align outgoing attachment/reference model to canonical staged path

**Bead ID:** `nerve-6jz`  
**SubAgent:** `coder`  
**Prompt:** Implement bead `nerve-6jz` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`. Start by claiming it with `bd update nerve-6jz --status in_progress --json`. Change the outgoing attachment/reference model so the primary `reference.path` prefers the durable staged workspace upload path under `~/.openclaw/workspace/.temp/nerve-uploads/...` rather than the transient optimized cache derivative under `~/.cache/openclaw/nerve/optimized-uploads/...`. Preserve optimized artifact details as explicit metadata only, update tests/docs as needed, commit the repo changes, and close the bead with `bd close nerve-6jz --reason "Aligned outgoing reference.path to canonical staged source" --json`.

**Folders Created/Deleted/Modified:**
- upload/runtime code paths to be discovered
- server/
- src/
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-22-nerve-canonical-reference-path-followup.md`
- `src/features/chat/InputBar.tsx`
- `src/features/chat/InputBar.test.tsx`

**Status:** ✅ Complete

**Results:** Implemented in commit `81a4131` (`Keep canonical staged paths in upload descriptors`). Root cause was in `src/features/chat/InputBar.tsx`, where successful file-reference image descriptors were being rewritten to the optimizer's transient derivative, including swapping the outward-facing `reference.path` / `reference.uri` to `~/.cache/openclaw/nerve/optimized-uploads/...`. The fix keeps the primary descriptor anchored to the original staged/source reference while preserving optimized artifact details only under `descriptor.optimization`. Focused tests were updated in `src/features/chat/InputBar.test.tsx` to assert that the primary `reference.path` stays on the staged/source file and any optimized derivative remains metadata-only. The subagent ran `npm test -- --run src/features/chat/InputBar.test.tsx src/features/chat/operations/sendMessage.test.ts src/features/chat/operations/loadHistory.test.ts server/lib/subagent-spawn.test.ts server/routes/gateway.test.ts` and reported `5` test files / `102` tests passing.

---

### Task 2: Validate canonical-path behavior with real upload flows

**Bead ID:** `nerve-xw0`  
**SubAgent:** `primary`  
**Prompt:** Implement bead `nerve-xw0` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve` after `nerve-6jz` is complete. Start by claiming it with `bd update nerve-xw0 --status in_progress --json`. Use real staged upload artifacts or an equivalent local validation path to confirm outgoing attachments now expose the durable staged source as the primary `reference.path`, while any optimized derivative remains metadata-only. Re-run the relevant focused tests, update this plan with the concrete findings and any caveats, commit tracked validation/docs changes if needed, and close the bead with `bd close nerve-xw0 --reason "Validated canonical staged path as outgoing reference" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`
- validation-related paths to be discovered

**Files Created/Deleted/Modified:**
- `.plans/2026-03-22-nerve-canonical-reference-path-followup.md`
- any validation notes kept in repo

**Status:** ✅ Complete

**Results:** Validated via an equivalent local verification path using a real staged browser-upload artifact already present on disk: `/home/derrick/.openclaw/workspace/.temp/nerve-uploads/2026/03/22/Chip_With_Drones_Realistic-caa9d54e.png` (`1479896` bytes, `image/png`, `1408×768`). I ran a one-off `tsx` validation script against the repo's actual `server/lib/upload-optimizer.ts` logic to optimize that staged file and then reconstructed the current `InputBar` file-reference descriptor shape exactly as the live send path now does: primary `reference.path` / `reference.uri` remained anchored to the staged source file, while the generated optimized derivative lived only under `optimization.optimized` plus the `artifacts` comparison metadata. The optimizer produced `/home/derrick/.cache/openclaw/nerve/optimized-uploads/Chip_With_Drones_Realistic-caa9d54e-8fb5d300.webp` (`98972` bytes, `image/webp`, `1408×768`), and the validation checks confirmed both `primaryReferenceStayedCanonical: true` and `optimizedDerivativeMetadataOnly: true`. The temporary optimized derivative was then cleaned up with the repo's own `deleteOptimizedUploads()` helper.

This was **not** an end-to-end live browser send/agent roundtrip; it was an equivalent local verification path using a real staged upload artifact plus the exact optimizer library/runtime metadata contract that the live send path consumes. I also re-ran the focused regression suite that covers descriptor creation, manifest embedding, and history rehydration: `npm test -- --run src/features/chat/InputBar.test.tsx src/features/chat/operations/sendMessage.test.ts src/features/chat/operations/loadHistory.test.ts` → `3` files / `73` tests passed. Vitest emitted pre-existing React `act(...)` warnings in `InputBar.test.tsx`, but the run completed green.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Nerve's outgoing file-reference contract is now both implemented and validated around the durable staged upload path. The implementation change in `81a4131` keeps the outward-facing `reference.path` on the canonical staged/source artifact, and this follow-up verification confirmed that a real staged upload still produces optimization metadata without letting the transient cache derivative take over as the primary reference.

**Commits:**
- `81a4131` - Keep canonical staged paths in upload descriptors
- `Pending in working tree` - plan-only validation notes for `nerve-xw0` (no code changes required)

**Lessons Learned:** The strongest practical verification here is a real staged artifact plus the real optimizer/runtime contract, because the optimized cache file is intentionally ephemeral. That gives a trustworthy check of the descriptor shape while avoiding over-claiming that a full live send/roundtrip was exercised.

---

*Drafted on 2026-03-22*
