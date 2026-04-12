# Cut Clean `feature/beads-view-ui` Branch and Package Upstream

**Date:** 2026-04-08
**Status:** In Progress
**Agent:** Chip 🐱‍💻

---

## Goal

Create a fresh upstream-facing branch named `feature/beads-view-ui` from `upstream/master`, transplant only the Beads viewer / explicit bead URI work onto it, verify that branch is clean, then open the upstream Issue + PR from that clean branch.

---

## Overview

The stress test passed, and the code audit says the Beads work itself is upstream-appropriate. The blocker is that `feature/bead-viewer` is not honest to upstream as a packaging source branch because it carries local `.plans/` artifacts alongside the intended code changes.

Rather than mutate history or surgically strip the existing branch in place, the cleaner path is to preserve `feature/bead-viewer` as working history and cut a new branch from `upstream/master` that contains only the Beads UI scope. That gives us a maintainable upstream narrative, avoids accidental local-artifact leakage, and keeps combo / canonical history understandable.

This run should therefore build a new clean branch, verify its diff is limited to the actual Beads feature set, run the maintainer-requested validation commands, and only then create the upstream feature request Issue plus the PR that references it.

---

## Tasks

### Task 1: Create the clean upstream-facing branch and transplant only Beads UI work

**Bead ID:** `nerve-hlof`
**SubAgent:** `coder`
**Prompt:** In `~/workspace/projects/gambit-openclaw-nerve`, create a new branch `feature/beads-view-ui` from `upstream/master`. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Clean upstream branch created" --json`. Bring over only the Beads-related code from the current canonical Beads work, explicitly excluding repo-local `.plans/` artifacts and any unrelated combo integration changes. Update this plan with the exact transplant method used, the resulting changed file list, and whether the branch diff now looks cleanly upstreamable.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `server/`
- `src/features/beads/`
- `src/features/chat/`
- `src/features/file-browser/`
- `src/features/markdown/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-cut-clean-beads-view-ui-branch-and-package-upstream.md`
- `server/app.ts`
- `server/lib/beads.test.ts`
- `server/lib/beads.ts`
- `server/lib/plans.ts`
- `server/routes/beads.test.ts`
- `server/routes/beads.ts`
- `src/App.tsx`
- `src/features/beads/BeadViewerTab.tsx`
- `src/features/beads/index.ts`
- `src/features/beads/links.test.ts`
- `src/features/beads/links.ts`
- `src/features/beads/types.ts`
- `src/features/beads/useBeadDetail.ts`
- `src/features/chat/ChatPanel.tsx`
- `src/features/chat/MessageBubble.test.tsx`
- `src/features/chat/MessageBubble.tsx`
- `src/features/file-browser/EditorTabBar.tsx`
- `src/features/file-browser/MarkdownDocumentView.test.tsx`
- `src/features/file-browser/MarkdownDocumentView.tsx`
- `src/features/file-browser/TabbedContentArea.test.tsx`
- `src/features/file-browser/TabbedContentArea.tsx`
- `src/features/markdown/MarkdownRenderer.test.tsx`
- `src/features/markdown/MarkdownRenderer.tsx`

**Status:** ✅ Complete

**Results:** Created local branch `feature/beads-view-ui` directly from `upstream/master` and committed a single clean transplant commit: `63bf93b` (`feat(beads): transplant bead viewer UI from canonical branch`).

**Exact transplant method used:** file-scoped transplant, not cherry-pick. I cut the new branch from `upstream/master`, then restored only the Beads-related source/test files from `feature/bead-viewer` with `git restore --source feature/bead-viewer -- <explicit file list>`, explicitly excluding all tracked `.plans/` files and any unrelated combo integration files. This avoided importing mixed-history plan commits while preserving the actual code state of the canonical Beads branch.

**Resulting changed file list (`upstream/master...feature/beads-view-ui`):**
- `server/app.ts`
- `server/lib/beads.test.ts`
- `server/lib/beads.ts`
- `server/lib/plans.ts`
- `server/routes/beads.test.ts`
- `server/routes/beads.ts`
- `src/App.tsx`
- `src/features/beads/BeadViewerTab.tsx`
- `src/features/beads/index.ts`
- `src/features/beads/links.test.ts`
- `src/features/beads/links.ts`
- `src/features/beads/types.ts`
- `src/features/beads/useBeadDetail.ts`
- `src/features/chat/ChatPanel.tsx`
- `src/features/chat/MessageBubble.test.tsx`
- `src/features/chat/MessageBubble.tsx`
- `src/features/file-browser/EditorTabBar.tsx`
- `src/features/file-browser/MarkdownDocumentView.test.tsx`
- `src/features/file-browser/MarkdownDocumentView.tsx`
- `src/features/file-browser/TabbedContentArea.test.tsx`
- `src/features/file-browser/TabbedContentArea.tsx`
- `src/features/markdown/MarkdownRenderer.test.tsx`
- `src/features/markdown/MarkdownRenderer.tsx`

**Upstreamability assessment:** the branch diff now looks cleanly upstreamable. It contains only Beads viewer / bead-link / explicit bead URI support plus directly related tests and server wiring. No `.plans/` files are tracked on the branch diff, and none of the unrelated combo integration files (`server/routes/file-browser*`, `SessionContext*`, `SettingsContext.tsx`, `FileTreePanel*`, `useFileTree*`, `AppearanceSettings.tsx`, etc.) were brought over.

**Verification performed:**
- Confirmed `feature/beads-view-ui` exists and is based on `upstream/master`.
- Confirmed branch is `ahead 1` with the clean transplant commit.
- Ran `npm run build:server` successfully.
- Ran targeted tests successfully:
  - `server/lib/beads.test.ts`
  - `server/routes/beads.test.ts`
  - `src/features/beads/links.test.ts`
  - `src/features/file-browser/MarkdownDocumentView.test.tsx`
  - `src/features/file-browser/TabbedContentArea.test.tsx`
  - `src/features/markdown/MarkdownRenderer.test.tsx`
  - `src/features/chat/MessageBubble.test.tsx`
- Result: 7 test files passed, 63 tests passed.

---

### Task 2: Verify cleanliness and run maintainer validation commands on `feature/beads-view-ui`

**Bead ID:** `nerve-m9v1`
**SubAgent:** `coder`
**Prompt:** On `feature/beads-view-ui`, confirm the branch diff against `upstream/master` is limited to Beads viewer / explicit bead URI scope, with no `.plans/` or unrelated changes. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Clean branch verified" --json`. Run the maintainer-requested validation commands (`npm run lint`, `npm run build`, `npm run build:server`, `npm test -- --run`) or the closest faithful equivalents supported by the repo, record exact outcomes, and update the plan with any failures or caveats.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-cut-clean-beads-view-ui-branch-and-package-upstream.md`

**Status:** ✅ Complete

**Results:** Verified the branch on `feature/beads-view-ui` against `upstream/master` and ran the repo’s exact maintainer-requested validation commands.

**Cleanliness verification findings:**
- `git diff --name-only upstream/master...HEAD` reports the same 23 files recorded in Task 1, all within Beads viewer / bead-link / explicit bead URI support plus directly related server wiring and tests.
- `git diff --name-only upstream/master...HEAD -- .plans` returned no tracked `.plans/` files.
- `git rev-list --left-right --count upstream/master...HEAD` returned `0 1`, confirming the branch is exactly one commit ahead of upstream master.
- `git status --short` showed only `?? .plans/`, i.e. the local untracked plan workspace; no unrelated tracked changes were present.
- Conclusion: the tracked branch diff stayed clean and upstream-focused. The only local non-code artifact is the intentionally untracked `.plans/` workspace.

**Exact commands run:**
- `git fetch upstream master`
- `git diff --name-only upstream/master...HEAD`
- `git diff --stat upstream/master...HEAD`
- `git diff --name-only upstream/master...HEAD -- .plans`
- `git status --short`
- `git rev-list --left-right --count upstream/master...HEAD`
- `npm run lint`
- `npm run build`
- `npm run build:server`
- `npm test -- --run`

**Pass/fail outcomes:**
- `npm run lint` — ❌ failed with 1 error and 6 warnings.
  - Blocking error: `src/features/beads/useBeadDetail.ts:16` trips `react-hooks/set-state-in-effect` for calling `setState({ bead: null, loading: true, error: null })` synchronously inside `useEffect`.
  - Additional warnings were pre-existing-style `react-hooks/exhaustive-deps` warnings in `src/App.tsx` and `src/hooks/useDashboardData.ts`, but they did not fail the command beyond the Beads hook error.
- `npm run build` — ✅ passed. This also ran `npm run build:server` as part of the script.
  - Caveat: Vite emitted non-fatal chunk-size / dynamic-import warnings, but the build completed successfully.
- `npm run build:server` — ✅ passed when run directly as requested.
- `npm test -- --run` — ✅ passed.
  - Result: `126` test files passed, `1662` tests passed.
  - Caveat: Vitest emitted non-fatal stderr noise from existing test diagnostics/warnings (for example React `act(...)` warnings and expected negative-path logs), but the suite exited `0`.

**Blockers / caveats for opening the upstream issue/PR (Task 3):**
- Primary blocker: `npm run lint` is not green on the clean branch because of the Beads-specific `react-hooks/set-state-in-effect` error in `src/features/beads/useBeadDetail.ts`.
- Non-blocking caveat: the branch itself remains clean and upstream-scoped, so the packaging problem is solved; only lint remediation remains before the strongest upstream-ready handoff.
- Non-blocking caveat: local `.plans/` remains untracked in the worktree, but no `.plans/` files are part of the tracked branch diff.

---

### Task 2.5: Fix the Beads lint blocker and re-run validation on `feature/beads-view-ui`

**Bead ID:** `nerve-j27b`
**SubAgent:** `coder`
**Prompt:** On `feature/beads-view-ui`, fix the blocking lint error in `src/features/beads/useBeadDetail.ts` with the narrowest correct change. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Lint blocker fixed" --json`. Re-run at least `npm run lint`, plus any focused tests/build commands needed to prove the fix is safe, then update this plan with the code change made, validation rerun results, and whether Task 3 is now unblocked.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `src/features/beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-cut-clean-beads-view-ui-branch-and-package-upstream.md`
- `src/features/beads/useBeadDetail.ts`
- any tightly related test files if needed

**Status:** ✅ Complete

**Results:** Fixed the Beads-specific lint blocker in `src/features/beads/useBeadDetail.ts` with the narrowest functional change and re-ran validation on `feature/beads-view-ui`.

**Exact code change made:**
- Replaced the hook state shape with a tiny internal fetch-state record: `{ bead, error, requestKey }`.
- Removed the synchronous `setState({ bead: null, loading: true, error: null })` call from inside `useEffect`, which was tripping `react-hooks/set-state-in-effect`.
- Computed `suffix` / `requestKey` from the current bead target, stored the completed request’s `requestKey` when the fetch resolved, and derived the public return value as:
  - `loading = state.requestKey !== requestKey`
  - `bead = loading ? null : state.bead`
  - `error = loading ? null : state.error`
- Result: the hook still clears stale bead/error data while a new request is in flight, but no longer performs a synchronous effect-body state reset.

**Validation rerun results:**
- `npm run lint` — ✅ passed with `0` errors. Remaining output is limited to the repo’s pre-existing non-blocking warnings in `src/contexts/ChatContext.tsx` and `src/hooks/useDashboardData.ts`.
- `npm run build` — ✅ passed.
  - Includes `tsc -b`, `vite build`, and `npm run build:server`.
  - Vite still emitted non-fatal existing chunk-size / dynamic-import warnings, but the build completed successfully.

**Task 3 unblocked?**
- Yes. The branch was already verified as clean/upstream-scoped in Task 2, and the only blocking validation failure was the Beads hook lint error. With `npm run lint` now green for errors and `npm run build` passing, the upstream Issue/PR packaging step is now unblocked.

---

### Task 3: Open the upstream feature request Issue and PR from the clean branch

**Bead ID:** `nerve-yf4t`
**SubAgent:** `research`
**Prompt:** Once `feature/beads-view-ui` is confirmed clean and validated, open the upstream feature request Issue and PR. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Upstream issue and PR opened" --json`. Follow maintainer templates and include: problem statement, rationale for Beads viewer support, explicit `bead://<path>#<bead-id>` design, legacy same-context `bead:<id>` compatibility, tests run, and dogfood evidence. Record the resulting Issue/PR URLs and numbers in this plan.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-cut-clean-beads-view-ui-branch-and-package-upstream.md`

**Status:** ✅ Complete

**Results:** Opened the upstream feature request and PR from the clean `feature/beads-view-ui` branch after re-running the full validation suite on the final branch state.

**Upstream artifacts opened:**
- Issue `#251` — <https://github.com/daggerhashimoto/openclaw-nerve/issues/251>
- PR `#252` — <https://github.com/daggerhashimoto/openclaw-nerve/pull/252>

**Branch / push details:**
- Local branch used: `feature/beads-view-ui`
- PR head remote/branch: `DerrickBarra/openclaw-nerve:feature/beads-view-ui`
- Push command/result: `git push -u derrickfork feature/beads-view-ui` succeeded and set local tracking to `derrickfork/feature/beads-view-ui`
- PR base: `daggerhashimoto/openclaw-nerve:master`

**Maintainer-facing summary of what was opened:**
- Feature request describes the in-app Beads viewer UI, the need for explicit `bead://<path>#<bead-id>` links when markdown lives outside the current repo context, and preservation of legacy same-context `bead:<id>` support.
- PR packages the clean Beads-only branch and calls out markdown/document/bead click-through behavior, path-aware bead lookup, legacy compatibility, focused tests, and live dogfood evidence from the markdown ↔ plan ↔ bead tab flow.
- Both artifacts explicitly mention validation results: `npm run lint` passing with `0` errors (while unrelated warnings remain elsewhere), `npm run build` pass, `npm run build:server` pass, and `npm test -- --run` pass (`126` files / `1662` tests).

**Caveats for maintainer review:**
- The PR checklist leaves the screenshot / screen recording item unchecked; no UI asset was attached in this packaging pass.
- Validation still emits existing non-fatal warnings/noise outside the Beads feature scope (for example longstanding lint warnings and expected test stderr), but all required commands exited successfully.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Cut a clean upstream-facing `feature/beads-view-ui` branch, fixed the Beads-specific lint blocker, re-ran validation, then opened upstream Issue `#251` and PR `#252` for the Beads viewer UI plus explicit `bead://<path>#<bead-id>` support while preserving legacy same-context `bead:<id>` compatibility.

**Commits:**
- `63bf93b` - feat(beads): transplant bead viewer UI from canonical branch
- `56a1ed7` - fix(beads): avoid sync effect reset in bead detail hook

**Lessons Learned:** Packaging upstream was straightforward once the branch was truly clean and the single Beads-specific lint failure was removed. For UI-heavy upstream PRs, it is worth deciding up front whether to also capture a screenshot/video artifact so the checklist can be fully checked.

---

*Completed on 2026-04-08*