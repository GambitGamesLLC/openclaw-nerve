---
plan_id: plan-2026-03-17-post-manifest-sanitization-inline-verification
bead_ids:
  - nerve-bod
  - nerve-efh
---
# gambit-openclaw-nerve

**Date:** 2026-03-17  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Run a fresh live verification pass after the manifest sanitization fix to confirm large inline image uploads no longer blow up agent context or trigger the old compaction failure pattern.

---

## Overview

We now have a tighter diagnosis than before. The adaptive browser-side shrinker appears to have been functioning, but the outgoing `<nerve-upload-manifest>` text path was still leaking inline image payload data into agent-visible context through `inline.previewUrl`, and potentially through `inline.base64` when explicit exposure was enabled. That means a verification pass now needs to validate not only that the image still sends successfully, but that the session remains healthy afterward and the manifest no longer carries payload-bearing inline fields.

This pass should use the same or equivalent large inline image that previously reproduced the failure. We want to confirm three things in one slice: first, the upload still succeeds with adaptive shrinking; second, the agent-visible manifest contains only safe metadata; and third, the session does not immediately balloon toward the prior ~294k-token compaction failure. If the pass succeeds, we can close the loop on the inline-upload regression with much higher confidence.

---

## Tasks

### Task 1: Prepare the verification checklist and bead linkage

**Bead ID:** `nerve-bod`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, prepare a concise live verification checklist for the post-manifest-sanitization inline upload retest, including exactly what to observe before send, during send, immediately after send, and after the assistant replies. Claim the bead at start and close it at completion.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-post-manifest-sanitization-inline-verification.md`

**Status:** ✅ Complete

**Results:**
- Live retest checklist prepared for the operator. Do **not** run it yet.
- Checklist:
  1. **Before send:** confirm Nerve is connected to the gateway, target session is healthy/selected, composer is in `inline` image mode, and the staged attachment summary/debug chips are visible so the send-prep metadata can be read.
  2. **Choose the test image:** use the same original large browser-origin image that previously reproduced the inline-context problem (the ~8 MB `Chip_With_Drones_Cute.png`, or an equivalent very large opaque image only if the original is unavailable). Prefer browser-origin upload again so `localPathAvailable=false` stays in scope.
  3. **After staging, inspect UI metadata before sending:** verify the staged attachment shows optimization/preparation details rather than a raw huge payload. Capture `mimeType`, `originalSizeBytes`, `base64Bytes`, `preparation.outcome`, `reason`, `inlineChosenWidth`, `inlineChosenHeight`, `inlineIterations`, `inlineMinDimension`, `finalMode`, `localPathAvailable`, and `policy.forwardToSubagents`. Expected healthy pattern for the opaque large-image retest: `preparation.outcome=optimized_inline`, `finalMode=inline`, `mimeType=image/webp`, and `base64Bytes` at or under the ~125 KB context-safe budget.
  4. **Immediately after send:** confirm the message sends normally with no composer-side block, no request-failure banner, no dead-session/error transition, and no disconnect/reconnect loop. The upload bubble/summary should still read like a safe inline send and should not suddenly surface payload-bearing inline fields.
  5. **Inspect the agent reply / manifest summary:** verify the assistant receives useful attachment metadata and can acknowledge the image, but the manifest summary no longer exposes payload-bearing `inline.previewUrl` data URLs or `inline.base64` bytes. Safe metadata such as type, size, dimensions, optimization outcome, and mode is expected; raw data URL/base64 body exposure is the regression to watch for.
  6. **Judge session health vs regression:** treat the pass as healthy if the send succeeds, the assistant replies normally, the manifest stays metadata-only, and the session remains responsive after the turn without falling into the old compaction/request-failure pattern. Treat it as regressed if payload text leaks back into the manifest summary, the send is blocked unexpectedly despite fitting after shrink, the session flips into request-failed/dead behavior right after upload, the reply stalls/fails, or context symptoms resembling the old blow-up return.
- Operator prerequisites: run against the updated runtime that already includes the adaptive-shrink pass and the manifest-sanitization fix; have the original large test image available; keep the pass observation-only unless a fresh regression is found.

---

### Task 2: Perform the live inline upload verification pass and capture the outcome

**Bead ID:** `nerve-efh`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, perform a live verification pass for the post-manifest-sanitization inline upload fix using the original large inline test image if available. Confirm the upload remains safe, check that the agent-visible manifest no longer leaks payload-bearing inline fields, record the observed optimization/result metadata, and capture whether the session stays healthy after the assistant reply. Claim the bead at start and close it at completion.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- runtime inspection paths as needed during verification

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-17-post-manifest-sanitization-inline-verification.md`
- repo files only if a safe verification-time fix is required

**Status:** ✅ Complete

**Results:**
- Live retest completed in the Nerve UI against the connected `Chip (main)` session using the original large test image found at `/home/derrick/Downloads/Chip_With_Drones_Cute.png` (~8 MB PNG, copied into workspace for browser injection during the pass).
- Staged/send configuration observed before send:
  - selected mode: `inline`
  - forwarding: enabled (`Forward to subagents` checked before send)
  - staged file: `Chip_With_Drones_Cute.png`
  - staged size: `7.7 MB`
- Post-send manifest behavior (live failure): the operator bubble rendered a literal `<nerve-upload-manifest>` containing an attachment object with:
  - `mode: "inline"`
  - `mimeType: "image/webp"`
  - `sizeBytes: 8048154`
  - `inline.encoding: "base64"`
  - `inline.base64: "UklGRiLxAQB..."` present directly in the manifest text (payload-bearing inline field still leaked)
- Assistant-visible/derived metadata from the same live turn:
  - `base64Bytes: 127274`
  - `outcome: optimized_inline`
  - chosen dimensions: `1741 x 1741`
  - iterations: `6`
  - budget fit: `124 KB <= 125 KB`
- Fields not cleanly recoverable from the rendered/truncated manifest text in this pass: exact `reason`, `inlineMinDimension`, and explicit serialized `localPathAvailable` / forwarding fields after send. Because the file was injected as a browser `File` object rather than passed as a native filesystem-backed browser upload, treat `localPathAvailable` as effectively **not confirmed** from the runtime output.
- Session health result: **healthy after reply**. The main session stayed responsive, completed the assistant turn normally, and returned to `IDLE` at roughly `181k` tokens instead of regressing into the earlier compaction/request-failure pattern.
- Verification verdict:
  - ✅ large inline browser-side optimization path still works
  - ✅ session remained healthy after the assistant reply
  - ❌ manifest sanitization is still failing the safety criterion in this runtime because `inline.base64` was exposed in the agent-visible manifest text
  - net result: post-manifest-sanitization verification pass **failed** on payload leakage even though the compaction regression did not recur

---

## Final Results

**Status:** ❌ Blocked

**What We Built:** Executed the live post-sanitization inline upload verification pass and captured the runtime behavior. The adaptive inline shrink path still succeeded on the original large image and the session stayed healthy after reply, but the agent-visible `<nerve-upload-manifest>` still leaked `inline.base64`, so the safety goal was not met.

**Commits:**
- None.

**Lessons Learned:** Sanitizing preview/data-URL fields alone was not sufficient for this runtime. The manifest text channel still needs a hard guarantee that payload-bearing inline fields (especially `inline.base64`) can never be surfaced to the assistant, regardless of debug/exposure flags.

---

*Created on 2026-03-17*
