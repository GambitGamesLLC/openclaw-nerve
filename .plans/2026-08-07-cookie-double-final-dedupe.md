# Cookie Double Final Message Dedupe

**Date:** 2026-08-07  
**Status:** In Progress  
**Last Updated:** 2026-08-07 20:24 EDT  
**Blocked Reason:** None  
**Agent:** byte

---

## Goal

Squash the remaining Cookie duplicate assistant-final message bug, prove the fix against latest upstream master and the deployed Cookie path, then upstream it as one GitHub issue and one PR.

---

## Overview

Cookie is deployed on `workhorse-v4` at `7303ef5`, so the stale Agents fix and prior chat identity/filtering patches are present. Derrick's 2026-08-07 screenshot shows a remaining duplicate: the same Cookie assistant final appears twice at `20:00` and `20:01`, after old stale subagents have disappeared. That means the previous rollout helped but did not fully cover this live duplicate-final path.

The earlier workhorse-v4 plan accepted a QA limitation: it did not force a fresh compaction/memory-flush event or send a new prompt from Nerve during the rerun. This plan closes that gap. The first slice is investigation and reproducible proof, not code. We need to determine whether the duplicate comes from Nerve rendering one backend row twice, the gateway/session history returning two rows with distinct identities, or Cookie/OpenClaw sending two equivalent final messages. The implementation must preserve legitimate repeated assistant messages while collapsing true duplicate final deliveries.

If the bug belongs in Nerve, the fix should be narrow and upstreamable: one issue, one branch, one PR. The PR branch must be based on latest upstream `master`, prove the bug or an equivalent reducer/adapter regression on unpatched master, prove the patch squashes it, and pass targeted chat tests plus the normal build/test gates. If the root cause is outside Nerve, this plan should stop and file the correct follow-up against the owning repo instead of forcing a Nerve patch.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Derrick screenshot showing Cookie duplicate assistant final after rollout | `/home/derrick/.openclaw/workspace/.temp/nerve-uploads/2026/08/08/image-67ea3ed9.png` |
| `REF-02` | Prior workhorse-v4 completed plan and accepted QA limitation | `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/archive/2026-08-07-workhorse-v4-agent-list-and-duplicate-replies.md` |
| `REF-03` | Prior upstreaming plan confirming Cookie/chip/pico rollout to `workhorse-v4` | `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-08-07-workhorse-v4-upstreaming.md` |
| `REF-04` | Prior chat identity/history merge fix | `ad01882` |
| `REF-05` | Prior internal control-turn filtering fix | `bf5dddc` |
| `REF-06` | Current Nerve upstream master baseline | `upstream/master` at `312e273` when drafted |
| `REF-07` | Required no-gateway-restart updater path | `/home/derrick/.openclaw/workspace/scripts/update.sh --skip-gateway-restart` |

---

## Tasks

### Task 1: Reproduce And Classify The Duplicate

**Bead ID:** `oc-ees`  
**SubAgent:** `primary`  
**Role:** `research`  
**References:** `REF-01`, `REF-02`, `REF-03`, `REF-04`, `REF-05`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. Investigate Derrick's Cookie duplicate assistant-final report in `REF-01`. Verify Cookie's deployed Nerve branch/commit and updater status without restarting the OpenClaw gateway. Inspect the running Cookie/Nerve data path, available Gateway/session history records, browser-visible DOM/state if needed, and local transcript/session artifacts. Determine whether the duplicate is one backend message rendered twice, two backend rows with different source identities, a delayed resend from Cookie/OpenClaw, or a Nerve merge/recovery issue. Capture evidence with timestamps, source ids if available, and the smallest reliable reproduction path. Do not make code changes and do not create public GitHub issues. Close the bead only if the root-cause classification and reproduction/proof notes are complete.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.temp/nerve-qa/cookie-double-final/`

**Files Created/Deleted/Modified:**
- `.plans/2026-08-07-cookie-double-final-dedupe.md`
- `.temp/nerve-qa/cookie-double-final/*`

**Status:** Complete

**Results:** Classified as one durable backend/session-history assistant final rendered twice by Nerve during live merge/recovery, not two backend rows and not a delayed Cookie/OpenClaw resend. Cookie is deployed on `workhorse-v4` at `7303ef526297`; `.env` has `NERVE_DEPLOY_BRANCH=workhorse-v4`; the Nerve process started at 2026-08-07 18:05:29 EDT; the OpenClaw gateway process started at 2026-08-07 13:06:04 EDT and was not restarted. Read-only `chat.history` for `agent:main:main` with `limit=500` contains exactly one matching assistant final for `Task 10 audit is verified complete`, with `timestamp=1786147218006`, `recordTimestampMs=1786147218069`, `seq=1429`, `__openclaw.id=8b415b68-9554-400c-b868-ed57246785e7`, `mirrorIdentity=019fdeaa-eb0d-7ed1-96dd-08243ee90d95:assistant`, and idempotency key `codex-app-server:019fdeaa-ead5-79c0-897e-5dd61b9130e8:019fdeaa-eb0d-7ed1-96dd-08243ee90d95:assistant`. The next nearby text row is a `Compaction` system row at `2026-08-08T00:01:43Z`, matching the screenshot's second visible copy at about 20:01 EDT. Evidence: `.temp/nerve-qa/cookie-double-final/oc-ees/INVESTIGATION.md`, `cookie-main-history-match-summary.json`, `cookie-main-history-textrows.jsonl`, `cookie-deploy-status.txt`, and `ref-01-cookie-duplicate.png`.

---

### Task 2: Implement Narrow Fix On Workhorse

**Bead ID:** `oc-psq`  
**SubAgent:** `primary`  
**Role:** `coder`  
**References:** `REF-01`, `REF-02`, `REF-04`, `REF-05`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. Use Task 1's evidence to implement the narrowest Nerve-side fix for true duplicate assistant-final delivery if and only if Task 1 confirms Nerve owns the bug. Preserve legitimate repeated assistant messages, streaming updates, tool groups, images, and manual repeats. Add focused regression tests that fail before the patch and pass after it. Run targeted chat tests, `npm run build`, and broader validation if the touched surface warrants it. Commit the fix separately on `workhorse-v4` and push. If Task 1 proves the root cause is outside Nerve, do not patch Nerve; update the bead and plan with the owning repo and suggested next issue instead.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `src/hooks/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/chat/operations/messageReconciliation.ts`
- `src/features/chat/operations/mergeRecoveredTail.ts`
- `src/features/chat/operations/mergeRecoveredTail.test.ts`
- `src/hooks/useChatMessages.ts`
- `src/hooks/useChatMessages.test.ts`
- `.plans/2026-08-07-cookie-double-final-dedupe.md`

**Status:** Complete

**Results:** Implemented a narrow Nerve-side reconciliation fix that aliases a local/live assistant final to a later durable OpenClaw history identity during final, history, and recovery-tail merges. The alias requires matching assistant text within 180 seconds, exactly one side with durable `openclaw:mirror:` / `openclaw:id:` identity, and no streaming, pending, failed, thinking, tool-group, chart, upload, or image payloads, so legitimate durable repeated assistant finals and rich messages are preserved. Added focused regressions for the Cookie-style local-to-durable assistant final, durable manual repeats, image-bearing assistant messages, and tool-group/rich recovery rows. Validation passed: `npm test -- --run src/hooks/useChatMessages.test.ts src/features/chat/operations/mergeRecoveredTail.test.ts src/features/chat/operations/loadHistory.test.ts src/features/chat/operations/streamEventHandler.test.ts` (111 tests), `npm run build` (passed with existing Vite chunk warnings), `npm run lint` (passed), and `npm test -- --run` (144 files / 1896 tests). Fix commit: `2ba668a`.

---

### Task 3: Deploy To Cookie And Prove The Squash

**Bead ID:** `oc-4zp`  
**SubAgent:** `primary`  
**Role:** `qa`  
**References:** `REF-01`, `REF-03`, `REF-07`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. After Task 2 lands, update Cookie's Nerve safely using `~/.openclaw/workspace/scripts/update.sh --skip-gateway-restart` or the repo-equivalent no-gateway-restart path. Do not restart the OpenClaw gateway. In the running Cookie Nerve environment, reproduce the original duplicate-final path from Task 1 and prove that one durable assistant final renders across live display, refresh, and hard reload. Also verify the prior workhorse-v4 guarantees still hold at a smoke level: stale Agents rows remain pruned and internal `NO_REPLY` / `HEARTBEAT_OK` rows remain hidden. Capture screenshots/DOM summaries/session-history evidence under `.temp/nerve-qa/cookie-double-final/`. Close the bead only if the proof is complete or the failure is clearly documented.

**Folders Created/Deleted/Modified:**
- `.temp/nerve-qa/cookie-double-final/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `.temp/nerve-qa/cookie-double-final/*`
- `.plans/2026-08-07-cookie-double-final-dedupe.md`

**Status:** Pending, blocked by `oc-psq`

**Results:** Pending.

---

### Task 4: Independent Audit

**Bead ID:** `oc-5gr`  
**SubAgent:** `primary`  
**Role:** `auditor`  
**References:** `REF-01`, `REF-02`, `REF-04`, `REF-05`, `REF-07`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. Independently audit the root-cause evidence, diff, tests, build output, Cookie deployment evidence, and QA proof for the duplicate assistant-final fix. Verify the fix is narrow, does not hide legitimate repeated assistant messages, and does not regress the prior chat identity/filtering or Agents pruning behavior. Re-run relevant tests if needed. Close the bead only if the work genuinely passes; otherwise report exact gaps and leave the implementation bead active for retry.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-08-07-cookie-double-final-dedupe.md`

**Status:** Pending, blocked by `oc-4zp`

**Results:** Pending.

---

### Task 5: Create Upstream Issue

**Bead ID:** `oc-unv`  
**SubAgent:** `primary`  
**Role:** `research`  
**References:** `REF-01`, `REF-06`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README, CONTRIBUTING docs if present, and `.github/ISSUE_TEMPLATE/bug_report.md` before creating anything. After local implementation, QA, and audit pass, create exactly one public GitHub issue in `daggerhashimoto/openclaw-nerve` for the remaining duplicate assistant-final bug. The issue must start with an `In Plain English` section explaining the problem and solution, then follow the upstream bug template. Include reproduction/proof from upstream master and the fixed behavior evidence without exposing secrets or private transcript content. Close the bead only after returning the issue number/URL.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-08-07-cookie-double-final-dedupe.md`

**Status:** Pending, blocked by `oc-5gr`

**Results:** Pending.

---

### Task 6: Create Upstream PR

**Bead ID:** `oc-v5q`  
**SubAgent:** `primary`  
**Role:** `coder`  
**References:** `REF-06`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README and contribution guidance before touching the repo. After Task 5 creates the GitHub issue, create a branch from latest upstream `master` named `fix/issue-<id>-dedupe-assistant-final-delivery` or a similarly precise issue-linked name. Reproduce the bug or equivalent failing regression on unpatched upstream master, apply only the audited fix, run targeted tests and required gates, push the branch, and open exactly one PR for the issue. The PR must start with an `In Plain English` section describing the problem and solution before technical details. Monitor initial GitHub checks and update the plan with the PR URL and status.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- Exact files pending Task 2 final diff.
- `.plans/2026-08-07-cookie-double-final-dedupe.md`

**Status:** Pending, blocked by `oc-unv`

**Results:** Pending.

---

### Task 7: PR Checks And Maintainer Follow-Up

**Bead ID:** `oc-bzx`  
**SubAgent:** `primary`  
**Role:** `auditor`  
**References:** `REF-06`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README before touching the repo. Monitor the upstream PR from Task 6 until initial CI and CodeRabbit checks complete. If checks fail, diagnose and route back to implementation. If checks pass, verify the issue/PR one-to-one mapping, branch base, diff scope, validation notes, and plain-English framing. Leave maintainer approval/merge as the remaining external gate unless a maintainer requests changes.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-08-07-cookie-double-final-dedupe.md`

**Status:** Pending, blocked by `oc-v5q`

**Results:** Pending.

---

## Final Results

**Status:** Pending

**What We Built:** Pending.

**Reference Check:** Pending.

**Commits:**
- Pending.

**Lessons Learned:** Pending.

---

*Drafted on 2026-08-07*
