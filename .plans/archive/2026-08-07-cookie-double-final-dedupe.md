# Cookie Double Final Message Dedupe

**Date:** 2026-08-07  
**Status:** Complete  
**Last Updated:** 2026-08-08 03:47 EDT  
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

**Status:** Complete

**Results:** Deployed the pushed `workhorse-v4` fix to Cookie with `/home/derrick/.openclaw/workspace/scripts/update.sh --skip-gateway-restart`; updater reported `Update Summary: SUCCESS` and `openclaw-gateway-restart-skipped`. Cookie moved from `7303ef526297` to `1a8ecfbe6675`, and `git merge-base --is-ancestor 2ba668a HEAD` passed. Final health check returned `{"status":"ok","gateway":"ok"}`. The OpenClaw gateway process remained PID `3117569`, started `Fri Aug 7 13:06:04 2026`; only Nerve restarted at `Fri Aug 7 20:37:53 2026`.

Duplicate-final proof passed against the Task 1 path: gateway `chat.history` for `agent:main:main` contains exactly one durable assistant row matching `Task 10 audit is verified complete`, with `timestamp=1786147218006`, `__openclaw.id=8b415b68-9554-400c-b868-ed57246785e7`, and `mirrorIdentity=019fdeaa-eb0d-7ed1-96dd-08243ee90d95:assistant`. The running Cookie Nerve UI rendered that final exactly once in the live display, after normal refresh, and after hard reload.

Smoke checks passed. The Agents UI rendered Cookie main plus the 9 current spawned-by-main rows across live/refresh/hard reload; stale examples including `2oj5 Windows bytecode E2E repair coder` and `APEX-` had DOM count 0 even though the full gateway historical session list still contains old rows, proving UI pruning rather than historical deletion. Exact assistant/operator `NO_REPLY` / `HEARTBEAT_OK` rows in sampled main history were 0; `HEARTBEAT_OK` rendered 0 times, and visible `NO_REPLY` occurrences were only inside user pre-compaction prompt text, not assistant control replies. Evidence bundle: `.temp/nerve-qa/cookie-double-final/oc-4zp/QA-SUMMARY.md`, `cookie-update-output.txt`, `final-deploy-check.txt`, `gateway-history-session-summary.json`, `01-live.png`, `02-refresh.png`, `03-hard-reload.png`, and matching DOM summaries.

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

**Status:** Complete

**Results:** Audit passed. Root-cause artifacts prove the reported Cookie duplicate was one durable backend/session-history assistant final rendered twice by Nerve live merge/recovery: gateway `chat.history` had exactly one matching assistant row for `Task 10 audit is verified complete` with durable `__openclaw.id=8b415b68-9554-400c-b868-ed57246785e7`, `mirrorIdentity=019fdeaa-eb0d-7ed1-96dd-08243ee90d95:assistant`, and a nearby compaction row at `2026-08-08T00:01:43Z`. The fix diff is narrow: it adds shared message reconciliation helpers and aliases only plain, finished assistant finals when exactly one side has durable OpenClaw identity, matching normalized text, no streaming/pending/failed/thinking/tool/chart/upload/image/rich payloads, and timestamps within 180 seconds. This preserves legitimate durable repeated assistant messages and rich/tool/image messages.

Regression coverage is sufficient for the Cookie local-to-durable final path and preservation cases: local rerun passed `npm test -- --run src/hooks/useChatMessages.test.ts src/features/chat/operations/mergeRecoveredTail.test.ts src/features/chat/operations/loadHistory.test.ts src/features/chat/operations/streamEventHandler.test.ts src/features/sessions/sessionReconciliation.test.ts src/contexts/SessionContext.test.tsx src/features/sessions/sessionTree.test.ts` (164 tests), `npm run lint`, and `npm run build` with only existing Vite dynamic-import/chunk-size warnings. Cookie deployment proof passed: `/home/derrick/.openclaw/workspace/scripts/update.sh --skip-gateway-restart` reported `Update Summary: SUCCESS` and `openclaw-gateway-restart-skipped`; deployed Cookie Nerve `HEAD=1a8ecfbe6675` contains `2ba668a`; the OpenClaw gateway PID/start stayed `3117569 Fri Aug 7 13:06:04 2026`; Nerve alone restarted; `/health` returned `{"status":"ok","gateway":"ok"}`. Live, refresh, and hard-reload DOM captures render the duplicate-final text exactly once, `HEARTBEAT_OK` zero times, stale Agents examples zero times, and `NO_REPLY` only inside user pre-compaction prompt text rather than assistant/operator control rows. Bead `oc-5gr` closed.

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

**Status:** Complete

**Results:** Created exactly one public upstream bug issue: [#376](https://github.com/daggerhashimoto/openclaw-nerve/issues/376), `[Bug] Assistant final can appear twice after history recovery`. The issue starts with an `In Plain English` section, then follows the upstream bug template. It includes sanitized reproduction/proof from the upstream-master-era failing path (`upstream/master` reference `312e273`, pre-fix Cookie deployment `7303ef5`) and fixed downstream evidence from `2ba668a` / Cookie deployment `1a8ecf`, without exposing secrets or private transcript content. Bead `oc-unv` may be closed after this URL is recorded.

---

### Task 6: Create Upstream PR

**Bead ID:** `oc-v5q`  
**SubAgent:** `primary`  
**Role:** `coder`  
**References:** `REF-06`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the bead on start. Read the repo README and contribution guidance before touching the repo. After Task 5 creates the GitHub issue, create a branch from latest upstream `master` named `fix/issue-<id>-dedupe-assistant-final-delivery` or a similarly precise issue-linked name. Reproduce the bug or equivalent failing regression on unpatched upstream master, apply only the audited fix, run targeted tests and required gates, push the branch, and open exactly one PR for the issue. The PR must start with an `In Plain English` section describing the problem and solution before technical details. Monitor initial GitHub checks and update the plan with the PR URL and status.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `src/features/chat/`
- `src/hooks/`
- `src/`

**Files Created/Deleted/Modified:**
- `src/features/chat/operations/loadHistory.ts`
- `src/features/chat/operations/mergeRecoveredTail.test.ts`
- `src/features/chat/operations/mergeRecoveredTail.ts`
- `src/features/chat/operations/messageReconciliation.ts`
- `src/features/chat/types.ts`
- `src/hooks/useChatMessages.test.ts`
- `src/hooks/useChatMessages.ts`
- `src/types.ts`
- `.plans/2026-08-07-cookie-double-final-dedupe.md`

**Status:** Complete

**Results:** Opened exactly one upstream PR for issue #376: [#377](https://github.com/daggerhashimoto/openclaw-nerve/pull/377), `fix(chat): dedupe assistant final history delivery`. Branch: `fix/issue-376-dedupe-assistant-final-delivery`, pushed to `GambitGamesLLC/openclaw-nerve` after direct push to `daggerhashimoto/openclaw-nerve` was denied. Base: `daggerhashimoto/openclaw-nerve:master` at `312e27333e14f841b95bf4f2b205a856b4a4c370`. Commit: `8238509` (`fix(chat): dedupe assistant final history delivery`), sourced from audited local fix `2ba668a` with a narrow upstream-master adaptation to carry durable chat source identities through `loadHistory`, `ChatMsg`, and `ChatMessage` types.

Pre-fix proof on unpatched upstream master: `src/features/chat/operations/messageReconciliation.ts` and `src/hooks/useChatMessages.test.ts` were absent, existing chat tests had no Cookie-style local-to-durable assistant-final aliasing coverage, and `npm test -- --run src/features/chat/operations/mergeRecoveredTail.test.ts src/hooks/useChatMessages.test.ts` only discovered the old `mergeRecoveredTail` suite (7 tests). No private transcript content was used.

Validation passed on the PR branch: targeted chat tests `npm test -- --run src/hooks/useChatMessages.test.ts src/features/chat/operations/mergeRecoveredTail.test.ts src/features/chat/operations/loadHistory.test.ts src/features/chat/operations/streamEventHandler.test.ts` (4 files / 105 tests), `npm run lint`, `npm run build && npm run build:server` with existing Vite dynamic-import/chunk-size warnings, and `npm test -- --run` (143 files / 1882 tests). PR body starts with `In Plain English`, follows the upstream template sections, includes validation, and contains `Closes #376`. Initial GitHub checks after opening: `build` pending and CodeRabbit pending; Task 7 remains responsible for monitoring checks and maintainer follow-up.

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

**Status:** Complete

**Results:** PR #377 initial GitHub CI `build` completed red at 2026-08-07 21:23 EDT on commit `8238509`; the only failure was full-suite test `src/features/kanban/CreateTaskDialog.test.tsx:118`, unable to find `No matching assignees`. The failed log showed the title input containing `Closed set taskagent:ghost`, meaning the typed assignee text landed outside the assignee field. That Kanban failure did not reproduce locally at PR head: `npm test -- --run src/features/kanban/CreateTaskDialog.test.tsx` passed before and after follow-up fixes, and the PR diff was chat/history scoped. Review feedback then found valid in-scope chat reconciliation issues. Commits `d5a34b9` and `8ac0120` were pushed to `GambitGamesLLC:fix/issue-376-dedupe-assistant-final-delivery`, tightening current-turn final aliasing, attaching optimistic user idempotency identities before insertion, preserving aliases/streaming state, preventing repeated final key reuse, and disambiguating repeated derived history identities. Local validation on `8ac0120` passed: focused chat suites `npm test -- --run src/hooks/useChatMessages.test.ts src/features/chat/operations/mergeRecoveredTail.test.ts src/features/chat/operations/loadHistory.test.ts src/features/chat/operations/sendMessage.test.ts` (94 tests), `npm run lint`, `npm run build` (with existing Vite chunk/dynamic-import warnings), and full suite `npm test -- --run` (143 files / 1891 tests). As of 2026-08-07 21:41 EDT, PR #377 head is `8ac0120`; GitHub `build` run `31233122984` passed in 2m42s, including lint/build/build:server/test; CodeRabbit is `SUCCESS` and the latest review generated no actionable comments. Remaining gate is maintainer review/merge (`reviewDecision: REVIEW_REQUIRED`).

---

## Final Results

**Status:** Complete, with upstream maintainer review pending under follow-up bead `oc-nz2`

**What We Built:** Reproduced and classified the remaining Cookie duplicate-final bug, patched Nerve's chat reconciliation to merge true local-to-durable assistant final duplicates without hiding legitimate repeated or rich messages, deployed the fix to Cookie without restarting the OpenClaw gateway, and proved the duplicate-final text renders once across live display, refresh, and hard reload. Filed upstream issue [#376](https://github.com/daggerhashimoto/openclaw-nerve/issues/376) and opened upstream PR [#377](https://github.com/daggerhashimoto/openclaw-nerve/pull/377).

**Reference Check:** `REF-01` was satisfied by the Cookie proof artifacts showing the previously duplicated final now renders once. `REF-02`, `REF-04`, and `REF-05` were preserved by smoke checks for prior duplicate/internal-control filtering behavior. `REF-07` was satisfied by the Cookie updater evidence showing `--skip-gateway-restart` and unchanged gateway PID/start time. `REF-06` was satisfied by opening PR #377 from upstream `master` and validating it with green GitHub CI plus CodeRabbit.

**Commits:**
- `2ba668a` - Fix assistant final history aliasing
- `1a8ecfb` - Update cookie dedupe implementation plan
- `2d40d1e` - Record Cookie duplicate final QA proof
- `0c8b2c4` - Record duplicate final audit
- `ad6c87f` - docs: record duplicate final upstream issue
- `8238509` - fix(chat): dedupe assistant final history delivery
- `fd9681e` - docs(plans): record duplicate final upstream PR
- `d5a34b9` - fix(chat): tighten final message reconciliation
- `8ac0120` - fix(chat): harden history identity merging

**Lessons Learned:** The duplicate family needed two layers of proof: backend/session-history cardinality and frontend live/history reconciliation. The screenshot's delayed second copy was tied to recovery/compaction timing, so future chat fixes should include live, refresh, and hard-reload DOM checks against a real deployed agent path before upstreaming.

---

*Drafted on 2026-08-07*
