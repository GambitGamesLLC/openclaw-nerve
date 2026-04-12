# gambit-openclaw-nerve — workhorse-v1 rollup

**Date:** 2026-04-12  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Create a fresh `workhorse-v1` branch from `upstream/master` that rolls up every currently open upstream PR targeting `daggerhashimoto/openclaw-nerve` from the `GambitGamesLLC` fork, including draft PRs, so Derrick has a clean combined dogfood branch and can retire the old `workhorse` branch afterward.

---

## Overview

Rather than untangling the current `workhorse` branch and its leftover scratch worktrees, this plan starts from a clean `upstream/master` base and rebuilds the integration branch intentionally. The new branch should represent the current live stack of Gambit-owned upstream lanes only, without legacy reroll noise, stale local-only experiments, or unrelated dogfood artifacts.

I queried upstream open PRs and identified nine currently open PRs from the `GambitGamesLLC` fork targeting `master`: `#267`, `#265`, `#264`, `#257`, `#253`, `#246`, `#235` (draft), `#233` (draft), and `#226`. The exact replay strategy still needs one explicit choice during execution: whether to merge each PR branch into `workhorse-v1` or cherry-pick its commits. Default recommendation is to merge each owning branch in a controlled order so the branch remains visibly composed of the upstream lanes.

---

## Tasks

### Task 1: Audit rollup inputs and choose integration order

**Bead ID:** `nerve-k15a`  
**SubAgent:** `primary`
**Prompt:** Audit every open upstream PR from the `GambitGamesLLC` fork targeting `daggerhashimoto/openclaw-nerve:master`, including drafts. Confirm branch names, check whether any branches depend on others, identify likely merge/conflict hotspots, and propose the safest deterministic integration order for a fresh `workhorse-v1` rollup branch.

**Files Created/Deleted/Modified:**
- `.plans/2026-04-12-workhorse-v1-rollup.md`

**Status:** ✅ Complete

**Results:** Audited all nine currently open upstream PRs from the `GambitGamesLLC` fork targeting `master`: `#267`, `#265`, `#264`, `#257`, `#253`, `#246`, `#235` (draft), `#233` (draft), and `#226`. Seven branches are based on current `upstream/master` commit `a5f7973`, while `#246`, `#233`, and `#235` are still based on older commit `5f70f84` and are seven upstream commits behind (`#229`, `#247`, `#236`, `#242`, `#239`, `#248`, `#231`). The only direct open-PR ancestry link is `#235` (`slice/workspace-directory-context`) stacking on top of `#233` (`slice/workspace-file-add-to-chat`).

Chosen deterministic merge order for `workhorse-v1`:
1. `#226` — `slice/nerve-sv1-sessions-subagent-visibility`
2. `#257` — `bug/default-model-effort`
3. `#265` — `fix/upload-config-capability`
4. `#267` — `feature/local-chat-links-self-heal-and-defaults`
5. `#253` — `feature/beads-view-ui`
6. `#264` — `bugfix/workspace-inline-reference-slice`
7. `#246` — `slice/hidden-workspace-entries-toggle`
8. `#233` — `slice/workspace-file-add-to-chat` (draft)
9. `#235` — `slice/workspace-directory-context` (draft)

Rationale: apply isolated, low-overlap fixes first; keep the markdown/link pair ordered so `#264` lands after the larger Beads-viewer markdown changes; then leave the stale-base workspace/file-tree stack until the end, with `#233` immediately before dependent `#235` so the highest-conflict branch pair is resolved once in final context.

Likely conflict hotspots / dependencies:
- `server/app.ts`: overlaps across `#265`, `#253`, `#233`, and `#235`
- `src/features/markdown/MarkdownRenderer.tsx` and tests: overlap between `#253` and `#264`
- `server/routes/file-browser.ts` and tests: overlap between `#264` and `#246`
- `src/features/file-browser/FileTreePanel.tsx` and tests: overlap between `#246`, `#233`, and `#235`
- `src/App.tsx` and `src/features/chat/ChatPanel.tsx`: overlap between `#253`, `#233`, and `#235`
- `#235` is a direct descendant of `#233`; merge them back-to-back
- `#233` and `#235` both predate upstream merges `#229` / `#231`, so expect the heaviest manual conflict resolution in upload-reference / InputBar / chat attachment paths when they are replayed onto fresh `upstream/master`

---

### Task 2: Create fresh `workhorse-v1` from `upstream/master`

**Bead ID:** `nerve-08uu`  
**SubAgent:** `primary`
**Prompt:** Create local branch `workhorse-v1` from fresh `upstream/master` in `gambit-openclaw-nerve`, ensuring the base commit is current and recorded in the plan before any rollup begins.

**Files Created/Deleted/Modified:**
- `.plans/2026-04-12-workhorse-v1-rollup.md`

**Status:** ✅ Complete

**Results:** Fetched latest remote refs, confirmed current `upstream/master` at `a5f7973eedd218a124759b27fe2c58d5c096b5eb` (`feat(chat): make paperclip the primary upload flow (#231)`), and created local branch `workhorse-v1` pointing exactly at that commit. I created the branch without switching the existing dirty `workhorse` working tree, so the rollup can start from a clean known base in the next task without disturbing local in-progress files.

---

### Task 3: Roll up all open Gambit PR branches into `workhorse-v1`

**Bead ID:** `nerve-drvu`  
**SubAgent:** `coder`
**Prompt:** Starting from fresh `workhorse-v1`, integrate every currently open upstream PR branch from the `GambitGamesLLC` fork (including drafts) in the approved order. Resolve conflicts carefully, preserving each lane’s intended behavior. Record exactly which branch/PR was integrated, whether by merge or cherry-pick, and any manual conflict resolutions.

**Files Created/Deleted/Modified:**
- repo source files as affected by branch integration
- `.plans/2026-04-12-workhorse-v1-rollup.md`

**Status:** ✅ Complete

**Results:** Completed the rollup by merging all nine branches into `workhorse-v1` with merge commits, preserving branch provenance throughout.

Merged branches / outcomes:
1. `#226` — `slice/nerve-sv1-sessions-subagent-visibility` → merge commit `03ce4c6`
2. `#257` — `bug/default-model-effort` → merge commit `9437dd5`
3. `#265` — `fix/upload-config-capability` → merge commit `4219fea`
4. `#267` — `feature/local-chat-links-self-heal-and-defaults` → merge commit `ef01129`
5. `#253` — `feature/beads-view-ui` → merge commit `8d45ae5`
6. `#264` — `bugfix/workspace-inline-reference-slice` → merge commit `9b77578`
7. `#246` — `slice/hidden-workspace-entries-toggle` → merge commit `4d82186`
8. `#233` — `slice/workspace-file-add-to-chat` → merge commit `3bd0184`
9. `#235` — `slice/workspace-directory-context` → merge commit `77b8407`

Manual conflict resolution notes:
- `feature/beads-view-ui` conflicted in `server/app.ts` because `fix/upload-config-capability` had already added `uploadConfigRoutes` while the Beads lane added `beadsRoutes`. Resolved by keeping both imports and both routes in the server route list.
- `bugfix/workspace-inline-reference-slice` conflicted in `src/features/markdown/MarkdownRenderer.tsx` because the inline-reference lane added `MarkdownLinkContext`, `createContext` / `useContext`, and inline path rendering changes, while the earlier Beads work added `parseBeadLinkHref`, `BeadLinkTarget`, and `defaultUrlTransform` usage. Resolved by combining both feature sets: keep bead-link parsing and preserve the inline reference / link-context behavior.
- `slice/hidden-workspace-entries-toggle` conflicted in `src/contexts/SettingsContext.tsx` and `src/features/settings/AppearanceSettings.tsx` because the stale branch wanted to add a hidden-workspace visibility toggle, while the newer base already carried a persisted workspace Kanban visibility toggle. Resolved additively by keeping both settings in context and rendering both controls in the appearance settings panel.
- `slice/workspace-file-add-to-chat` conflicted in `server/app.ts` and `src/features/chat/ChatPanel.tsx` because the stale branch predated later route wiring (`uploadConfigRoutes`, `beadsRoutes`) and bead-link chat support. Resolved by preserving the old branch’s workspace-file-to-chat changes while keeping the newer route registrations and the `BeadLinkTarget` import / prop path intact.
- `slice/workspace-directory-context` merged cleanly after `slice/workspace-file-add-to-chat` with no additional manual conflict resolution required.

Notes:
- Because the original repo checkout was a dirty `workhorse` worktree, the rollup was executed inside a separate clean worktree rooted at `.worktrees/workhorse-v1-rollup` on branch `workhorse-v1` to avoid disturbing existing local scratch state.
- No validation beyond merge-cleanliness was run, per task constraints.

---

### Task 4: Prepare dogfood validation handoff

**Bead ID:** `nerve-6g3k`  
**SubAgent:** `coder`
**Prompt:** Run the most relevant repo-local validation for the rolled-up `workhorse-v1` branch (build/tests needed to catch integration breakage), then prepare the local dogfood handoff by updating `~/.openclaw/.env` so the deploy target branch is `workhorse-v1`. Do not run `update.sh` or `restore.sh`; Derrick will run those manually. Summarize pass/fail status and any follow-up fixes required before dogfooding.

**Files Created/Deleted/Modified:**
- `.plans/2026-04-12-workhorse-v1-rollup.md`
- `~/.openclaw/.env`

**Status:** ✅ Complete

**Results:** Ran practical repo-local integration validation in the clean `.worktrees/workhorse-v1-rollup` checkout after installing dependencies with `npm ci`.

Exact commands and outcomes:
- `npm ci` → ✅ passed in ~12s; installed dependencies successfully. Postinstall emitted the normal reminder that local Nerve setup can be completed with `npm run setup`. `npm audit` summary reported 13 existing vulnerabilities (3 moderate, 10 high), but install completed successfully.
- `npm run build` → ✅ passed. TypeScript, Vite production build, and server build all completed successfully. Vite emitted non-fatal warnings about large chunks and about some modules being both statically and dynamically imported; no build failure occurred.
- `npm test -- --run` → ✅ passed. Vitest finished with `129 passed` test files and `1712 passed` tests in about `40.22s`.

Deploy handoff update:
- Updated `~/.openclaw/.env` from `NERVE_DEPLOY_BRANCH=workhorse` to `NERVE_DEPLOY_BRANCH=workhorse-v1`.

Readiness note:
- Validation passed, so this branch is ready for Derrick’s manual local rollout flow.
- Per task constraints, I did **not** run `update.sh` or `restore.sh`.

---

### Task 5: Report readiness and next cleanup actions

**Bead ID:** `nerve-gll7`  
**SubAgent:** `primary`
**Prompt:** Summarize the final `workhorse-v1` stack, list all included PRs and their branches, record repo-local validation outcomes, note that `~/.openclaw/.env` now points deploys at `workhorse-v1`, and spell out the exact manual follow-up Derrick must do next (`update.sh`, `restore.sh`, then dogfood). Also recommend the exact follow-up steps for retiring old `workhorse` and cleaning leftover scratch worktrees safely.

**Files Created/Deleted/Modified:**
- `.plans/2026-04-12-workhorse-v1-rollup.md`

**Status:** ✅ Complete

**Results:** `workhorse-v1` is now the clean rollup branch rooted at `upstream/master` commit `a5f7973eedd218a124759b27fe2c58d5c096b5eb`, with all nine currently open Gambit upstream lanes merged in this order:
1. `#226` — `slice/nerve-sv1-sessions-subagent-visibility`
2. `#257` — `bug/default-model-effort`
3. `#265` — `fix/upload-config-capability`
4. `#267` — `feature/local-chat-links-self-heal-and-defaults`
5. `#253` — `feature/beads-view-ui`
6. `#264` — `bugfix/workspace-inline-reference-slice`
7. `#246` — `slice/hidden-workspace-entries-toggle`
8. `#233` — `slice/workspace-file-add-to-chat` (draft)
9. `#235` — `slice/workspace-directory-context` (draft)

Validation summary recorded for handoff:
- `npm ci` ✅
- `npm run build` ✅
- `npm test -- --run` ✅ (`129` files / `1712` tests passed)
- Build emitted warnings only; no failing validation remains documented from this pass.

Deploy target summary:
- `~/.openclaw/.env` now points deploys at `workhorse-v1` via `NERVE_DEPLOY_BRANCH=workhorse-v1`.

Derrick’s exact next manual steps:
1. Run `~/.openclaw/workspace/scripts/update.sh`
2. Run `~/.openclaw/workspace/scripts/restore.sh`
3. Dogfood the resulting local Nerve deployment on `workhorse-v1`

Recommended cleanup / retirement follow-up after dogfooding succeeds:
1. Confirm the old `workhorse` branch/worktree is no longer needed.
2. Archive or delete the legacy `workhorse` worktree only after confirming there is no uncommitted state worth preserving.
3. Remove the temporary rollup / scratch worktrees that are now superseded (`.worktrees/workhorse-v1-rollup`, old issue-specific `.temp/...` worktrees, and other stale integration scratch trees) only after verifying no remaining branch depends on them.
4. Keep `workhorse-v1` as the active combined dogfood branch until upstream PR state changes require a new rollup.

---

### Task 6: Bring dirty `workhorse` plan docs forward and retire the rollup worktree

**Bead ID:** `nerve-kprv`  
**SubAgent:** `coder`
**Prompt:** Copy the relevant dirty/untracked `.plans/` files from the current main-checkout `workhorse` into the `workhorse-v1` branch so the new dogfood branch carries forward the active planning history. Then commit the plan/doc state on `workhorse-v1`, retire the temporary `workhorse-v1` rollup worktree, and leave the repo ready for the main checkout to switch onto `workhorse-v1` cleanly without losing those plans.

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-cut-clean-beads-view-ui-branch-and-package-upstream.md`
- `.plans/2026-04-08-diagnose-root-workspace-bead-not-found.md`
- `.plans/2026-04-08-stress-test-bead-viewer-and-package-upstream.md`
- `.plans/2026-04-09-audit-open-prs-and-refresh-combo-branch.md`
- `.plans/2026-04-09-final-post-rewrite-coderabbit-cleanup.md`
- `.plans/2026-04-09-remove-plans-from-pr-253-history.md`
- `.plans/2026-04-10-bug2-issue-pr-followthrough.md`
- `.plans/2026-04-10-chat-path-links-endpoint-diagnosis.md`
- `.plans/2026-04-10-link-dogfood-not-live-diagnosis.md`
- `.plans/2026-04-10-nerve-502-startup-diagnosis.md`
- `.plans/2026-04-10-workspace-add-to-chat-disabled-diagnosis.md`
- `.plans/2026-04-10-workspace-add-to-chat-upload-config-fix.md`
- `.plans/2026-04-10-workspace-link-canonical-path-tightening.md`
- `.plans/2026-04-10-workspace-link-pattern-broadening.md`
- `.plans/2026-04-10-workspace-link-wrapper-followups.md`
- `.plans/2026-04-11-chat-link-hardening-lane.md`
- `.plans/2026-04-11-workhorse-packaging-and-chat-links-hardening.md`
- `.plans/2026-04-12-workhorse-v1-rollup.md`

**Status:** ✅ Complete

**Results:** Carried the active dirty plan state from the main-checkout `workhorse` tree into `workhorse-v1` by copying the sixteen untracked top-level `.plans/*.md` files plus the modified `.plans/2026-04-11-workhorse-packaging-and-chat-links-hardening.md` file into the clean `workhorse-v1` rollup worktree. I intentionally did **not** overwrite `.plans/2026-04-12-workhorse-v1-rollup.md` from the dirty main checkout because that copy was stale relative to the rollup worktree’s already-completed task record; instead I updated the authoritative `workhorse-v1` copy in place with this Task 6 handoff.

Committed the carry-forward on `workhorse-v1` with message `docs: carry workhorse plans into workhorse-v1`. This preserved the dirty `workhorse` planning history on the new branch without touching the old `workhorse` branch itself and left the main checkout still on `workhorse` so Derrick can switch it later once ready.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** A fresh `workhorse-v1` integration branch from current `upstream/master`, containing all nine currently open Gambit-owned upstream PR branches, validated locally with a full install/build/test pass, wired into local deploy configuration by changing `~/.openclaw/.env` to target `workhorse-v1`, and now carrying forward the dirty active `.plans/` history from the old `workhorse` checkout.

**Commits:**
- `03ce4c6` - Merge branch `slice/nerve-sv1-sessions-subagent-visibility` into `workhorse-v1`
- `9437dd5` - Merge branch `bug/default-model-effort` into `workhorse-v1`
- `4219fea` - Merge branch `fix/upload-config-capability` into `workhorse-v1`
- `ef01129` - Merge branch `feature/local-chat-links-self-heal-and-defaults` into `workhorse-v1`
- `8d45ae5` - Merge branch `feature/beads-view-ui` into `workhorse-v1`
- `9b77578` - Merge branch `bugfix/workspace-inline-reference-slice` into `workhorse-v1`
- `4d82186` - Merge branch `slice/hidden-workspace-entries-toggle` into `workhorse-v1`
- `3bd0184` - Merge branch `slice/workspace-file-add-to-chat` into `workhorse-v1`
- `77b8407` - Merge branch `slice/workspace-directory-context` into `workhorse-v1`
- `02d9069` - docs: record workhorse-v1 rollup merge results
- final workhorse-v1 docs carry-forward commit — `docs: carry workhorse plans into workhorse-v1`

**Lessons Learned:** Using a dedicated clean worktree for the rollup avoided contaminating the existing dirty `workhorse` checkout and made it straightforward to validate the combined branch in isolation before repointing deployment. Copying the dirty plan set forward before retiring the temporary worktree also preserved local planning history without forcing an early branch switch in the main checkout.

---

### Rollup candidates detected at plan time

Open upstream PRs from `GambitGamesLLC` fork targeting `master`:
- `#267` — `feature/local-chat-links-self-heal-and-defaults`
- `#265` — `fix/upload-config-capability`
- `#264` — `bugfix/workspace-inline-reference-slice`
- `#257` — `bug/default-model-effort`
- `#253` — `feature/beads-view-ui`
- `#246` — `slice/hidden-workspace-entries-toggle`
- `#235` — `slice/workspace-directory-context` (draft)
- `#233` — `slice/workspace-file-add-to-chat` (draft)
- `#226` — `slice/nerve-sv1-sessions-subagent-visibility`

*Created on 2026-04-12*
