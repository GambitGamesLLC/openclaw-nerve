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

### Task 7: Preserve dirty `workhorse` state and switch main checkout to `workhorse-v1`

**Bead ID:** `nerve-8854`  
**SubAgent:** `primary`
**Prompt:** Preserve the dirty/untracked state in the main-checkout `workhorse` branch without losing it, then switch the main repo checkout at `projects/gambit-openclaw-nerve` onto `workhorse-v1` so `update.sh` can deploy from the correct branch. Record exactly how the old state was preserved and verify the main checkout branch/status after the switch.

**Files Created/Deleted/Modified:**
- `.plans/2026-04-12-workhorse-v1-rollup.md`
- git stash / refs metadata as needed

**Status:** ✅ Complete

**Results:** Preserved the dirty main-checkout `workhorse` state using a named stash that included untracked files:
- `stash@{0}` — `On workhorse: pre-workhorse-v1-switch-2026-04-12-1048`

Then switched the main repo checkout at `projects/gambit-openclaw-nerve` from `workhorse` to `workhorse-v1` successfully.

Post-switch verification:
- current branch: `workhorse-v1`
- working tree status: `?? .worktrees/`

Notes:
- `git stash push -u` reported `Ignoring path .worktrees/...` for nested worktree directories; that is expected for nested worktree paths and the important dirty plan/doc state from the old main checkout was preserved in the stash.
- The main checkout is now on the intended deploy branch for `update.sh` / `restore.sh`.

---

### Task 8: Audit remaining legacy worktrees and classify removal safety

**Bead ID:** `nerve-42eh`  
**SubAgent:** `primary`
**Prompt:** Investigate the remaining `.worktrees/` entries and any related registered git worktrees for `gambit-openclaw-nerve`. For each remaining item, determine whether it is a real registered worktree or a standalone nested scratch repo, identify its branch/commit/purpose if recoverable from plan/memory history, and classify it as safe to remove now vs keep. Prefer evidence-backed classification over assumptions.

**Files Created/Deleted/Modified:**
- `.plans/2026-04-12-workhorse-v1-rollup.md`

**Status:** ✅ Complete

**Results:** Cross-checked the remaining on-disk `.worktrees/` entries against `git worktree list --porcelain`, each checkout’s `.git` layout, branch/HEAD state, and the 2026-04-11 hardening plan + memory notes.

Per-item classification:
- `.worktrees/local-chat-links-self-heal`
  - **Type:** real registered git worktree (`.git` points at main repo admin dir; listed by `git worktree list`)
  - **Branch / commit:** `feature/local-chat-links-self-heal-and-defaults` @ `6687533` (`test(config): isolate ConfigTab local storage state`)
  - **Recoverable purpose:** canonical clean source branch for upstream PR `#267` (`feature/local-chat-links-self-heal-and-defaults`), created as the fresh upstream-master lane for the chat-links hardening work
  - **Removal safety:** **Keep** for now. Evidence says this is still the authoritative PR branch/worktree and it contains the final CodeRabbit + CI-fix follow-up commits documented in memory.
- `.worktrees/workhorse-dogfood`
  - **Type:** real registered git worktree (`.git` points at main repo admin dir; listed by `git worktree list`)
  - **Branch / commit:** detached HEAD at `d9db0a1` (`feat(chat): self-heal missing local chat path links config`); commit is still reachable from local branches `workhorse` and `workhorse-reroll`
  - **Recoverable purpose:** stale dogfood snapshot from the early `workhorse` reroll phase of the 2026-04-11 chat-link hardening lane, before the later helper/server-tree and Windows-aware follow-up rerolls
  - **Removal safety:** **Safe to remove now.** It is clean, detached, superseded by later documented rerolls and by `workhorse-v1`, and deleting the worktree would not strand the referenced commit.
- `.worktrees/nerve-lp9p-reroll`
  - **Type:** standalone nested scratch repo, **not** a registered worktree (`.git` is a directory, not a gitfile; absent from the main repo’s `git worktree list`)
  - **Branch / commit:** nested repo branch `workhorse` @ `fb9778b` (`fix(chat): keep chat path links helper in server tree`), with nested `origin` pointed back at the main repo path and shown as `ahead 1`
  - **Recoverable purpose:** scratch reroll clone used for Task 5 of the 2026-04-11 plan to replay the missing server-tree helper fix onto `workhorse` for Linux dogfood; the same commit is preserved in the main repo as branch `workhorse-reroll`
  - **Removal safety:** **Safe to remove now.** It is a clean scratch clone, not an active registered worktree, its purpose is fully documented, and its key reroll commit is already preserved in the main repo.

Summary evidence note: among the remaining `.worktrees/` entries, only `local-chat-links-self-heal` and `workhorse-dogfood` are still registered to the main repo; `nerve-lp9p-reroll` is just a nested throwaway repo. The only remaining item that should clearly be kept is the live PR/source branch worktree `local-chat-links-self-heal`.

---

### Task 9: Remove remaining local worktrees and scratch reroll repo

**Bead ID:** `nerve-tr21`  
**SubAgent:** `primary`
**Prompt:** Remove all remaining local `.worktrees/*` leftovers now that Derrick has confirmed they are no longer needed locally. Use `git worktree remove` for registered worktrees, remove any standalone nested scratch repo carefully, and verify the resulting `.worktrees/` state plus `git worktree list` afterward. Record exactly what was removed.

**Files Created/Deleted/Modified:**
- `.plans/2026-04-12-workhorse-v1-rollup.md`
- local worktree directories / git worktree metadata

**Status:** ✅ Complete

**Results:** Removed all three remaining local `.worktrees/*` entries and verified cleanup afterward.

Exact removals:
- Removed registered worktree `.worktrees/local-chat-links-self-heal` via `git worktree remove`
- Removed registered worktree `.worktrees/workhorse-dogfood` via `git worktree remove`
- Removed standalone nested scratch repo `.worktrees/nerve-lp9p-reroll` by deleting that directory after confirming it was not a registered worktree

Final verification state:
- `.worktrees/` is now empty (no remaining entries under that directory)
- `git worktree list --porcelain` no longer shows any `.worktrees/...` paths
- Remaining registered worktrees are only the main checkout on `workhorse-v1` plus the separate `.temp/...` worktrees; no branch refs or remotes were touched during this cleanup

---

### Task 10: Audit remaining `.temp` worktrees and classify removal safety

**Bead ID:** `nerve-wi5b`  
**SubAgent:** `primary`
**Prompt:** Investigate the remaining `.temp/...` git worktrees for `gambit-openclaw-nerve`. For each one, determine branch/commit, whether it is a registered worktree, likely purpose from branch naming and plan/memory history, and whether it appears safe to remove locally now. Prefer evidence-backed classification and note any item that looks like it still has unique local value.

**Files Created/Deleted/Modified:**
- `.plans/2026-04-12-workhorse-v1-rollup.md`

**Status:** ✅ Complete

**Results:** Audited all remaining registered `.temp/...` worktrees from `git worktree list --porcelain`, cross-checking each checkout’s `git status --short --branch`, branch/HEAD state, commit subject, ancestry vs `workhorse-v1` / `upstream/master`, and relevant plan/memory notes.

Per-item classification:
- `.temp/gambit-openclaw-nerve-bead-scheme-nav`
  - **Type:** real registered git worktree (listed by `git worktree list`)
  - **Branch / commit:** `slice/bead-scheme-markdown-navigation` @ `8c2c37e` (`fix(markdown): preserve bead: links through react-markdown transform`)
  - **Recoverable purpose:** narrow Beads markdown-link fix lane from the 2026-04-06 / 2026-04-07 bead-link dogfood work; memory explicitly ties this branch to the `bead:` / `bead://` navigation investigation
  - **Evidence notes:** clean worktree; commit is preserved on local+remote branch, but **not** contained by `upstream/master` or `workhorse-v1`
  - **Removal safety:** **Safe to remove locally now** if Derrick only wants to clean disk/worktree state. The branch tip is preserved, but this lane still looks like an unmerged canonical branch rather than throwaway history.
- `.temp/gambit-openclaw-nerve-issue-228`
  - **Type:** real registered git worktree
  - **Branch / commit:** `slice/issue-228-canonical-attachment-contract` @ `4595bc1` (`Validate upload staging path before writes`)
  - **Recoverable purpose:** old issue/PR `#228/#229` canonical attachment-contract lane documented in 2026-04-03 / 2026-04-04 memory
  - **Evidence notes:** clean worktree; branch shows `ahead 2, behind 7` vs `upstream/master`; commit is already contained by `workhorse-v1` and preserved on `origin/slice/issue-228-canonical-attachment-contract`
  - **Removal safety:** **Safe to remove locally now.** No local-only changes surfaced.
- `.temp/gambit-openclaw-nerve-issue-230`
  - **Type:** real registered git worktree
  - **Branch / commit:** `slice/composer-single-primary-paperclip` @ `d3dea62` (`fix(chat): resolve InputBar lint errors`)
  - **Recoverable purpose:** old paperclip/composer lane in the attachment-flow stack, documented in 2026-04-04 memory as part of the chain feeding later add-to-chat work
  - **Evidence notes:** clean worktree; commit is contained by `workhorse-v1` and preserved on `origin/slice/composer-single-primary-paperclip`
  - **Removal safety:** **Safe to remove locally now.** No unique local value detected.
- `.temp/gambit-openclaw-nerve-issue-232`
  - **Type:** real registered git worktree
  - **Branch / commit:** `slice/workspace-file-add-to-chat` @ `0215573` (`Add workspace file tree add-to-chat action`)
  - **Recoverable purpose:** current draft upstream PR `#233`, also explicitly recorded in this plan’s rollup tasks
  - **Evidence notes:** clean worktree; commit is contained by `workhorse-v1` and preserved on `origin/slice/workspace-file-add-to-chat`
  - **Removal safety:** **Safe to remove locally now.** The branch itself still matters, but this local checkout does not appear to hold unique state.
- `.temp/gambit-openclaw-nerve-issue-234`
  - **Type:** real registered git worktree
  - **Branch / commit:** `slice/workspace-directory-context` @ `8a5d0b4` (`Allow adding workspace directories to chat`)
  - **Recoverable purpose:** current draft upstream PR `#235`, stacked directly on `slice/workspace-file-add-to-chat` per both memory and this plan’s Task 1 audit
  - **Evidence notes:** clean worktree; commit is contained by `workhorse-v1` and preserved on `origin/slice/workspace-directory-context`
  - **Removal safety:** **Safe to remove locally now.** No local-only changes surfaced.
- `.temp/gambit-openclaw-nerve-sv1`
  - **Type:** real registered git worktree
  - **Branch / commit:** `slice/nerve-sv1-sessions-subagent-visibility` @ `93e155a` (`fix(sessions): include spawned children from all root agents`)
  - **Recoverable purpose:** upstream PR `#226` sessions/subagent visibility lane documented in 2026-04-02 memory and in this rollup plan
  - **Evidence notes:** clean worktree tracking `origin/slice/nerve-sv1-sessions-subagent-visibility`; commit is contained by `workhorse-v1`
  - **Removal safety:** **Safe to remove locally now.** Branch is preserved and no unique local changes were found.
- `.temp/nerve-upstream-master-f0dbe68`
  - **Type:** real registered git worktree
  - **Branch / commit:** detached HEAD @ `f0dbe68` (`fix(chat): preserve uploaded user images across history reconciliation (#220)`)
  - **Recoverable purpose:** scratch clean checkout pinned to the 2026-04-02 `upstream/master` baseline used during early sessions-visibility / bug-triage work
  - **Evidence notes:** unlike the branch-backed worktrees above, this checkout has an untracked file: `src/contexts/SessionContext.subagent-visibility-gap.temp.test.tsx`; the base commit is now fully contained by `upstream/master`, `workhorse`, and `workhorse-v1`
  - **Removal safety:** **Keep / review before removing.** The registered worktree itself is disposable, but the untracked temp test is local-only value until consciously discarded or copied elsewhere.
- `.temp/nerve-upstream-master-next-candidate`
  - **Type:** real registered git worktree
  - **Branch / commit:** detached HEAD @ `f0dbe68` (`fix(chat): preserve uploaded user images across history reconciliation (#220)`)
  - **Recoverable purpose:** another old clean-upstream scratch checkout, likely used for “next candidate” exploration / triage around early April before a stronger lane was chosen
  - **Evidence notes:** has untracked file `src/hooks/useWebSocket.reconnect-auth-failure.temp.test.ts`; base commit is already contained by `upstream/master`, `workhorse`, and `workhorse-v1`
  - **Removal safety:** **Keep / review before removing.** Same reason as above: the checkout is not important, but the untracked temp test looks like unique local-only scratch value.
- `.temp/nerve-workhorse-clean-2026-04-09`
  - **Type:** real registered git worktree
  - **Branch / commit:** `staging/workhorse-clean-2026-04-09` @ `a3fecfc` (`Tighten final bead lookup follow-ups`)
  - **Recoverable purpose:** a dated staging/cleanup integration branch from the 2026-04-09 workhorse refresh period; naming and branch shape suggest it was a clean staging candidate before the later `workhorse-v1` reset
  - **Evidence notes:** clean worktree tracking `origin/staging/workhorse-clean-2026-04-09`; not contained by `upstream/master` or `workhorse-v1`, but preserved on the local+remote staging branch and still reachable from `workhorse`
  - **Removal safety:** **Safe to remove locally now.** No local-only edits surfaced, and it appears superseded by the newer `workhorse-v1` rollout.

Summary evidence note: every remaining `.temp/...` item is a real registered worktree. Seven look clean and locally disposable because their value is preserved by branch refs and/or inclusion in `workhorse-v1`. The only items that clearly need human review before deletion are the two detached old-`upstream/master` scratch worktrees, because both contain untracked `.temp.test.ts(x)` files that may still hold unique local-only experiment value.

---

### Task 11: Remove remaining `.temp` worktrees and detached scratch baselines

**Bead ID:** `nerve-si6j`  
**SubAgent:** `primary`
**Prompt:** Remove the remaining `.temp/...` worktrees now that Derrick has confirmed the two detached upstream-master scratch worktrees and their temp test files are disposable. Use `git worktree remove` for all registered `.temp` worktrees, verify the final `git worktree list`, and record exactly what was removed.

**Files Created/Deleted/Modified:**
- `.plans/2026-04-12-workhorse-v1-rollup.md`
- local `.temp/...` worktree directories / git worktree metadata

**Status:** ✅ Complete

**Results:** Removed all remaining registered `.temp/...` worktrees:
- `.temp/gambit-openclaw-nerve-bead-scheme-nav`
- `.temp/gambit-openclaw-nerve-issue-228`
- `.temp/gambit-openclaw-nerve-issue-230`
- `.temp/gambit-openclaw-nerve-issue-232`
- `.temp/gambit-openclaw-nerve-issue-234`
- `.temp/gambit-openclaw-nerve-sv1`
- `.temp/nerve-upstream-master-f0dbe68`
- `.temp/nerve-upstream-master-next-candidate`
- `.temp/nerve-workhorse-clean-2026-04-09`

Removal notes:
- Most were removed cleanly with normal `git worktree remove` semantics.
- The detached upstream-master scratch worktree `nerve-upstream-master-f0dbe68` refused a non-force removal because it still contained disposable untracked temp-test files, matching the prior audit. After Derrick confirmed those files were junk, the remaining `.temp` worktrees were removed with force.

Verification:
- `git worktree list --porcelain` now shows only the main checkout on `workhorse-v1`
- current `git status --short` shows only the modified plan file `.plans/2026-04-12-workhorse-v1-rollup.md`

---

## Final Results

**Status:** ✅ Complete

**What We Built:** A fresh `workhorse-v1` integration branch from current `upstream/master`, containing all nine currently open Gambit-owned upstream PR branches, validated locally with a full install/build/test pass, wired into local deploy configuration by changing `~/.openclaw/.env` to target `workhorse-v1`, carrying forward the dirty active `.plans/` history from the old `workhorse` checkout, and now positioned as the main repo checkout branch for the next manual deploy.

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
