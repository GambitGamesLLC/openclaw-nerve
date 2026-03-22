---
plan_id: plan-2026-03-21-nerve-upload-cost-metadata-and-orchestrator-optimization-tuning
bead_ids:
  - nerve-xru
  - nerve-mz1
  - nerve-1ez
---
# gambit-openclaw-nerve

**Date:** 2026-03-21  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Add exact metadata that helps humans/agents choose between canonical staged uploads and optimized derivatives for review, and retune Nerve’s upload optimization defaults to better fit Derrick’s orchestrator/subagent workflow.

---

## Overview

We just established that `~/.openclaw/workspace/.temp/nerve-uploads/...` should be treated as the canonical durable upload path, while `~/.cache/openclaw/nerve/optimized-uploads/...` is an ephemeral optimization artifact. Derrick’s follow-up question is the right product question: if both versions may exist, how can a human or agent quickly tell which one is more appropriate to inspect as context?

There are really two dimensions here. First, we need useful metadata built only from durable facts: bytes, dimensions, mime type, and clear roles for each artifact (canonical staged source vs optional optimized derivative). We explicitly do not want fake “exact token counts” or model/provider-specific context-cost heuristics that will drift as models improve. Second, for Derrick’s orchestrator pattern, the current optimization target (driving images down aggressively for inline-safe use) is likely over-optimized. If the normal pattern is to pass a path reference to an ephemeral vision-capable subagent, then preserving more detail at a larger budget is often the better tradeoff.

This slice should therefore answer both the UX and policy questions: what metadata should be surfaced, and how should upload optimization defaults/config be changed so they fit an orchestrator-first workflow without losing flexibility for other Nerve users.

---

## Tasks

### Task 1: Add exact metadata for canonical vs optimized upload variants

**Bead ID:** `nerve-xru`  
**SubAgent:** `coder`  
**Prompt:** Implement bead `nerve-xru` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`. Start by claiming it with `bd update nerve-xru --status in_progress --json`. Inspect the current upload manifest / metadata model and implement a lightweight way to expose exact comparison metadata for the canonical staged upload and any optimized derivative. Include only durable facts such as bytes, mime type, dimensions, and explicit artifact roles (canonical staged source vs optimized derivative). Do not add token estimates or rough context-cost heuristics. Make the metadata easy for humans/agents to use when deciding which artifact to inspect. Update tests/docs as needed, commit the repo changes, and close the bead with `bd close nerve-xru --reason "Added exact canonical vs optimized upload metadata" --json`.

**Folders Created/Deleted/Modified:**
- upload/runtime code paths to be discovered
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-21-nerve-upload-cost-metadata-and-orchestrator-optimization-tuning.md`
- implementation/docs files to be discovered

**Status:** ✅ Complete

**Results:** Implemented in commit `40a88d5` (`Add exact canonical vs optimized upload metadata`). The upload optimizer now returns an `artifacts` array with explicit roles (`canonical_staged_source`, `optimized_derivative`) plus exact `sizeBytes`, `mimeType`, `width`, and `height`, and the chat UI renders those labels directly so humans/agents can tell which artifact is durable versus derived at a glance.

---

### Task 2: Retune optimization defaults/config for orchestrator-first use

**Bead ID:** `nerve-mz1`  
**SubAgent:** `coder`  
**Prompt:** Implement bead `nerve-mz1` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`. Start by claiming it with `bd update nerve-mz1 --status in_progress --json`. Review the current optimization thresholds/defaults that currently bias toward tiny inline-safe image payloads (including the current 32KB-oriented behavior Derrick referenced). Propose and implement a better default/config story for an orchestrator/subagent workflow where path-based handoff is preferred and preserving detail matters more than minimizing inline payload size. Derrick specifically wants a much larger preservation target, on the order of ~1 MB rather than ~32 KB, if that matches the actual config model cleanly. Include the exact config/settings changes, docs, and any guardrails needed so other users can still prefer more aggressive optimization if they want. Commit the repo changes and close the bead with `bd close nerve-mz1 --reason "Retuned upload optimization defaults for orchestrator workflow" --json`.

**Folders Created/Deleted/Modified:**
- config/runtime/upload handling paths to be discovered
- docs/
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-21-nerve-upload-cost-metadata-and-orchestrator-optimization-tuning.md`
- implementation/docs/config files to be discovered

**Status:** ✅ Complete

**Results:** Implemented in commit `b393854` (`Retune upload optimization defaults for orchestrator workflow`). File-reference optimization now targets roughly `1 MB` (`1048576` bytes) with a soft ceiling of `1310720` bytes, keeps a larger `4096px` max-dimension budget, and explicitly documents that inline shrinking remains the separate `32 KB` context-safety path for raw base64 attachments.

---

### Task 3: Validate the resulting metadata + policy with a real upload artifact

**Bead ID:** `nerve-1ez`  
**SubAgent:** `primary`  
**Prompt:** Implement bead `nerve-1ez` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve` after `nerve-xru` and `nerve-mz1` are complete. Start by claiming it with `bd update nerve-1ez --status in_progress --json`. Validate with a real staged upload that the metadata makes it obvious which artifact is canonical, which is optimized, and what their exact bytes/mime/dimensions are. Confirm the updated optimization settings produce the intended larger-preservation behavior for Derrick’s workflow. Update this plan with the real outcome, commit repo changes if any tracked files change, and close the bead with `bd close nerve-1ez --reason "Validated upload metadata and tuned optimization with real artifact" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`
- any validation artifact/doc paths discovered during execution

**Files Created/Deleted/Modified:**
- `.plans/2026-03-21-nerve-upload-cost-metadata-and-orchestrator-optimization-tuning.md`
- any validation notes kept in repo

**Status:** ✅ Complete

**Results:** Validated against two real staged uploads already present from today’s Nerve usage, so no synthetic fixture fallback was needed. For `/home/derrick/.openclaw/workspace/.temp/nerve-uploads/2026/03/22/Chip_With_Drones_Realistic-caa9d54e.png`, the canonical staged source was `1479896` bytes at `image/png` and `1408×768`; running the current optimizer produced an optimized derivative at `/home/derrick/.cache/openclaw/nerve/optimized-uploads/Chip_With_Drones_Realistic-caa9d54e-ba4eb8be.webp` with `98972` bytes, `image/webp`, and the same `1408×768` dimensions. That makes the metadata distinction clear in exactly the way Derrick asked for: the canonical staged source is visibly labeled as the durable source artifact, while the optimized derivative is separately labeled with its own exact bytes/mime/dimensions. For `/home/derrick/.openclaw/workspace/.temp/nerve-uploads/2026/03/22/bf029e1a-6180-4428-871c-87fbb5c7061e-7c08a8d9.jpg`, the staged mobile upload was already under the new preservation target (`643921` bytes at `image/jpeg`, `1600×1200`), so the optimizer correctly returned `optimized: false` and preserved the canonical staged file instead of recompressing it. This confirms the larger-preservation tuning matches Derrick’s workflow: files already within the ~1 MB preservation budget stay canonical, while larger files can still get a derived optimization artifact without unnecessary resolution loss. Also re-ran the focused regression suite (`server/lib/upload-optimizer.test.ts`, `server/routes/upload-optimizer.test.ts`, `src/features/chat/MessageBubble.uploadSummary.test.tsx`, `src/features/chat/InputBar.test.tsx`, `src/features/chat/uploadPolicy.test.ts`, `server/routes/upload-config.test.ts`, `server/lib/config.test.ts`) and it passed (`7` files, `84` tests).

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Nerve now exposes exact artifact comparison metadata for uploads and uses an orchestrator-friendly optimization policy. Real staged-upload validation showed the UI/API clearly distinguish the canonical staged source from any optimized derivative using explicit role labels plus exact bytes, mime type, and dimensions.

**Commits:**
- `40a88d5` - Add exact canonical vs optimized upload metadata
- `b393854` - Retune upload optimization defaults for orchestrator workflow
- validation plan update committed with message `docs(plan): record real upload metadata validation outcome`

**Lessons Learned:** For long-lived product metadata, durable facts beat speculative heuristics. Bytes, mime type, dimensions, and artifact role are stable; token/context-cost estimates are model-dependent and likely to drift over time. The real-world check also confirmed Derrick’s workflow wants two different budgets: a tiny inline base64 budget for prompt safety, and a much larger file-reference preservation budget for staged path handoff.

---

*Completed on 2026-03-21*
