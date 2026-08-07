# Workhorse v4 Upstreaming

**Date:** 2026-08-07  
**Status:** Blocked  
**Last Updated:** 2026-08-07 18:07 EDT  
**Blocked Reason:** Awaiting Derrick approval before public upstream GitHub issue/PR writes  
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

### Task 3: Prepare Chat Identity Merge Upstream Branch

**Bead ID:** `oc-bjk`  
**SubAgent:** `primary`  
**Role:** `coder`  
**References:** `REF-01`, `REF-03`  
**Prompt:** After issue creation approval/issue ID exists, create a branch from latest upstream `master` named for that issue and the chat identity merge bug. Prove the bug on unpatched master where feasible, cherry-pick or reimplement only commit `ad01882`, run targeted tests and required checks, then prepare/push the branch for one PR. Claim the bead on start.  

**Folders Created/Deleted/Modified:**
- Nerve source tree

**Files Created/Deleted/Modified:**
- Chat identity/history merge files and tests

**Status:** ⏸ Waiting for approval

**Results:** Waiting on upstream issue ID.

---

### Task 4: Prepare Internal Control Turn Filtering Upstream Branch

**Bead ID:** `oc-8tn`  
**SubAgent:** `primary`  
**Role:** `coder`  
**References:** `REF-01`, `REF-04`  
**Prompt:** After issue creation approval/issue ID exists, create a branch from latest upstream `master` named for that issue and the internal control turn filtering bug. Prove the bug on unpatched master where feasible, cherry-pick or reimplement only commit `bf5dddc`, run targeted tests and required checks, then prepare/push the branch for one PR. Claim the bead on start.  

**Folders Created/Deleted/Modified:**
- Nerve source tree

**Files Created/Deleted/Modified:**
- Chat history loading files and tests

**Status:** ⏸ Waiting for approval

**Results:** Waiting on upstream issue ID.

---

### Task 5: Prepare Stale Agents Pruning Upstream Branch

**Bead ID:** `oc-pe0`  
**SubAgent:** `primary`  
**Role:** `coder`  
**References:** `REF-01`, `REF-05`  
**Prompt:** After issue creation approval/issue ID exists, create a branch from latest upstream `master` named for that issue and the stale Agents/session pruning bug. Prove the bug on unpatched master where feasible, cherry-pick or reimplement only commits `4456816` and `49c8481`, run targeted tests and required checks, then prepare/push the branch for one PR. Claim the bead on start.  

**Folders Created/Deleted/Modified:**
- Nerve source tree

**Files Created/Deleted/Modified:**
- Session reconciliation files and tests

**Status:** ⏸ Waiting for approval

**Results:** Waiting on upstream issue ID.

---

### Task 6: QA And Audit Upstream Branches

**Bead ID:** `oc-psf`  
**SubAgent:** `primary`  
**Role:** `qa` / `auditor`  
**References:** `REF-01`, `REF-03`, `REF-04`, `REF-05`  
**Prompt:** For each upstream branch, independently verify the branch starts from upstream `master`, contains only the intended fix, reproduces the target bug before the patch where feasible, squashes it after the patch, and passes required validation. The auditor closes the corresponding bead only when evidence is sufficient.  

**Folders Created/Deleted/Modified:**
- Nerve source tree

**Files Created/Deleted/Modified:**
- Plan and Beads state

**Status:** ⏸ Waiting for upstream branches

**Results:** Pending.

---

## Final Results

**Status:** ⚠️ Partial / Blocked on external approval

**What We Built:** Internal rollout completed for cookie, chip, and pico. Upstream issue/PR split and branch strategy planned.

**Reference Check:** `REF-01` reviewed for required upstream process. `REF-02` reviewed for local validation baseline. `REF-03`, `REF-04`, and `REF-05` split into three proposed upstream submissions.

**Commits:**
- Pending

**Lessons Learned:** Pending.

---

*Completed on Pending*
