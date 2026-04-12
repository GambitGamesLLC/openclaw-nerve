# Stress Test Beads Viewer and Package Upstream

**Date:** 2026-04-08  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Stress test the Beads viewer on the currently deployed combo branch, fix any issues canonically on `feature/bead-viewer`, then prepare the upstream Issue + PR for the Beads viewer + explicit `bead://` URI work.

---

## Overview

The handoff from earlier today says the branch architecture is finally clean again: `feature/bead-viewer` is the canonical upstream-facing Beads branch, and `feature/combo-workhorse-all-unmerged-2026-04-07` is the integration branch currently used by Nerve. The next job is confidence and packaging, not more branch drift.

Derrick clarified the stress-test target: reuse the existing branch-stable `~/workspace/bead-link-dogfood.md` file, but rewrite it so the clickable test links point into Beads that live in the `gambit-openclaw-nerve` repo itself. The main UX being tested is seamless movement between markdown plans and bead viewer tabs in both directions, not just isolated bead opens.

So this run should start by generating repo-local test beads in `gambit-openclaw-nerve`, updating `bead-link-dogfood.md` to link to them, and then deliberately trying to break the current Beads viewer behavior in the live combo flow: explicit `bead://...#...` links from the dogfood markdown, repeated opens/focus, same-context `bead:<id>` behavior, navigation from bead links back into plan documents where applicable, and relative-vs-absolute path edge cases. If the combo branch shows any Beads-specific regression, the fix belongs on `feature/bead-viewer` first and only then gets rolled into combo.

If stress testing passes, we move directly into upstream packaging: summarize the feature and rationale cleanly for maintainers, open an upstream Issue if needed, then open/update the PR from `feature/bead-viewer` with the final scope aligned to the explicit URI model and Beads viewer work already landed.

---

## Tasks

### Task 1: Create repo-local Beads stress-test targets and rewrite the shared dogfood markdown

**Bead ID:** `nerve-3bou`  
**SubAgent:** `primary`  
**Prompt:** In `~/workspace/projects/gambit-openclaw-nerve`, create a small, intentional set of repo-local Beads test items specifically for Nerve bead-viewer dogfooding. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Dogfood targets prepared" --json`. Then update the shared branch-stable markdown file `~/workspace/bead-link-dogfood.md` so it reuses that file but points at the newly created `gambit-openclaw-nerve` bead IDs instead of another repo. Include links that let Derrick move between plans and beads cleanly, and document which links are testing explicit absolute `bead://`, explicit relative `bead://`, and legacy same-context `bead:<id>` behavior.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-stress-test-bead-viewer-and-package-upstream.md`
- `/home/derrick/.openclaw/workspace/bead-link-dogfood.md`

**Status:** ✅ Complete

**Results:** Created three repo-local dogfood beads in `gambit-openclaw-nerve` for distinct navigation cases: `nerve-tzil` (explicit absolute target), `nerve-nlat` (explicit relative target), and `nerve-a2xe` (legacy same-context target). Rewrote `/home/derrick/.openclaw/workspace/bead-link-dogfood.md` so it now points only at those repo-local bead IDs and the active repo-local stress-test plan via both relative and absolute workspace paths. Added bidirectional plan/bead navigation by putting plan backlinks plus cross-bead `bead:<id>` links into each dogfood bead’s notes. Verified coherence by checking the created bead records, confirming the linked plan file exists at `projects/gambit-openclaw-nerve/.plans/2026-04-08-stress-test-bead-viewer-and-package-upstream.md`, and ensuring the markdown exercises explicit absolute `bead://`, explicit relative `bead://`, `.beads` relative explicit targeting, and legacy `bead:` patterns without referencing the old cross-repo VirTra examples.

---

### Task 2: Stress test the current combo-branch Beads viewer behavior

**Bead ID:** `nerve-31dx`  
**SubAgent:** `primary`  
**Prompt:** In `~/workspace/projects/gambit-openclaw-nerve`, verify the current combo deployment and stress test the Beads viewer behavior end-to-end using the rewritten `~/workspace/bead-link-dogfood.md` file and any focused follow-up checks needed. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Stress test complete" --json`. Validate seamless clicking between plans and beads, explicit `bead://...#...` links, repeated opens/focus behavior, related bead navigation, absolute vs relative explicit targets, and same-context legacy `bead:<id>` behavior. Record exact findings, repro steps, and whether any failures are combo-only or canonical Beads issues.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `src/` (inspection only unless a bug is found)
- `server/` (inspection only unless a bug is found)

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-stress-test-bead-viewer-and-package-upstream.md`

**Status:** ✅ Complete

**Results:** Derrick completed the live dogfood pass in the active Nerve UI and did not find any Beads viewer issues during the intended click-through flow. The tested path covered the rewritten root dogfood markdown, movement between the stress-test plan and repo-local bead tabs, and back-and-forth navigation without any reported wrong-target, non-clickable, external-browser, or tab-focus/reopen regressions. This gives enough confidence to move from dogfood validation into upstream packaging, with the remaining work focused on maintainer guidance, branch cleanliness, and PR/Issue preparation.

---

### Task 3: If needed, fix Beads regressions canonically on `feature/bead-viewer` and realign combo

**Bead ID:** `nerve-b5j0`  
**SubAgent:** `coder`  
**Prompt:** If Task 1 finds a Beads-related bug, switch to the canonical `feature/bead-viewer` branch and land the narrowest correct fix there first. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Canonical Beads fix complete" --json`. Add or update focused tests, verify locally, commit on the canonical branch, then roll the fix into `feature/combo-workhorse-all-unmerged-2026-04-07` and verify combo is realigned. Document the exact commits and verification commands.

**Folders Created/Deleted/Modified:**
- `.plans/`
- branch-dependent code paths as needed

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-stress-test-bead-viewer-and-package-upstream.md`
- focused source/test files as needed

**Status:** ✅ Complete

**Results:** No canonical fix was needed for this plan run. Live dogfood on the active combo branch passed without exposing a new Beads regression, so no new Beads code change or combo realignment was performed under this task.

---

### Task 4: Package the upstream Issue + PR for `feature/bead-viewer`

**Bead ID:** `nerve-y5m2`  
**SubAgent:** `research`  
**Prompt:** Once the Beads viewer state is verified and any canonical fixes are landed, prepare the upstream maintainer package for `feature/bead-viewer`. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Upstream packaging complete" --json`. Before opening anything, double-check upstream maintainer rules and contribution guidance for Issues + PRs, audit `feature/bead-viewer` to confirm it is cleanly scoped to Beads-related work, and verify there are no Beads-only fixes living only on combo that were not canonically backported. Summarize the feature, rationale, UX behavior, explicit `bead://<path>#<bead-id>` design, legacy compatibility, tests, dogfood evidence, branch-cleanliness findings, and any maintainer-risk notes. Then open or draft the upstream Issue and PR with accurate scope and branch references, and record the resulting URLs.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-stress-test-bead-viewer-and-package-upstream.md`

**Status:** ✅ Complete

**Results:** Audited upstream packaging readiness and documented a blocker instead of opening misleading upstream artifacts.

- **Maintainer guidance found:** `CONTRIBUTING.md` requires opening an issue first for non-trivial changes, branching from `master`, keeping PRs focused to one feature/fix, running `npm run lint`, `npm run build`, `npm run build:server`, and `npm test -- --run`, and filling out the PR template with what/why/how plus related issue links. `.github/ISSUE_TEMPLATE/feature_request.md` asks for Problem / Proposed Solution / Alternatives / Additional Context. `.github/pull_request_template.md` expects What / Why / How, change type, validation checklist, and screenshots for UI work.
- **Branch cleanliness findings (`feature/bead-viewer` vs `upstream/master`):** code scope is Beads-related, but the branch is **not cleanly upstreamable as-is** because it also carries local planning artifacts under `.plans/` (`git diff --name-only upstream/master...feature/bead-viewer`). The branch contains the expected Beads viewer / markdown / route work plus multiple repo-local plan files that should not be sent upstream in a feature PR. Because of that contamination, I did **not** open an upstream issue or PR from the branch in its current state.
- **Combo/canonical findings:** there is **no Beads-only delta living only on combo** after comparing the Beads-related file set directly between `feature/bead-viewer` and `feature/combo-workhorse-all-unmerged-2026-04-07`. `git diff feature/bead-viewer..feature/combo-workhorse-all-unmerged-2026-04-07 -- <Beads-related paths>` returned no code diff for the canonical Beads files, while `git range-diff upstream/master...feature/bead-viewer upstream/master...feature/combo-workhorse-all-unmerged-2026-04-07` showed the combo branch carrying the Beads commits as cherry-picks plus unrelated integration work. Conclusion: combo includes the canonical Beads work, but does not appear to contain extra Beads-only fixes that were never backported.
- **Existing GitHub state checked to avoid duplication:** `gh issue list --repo daggerhashimoto/openclaw-nerve --state open --limit 100 --json ...`, `gh pr list --repo daggerhashimoto/openclaw-nerve --state open --limit 100 --json ...`, and targeted searches over issue/PR titles and bodies did not show an existing upstream bead-viewer / explicit `bead://` packaging thread.
- **Issue URL/number:** None created.
- **PR URL/number:** None created.
- **Caveats / follow-up risks:** before upstream packaging, create a clean upstream-facing branch from `upstream/master` that contains only the Beads feature commits and excludes repo-local `.plans/` history. The eventual maintainer package should explicitly call out the explicit `bead://<path>#<bead-id>` form, continued support for legacy same-context `bead:<id>` links, and the local dogfood evidence from `/home/derrick/.openclaw/workspace/bead-link-dogfood.md`.

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:** Rewrote the shared dogfood markdown to target repo-local Beads in `gambit-openclaw-nerve`, completed a live combo-branch dogfood pass without surfacing a new Beads regression, and finished the upstream packaging audit. Packaging is currently blocked because `feature/bead-viewer` is not cleanly upstreamable as-is: it mixes the intended Beads feature work with local `.plans/` artifacts that should be stripped before opening upstream Issue/PR artifacts.

**Commits:**
- No new code commits were created by this plan task.

**Lessons Learned:** Even when the feature code itself is appropriately scoped, branch hygiene still decides whether upstream packaging is honest. The next upstream step should be a clean branch cut from `upstream/master` that preserves the Beads feature commits while dropping repo-local planning files.

---

*Drafted on 2026-04-08*