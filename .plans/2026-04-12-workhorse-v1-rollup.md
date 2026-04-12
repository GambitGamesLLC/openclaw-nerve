# gambit-openclaw-nerve — workhorse-v1 rollup

**Date:** 2026-04-12  
**Status:** In Progress  
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

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 5: Report readiness and next cleanup actions

**Bead ID:** `nerve-gll7`  
**SubAgent:** `primary`
**Prompt:** Summarize the final `workhorse-v1` stack, list all included PRs and their branches, record repo-local validation outcomes, note that `~/.openclaw/.env` now points deploys at `workhorse-v1`, and spell out the exact manual follow-up Derrick must do next (`update.sh`, `restore.sh`, then dogfood). Also recommend the exact follow-up steps for retiring old `workhorse` and cleaning leftover scratch worktrees safely.

**Files Created/Deleted/Modified:**
- `.plans/2026-04-12-workhorse-v1-rollup.md`

**Status:** ⏳ Pending

**Results:** Pending.

---

## Final Results

**Status:** ⏳ Pending

**What We Built:** Pending.

**Commits:**
- Pending

**Lessons Learned:** Pending.

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
