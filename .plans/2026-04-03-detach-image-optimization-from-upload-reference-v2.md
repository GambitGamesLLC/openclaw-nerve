---
plan_id: plan-2026-04-03-detach-image-optimization-from-upload-reference-v2
bead_ids:
  - nerve-i6ij
  - nerve-x9kn
  - nerve-a05w
---
# Gambit OpenClaw Nerve — detach image optimization from upload/reference v2

**Date:** 2026-04-03  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Remove image/file optimization behavior from the `feature/upload-reference-v2` branch so the branch stays focused on canonical attachment/reference behavior, and treat optimization as a separate future issue/PR lane.

---

## Overview

Derrick corrected the scope for the branch that will become the upload/reference v2 feature/PR: this branch should tell a clean maintainer story about **how Nerve resolves a durable canonical reference** for an attachment, not about whether Nerve also creates optional optimized derivatives for some image paths. The current branch still carries the older optimizer lane from March, including config/env knobs, routes, client fetches, manifest metadata, cleanup behavior, UI badges, and focused tests.

The audit in this run confirmed that optimization is still materially coupled to the current branch in three places:
- **send-time behavior**: `InputBar` still calls `/api/upload-optimizer` for image `file_reference` descriptors and records derivative metadata;
- **post-send lifecycle**: `ChatContext` still tries to delete temp optimized derivatives after send success;
- **contract / presentation / tests**: config surfaces, descriptor types, upload summary UI, docs, and tests still describe optimization as part of the active attachment model.

For the upload/reference v2 branch, that is too much product policy mixed into the attachment pitch. The clean branch story should be:
- one attach flow;
- canonical reference resolution (`direct_workspace_reference` or `imported_workspace_reference`);
- durable primary `reference.path` semantics;
- transcript/history/subagent forwarding that preserve the canonical reference.

Optimization can still be a valid follow-up, but it should re-enter later as an explicitly opinionated enhancement layered on top of the path contract rather than co-owned by the first upstream attachment PR.

---

## Tasks

### Task 1: Audit and map optimization touchpoints still active in the branch

**Bead ID:** `nerve-i6ij`  
**SubAgent:** `primary`

**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-i6ij` at start with `bd update nerve-i6ij --status in_progress --json`, audit the current `feature/upload-reference-v2` branch and identify every active image/file optimization touchpoint that is still coupled to the attachment flow. Write the exact files, routes, client hooks, manifest fields, and tests involved. Close the bead on completion with `bd close nerve-i6ij --reason "Optimization touchpoints in upload/reference v2 audited" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-03-detach-image-optimization-from-upload-reference-v2.md`

**Status:** ✅ Complete

**Results:** Claimed and completed during this planning pass. Audit findings:

#### A) Client behavior still invokes optimization in the attachment path
- `src/features/chat/InputBar.tsx`
  - `optimizeFileReference()` calls `POST /api/upload-optimizer`.
  - `buildFileReferenceDescriptor()` still conditionally runs the optimizer whenever `uploadConfig.imageOptimizationEnabled` is true and the outgoing `file_reference` is an image.
  - The returned descriptor still carries `optimization: { applied, tempDerivative, cleanupAfterSend, original, optimized, artifacts }`.
  - `prepareInlineItem()` still sets `optimizerAttempted` metadata when inline images downgrade to `file_reference`.
  - The upload-config bootstrap still reads `imageOptimizationEnabled`, `imageOptimizationTargetBytes`, `imageOptimizationMaxBytes`, `imageOptimizationMaxDimension`, and `imageOptimizationWebpQuality` from `/api/upload-config`.

#### B) Post-send cleanup still depends on temp optimized derivatives
- `src/contexts/ChatContext.tsx`
  - `collectOptimizedCleanupPaths()` extracts `descriptor.reference.path` values from file-reference descriptors marked with optimization cleanup metadata.
  - `cleanupOptimizedUploadArtifacts()` posts those paths to `/api/upload-optimizer/cleanup` after successful send.
  - This keeps optimized temp artifact lifecycle in the active attachment flow even though v2 should only care about durable references.

#### C) Server/runtime config and routes still expose optimization as first-class upload behavior
- `server/routes/upload-optimizer.ts`
  - `POST /api/upload-optimizer`
  - `POST /api/upload-optimizer/cleanup`
- `server/lib/upload-optimizer.ts`
  - generates temp derivatives under `~/.cache/openclaw/nerve/optimized-uploads`
  - computes `optimized_derivative` metadata
  - performs stale cleanup + delete logic
- `server/lib/config.ts`
  - still defines and exports upload optimization env/config under `config.upload.optimization.*`
- `server/routes/upload-config.ts`
  - still exposes optimization values to the client (`imageOptimizationEnabled`, target/max bytes, dimension, quality)
- `server/app.ts`
  - still mounts `uploadOptimizerRoutes`
- `.env.example`
  - still documents the optimization env block as active upload config
- `docs/CONFIGURATION.md`
  - still describes file-reference optimization as part of the current upload system

#### D) Shared descriptor / UI / transcript model still includes optimization metadata
- `src/features/chat/types.ts`
  - still defines `UploadOptimizationMetadata`, `UploadArtifactRole`, `UploadArtifactComparisonMetadata`, and the `optimization?` field on `UploadAttachmentDescriptor`
- `src/features/chat/MessageBubble.tsx`
  - still renders optimization-specific summary/badges/text (`REF OPT`, `optimized derivative`, artifact comparison details)
- `src/features/chat/operations/sendMessage.ts` and `src/features/chat/operations/loadHistory.test.ts`
  - still preserve optimization metadata inside the manifest/transcript descriptor shape
- `server/lib/subagent-spawn.ts`
  - still forwards `descriptor.optimization` metadata in path-forwarding manifests and uses `optimization.applied` to canonicalize forwarded names

#### E) Focused tests still lock the branch to optimizer behavior
- `server/lib/upload-optimizer.test.ts`
- `server/routes/upload-optimizer.test.ts`
- `server/routes/upload-config.test.ts`
- `server/lib/config.test.ts`
- `src/features/chat/InputBar.test.tsx`
- `src/features/chat/MessageBubble.uploadSummary.test.tsx`
- `src/features/chat/operations/sendMessage.test.ts`
- `src/features/chat/operations/loadHistory.test.ts`
- `server/lib/subagent-spawn.test.ts`
- `server/routes/gateway.test.ts`

**Audit conclusion:** optimization is still actively coupled to the branch’s file-reference send path, config surface, descriptor schema, transcript/debug rendering, and cleanup lifecycle. It is not just dead code or leftover docs.

---

### Task 2: Define the narrow branch cleanup needed to remove optimization from upload/reference v2

**Bead ID:** `nerve-x9kn`  
**SubAgent:** `primary`

**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, after the audit is clear, claim bead `nerve-x9kn` at start with `bd update nerve-x9kn --status in_progress --json`, use the audit to define the exact cleanup needed so upload/reference v2 no longer applies image/file optimization in this branch. Be explicit about what code/tests/docs need to change and what behavior should remain intact. Close the bead on completion with `bd close nerve-x9kn --reason "Cleanup needed to detach optimization from upload/reference v2 defined" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-03-detach-image-optimization-from-upload-reference-v2.md`

**Status:** ✅ Complete

**Results:** Claimed and completed during this planning pass. Recommended cleanup is intentionally narrow and branch-focused.

#### Exact cleanup to perform in this branch

##### 1) Remove optimizer usage from the attachment send path
- `src/features/chat/InputBar.tsx`
  - delete `optimizeFileReference()`
  - simplify `buildFileReferenceDescriptor()` so it always returns the canonical `descriptorBase` for `file_reference` items without calling `/api/upload-optimizer`
  - remove reads of optimization fields from `/api/upload-config`
  - stop writing `optimization` metadata into outgoing descriptors
  - stop marking `optimizerAttempted` based on file-reference optimization; keep inline-preparation metadata only if it is still required for inline safety/debugging

##### 2) Remove post-send optimized-artifact cleanup from the active attachment path
- `src/contexts/ChatContext.tsx`
  - delete `collectOptimizedCleanupPaths()`
  - delete `cleanupOptimizedUploadArtifacts()`
  - remove the post-send cleanup call tied to upload payloads

##### 3) Remove optimizer route wiring from the active app surface
- `server/app.ts`
  - stop mounting `uploadOptimizerRoutes`
- `server/routes/upload-optimizer.ts`
  - remove from this branch
- `server/lib/upload-optimizer.ts`
  - remove from this branch if nothing else still imports it

##### 4) Remove optimization-specific upload config from the attachment contract
- `server/lib/config.ts`
  - remove `config.upload.optimization.*` fields and their env parsing
- `server/routes/upload-config.ts`
  - stop returning optimization values to the client
- `src/features/chat/uploadPolicy.ts`
  - remove `imageOptimizationEnabled`, `imageOptimizationTargetBytes`, `imageOptimizationMaxBytes`, `imageOptimizationMaxDimension`, and `imageOptimizationWebpQuality` from `UploadFeatureConfig` + defaults

##### 5) Shrink the attachment descriptor model back to canonical-reference concerns
- `src/features/chat/types.ts`
  - remove `UploadOptimizationMetadata`, artifact-role metadata, and `optimization?` from `UploadAttachmentDescriptor`
- `server/lib/subagent-spawn.ts`
  - stop forwarding optimization metadata blocks and stop using `optimization.applied` as name-rewrite logic
  - forwarded attachments should be keyed only off canonical reference/name/mime/policy that still matter for upload/reference v2

##### 6) Remove optimization-specific UI language from transcript/debug surfaces
- `src/features/chat/MessageBubble.tsx`
  - remove `REF OPT` badge logic
  - remove artifact-role rendering (`canonical staged source` vs `optimized derivative`)
  - keep attachment summaries focused on attach flow, canonical reference, inline vs file_reference transport where still relevant, and direct/imported origin only if needed for debugging

##### 7) Update or delete optimization-coupled tests
- delete optimizer-focused suites from this branch:
  - `server/lib/upload-optimizer.test.ts`
  - `server/routes/upload-optimizer.test.ts`
- update remaining tests so they assert the non-optimized branch contract:
  - `server/routes/upload-config.test.ts`
  - `server/lib/config.test.ts`
  - `src/features/chat/InputBar.test.tsx`
  - `src/features/chat/MessageBubble.uploadSummary.test.tsx`
  - `src/features/chat/operations/sendMessage.test.ts`
  - `src/features/chat/operations/loadHistory.test.ts`
  - `server/lib/subagent-spawn.test.ts`
  - `server/routes/gateway.test.ts`
- new expectations should prove:
  - outgoing descriptors keep canonical reference paths only
  - no optimizer route fetch occurs
  - no optimization metadata is embedded in manifests/history
  - no post-send cleanup call to `/api/upload-optimizer/cleanup` occurs

##### 8) Tighten docs/env examples so this branch does not advertise optimization as part of v2
- `.env.example`
  - remove the upload optimization env block from the feature branch’s current attachment story
- `docs/CONFIGURATION.md`
  - remove or move file-reference optimization guidance out of the current attachment/reference documentation path
- any branch-specific planning/docs that still present optimization as part of upload/reference v2 should be updated to label it as deferred follow-up work

#### What should remain intact after optimization is removed
This is the important scope boundary. The branch should still do all of the following:
- resolve **direct workspace references** through `/api/upload-reference/resolve` for files already under the workspace root
- import **external uploads** into the canonical workspace staging area and produce `imported_workspace_reference` results
- emit one primary durable canonical `reference.path` / `reference.uri` for outgoing `file_reference` descriptors
- preserve transcript/history enough to reconstruct the canonical file reference later
- preserve subagent forwarding of canonical path-backed attachments
- preserve inline-image safety behavior only insofar as the branch still needs safe inline attachments; but inline safety should not rely on or advertise separate file-reference optimization
- preserve the single-paperclip / canonical-reference product story from the v2 spec

#### Practical implementation order for the eventual code pass
1. Remove client optimizer calls and cleanup hooks.
2. Remove server optimizer routes/lib + app wiring.
3. Remove config/env surface.
4. Collapse descriptor/types/UI/test expectations.
5. Re-run focused attachment/reference tests only.

This order keeps the branch reviewable and minimizes half-detached states.

---

### Task 3: Define the separate future issue/PR lane for optimization

**Bead ID:** `nerve-a05w`  
**SubAgent:** `primary`

**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, after the cleanup definition is done, claim bead `nerve-a05w` at start with `bd update nerve-a05w --status in_progress --json`, define how image/file optimization should be described as a separate future issue/PR lane rather than part of upload/reference v2. Capture the likely scope, what makes it opinionated, and what should not be mixed into the first upstream attachment pitch. Close the bead on completion with `bd close nerve-a05w --reason "Separate future issue/PR lane for optimization defined" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-03-detach-image-optimization-from-upload-reference-v2.md`

**Status:** ✅ Complete

**Results:** Claimed and completed during this planning pass.

#### Recommended future issue / PR title
- **Optional image derivative optimization for path-backed attachments**

#### Why this must be a separate lane
Optimization is not the same thing as canonical attachment/reference resolution. It adds product policy decisions that upstream may reasonably disagree with:
- whether to create derivatives at all
- when to skip optimization vs recompress
- target bytes / max bytes / max dimension defaults
- PNG-vs-WebP policy
- temp cache location and cleanup semantics
- whether optimization metadata belongs in manifests/transcripts/UI
- whether forwarded children should see optimized artifacts, canonical artifacts, or both

Those are all opinionated choices. The first upstream attachment pitch should not require the maintainer to accept them in order to accept the cleaner attach/reference model.

#### Likely scope of the future lane
If revived later, the optimization lane should be framed as a thin optional layer on top of the canonical reference contract:
- input: a canonical path-backed attachment already resolved by upload/reference v2
- behavior: optionally derive a temporary optimized artifact for delivery/inspection
- invariant: the canonical reference remains primary and durable
- metadata: optimized artifact details are secondary and explicitly marked transient
- cleanup: derivative lifecycle is best-effort and isolated from the core attachment contract

#### What must not be mixed into the first upstream attachment pitch
Do **not** mix these into the first upload/reference v2 PR:
- `/api/upload-optimizer` route introduction or retention
- temp derivative cleanup endpoints / cache TTL logic
- optimizer env/config knobs
- derivative-vs-canonical artifact metadata comparisons
- UI badges like `REF OPT` / `optimized derivative`
- filename rewriting based on optimized artifacts
- transport policy arguments about WebP/PNG/quality ladders

#### Best future sequencing
After upload/reference v2 lands cleanly, the follow-up optimization issue/PR can say:
1. canonical path-backed attachments now exist and are stable
2. some operators may want optional send-time image derivatives for bandwidth / model-delivery / preview reasons
3. here is a strictly secondary derivative layer that never overwrites the canonical path contract

That is a much easier maintainer conversation than shipping both ideas at once.

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- Completed the planning-only scope-correction pass for `feature/upload-reference-v2`.
- Audited the exact optimization touchpoints still coupled to the branch.
- Defined the concrete cleanup needed to remove optimizer behavior from the branch without disturbing the canonical attachment/reference story.
- Defined the separate future issue/PR lane for optional image/file optimization so it does not muddy the first upstream attachment pitch.
- Explicitly recorded what the attachment branch should still do after optimization is removed: canonical direct/imported references, stable primary path semantics, transcript persistence, and coherent subagent forwarding.

**Commits:**
- None in this run. Planning/documentation only.

**Lessons Learned:**
- The branch already has the right core v2 story; the cleanup is mostly about deleting March-era optimizer coupling so the maintainer sees one idea at a time.
- Optimization is valid follow-up work, but it is opinionated enough that bundling it with canonical references would weaken the upstream pitch.
- The durable invariant to protect is simple: attachment success means one canonical path-backed reference exists, regardless of any optional derivative work that may happen later.

---

*Updated on 2026-04-03 during the planning-only detachment pass.*