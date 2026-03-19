---
plan_id: plan-2026-03-18-nerve-human-ui-validation-pass
bead_ids:
  - nerve-nkq
---
# gambit-openclaw-nerve

**Date:** 2026-03-18  
**Status:** Draft  
**Agent:** Chip 🐱‍💻

---

## Goal

Validate the current real-world state of the Nerve UI on Chip with a fresh human/manual test pass now that the production build blocker is resolved.

---

## Overview

Recent Nerve work landed several attachment, plans, beads, and UI-flow changes, and the immediate TypeScript startup regression has now been repaired. The next useful step is not speculative polish — it is a human validation pass against the live UI to see what is actually solid, what is rough, and what still breaks in normal use.

Because Derrick is already actively chatting with me through Nerve, this validation pass can skip basic app-load and session-connect smoke checks and go straight to the attachment workflow. The focus is now the highest-value unresolved user-facing slice: staging an attachment, sending it through the live UI, verifying what reaches the assistant, confirming post-send cleanup, and noting any nearby Plans/Beads or failure-state issues only if they block or distort the attachment test. Findings from this pass should drive any new implementation beads rather than reviving stale assumptions.

---

## Tasks

### Task 1: Run live attachment-focused validation in the current Nerve UI session on Chip

**Bead ID:** `nerve-nkq`  
**SubAgent:** `primary`  
**Prompt:** Pending after Derrick confirms the narrowed test plan. This task will cover live manual validation in the running Nerve UI on Chip, focused specifically on attachment staging, send, delivery, and cleanup behavior; it will capture concrete findings and turn any real defects into targeted follow-up beads.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-nerve-human-ui-validation-pass.md`
- Follow-up notes or plan updates as needed

**Status:** ⏳ In Progress

**Results:** First live attachment test completed with `avatar.png` sent as a path reference. The assistant received both the rendered image and a `<nerve-upload-manifest>` payload describing a `server_path` origin attachment in `file_reference` mode. Manifest details included a durable local file reference under `~/.cache/openclaw/nerve/optimized-uploads/`, optimization metadata showing a temporary derivative was created, and `policy.forwardToSubagents: true`.

Second live test from Derrick's phone initially surfaced an important mobile/browser upload inconsistency: path-reference mode correctly reported that local file-path attach was unavailable on the phone, but an inline image upload first failed with an old-looking error mentioning a `768px` minimum dimension. A subsequent inline retry from the phone then succeeded, which strongly suggests stale client state/bundle rather than a persistent policy regression.

The successful inline delivery carried a `<nerve-upload-manifest>` with:
- `origin: upload`
- `mode: inline`
- `policy.forwardToSubagents: true`
- `preparation.outcome: optimized_inline`
- `inlineBase64Bytes: 28890`
- `inlineTargetBytes: 29491`
- `contextSafetyMaxBytes: 32768`
- `inlineChosenWidth: 420`
- `inlineChosenHeight: 558`
- `inlineIterations: 27`
- `inlineMinDimension: 512`
- `localPathAvailable: false`

This confirms the intended 512px inline floor is active in the successful path, and mobile/browser-origin inline uploads can fit under budget and reach the assistant correctly.

A subsequent live subagent-forwarding verification with two attachments both marked `policy.forwardToSubagents: true` exposed a real gap: the child did not receive any forwarded image bytes, did not see a `<nerve-upload-manifest>` block, and did not see a `<nerve-forwarded-server-paths>` block. That means the main agent delivery path is working, but the current subagent handoff path still appears broken or incomplete for this mixed path-reference + inline case. The subagent prematurely closed bead `nerve-nkq`; Chip reopened it because the overall validation slice is not complete. Post-send composer cleanup for the successful sends still needs explicit confirmation from Derrick.

---

## Proposed Human Test Checklist

1. In the active Nerve session, stage an attachment from the composer.
2. Verify pre-send UI behavior:
   - picker works
   - staged attachment preview/chip appears correctly
   - filename/type presentation looks sane
   - no obviously broken controls or layout regressions
3. Send the attachment through the live session.
4. Verify post-send behavior:
   - send completes
   - message lands in chat
   - staged attachment cleanup/reset happens correctly
5. Verify what reaches the assistant:
   - actual attachment context is delivered
   - any attachment metadata/manifests still match expectations
   - if relevant, note whether forwarding/subagent policy is visible in the delivered metadata
6. Watch for failure-state presentation issues only if they appear during the attachment flow:
   - bad badges/labels
   - stuck loading
   - abort controls mismatch
   - transient failure shown as hard error
7. Record concrete findings and decide whether each is:
   - working as expected
   - minor polish
   - real bug requiring a new bead

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:** Completed a fresh live human validation pass for Nerve attachments on Chip. The pass proved that main-agent delivery is working for both file-reference and inline uploads, confirmed the intended 512px inline floor is active in the current path, and isolated a real regression in the Nerve -> subagent forwarding bridge for mixed forwarded attachment sets.

**Commits:**
- Pending.

**Lessons Learned:** Fresh human testing was the right move. It ruled out stale assumptions, separated transient client-state weirdness from the actual runtime behavior, and narrowed the real remaining defect to the subagent forwarding handoff rather than the main Nerve upload pipeline.

**Next Follow-up:** The remaining fix is tracked in active plan `.plans/2026-03-18-subagent-attachment-forwarding-regression-fix.md` and bead `nerve-jg1`; `nerve-nkq` now depends on that repair for live re-verification.

---

*Completed on 2026-03-18*
