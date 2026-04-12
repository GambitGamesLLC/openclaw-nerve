# Audit Open PRs and Refresh the Combo Branch

**Date:** 2026-04-09  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Verify that the Gambit-owned combo branch lives on the correct fork, is rebased onto the latest upstream `master`, includes all currently open Nerve PRs we still want, and identifies any older unmerged/superseded work that should be reconsidered before rebuilding the combo branch.

---

## Overview

We need to treat this as both a Git packaging task and a PR-history audit. The first part is mechanical: identify the current combo branch (or decide to replace it), verify it exists on `GambitGamesLLC/openclaw-nerve`, compare it to the latest `daggerhashimoto/openclaw-nerve:master`, and make sure all five currently open Gambit PRs are represented. If a clean rebuild is safer than patching the current combo branch, we should cut a fresh combo branch from current upstream and restack the approved PR heads onto it.

The second part is a gate before branch construction. Derrick explicitly wants a review of older prior PRs to determine whether their changes have already landed upstream, were replaced by equivalent upstream work, or were left out without a real replacement. If we find older unmerged work that was neither merged nor effectively superseded, we should stop and report that gap before including anything into the combo branch.

This plan therefore has a deliberate pause point: audit open PRs and historical PR outcomes first, report any unresolved non-superseded omissions, then only execute the combo-branch rebuild/update after Derrick confirms the inclusion set.

---

## Tasks

### Task 1: Inventory the current open Nerve PR set and the existing combo-branch state

**Bead ID:** `nerve-6oip`  
**SubAgent:** `research`  
**Prompt:** In `~/workspace/projects/gambit-openclaw-nerve`, inventory the current open upstream PRs relevant to the Gambit fork and inspect the current combo-branch situation. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Audited open PRs and combo branch state" --json`. Determine: the five currently open PRs, their head branches/commits, whether an existing combo branch already lives on `GambitGamesLLC/openclaw-nerve`, and whether that combo branch is based on the latest upstream `master`. Update this plan with the exact PR list, branch refs, and combo-branch findings.

**Folders Created/Deleted/Modified:**
- `.plans/`
- inspected git refs and GitHub PR metadata

**Files Created/Deleted/Modified:**
- `.plans/2026-04-09-audit-open-prs-and-refresh-combo-branch.md`

**Status:** ✅ Complete

**Results:** Audited the currently open Gambit-relevant upstream PR set against `daggerhashimoto/openclaw-nerve` and the existing Gambit combo branch on `GambitGamesLLC/openclaw-nerve`.

Open PRs relevant to the Gambit combo branch:
- PR #253 — `feat: add Beads viewer UI and explicit bead:// link support`
  - head ref: `GambitGamesLLC/openclaw-nerve:feature/beads-view-ui`
  - head commit: `067aab72a82f197bb26bc34a6414c2f24e0adfa4`
  - combo containment: **not present** on current combo branch
- PR #246 — `feat(settings): add optional hidden workspace entries toggle`
  - head ref: `GambitGamesLLC/openclaw-nerve:slice/hidden-workspace-entries-toggle`
  - head commit: `be6199b4463fa51c380ddf86a660b03c7b1ad798`
  - combo containment: present
- PR #235 — `feat(workspace): allow adding directories to chat`
  - head ref: `GambitGamesLLC/openclaw-nerve:slice/workspace-directory-context`
  - head commit: `8a5d0b40526127b2327bc4255a4dfef82cafeb6a`
  - combo containment: present
- PR #233 — `feat(workspace): add file-tree add-to-chat action`
  - head ref: `GambitGamesLLC/openclaw-nerve:slice/workspace-file-add-to-chat`
  - head commit: `02155738dbc6b3405f9592b3737d5dfd2d21198d`
  - combo containment: present
- PR #226 — `fix(sessions): keep spawned child sessions visible after refresh`
  - head ref: `GambitGamesLLC/openclaw-nerve:slice/nerve-sv1-sessions-subagent-visibility`
  - head commit: `d0e41eb8c951b09b66b5e77d325a74c1b0cafbef`
  - combo containment: present

Combo branch findings:
- Existing Gambit combo branch already exists on the fork as `GambitGamesLLC/openclaw-nerve:feature/combo-workhorse-all-unmerged-2026-04-07`
- combo branch tip: `c82dc1216cc0df2cf1735dbb1b7a8474b716589f`
- upstream master tip checked: `a5f7973eedd218a124759b27fe2c58d5c096b5eb`
- merge-base of combo branch vs `upstream/master`: `a5f7973eedd218a124759b27fe2c58d5c096b5eb`
- conclusion: the current combo branch **is based on the latest upstream `master`** at audit time (0 commits behind upstream, 29 commits ahead)
- inclusion conclusion: current combo branch already carries PRs #246, #235, #233, and #226, but **does not yet include PR #253**.

---

### Task 2: Audit prior PRs for merged, superseded, or missing work and stop on unresolved omissions

**Bead ID:** `nerve-h2u7`  
**SubAgent:** `research`  
**Prompt:** In `~/workspace/projects/gambit-openclaw-nerve`, audit prior Gambit-origin Nerve PRs and classify each as merged upstream, effectively superseded/replaced by other upstream code, still open and relevant, or unmerged without a real replacement. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Audited prior PR outcomes for combo inclusion" --json`. For any prior PR that appears unmerged and not truly replaced/superseded, record it clearly as a stop-and-review item for Derrick before combo-branch execution proceeds. Update this plan with the classification table in prose/bullets and the recommended inclusion gate.

**Folders Created/Deleted/Modified:**
- `.plans/`
- inspected GitHub PR history and upstream commit history

**Files Created/Deleted/Modified:**
- `.plans/2026-04-09-audit-open-prs-and-refresh-combo-branch.md`

**Status:** ✅ Complete

**Results:** Audited all Gambit-origin upstream PRs visible in `daggerhashimoto/openclaw-nerve` and classified them as follows.

- **Merged upstream:**
  - `#148` — `feat(file-browser): add safe workspace path resolve and reveal` — merged 2026-03-24.
  - `#151` — `feat(setup): infer agent name from local identity metadata` — merged 2026-03-24.
  - `#229` — `feat(attachments): add canonical upload reference contract` — merged 2026-04-06.
  - `#231` — `feat(chat): make paperclip the primary upload flow` — merged 2026-04-07.
  - `#239` — `feat(chat): add configurable workspace path links` — merged 2026-04-06.
  - `#242` — `feat(settings): make built-in Kanban optional with a default-on toggle` — merged 2026-04-06.

- **Effectively superseded / replaced by other upstream code:**
  - `#238` — `feat(chat): add configurable workspace path links` — closed unmerged because it was accidentally based on the wrong feature stack; Derrick explicitly closed/reopened it from a clean branch as `#239`, which merged upstream.
  - `#244` — `feat(workspace): add navigable markdown document view` — closed unmerged after upstream owner explicitly marked it "Superseded by #248, which preserves your original PR history"; `#248` then merged upstream on 2026-04-06.

- **Still open and relevant for combo inclusion:**
  - `#226` — `fix(sessions): keep spawned child sessions visible after refresh`.
  - `#233` — `feat(workspace): add file-tree add-to-chat action`.
  - `#235` — `feat(workspace): allow adding directories to chat`.
  - `#246` — `feat(settings): add optional hidden workspace entries toggle`.
  - `#253` — `feat: add Beads viewer UI and explicit bead:// link support`.

- **Unmerged without a real replacement:**
  - None found in the Gambit-origin PR history reviewed here.

**Gate recommendation:** No historical Gambit PR was left behind without either merging or a clear replacement/supersession. Combo-branch execution does **not** need to pause for prior-unmerged-history review. The only remaining inclusion decisions are the five currently open/relevant PRs above.

---

### Task 3: Build or refresh the Gambit-owned combo branch from the approved inclusion set

**Bead ID:** `nerve-5ph9`  
**SubAgent:** `coder`  
**Prompt:** After Derrick confirms the inclusion set from Tasks 1-2, build or refresh the combo branch in `~/workspace/projects/gambit-openclaw-nerve`. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Built refreshed combo branch from approved PR set" --json`. If safer, create a new combo branch from the latest `upstream/master`; otherwise update the existing Gambit-owned combo branch. Ensure it lives on `GambitGamesLLC/openclaw-nerve`, includes all approved open PR branches, and excludes anything Derrick explicitly gates. Update this plan with the exact branch strategy, commit stack, and push target.

**Folders Created/Deleted/Modified:**
- `.plans/`
- git refs/branches in `gambit-openclaw-nerve`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-09-audit-open-prs-and-refresh-combo-branch.md`
- code/test files only as introduced by the approved stacked PRs

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 4: Verify the refreshed combo branch contents against upstream and the open PR set

**Bead ID:** `nerve-0f6n`  
**SubAgent:** `research`  
**Prompt:** After Task 3, verify the refreshed combo branch. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Verified refreshed combo branch contents" --json`. Confirm the branch lives on the Gambit fork, is based on the latest upstream `master`, contains each approved open PR head, and produce a concise verification summary with exact refs/commits.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-09-audit-open-prs-and-refresh-combo-branch.md`

**Status:** ✅ Complete

**Results:** Verified the refreshed combo branch on the Gambit fork with exact refs and containment checks.

- Fork/remote confirmation:
  - `origin` URL: `git@github.com:GambitGamesLLC/openclaw-nerve.git`
  - verified remote branch ref: `origin/feature/combo-workhorse-all-unmerged-2026-04-07`
  - verified combo tip: `15d7196bbe8d5456f90bbaa8c67b8c24bbdf179d` (`merge: PR #253 feature/beads-view-ui`)
- Upstream base confirmation:
  - `upstream/master` tip at verification time: `a5f7973eedd218a124759b27fe2c58d5c096b5eb` (`feat(chat): make paperclip the primary upload flow (#231)`)
  - merge-base of combo branch vs `upstream/master`: `a5f7973eedd218a124759b27fe2c58d5c096b5eb`
  - divergence (`upstream/master...combo`): `0` behind / `45` ahead
  - conclusion: the refreshed combo branch is still based on the latest upstream `master` at verification time
- Approved open PR head containment in combo ancestry:
  - `#226` — `d0e41eb8c951b09b66b5e77d325a74c1b0cafbef` — contained
  - `#233` — `02155738dbc6b3405f9592b3737d5dfd2d21198d` — contained
  - `#235` — `8a5d0b40526127b2327bc4255a4dfef82cafeb6a` — contained
  - `#246` — `be6199b4463fa51c380ddf86a660b03c7b1ad798` — contained
  - `#253` — `067aab72a82f197bb26bc34a6414c2f24e0adfa4` — contained
- `.plans` diff check against `upstream/master`:
  - **failed** the clean diff requirement
  - combo diff currently includes these `.plans/` files:
    - `.plans/2026-04-07-bead-links-not-clickable-runtime-diagnosis.md`
    - `.plans/2026-04-07-roll-bead-link-clickable-fix-into-clean-combo.md`
    - `.plans/2026-04-07-root-workspace-bead-link-dogfood-file.md`
    - `.plans/2026-04-08-bead-links-routing-to-external-browser.md`
    - `.plans/2026-04-08-bead-uri-links-not-clickable.md`
    - `.plans/2026-04-08-correct-beads-branch-layout-and-delete-stray-branch.md`
    - `.plans/2026-04-08-diagnose-nerve-502-after-update-and-restore.md`
    - `.plans/2026-04-08-finish-bead-link-routing-in-markdown-document-preview.md`
    - `.plans/2026-04-08-roll-latest-bead-viewer-into-combo.md`
    - `.plans/2026-04-08-spec-and-implement-bead-uri-links.md`

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:** The refreshed combo branch `origin/feature/combo-workhorse-all-unmerged-2026-04-07` on `GambitGamesLLC/openclaw-nerve` was verified to include all five approved open PR heads and to remain exactly based on the current `upstream/master` tip (`a5f7973eedd218a124759b27fe2c58d5c096b5eb`). The verification also found that the combo diff is **not clean with respect to `.plans/` content**: ten `.plans` files are present in the branch diff versus upstream.

**Commits:**
- `15d7196bbe8d5456f90bbaa8c67b8c24bbdf179d` - combo branch tip on `origin/feature/combo-workhorse-all-unmerged-2026-04-07`
- `a5f7973eedd218a124759b27fe2c58d5c096b5eb` - current `upstream/master` base used by the combo branch

**Lessons Learned:** Verification passed for fork location, upstream base, and PR-head containment, but failed the `.plans`-noise check. I updated this plan file locally/uncommitted only so we do not add more `.plans` noise to the combo branch.

---

*Started on 2026-04-09*
