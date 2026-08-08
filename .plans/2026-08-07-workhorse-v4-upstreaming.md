# Workhorse v4 Upstreaming

**Date:** 2026-08-07  
**Status:** Blocked  
**Last Updated:** 2026-08-08 04:47 EDT  
**Blocked Reason:** Waiting for upstream maintainer approval/merge on PRs #373, #374, #375, and #377  
**Agent:** byte

---

## Goal

Roll out the verified `workhorse-v4` Nerve fixes to internal agents and prepare clean one-issue/one-PR upstream submissions to Nerve `master`.

---

## Overview

`workhorse-v4` is a clean branch based on upstream `master` `312e273` with the local fix stack already tested and pushed. The next step is to make cookie, chip, and pico use that branch for their local Nerve installs without restarting their OpenClaw gateways, then prepare upstream submissions that preserve reviewability.

Upstream Nerve contribution guidance requires opening an issue first for non-trivial changes, branching from `master`, keeping PRs focused, filling out the PR template, including tests, and passing `npm run lint`, `npm run build`, `npm run build:server`, and `npm test -- --run`. Derrick also wants both issues and PRs to start with a plain-English problem/solution summary.

The fixes should be upstreamed as separate branches/commits/PRs so each can be tested against latest `master`, proven to reproduce the original bug before the patch, and rolled back independently later if needed.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Nerve contribution workflow and required checks | `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/CONTRIBUTING.md` |
| `REF-02` | Completed local workhorse-v4 plan and validation record | `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/archive/2026-08-07-workhorse-v4-agent-list-and-duplicate-replies.md` |
| `REF-03` | Chat identity/history merge fix | `ad01882` |
| `REF-04` | Internal chat control turn filtering fix | `bf5dddc` |
| `REF-05` | Stale Agents/session pruning fixes | `4456816`, `49c8481` |

---

## Tasks

### Task 1: Roll Workhorse v4 To Internal Agents

**Bead ID:** `oc-r57`  
**SubAgent:** `primary`  
**Role:** `coder`  
**References:** `REF-02`  
**Prompt:** Update cookie, chip, and pico so their `~/.openclaw/.env` points Nerve at `workhorse-v4`, make sure each Nerve repo has the branch synced locally, then run each agent's `update.sh` with the flag that avoids restarting the OpenClaw gateway. Claim the bead on start. Read any relevant repo README before touching a repo. Report exact hosts/paths updated, commands run, and verification output.  

**Folders Created/Deleted/Modified:**
- Agent-local `~/.openclaw/` environments for cookie, chip, and pico

**Files Created/Deleted/Modified:**
- Agent-local `~/.openclaw/.env` files for cookie, chip, and pico

**Status:** ✅ Complete

**Results:** Cookie, chip, and pico were reachable over SSH aliases. Each agent started on `NERVE_DEPLOY_BRANCH=workhorse-v3`, branch `workhorse-v3`, head `921f6d4`. Each agent's Nerve repo was fetched from `origin`, switched to `workhorse-v4`, fast-forwarded to `7303ef5`, and each `~/.openclaw/.env` now reports `NERVE_DEPLOY_BRANCH=workhorse-v4`. Ran `~/.openclaw/workspace/scripts/update.sh --skip-gateway-restart` on each. All three update summaries reported `SUCCESS`, `nerve service running`, and `openclaw-gateway-restart-skipped`. Chip also reported a non-blocking prerequisite warning because its active Node is `v25.4.0` while `NODE_VERSION` is pinned to `22.22.3`.

---

### Task 2: Map Upstream Submission Path

**Bead ID:** `oc-wrw`  
**SubAgent:** `primary`  
**Role:** `research`  
**References:** `REF-01`, `REF-02`  
**Prompt:** Inspect upstream Nerve GitHub contribution expectations, issue templates, PR templates, existing issue/PR style, and prior local upstream submissions if discoverable. Claim the bead on start. Read the repo README and CONTRIBUTING before recommendations. Return a concise proposed issue/PR plan with titles, branch naming, issue-to-fix mapping, and required validation evidence. Do not create public issues or PRs.  

**Folders Created/Deleted/Modified:**
- None expected

**Files Created/Deleted/Modified:**
- Plan file only

**Status:** ✅ Complete

**Results:** Upstream repo is `daggerhashimoto/openclaw-nerve`, default branch `master`. Local `CONTRIBUTING.md` says to open an issue first for non-trivial changes, branch from `master`, keep PRs focused, include tests, fill the PR template, and pass `npm run lint`, `npm run build`, `npm run build:server`, and `npm test -- --run`. Bug issue template sections are `Description`, `Steps to Reproduce`, `Expected Behavior`, `Actual Behavior`, `Screenshots / Logs`, and `Environment`. PR template sections are `What`, `Why`, `How`, `Type of Change`, `Checklist`, and `Screenshots`. Prior accepted PR examples use branch names like `fix/issue-50-ws-allowed-gateway-host` and PR titles like `fix(setup): auto-add remote GATEWAY_URL host to WS_ALLOWED_HOSTS`.

Proposed upstream split:

1. Issue: `Chat history loses assistant message identity during reload/recovery`
   Branch after issue ID: `fix/issue-<id>-chat-message-identity-merge`
   PR title: `fix(chat): preserve message identity during history recovery`
   Source areas: `src/features/chat/operations/loadHistory.ts`, `mergeRecoveredTail.ts`, `sendMessage.ts`, `src/hooks/useChatMessages.ts`, `src/contexts/ChatContext.tsx`, `src/types.ts`.
   Local patch source: `ad01882`.

2. Issue: `Internal control replies appear in chat history`
   Branch after issue ID: `fix/issue-<id>-filter-internal-chat-turns`
   PR title: `fix(chat): filter internal control turns from history`
   Source areas: `src/features/chat/operations/loadHistory.ts` and adjacent history tests.
   Local patch source: `bf5dddc`.

3. Issue: `Agents panel keeps stale spawned-session rows after sessions disappear`
   Branch after issue ID: `fix/issue-<id>-prune-stale-agent-sessions`
   PR title: `fix(sessions): prune stale agent session rows`
   Source areas: `src/contexts/SessionContext.tsx`, `src/features/sessions/sessionReconciliation.ts`, and adjacent tests.
   Local patch source: `4456816` plus `49c8481`.

Each issue and PR should begin with an `In Plain English` section before the upstream template details. Each branch must be created from latest `upstream/master`, reproduce the bug on unpatched master where feasible, apply only the relevant fix commit(s), and run targeted regression tests plus the required full checks before PR creation.

---

### Task 3: Create Upstream GitHub Issues

**Bead ID:** `oc-6nv`  
**SubAgent:** `primary`  
**Role:** `coder`  
**References:** `REF-01`, `REF-03`, `REF-04`, `REF-05`  
**Prompt:** Derrick approved the public upstream writes. Create the three GitHub bug issues in `daggerhashimoto/openclaw-nerve` for the already-planned split. Read the repo README, CONTRIBUTING, `.github/ISSUE_TEMPLATE/bug_report.md`, and the plan before creating issues. Each issue must start with an `In Plain English` section, then follow the bug template sections. Use one issue per planned PR: chat identity/history merge (`REF-03`), internal `NO_REPLY`/`HEARTBEAT_OK` filtering (`REF-04`), and stale Agents/session pruning (`REF-05`). Return issue numbers/URLs and do not create branches or PRs. Claim the bead on start and close it when the issues are created.

**Folders Created/Deleted/Modified:**
- None expected

**Files Created/Deleted/Modified:**
- Plan and Beads state only

**Status:** ✅ Complete

**Results:** Derrick approved public upstream GitHub issue/PR writes at 2026-08-07 18:40 EDT. Created upstream issues:
- #370 `[Bug] Chat history loses assistant message identity during reload/recovery`: https://github.com/daggerhashimoto/openclaw-nerve/issues/370
- #371 `[Bug] Internal control replies appear in chat history`: https://github.com/daggerhashimoto/openclaw-nerve/issues/371
- #372 `[Bug] Agents panel keeps stale spawned-session rows after sessions disappear`: https://github.com/daggerhashimoto/openclaw-nerve/issues/372

Issue bodies start with `In Plain English` and then follow the bug report template. Adding the `bug` label failed because the GitHub account does not have upstream label permissions (`AddLabelsToLabelable`).

---

### Task 4: Prepare Chat Identity Merge Upstream Branch

**Bead ID:** `oc-bjk`  
**SubAgent:** `primary`  
**Role:** `coder`  
**References:** `REF-01`, `REF-03`  
**Prompt:** Issue #370 exists. Create a branch from latest upstream `master` named `fix/issue-370-chat-message-identity-merge`. Prove the bug on unpatched master where feasible, cherry-pick or reimplement only commit `ad01882`, run targeted tests and required checks, then prepare/push the branch for one PR. Claim the bead on start.  

**Folders Created/Deleted/Modified:**
- Nerve source tree

**Files Created/Deleted/Modified:**
- Chat identity/history merge files and tests

**Status:** ✅ Complete

**Results:** Issue #370 created and PR #373 opened: https://github.com/daggerhashimoto/openclaw-nerve/pull/373. Branch `fix/issue-370-chat-message-identity-merge` was created from upstream `master` `312e27333e14f841b95bf4f2b205a856b4a4c370`, pushed to `origin`, and contains commit `657a9da950e5f5b1143ae526ad6fe925aa1da717`. Pre-patch proof reproduced with `npm test -- --run src/features/chat/operations/mergeRecoveredTail.test.ts`, failing on unpatched master because the recovered assistant identity regression dropped the local question. Validation passed: targeted chat tests (81 tests), `npm run lint`, `npm run build`, `npm run build:server`, and `npm test -- --run` (143 files / 1878 tests). GitHub reports CI `build` plus CodeRabbit successful.

---

### Task 5: Prepare Internal Control Turn Filtering Upstream Branch

**Bead ID:** `oc-8tn`  
**SubAgent:** `primary`  
**Role:** `coder`  
**References:** `REF-01`, `REF-04`  
**Prompt:** Issue #371 exists. Create a branch from latest upstream `master` named `fix/issue-371-filter-internal-chat-turns`. Prove the bug on unpatched master where feasible, cherry-pick or reimplement only commit `bf5dddc`, run targeted tests and required checks, then prepare/push the branch for one PR. Claim the bead on start.  

**Folders Created/Deleted/Modified:**
- Nerve source tree

**Files Created/Deleted/Modified:**
- Chat history loading files and tests

**Status:** ✅ Complete

**Results:** Issue #371 created and PR #374 opened: https://github.com/daggerhashimoto/openclaw-nerve/pull/374. Branch `fix/issue-371-filter-internal-chat-turns` was created from upstream `master` `312e27333e14f841b95bf4f2b205a856b4a4c370`, pushed to `origin`, and contains commit `37f21cc25926bb79228b5d4f1c50f6eaf0db8237`. Pre-patch proof reproduced with `npm test -- --run src/features/chat/operations/loadHistory.test.ts`, failing on unpatched master because broader internal control/status replies such as `{"action":"NO_REPLY"}` and `Compaction complete.` remained visible in loaded history; upstream master already filtered exact bare `NO_REPLY` and `HEARTBEAT_OK`. Validation passed: focused load-history tests (48 passed), targeted chat tests (5 files / 120 passed), `npm run lint`, `npm run build`, `npm run build:server`, and `npm test -- --run` (142 files / 1874 passed). Parent review verified the PR has one commit, only touches `src/features/chat/operations/loadHistory.ts` and `loadHistory.test.ts`, and GitHub reports CI `build` plus CodeRabbit successful.

---

### Task 6: Prepare Stale Agents Pruning Upstream Branch

**Bead ID:** `oc-pe0`  
**SubAgent:** `primary`  
**Role:** `coder`  
**References:** `REF-01`, `REF-05`  
**Prompt:** Issue #372 exists. Create a branch from latest upstream `master` named `fix/issue-372-prune-stale-agent-sessions`. Prove the bug on unpatched master where feasible, cherry-pick or reimplement only commits `4456816` and `49c8481`, run targeted tests and required checks, then prepare/push the branch for one PR. Claim the bead on start.  

**Folders Created/Deleted/Modified:**
- Nerve source tree

**Files Created/Deleted/Modified:**
- Session reconciliation files and tests

**Status:** ✅ Complete

**Results:** Issue #372 created and PR #375 opened: https://github.com/daggerhashimoto/openclaw-nerve/pull/375. Branch `fix/issue-372-prune-stale-agent-sessions` was created from upstream `master` `312e27333e14f841b95bf4f2b205a856b4a4c370`, pushed to `origin`, and contains commits `e5d5478c35ac839d6529edb5fd8d3feebe37e616` and `08cd488adae1acf4b374177cdf628c950e12d756`. Pre-patch proof reproduced with `npm test -- --run src/contexts/SessionContext.test.tsx`, failing on unpatched master because `Old cached child` remained rendered. Validation passed: targeted session tests (2 files / 27 tests), `npm run lint`, `npm run build`, `npm run build:server`, and `npm test -- --run` (143 files / 1878 tests). Parent review verified the PR has only the two intended commits, touches only session reconciliation/context files and tests, and GitHub reports CI `build` plus CodeRabbit successful. Full tests emitted existing unrelated React `act(...)` and nested-button warning noise; Vite build emitted existing chunk/dynamic-import warnings.

---

### Task 7: QA And Audit Upstream Branches

**Bead ID:** `oc-psf`  
**SubAgent:** `primary`  
**Role:** `qa` / `auditor`  
**References:** `REF-01`, `REF-03`, `REF-04`, `REF-05`  
**Prompt:** For each upstream branch, independently verify the branch starts from upstream `master`, contains only the intended fix, reproduces the target bug before the patch where feasible, squashes it after the patch, and passes required validation. The auditor closes the corresponding bead only when evidence is sufficient.  

**Folders Created/Deleted/Modified:**
- Nerve source tree

**Files Created/Deleted/Modified:**
- Plan and Beads state

**Status:** ✅ Complete

**Results:** QA completed at 2026-08-07 19:22 EDT and passed for upstream PRs #373, #374, and #375. QA read `README.md`, `CONTRIBUTING.md`, and this plan; claimed `oc-psf`; confirmed upstream `master` is still `312e27333e14f841b95bf4f2b205a856b4a4c370`; verified each branch's merge-base is exactly `312e273`; verified commit counts are 1, 1, and 2 respectively; confirmed each PR touches only its intended scope; reproduced each regression on unpatched master by checking out the regression tests only; and confirmed patched targeted tests pass locally. QA also reviewed PR bodies and GitHub evidence: CI runs `31225141123` (#373 head `657a9da`), `31225894745` (#374 head `37f21cc`), and `31226424927` (#375 head `08cd488`) all completed successfully, and CodeRabbit status is success on all three. Warning noise for #375 was documented as existing unrelated React `act(...)`/nested-button warnings and Vite chunk/dynamic-import warnings.

Independent audit completed at 2026-08-07 19:28 EDT and closed `oc-psf`. Parent review re-checked GitHub PR heads and statuses. Audit verified upstream `master` is still `312e27333e14f841b95bf4f2b205a856b4a4c370`; all three branch merge-bases are exactly `312e273`; PR #373 has one commit `657a9da` and only chat identity/history files; PR #374 has one commit `37f21cc` and only `loadHistory` files; PR #375 has two commits `e5d5478` and `08cd488` and only session reconciliation/context files. Issues #370/#371/#372 map one-to-one to PRs #373/#374/#375, the issues and PRs start with plain-English problem/solution framing, GitHub CI is green on all three, and CodeRabbit is passing on all three. Minor residual risk: PR #375 uses a plain `In Plain English` line rather than a Markdown `##` heading, but the framing requirement is substantively met.

---

### Task 8: Monitor Upstream Review And Merge

**Bead ID:** `oc-nz2`  
**SubAgent:** `primary`  
**Role:** `auditor` / `coder`  
**References:** `REF-01`, `REF-03`, `REF-04`, `REF-05`  
**Prompt:** Track upstream PRs #373, #374, #375, and #377 until maintainer approval/merge or requested changes. Re-check CI if upstream `master` advances, respond to review feedback, and update/close linked issues as needed. Claim the bead on start.  

**Folders Created/Deleted/Modified:**
- None yet

**Files Created/Deleted/Modified:**
- Plan and Beads state only

**Status:** ⏳ Pending on upstream maintainer review

**Results:** Follow-up bead created because all agent-owned branch, issue, PR, QA, and audit work is complete, but the upstream repo still requires maintainer approval/merge before the fixes actually land on Nerve `master`. The monitor set now includes #377, the Cookie duplicate-final follow-up PR, alongside #373/#374/#375.

---

## Final Results

**Status:** ⚠️ Blocked on upstream maintainer review

**What We Built:** Internal rollout completed for cookie, chip, and pico. Upstream issue/PR split and branch strategy planned. Derrick approved public upstream writes, the three original upstream issues have been created, PRs #373, #374, and #375 are open with GitHub checks green and independent QA/audit passed, and follow-up duplicate-final PR #377 is also open and green.

**Reference Check:** `REF-01` reviewed for required upstream process. `REF-02` reviewed for local validation baseline. `REF-03`, `REF-04`, and `REF-05` split into three upstream submissions. QA/audit verified each branch starts at upstream `master` `312e273`, has only the intended commits/files, reproduces the target regression on unpatched master, fixes it on the patched branch, and has passing GitHub CI plus CodeRabbit.

**Commits:**
- Pending

**Lessons Learned:** The one-issue/one-PR split kept review scope clean. Public upstream work should continue to record both unpatched-master reproduction and patched-branch validation in each PR body, because that made the independent audit straightforward.

---

*Completed on Pending upstream maintainer review*
