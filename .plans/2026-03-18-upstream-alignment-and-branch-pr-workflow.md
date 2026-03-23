---
plan_id: plan-2026-03-18-upstream-alignment-and-branch-pr-workflow
related_bead_ids:
  - nerve-xaa
  - nerve-dqc
  - nerve-u2h
bead_ids:
  - nerve-b1p
  - nerve-ani
  - nerve-1bt
  - nerve-tb0
  - nerve-epa
  - nerve-xsj
  - nerve-7vm
  - nerve-mhd
  - nerve-dnt
  - nerve-t68
  - nerve-okz
  - nerve-50n
  - nerve-mi0
  - nerve-hpe
  - nerve-f2o
  - nerve-vfl
  - nerve-dnt.1
  - nerve-dnt.2
  - nerve-dnt.3
  - nerve-dnt.4
  - nerve-t68.1
  - nerve-t68.2
  - nerve-t68.3
  - nerve-okz.1
  - nerve-okz.2
  - nerve-okz.3
  - nerve-50n.1
  - nerve-50n.2
  - nerve-50n.3
  - nerve-mi0.1
  - nerve-mi0.2
  - nerve-mi0.3
  - nerve-hpe.1
  - nerve-hpe.2
  - nerve-hpe.3
---
# Gambit OpenClaw Nerve — upstream alignment and branch / PR workflow

**Date:** 2026-03-18  
**Status:** In Progress (execution approved 2026-03-22)  
**Agent:** Chip 🐱‍💻

---

## Goal

Define a durable workflow so `gambit-openclaw-nerve` can stay close to upstream Nerve while our local features and bug fixes live on clean branches, land on our `master` branch for real use, and also map back to upstream issues and PRs whenever appropriate.

---

## Overview

The pressure point is no longer hypothetical: `gambit-openclaw-nerve` has accumulated a meaningful amount of local drift from upstream, and Derrick wants to tackle that directly before it gets even hairier. The goal of this slice is to make the drift explicit, classify which local changes are upstreamable versus intentionally local, and turn that into a repeatable branch / sync / PR workflow.

The intended shape is: upstream Nerve remains the comparison baseline, `gambit-openclaw-nerve` remains the repo Derrick actually uses, and our custom work gets grouped into branch-sized slices that are understandable both locally and upstream. `master` should remain Derrick-ready, but it should stop being a pile of undocumented divergence. Instead, new work should move through named slices with clear linkage back to beads, plans, and—when appropriate—upstream issues and PRs.

Additional execution rule clarified on 2026-03-22: **one feature/bug fix, one branch, based on canonical `upstream/master`** for any replayable or upstream-candidate work. Large umbrella slices in this plan are classification buckets only; they must be split into branch-sized micro-slices before implementation. The same discipline should be used even for Gambit-only replay when possible, so the refreshed line remains reviewable and reversible.

As of 2026-03-22, the attachment/canonical staged-path prerequisite stream is closed after live human verification, so this plan is now unblocked for direct execution. Current repo snapshot at planning time: local branch `master`, fork remote `origin` over SSH, upstream comparison remote currently configured as `https://github.com/varun86/openclaw-nerve-old.git`, and there are local uncommitted changes in `.beads/interactions.jsonl`.

Derrick confirmed on 2026-03-22 that `.beads/interactions.jsonl` is effectively always dirty because Beads re-dirties it during normal operation. Treat it as expected Beads runtime churn for now, not meaningful product drift. One open process question to preserve for later: whether that file belongs in git at all or is part of the Dolt-backed cross-agent/cross-terminal synchronization contract.

Additional requirement captured on 2026-03-22: the OpenClaw host should be able to choose which `gambit-openclaw-nerve` branch gets used by `update.sh` / `restore.sh`, controlled via `~/.openclaw/.env` (or equivalent shared OpenClaw runtime config). The purpose is to let Derrick and Chip switch the live local Nerve deployment onto reconciliation/testing branches, validate them in the real UI, and then approve slices for upstream issue/PR submission without mutating the currently trusted integrated line by accident.

---

## Tasks

### Task 1: Audit the actual drift between fork and upstream

**Bead ID:** `nerve-ani`  
**SubAgent:** `research`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, audit the real divergence between `origin/master` and the configured upstream baseline. Capture remotes, branch ancestry, ahead/behind commit ranges, and group the drift into practical buckets (upstream-only, fork-only, likely upstreamable local fixes, intentionally local workflow customizations, risky merge/conflict zones). Claim the assigned bead at start with `bd update <id> --status in_progress --json`, write the findings into the plan, and close the bead when done.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upstream-alignment-and-branch-pr-workflow.md`

**Status:** ✅ Complete

**Results:** Execution approved on 2026-03-22. Created follow-up beads `nerve-ani`, `nerve-1bt`, `nerve-tb0`, and `nerve-epa`. `nerve-1bt` and `nerve-tb0` both depend on the Task 1 audit bead, and Task 4 depends on Tasks 2 and 3. The parent epic remains `nerve-b1p`, but Beads does not allow tasks to depend on an epic directly.

Audit completed on 2026-03-22 against the currently configured `upstream` remote and a sanity-check candidate active upstream.

- **Remote / branch context:** local branch `master`; `origin` = `git@github.com:GambitGamesLLC/openclaw-nerve.git`; configured `upstream` = `https://github.com/varun86/openclaw-nerve-old.git`; both remotes advertise `master` as default branch.
- **Configured-baseline ancestry shape:** `origin/master` (`9aca6e92`) is a strict descendant of configured `upstream/master` (`d90dfb66`). The merge base between them is exactly `d90dfb66`, so the configured upstream is an ancestor, not a side branch.
- **Configured-baseline ahead/behind:** `git rev-list --left-right --count upstream/master...origin/master` returned `0 247`. In plain English: no upstream-only commits, 247 fork-only commits on top of that baseline.
- **Practical drift buckets versus configured `upstream`:**
  - **Upstream-only:** none relative to `varun86/openclaw-nerve-old`.
  - **Fork-only:** effectively the entire Gambit working history since `d90dfb66`, including Beads/Plans surfaces, kanban/task-board implementation, file browser operations, updater/release plumbing, auth/gateway hardening, voice/TTS/STT work, mobile/responsive UI, upload staging/canonical-path work, and repo-local plans/docs.
  - **Likely upstreamable local fixes/features:** many commits already read like upstream-quality slices rather than fork glue, especially auth/rate-limit/WS proxy hardening, test coverage additions, updater fixes, file-browser operations, chat/voice reliability fixes, kanban/task board features, and smaller UX repairs like IME handling, scroll/layout fixes, and stale-socket/race-condition fixes.
  - **Intentionally local Gambit workflow customizations:** `.beads/` integration, `.plans/` corpus, `AGENTS.md`, bundled `skills/nerve-kanban/`, Gambit-specific operator workflow/docs, and the recent upload/canonical staged-path work tied to OpenClaw orchestration practice.
  - **Likely merge/conflict hot spots if we realign to a newer upstream:** `src/App.tsx`, `src/features/chat/InputBar.tsx`, `src/contexts/ChatContext.tsx`, `src/contexts/SessionContext.tsx`, `src/features/workspace/*`, `src/features/kanban/*`, `server/lib/config.ts`, `server/lib/ws-proxy.ts`, `server/routes/gateway.ts`, `scripts/setup.ts`, `package.json`, `README.md`, and `CHANGELOG.md`.
- **Red flag on the current upstream target:** the remote name itself (`openclaw-nerve-old`) was suspicious, and the ancestry check confirms it is now too stale to represent current upstream reality. A direct fetch of `https://github.com/daggerhashimoto/openclaw-nerve.git` produced `FETCH_HEAD=6e6f78f6`; relative to that repo, `git rev-list --left-right --count FETCH_HEAD...origin/master` returned `30 105`. So the real shape is not “we are 247 commits ahead of upstream with nothing to pull”; it is “our fork and the likely active upstream have materially diverged on both sides.” That makes the configured `varun86/...-old` remote a comparison convenience at best and a misleading baseline at worst.

---

### Task 2: Design the reconciliation strategy for the current drift

**Bead ID:** `nerve-1bt`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, design the concrete strategy for reconciling the current fork drift. Recommend whether to merge, rebase, cherry-pick, or replay local slices onto a refreshed upstream base; identify the safest sequencing; and call out which local changes should stay Gambit-only versus which should become upstream candidate branches. Claim the assigned bead at start, update the plan with the recommended strategy, and close the bead when complete.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upstream-alignment-and-branch-pr-workflow.md`

**Status:** ✅ Complete

**Results:** Completed on 2026-03-22. Recommended a **hybrid reconciliation strategy** built around a refreshed active-upstream baseline plus selective replay of local product slices. The key conclusion is that we should **not** merge the current Gambit `master` directly into the active upstream, and we should **not** rebase the existing `master` history in place. With the likely real divergence at roughly **30 upstream-only / 105 fork-only** and the fork-only side containing both product work and local planning/runtime churn, a direct merge would create a noisy integration commit while preserving unwanted coupling, and a history rewrite rebase would be unnecessarily risky for Derrick’s live branch.

Instead, the safe shape is:

1. Treat `daggerhashimoto/openclaw-nerve` (or whatever repo Derrick confirms is the active upstream) as the canonical comparison target, and reconfigure/rename remotes so the stale `varun86/openclaw-nerve-old` remote stops masquerading as the primary baseline.
2. Create a **fresh reconciliation branch from active upstream `master`** rather than from Gambit `master`.
3. Replay Gambit-owned product work onto that refreshed base in **small thematic slices** using cherry-pick, manual patch replay, or file-level reconstruction as appropriate.
4. Keep Gambit-only workflow/operator layers out of the upstream replay branch unless they are explicitly required for local shipping.
5. Once the replayed branch is stable, use that branch as the candidate successor to current `master`; only then decide whether to fast-forward/merge locally, while preserving the old integrated branch as a rollback reference.

That yields a practical recommendation on the merge/rebase/cherry-pick question:

- **Do not do a direct merge** of current `master` with the active upstream as the primary strategy. Use merges later only for normal ongoing sync once the branch shape is cleaned up.
- **Do not rebase current Gambit `master` in place.** Too much operator-facing history and local coordination context is mixed into the 105 fork-only commits.
- **Do use replay/cherry-pick as the main tool** for reconciling the fork, because it lets us separate product slices from Gambit-only operational residue.
- **Use a hybrid approach overall:** replay/cherry-pick for the one-time cleanup, then normal upstream merges (or a very small periodic rebase policy on short-lived topic branches only) after the branch model is stabilized.

---

### Task 3: Define the ongoing branch / issue / PR workflow

**Bead ID:** `nerve-tb0`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, define the durable workflow that future Nerve work must follow so drift stays controlled. Cover branch naming, how beads/plans map to topic branches, when a local slice should become an upstream issue/PR, how `master` gets updated, and how accepted/rejected upstream changes feed back into the fork. Claim the assigned bead at start, update the plan, and close the bead when complete.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upstream-alignment-and-branch-pr-workflow.md`

**Status:** ✅ Complete

**Results:** Completed on 2026-03-22. Defined the durable fork/upstream workflow around a small set of explicit branch roles instead of letting `master` absorb unnamed drift.

- **Branch roles / naming:**
  - `master` = Derrick-ready integration branch in the Gambit fork. It should always be runnable, reviewable, and suitable for daily use; no experimental half-slices land here.
  - `sync/<yyyymmdd>-<validated-upstream-tag-or-sha>` = temporary upstream revalidation / intake branch. Create one whenever we refresh from upstream so the exact baseline and conflict review are documented.
  - `slice/<bead-id>-<slug>` = the default working branch for a single coherent change slice. One bead, one topic branch, one review narrative.
  - `upstream/<bead-id>-<slug>` = optional publication branch when a local slice graduates into an upstream candidate. This can point at the same commits as the `slice/` branch or be a trimmed derivative if Gambit-only commits must be excluded.
  - `spike/<slug>` = short-lived investigation branch only for discovery. Spikes do not merge directly to `master`; any durable outcome must be recut as one or more `slice/` branches.
- **How plans / beads map to branches:**
  - The repo-level living plan stays the umbrella document for a stream like upstream alignment.
  - Each executable bead should map to one durable `slice/<bead-id>-<slug>` branch.
  - **Hard rule:** one feature/bug fix = one branch = one review narrative, and replayable branches should start from canonical `upstream/master` (or the current validated reconciliation branch that is still a direct descendant of that upstream base).
  - If a bead grows into multiple independently reviewable changes, split the bead or create child beads instead of hiding multiple concerns on one branch.
  - Large classification slices in this plan are not permission to batch unrelated fixes together; they must be decomposed into branch-sized micro-slices before implementation or upstream submission.
  - The plan should record the bead ID, intended branch name, whether the slice is Gambit-only or upstream-candidate, and the promotion path (`master` only vs `master` + upstream PR).
- **How Derrick-ready integrated work reaches `master`:**
  - New work starts on a `slice/` branch from the current fork integration base, not directly on `master`.
  - A slice can merge into `master` only after: (1) scope is still single-purpose, (2) local conflicts are reviewed, (3) the relevant tests for the touched surface pass, and (4) the commit series is understandable enough that we could later replay or upstream it.
  - Prefer merging reviewed slice branches into `master` in deliberate batches. If multiple slices interact tightly, land them through a short-lived integration branch first, verify there, then merge the integration result to `master`.
- **When a local slice should become an upstream issue / PR:**
  - Open or attach an upstream issue / PR when the slice fixes a bug, hardens reliability, improves UX, or adds generic capability that is not tied to Gambit-specific Beads/Plans/operator workflow.
  - Keep the slice local-only when it encodes Gambit operating practice (`.beads/`, `.plans/`, `AGENTS.md`, Gambit-specific orchestration docs/skills, local staging conventions) or when it depends on private workflow assumptions upstream is unlikely to want.
  - If a branch contains both generic and Gambit-specific changes, split it before upstreaming. Upstream should see the smallest self-contained branch that still makes sense.
- **How accepted / rejected upstream work feeds back into the fork:**
  - If upstream accepts a PR, record the upstream PR/merge commit in the plan, then on the next upstream revalidation branch confirm that the fork now inherits it from the refreshed upstream baseline. After that, retire any fork-only duplicate patching.
  - If upstream requests changes, keep iterating on the `upstream/` branch rather than mutating `master` first. Only merge back to `master` early if Derrick needs the fix immediately, and record that we are temporarily carrying a fork patch pending upstream outcome.
  - If upstream rejects the change or goes inactive, keep the slice documented as a permanent or long-lived fork delta. Tag it in the plan as `fork-only by decision` so future sync passes do not repeatedly re-litigate it.
- **Sync cadence / conflict review / testing gates:**
  - Because the configured `upstream` remote appears stale, every future sync starts by revalidating the true canonical upstream repository and default branch before any merge/rebase decisions. Do not trust the current `varun86/openclaw-nerve-old` remote without re-checking.
  - Run an upstream intake at a steady cadence: at minimum before starting any major new feature stream, before cutting an upstream PR batch, and otherwise on a regular housekeeping rhythm (roughly weekly when active, immediately after meaningful upstream movement).
  - Each intake happens on `sync/<date>-<upstream-ref>`: fetch the validated upstream, inspect ahead/behind counts, review changed files/areas, and explicitly classify conflicts into `safe trivial`, `needs human review`, and `defer / isolate` buckets.
  - Never promote a sync branch or a slice branch to `master` without a targeted test pass for the touched areas. At minimum run the repo's standard lint/type/test/build gates that cover the modified surface; if a slice affects chat/session/workspace/server routing, include the relevant focused checks for those domains.
  - Treat `.beads/interactions.jsonl` as runtime churn, not product drift, during conflict review unless we later intentionally change how Beads persistence is handled.
- **Practical promotion rule:**
  - The preferred flow is `validated upstream` -> `sync/...` review -> `slice/...` work -> optional `upstream/...` PR branch -> reviewed integration into `master`.
  - The key control is that every durable change should remain identifiable as a named slice with a bead, a branch, a test story, and an explicit upstream disposition.

---

### Task 4: Convert the approved strategy into execution beads

**Bead ID:** `nerve-epa`  
**SubAgent:** `primary`  
**Prompt:** After Derrick approves the upstream-alignment strategy, create the executable beads needed to perform the actual reconciliation in `gambit-openclaw-nerve`, including drift-audit follow-through, upstream sync work, branch cleanup, upstream-candidate slices, and the runtime branch-selection mechanism that lets `update.sh` / `restore.sh` deploy a chosen `gambit-openclaw-nerve` branch for live testing. Claim the assigned bead at start, create/link the exact bead IDs in this plan, and close the bead when finished.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upstream-alignment-and-branch-pr-workflow.md`

**Status:** ✅ Complete

**Results:** Completed on 2026-03-22. Converted the approved strategy into the concrete execution graph below while keeping current `master` explicitly stable during the planning phase. Refined again on 2026-03-22 after the clarified global rule (**one feature/bug fix, one branch, based on canonical `upstream/master`**) by turning the six broad execution beads into coordination/grouping nodes and creating explicit child micro-slice beads for real implementation control.

Created execution beads:

- `nerve-xsj` — normalize and validate the canonical upstream remote baseline
- `nerve-7vm` — create rollback snapshot and safe reconciliation bootstrap flow
- `nerve-mhd` — inventory and classify fork-only / branch-only deltas into replayable slices
- `nerve-dnt` — replay the first low-risk high-value upstream-candidate slices onto the refreshed base
- `nerve-t68` — separate Gambit-only overlays from the refreshed upstream-candidate line
- `nerve-okz` — isolate app-shell and chat/session conflict zones into a dedicated reconciliation stream
- `nerve-50n` — isolate workspace and file-browser conflict zones into a dedicated reconciliation stream
- `nerve-mi0` — isolate kanban and task-board conflict zones into a dedicated reconciliation stream
- `nerve-hpe` — isolate gateway/config/setup/package metadata conflicts into a dedicated reconciliation stream
- `nerve-f2o` — add branch-selectable `gambit-openclaw-nerve` deployment via `~/.openclaw/.env`
- `nerve-vfl` — final validation/promotion for refreshed integration branches plus upstream-candidate approval

Dependency shape created in Beads:

- `nerve-xsj` -> `nerve-7vm` -> `nerve-mhd`
- `nerve-mhd` -> `nerve-dnt`
- `nerve-dnt` -> `nerve-t68`
- `nerve-mhd` -> `nerve-okz`, `nerve-50n`, `nerve-mi0`, `nerve-hpe`
- `nerve-7vm` -> `nerve-f2o`
- `nerve-dnt`, `nerve-t68`, `nerve-okz`, `nerve-50n`, `nerve-mi0`, `nerve-hpe`, and `nerve-f2o` all block `nerve-vfl`

Micro-slice child beads created for branch-sized execution control:

- `nerve-dnt.1` watcher default; `nerve-dnt.2` websocket reconnect + session visibility; `nerve-dnt.3` gateway `sessions_list` shape handling; `nerve-dnt.4` missing-transcript model lookup
- `nerve-t68.1` Beads board overlay; `nerve-t68.2` Plans linkage/reader overlay; `nerve-t68.3` upload staging/canonical-path overlay
- `nerve-okz.1` app shell/navigation; `nerve-okz.2` chat composer/add-to-chat UX; `nerve-okz.3` chat/session contexts
- `nerve-50n.1` workspace navigation; `nerve-50n.2` file-browser ops/APIs; `nerve-50n.3` workspace/plans handoff
- `nerve-mi0.1` generic kanban/runtime-store alignment; `nerve-mi0.2` Beads-backed kanban backend; `nerve-mi0.3` kanban plan linkage
- `nerve-hpe.1` gateway/config hardening; `nerve-hpe.2` setup/package manifests; `nerve-hpe.3` docs metadata

Extra dependency wiring added for execution order inside the broad streams:

- `nerve-t68.1`, `nerve-t68.2`, and `nerve-t68.3` all depend on `nerve-dnt`
- `nerve-okz.3` depends on `nerve-dnt`
- `nerve-50n.3` depends on `nerve-50n.1`
- `nerve-mi0.2` depends on `nerve-mi0.1`; `nerve-mi0.3` depends on `nerve-mi0.2`
- `nerve-hpe.3` depends on `nerve-hpe.2`

This execution graph deliberately separates low-risk replay, Gambit-only overlays, high-conflict domains, and the new branch-selectable deployment requirement so the refreshed line can be validated live before any promotion or upstream submission decisions.

---

## Recommended Reconciliation Strategy

### Decision

Use a **hybrid refresh-and-replay strategy**:

- refresh the comparison target to the likely active upstream
- branch from that refreshed upstream head
- replay selected Gambit product slices in deliberate order
- keep Gambit-only operator workflow layers separate unless they are intentionally part of the shipped fork
- avoid destructive history surgery on the current `master`

This is the safest option because the fork-only side is not a single coherent feature stream. It includes upstreamable product work, local operator workflow customizations, living-plan/bead documentation, and runtime churn. Reconstructing the desired end state on top of a clean upstream base is lower risk than trying to preserve every historical relationship in one giant merge.

### Why this over merge vs rebase

**Direct merge of active upstream into current Gambit `master`: reject as the primary tactic.**  
A merge would preserve history, but it would also preserve the current entanglement. With the active picture looking like roughly `30 upstream-only / 105 fork-only`, a merge-first approach would likely produce one huge conflict-resolution event across `src/App.tsx`, chat/session/workspace surfaces, gateway/server config, package metadata, and docs. It would get us to “some combined branch,” but not to a maintainable or upstreamable slice model.

**Rebase current Gambit `master` onto active upstream: reject.**  
In theory this makes history linear; in practice it rewrites the working branch Derrick actually uses, drags operator/docs/beads changes through every conflict, and makes rollback/handoff harder. This is too risky for a live fork with mixed concerns.

**Cherry-pick / manual replay onto a fresh upstream branch: accept as the main tactic.**  
This allows selective inclusion, easier conflict isolation, and clean extraction of upstream-candidate changes.

**Hybrid overall recommendation: accept.**  
Use replay/cherry-pick/manual reconstruction for the one-time cleanup, then after the fork is re-centered, return to ordinary upstream sync merges for long-lived maintenance and keep rebases limited to short-lived local topic branches where needed.

### Change classification

#### Keep Gambit-only

These should remain local to the Gambit fork unless a later explicit upstream value case emerges:

- `.beads/` state, hooks, and Beads-integrated workflow surfaces
- `.plans/` corpus, archive/history, and planning metadata
- `AGENTS.md`, local skills, and operator-facing orchestration docs
- Gambit-specific upload staging / canonical staged-path workflow that exists to support local OpenClaw orchestration rather than upstream Nerve broadly
- any repo-local automation or docs that assume Derrick’s workflow, machine layout, or Gambit operations

These can live either on a dedicated Gambit-overlay branch or as clearly separated Gambit-only topic slices reapplied after the product base is reconciled.

#### Good upstream-candidate slices

These are the best candidates to extract as small replayable branches and eventual upstream PRs:

- auth / gateway hardening and server reliability fixes
- websocket / proxy robustness work
- file-browser operations and workflow fixes that are broadly useful outside Gambit
- chat reliability / UX repairs such as IME handling, stale socket behavior, composer persistence, layout fixes, and message rendering fixes
- session / sidebar / responsive UI improvements that map to general Nerve usability
- kanban or task-board functionality that is product-grade and not tightly coupled to Beads-local assumptions
- updater / installer / release plumbing improvements that solve generic deployment problems
- targeted test coverage additions that validate the above slices

The main rule: if a change improves Nerve as software rather than encoding Derrick’s workflow, treat it as an upstream candidate until proven otherwise.

#### Risky conflict zones to isolate into dedicated follow-up work

These should not be mixed into the first replay wave because they are likely to absorb upstream conflicts from both sides:

- `src/App.tsx`
- `src/features/chat/InputBar.tsx`
- `src/contexts/ChatContext.tsx`
- `src/contexts/SessionContext.tsx`
- `src/features/workspace/*`
- `src/features/kanban/*`
- `server/lib/config.ts`
- `server/lib/ws-proxy.ts`
- `server/routes/gateway.ts`
- `scripts/setup.ts`
- `package.json` and `package-lock.json`
- `README.md` and `CHANGELOG.md`

These need their own reconciliation beads/branches so conflict decisions are explicit and reviewable instead of buried inside a giant catch-all sync.

### Safest sequencing

#### Phase 0 — Baseline cleanup and protection

- confirm the active upstream repo and add it as the canonical upstream remote
- rename the stale `varun86/openclaw-nerve-old` remote to something archival like `upstream-old` instead of leaving it as `upstream`
- tag or branch the current Gambit `master` as a rollback snapshot before any reconciliation work begins
- explicitly ignore `.beads/interactions.jsonl` as drift signal during comparison work

#### Phase 1 — Build the clean integration base

- create `reconcile/<date>-upstream-base` from active upstream `master`
- run the app/tests there first so we know the upstream base is healthy on Derrick’s machine before replaying local work
- generate a slice inventory from the 105 fork-only commits grouped by feature area rather than replaying commit-by-commit blindly

#### Phase 2 — Replay low-risk product slices first

Reapply the least controversial and most upstreamable slices first:

- targeted bug fixes
- small UI/UX fixes
- server hardening that applies cleanly
- tests for those slices

Technique order for each slice:

1. cherry-pick cleanly if the commit series is already coherent
2. if not, manually reconstruct the intended change on the new base
3. keep each slice on its own branch with its own bead/plan linkage

#### Phase 3 — Replay Gambit-required but non-upstream overlay work

After the shared product base is in shape, layer in the changes Derrick needs locally but that should not contaminate upstream PR branches:

- Beads/Plans/operator workflow integrations
- local upload-staging conventions
- Gambit-specific docs and agent affordances

This phase should produce either:

- a dedicated `gambit-overlay/*` branch stack on top of the refreshed product base, or
- a tightly bounded set of Gambit-only commits merged after the upstream-candidate slices land locally

#### Phase 4 — Attack risky conflict zones as isolated streams

Handle the high-conflict areas one domain at a time:

- app shell / navigation
- chat/session context model
- workspace and file-browser integration
- kanban/task-board surfaces
- gateway/config/setup/package metadata
- docs/changelog cleanup

Each stream should have its own validation pass and should not block extraction of already-clean upstream candidate slices.

#### Phase 5 — Promote the refreshed branch

- when the replayed branch is functionally complete, validate with tests/manual smoke checks
- compare refreshed branch against current `master` for any truly missing Gambit-critical behavior
- only then promote it to become the new day-to-day integration branch for Derrick
- preserve old `master` (or a snapshot branch) until the refreshed line proves stable

### Concrete execution beads and intended ordering

1. **`nerve-xsj` — Remote normalization / true-upstream validation**  
   Confirm the canonical upstream repo/default branch, demote the stale `varun86/openclaw-nerve-old` remote into archival status, and record the exact upstream SHA/ref that all later work must use.

   **Completed 2026-03-22:** validated `daggerhashimoto/openclaw-nerve` as the canonical active upstream with default branch `master`, then normalized repo remotes so `upstream` now points to `git@github.com:daggerhashimoto/openclaw-nerve.git` and the stale prior baseline was preserved as archival `upstream-old` at `git@github.com:varun86/openclaw-nerve-old.git`. The old remote was kept because it still marks the ancestor baseline (`upstream-old/master` = `d90dfb6677e422ed4e4c98da02662c25c5c88edc`) that Gambit previously forked from, but it should no longer be treated as the comparison target for reconciliation work. Verified fetch state after normalization: canonical `upstream/master` = `6e6f78f676b34ff92865608ed39b8db512f4b760`, `origin/master` remains `9aca6e92`, and `git rev-list --left-right --count upstream/master...origin/master` remains `30 105` with merge base `68c11d68232e31de4354e0d4892ffce386e34e93`.

   **Why this change:** leaving `varun86/openclaw-nerve-old` on the `upstream` name falsely suggested Gambit was only ahead of upstream, when the active upstream has continued moving independently. Explicitly separating canonical `upstream` from archival `upstream-old` makes later beads compare against the right baseline while preserving historical context.

   **Cautions for later beads:** use `upstream/master` as the only canonical reconciliation base unless Derrick explicitly revalidates to something newer; treat `upstream-old/master` as historical reference only; do not rewrite current `master`; and continue ignoring `.beads/interactions.jsonl` as runtime churn rather than product drift.

2. **`nerve-7vm` — Rollback snapshot + reconciliation bootstrap** *(depends on `nerve-xsj`)*  
   Protect current `master` with a rollback snapshot/tag and create the safe fresh-branch bootstrap flow from the validated upstream baseline.

   **Completed 2026-03-22:** captured the current stable Gambit fork line from `origin/master` / local `master` at commit `9aca6e92d74db07e671e0e391e7766a03876c574` (`Update interactions.jsonl`) without rewriting `master`. Created two explicit rollback refs for recovery:
   - branch `snapshot/2026-03-22-origin-master-stable` -> `9aca6e92d74db07e671e0e391e7766a03876c574`
   - annotated tag `snapshot/nerve-7vm-origin-master-2026-03-22` -> commit `9aca6e92d74db07e671e0e391e7766a03876c574`

   Created the clean reconciliation bootstrap branch from the canonical upstream baseline, not from the Gambit fork:
   - branch `reconcile/2026-03-22-upstream-master-bootstrap` -> `upstream/master` = `6e6f78f676b34ff92865608ed39b8db512f4b760` (`Correct diagram formatting in README`)

   **Verification:** `git merge-base reconcile/2026-03-22-upstream-master-bootstrap upstream/master` returned `6e6f78f676b34ff92865608ed39b8db512f4b760`, confirming the bootstrap branch is a clean pointer to the validated upstream base. `git merge-base snapshot/2026-03-22-origin-master-stable origin/master` returned `9aca6e92d74db07e671e0e391e7766a03876c574`, confirming the rollback snapshot preserves the current stable fork head exactly.

   **Recovery notes for later beads:**
   - Do **not** rewrite or replace current `master`; keep it as the trusted live Gambit integration line until a later promotion bead explicitly says otherwise.
   - If a reconciliation branch goes sideways, recover by checking out `master` for the live fork line, or by branching/resetting from `snapshot/2026-03-22-origin-master-stable` (or the matching annotated tag `snapshot/nerve-7vm-origin-master-2026-03-22`) to recreate the protected pre-reconciliation state.
   - All replay/bootstrap work after this bead should start from `reconcile/2026-03-22-upstream-master-bootstrap` unless a later bead records a newer validated `upstream/master` intake.

3. **`nerve-mhd` — Slice inventory and classification** *(depends on `nerve-7vm`)*  
   Turn current fork-only / branch-only deltas into a concrete map of replayable slices: low-risk upstream candidates, Gambit-only overlays, and high-conflict domains.

   **Completed 2026-03-22:** inventoried the current divergence against the canonical bootstrap baseline `reconcile/2026-03-22-upstream-master-bootstrap` (`6e6f78f676b34ff92865608ed39b8db512f4b760`) and the protected stable fork line `origin/master` / `master` (`9aca6e92d74db07e671e0e391e7766a03876c574`). Current shape remains **30 upstream-only / 105 fork-only** versus canonical upstream. For replay planning, the important observation is that the 105 fork-only commits are **not** one clean branch stack: they mix product fixes, Gambit operator workflow, runtime churn, and already-landed upstream equivalents.

   **Relevant branch-only deltas still visible in the fork:**
   - `origin/fix-watch-realtime-upstream` carries **1 unique commit** beyond `master`: `cb2c921` (`fix(watcher): disable recursive workspace watch by default`). This looks like an upstream-candidate micro-slice and already has equivalent logic in the merged history under different hashes.
   - `origin/pr/upstream-nerve-fixes` carries **2 unique commits** beyond `master`: `cb2c921` plus `f7dc386` (`fix(realtime): keep WS reconnecting; widen sessions.list for subagent visibility`). Treat this branch as a publication artifact for the realtime/session hardening slice rather than a new fork-only feature area.
   - `origin/upstream/fix-watch-realtime` carries **4 unique commits** beyond `master`: watcher disable, realtime reconnect/session visibility, test alignment, and `fix(gateway): handle sessions_list output shape`. This is the cleanest preserved branch-shaped candidate for replaying/republishing the gateway/session reliability slice.
   - `origin/pr/model-lookup-missing-transcript` carries **5 unique commits** beyond `master`: `fix(sessions): avoid 404 on model lookup when transcript missing` plus localStorage test shims and early beads/plans bootstrap commits. Split this into a small upstream-candidate session fix and a Gambit-only repo-workflow residue slice.
   - `origin/feature/sessions-tab-subagent-visibility` and `origin/fix/realtime-stall-subagent-visibility` are already fully contained by `master`; they are provenance clues, not separate replay targets.

   **Replayable slice map and recommended ordering:**

   **Slice A — Gateway / session reliability fixes (first replay wave)**
   - **Purpose:** preserve the cleanest live-runtime fixes that improve connection stability, subagent/session visibility, and fault handling without dragging in larger product overlays.
   - **Likely source commits / areas:** `59cc87f`, `de0a53f` / `ddf6dfa`, `fb1b883` / `149abdd`, `8ec8287`, `3969067`, `875d724`, `f80262a`; branch evidence from `origin/upstream/fix-watch-realtime`, `origin/pr/upstream-nerve-fixes`, and `origin/pr/model-lookup-missing-transcript`.
   - **Disposition:** **upstream-candidate**.
   - **Estimated replay approach:** mostly **cherry-pick** or tight manual replay if hashes diverged from the publication branches.
   - **Major files / surfaces:** `server/routes/connect-defaults.ts`, `server/lib/file-watcher.ts`, `server/routes/gateway.ts`, `server/routes/sessions.ts`, `src/contexts/SessionContext.tsx`, `src/features/connect/*`, related tests.

   **Slice B — Beads board foundation and linked Plans workflow**
   - **Purpose:** preserve the Gambit productivity layer that makes Beads a first-class task surface inside Nerve and wires bead/plan references through the workspace and chat surfaces.
   - **Likely source commits / areas:** `e2fcfc8`, `5d928f9`, `aeef182`, `0181bfd`, `220dbbf`, `7f5004b`, `2000565`, `b9a5014`, `6060702`, `fecaf7d`, `68fecaf`, `4600c2d`, `3e015a3`, `1a4d328`, `732927e`, `4b91636` plus the surrounding plan-linkage commits.
   - **Disposition:** **Gambit-only** for now, with a possible later upstream extraction of generic non-Beads plan UX if desired.
   - **Estimated replay approach:** **manual reconstruction** onto the refreshed base, because the slice spans UI, server APIs, linkage metadata, and repo workflow assumptions.
   - **Major files / surfaces:** `src/features/kanban/*`, `server/lib/beads-board.ts`, `server/routes/beads.ts`, `server/lib/plans.ts`, `server/routes/plans.ts`, `src/features/workspace/tabs/PlansTab.tsx`, `src/features/plans/*`, `docs/BEAD-PLAN-LINKAGE.md`, `.beads/*`, `.plans/*`.

   **Slice C — Plans/mobile/navigation UX follow-through**
   - **Purpose:** keep the nontrivial UX work that makes Plans/Beads usable on mobile and desktop, including reader flow, top-level surfacing, selection persistence, and chat affordances.
   - **Likely source commits / areas:** `93112ad`, `822d222`, `7c14b4a`, `263306a`, `14d04bf`, `270b045`, `4d76ca1`, `2781322`, `b25203a`, `371f4f3`, `862be27` and related plan-verification commits.
   - **Disposition:** **conflict-zone**. Some subparts may become upstream-candidate later, but they currently sit on top of Gambit-specific Plans/Beads concepts.
   - **Estimated replay approach:** **manual reconstruction** or **defer to conflict bead** once the base product line is stable.
   - **Major files / surfaces:** `src/App.tsx`, `src/components/TopBar.tsx`, `src/features/workspace/*`, `src/features/chat/InputBar.tsx`, `src/features/chat/addToChat.ts`, `src/features/plans/*`.

   **Slice D — Attachment / upload staging and canonical-path workflow**
   - **Purpose:** retain the newer attachment pipeline that stages browser uploads into workspace temp files, keeps canonical paths in descriptors, and exposes a two-mode upload/path flow better aligned with orchestration.
   - **Likely source commits / areas:** `14478d5`, `8b654c9`, `e8369ce`, `81a4131`, `40a88d5`, `b393854` plus the March 21–22 validation/documentation commits.
   - **Disposition:** **Gambit-only** unless trimmed down to a more generic upstream-safe upload behavior slice.
   - **Estimated replay approach:** core mechanics via **manual reconstruction**; validation/docs remain **deferred to Gambit overlay**.
   - **Major files / surfaces:** `server/lib/upload-staging.ts`, `server/lib/upload-optimizer.ts`, `server/routes/upload-stage.ts`, `server/routes/upload-config.ts`, `server/routes/upload-optimizer.ts`, `src/features/chat/InputBar.tsx`, `src/features/chat/image-compress.ts`, `src/features/chat/uploadPolicy.ts`, `.plans/archive/2026-03-18-upload-followups-polish-rejection-and-file-reference-validation.md` and related upload plans.

   **Slice E — App shell, chat composer, and context-model reshaping**
   - **Purpose:** reconcile the large app-shell and chat-input evolution in the fork without letting it contaminate the small low-risk replay wave.
   - **Likely source commits / areas:** `3e07682`, `ad73e47`, parts of `4600c2d`, the add-to-chat work, attachment-flow commits, and broader UI reshaping visible in `src/App.tsx` / `src/features/chat/InputBar.tsx` / `src/contexts/ChatContext.tsx`.
   - **Disposition:** **conflict-zone**.
   - **Estimated replay approach:** **defer to conflict bead** with selective manual reconstruction.
   - **Major files / surfaces:** `src/App.tsx`, `src/features/chat/InputBar.tsx`, `src/contexts/ChatContext.tsx`, `src/features/chat/ChatPanel.tsx`, `src/features/chat/MessageBubble.tsx`, `src/components/TopBar.tsx`.

   **Slice F — Workspace / file-browser integration stream**
   - **Purpose:** isolate workspace-path opening, plans/workspace handoff, and any file-browser surface changes from the chat/session and kanban streams.
   - **Likely source commits / areas:** `862be27`, `822d222`, the plans workspace surface commits, plus file/workspace API adjustments visible in the fork diff.
   - **Disposition:** **conflict-zone** with some likely upstream-candidate sub-slices after untangling.
   - **Estimated replay approach:** **defer to conflict bead** (`nerve-50n`) with manual reconstruction.
   - **Major files / surfaces:** `src/features/workspace/*`, `src/features/file-browser/*`, `server/routes/file-browser.ts`, `server/routes/workspace.ts`, `server/lib/file-ops.ts`, `server/lib/file-utils.ts`.

   **Slice G — Kanban / task-board and runtime store divergence**
   - **Purpose:** isolate the large kanban/task-board branch of Gambit work from the refreshed upstream line and decide later what is generic enough to upstream.
   - **Likely source commits / areas:** `2da41d6` ancestry in the fork, `5d928f9`, `aeef182`, `0181bfd`, `6060702`, and the surrounding Beads board / kanban commits; note that upstream has independently evolved this area (`6f1a028`, `6e6f78f` ancestry), increasing conflict risk.
   - **Disposition:** **conflict-zone**.
   - **Estimated replay approach:** **defer to conflict bead** (`nerve-mi0`) and manually reconstruct against the now-more-modern upstream kanban/runtime-store shape.
   - **Major files / surfaces:** `src/features/kanban/*`, `server/lib/beads-board.ts`, `server/lib/kanban-store.ts`, `server/routes/beads.ts`, `server/lib/plans.ts`.

   **Slice H — Packaging / docs / installer metadata cleanup**
   - **Purpose:** separate the repo metadata and operator docs drift from product behavior so README/package/setup conflicts stop polluting other slices.
   - **Likely source commits / areas:** `55c2bdb`, `.env.example` / `package-lock.json` / `package.json` drift, `AGENTS.md`, README/changelog/docs updates, and installer/setup edits around branch/workflow support.
   - **Disposition:** mixed but operationally **Gambit-only** for now, with any generic installer hardening reconsidered later.
   - **Estimated replay approach:** **manual reconstruction** after product slices settle; some docs may simply be omitted from the upstream-facing replay branch.
   - **Major files / surfaces:** `README.md`, `CHANGELOG.md`, `docs/*`, `AGENTS.md`, `scripts/setup.ts`, `package.json`, `package-lock.json`, `.env.example`.

   **Ordering recommendation:**
   1. Replay **Slice A** first through `nerve-dnt`, but split it into multiple upstream-candidate micro-slices rather than shipping it as one umbrella branch. Each micro-slice must be a single coherent bug fix or feature, with its own branch, test story, and upstream issue/PR narrative.
   2. Keep **Slice D** out of the first upstream replay wave; treat it as a Gambit overlay candidate after the base line stabilizes.
   3. Route **Slice B** and the docs/runtime residue of **Slice D** into `nerve-t68` as the initial Gambit-only overlay stack.
   4. Use the dedicated conflict beads for the remaining large domains: **Slice E** -> `nerve-okz`, **Slice F** -> `nerve-50n`, **Slice G** -> `nerve-mi0`, **Slice H** + gateway/config/package spillover -> `nerve-hpe`.
   5. The umbrella execution graph **did** need additional supporting beads once the global one-change-per-branch rule was clarified, so child micro-slice beads were created under the six broad execution nodes below. Those parent nodes now act as coordination/grouping containers only and should close only after their child slices are completed or intentionally deferred.

4. **`nerve-dnt` — First low-risk/high-value replay wave** *(depends on `nerve-mhd`)*  
   Coordination/grouping node only. Actual implementation must happen on child micro-slice branches `nerve-dnt.1` through `nerve-dnt.4`, each carrying one coherent upstream-candidate reliability fix from canonical `upstream/master` (or its validated descendant) with its own test and upstream narrative.

5. **`nerve-t68` — Gambit-only overlay separation** *(depends on `nerve-dnt`)*  
   Coordination/grouping node only. Actual implementation must happen on child overlay branches `nerve-t68.1` through `nerve-t68.3`, each layering one Gambit-only concern onto the refreshed reconciliation line after the upstream-candidate base exists.

6. **High-conflict dedicated streams** *(all depend on `nerve-mhd` and can run in parallel once the slice inventory exists)*
   These are also coordination/grouping nodes only; actual work must happen in their child micro-slice branches.
   - **`nerve-okz`** — child branches `nerve-okz.1` through `nerve-okz.3` for app shell, chat composer UX, and chat/session contexts
   - **`nerve-50n`** — child branches `nerve-50n.1` through `nerve-50n.3` for workspace nav, file-browser ops, and workspace/plans handoff
   - **`nerve-mi0`** — child branches `nerve-mi0.1` through `nerve-mi0.3` for generic kanban alignment, Beads backend overlay, and kanban plan linkage
   - **`nerve-hpe`** — child branches `nerve-hpe.1` through `nerve-hpe.3` for gateway/config hardening, setup/package drift, and docs metadata

7. **`nerve-f2o` — Branch-selectable live deployment** *(depends on `nerve-7vm`)*  
   Add the `~/.openclaw/.env` (or equivalent runtime-config) mechanism that lets `update.sh` / `restore.sh` deploy a chosen `gambit-openclaw-nerve` branch for live testing.

8. **`nerve-vfl` — Final validation / promotion / upstream approval** *(depends on `nerve-dnt`, `nerve-t68`, `nerve-okz`, `nerve-50n`, `nerve-mi0`, `nerve-hpe`, and `nerve-f2o`)*  
   Run final validation on the refreshed branch stack, promote approved slices into the refreshed local integration line, and record which slices advance to upstream issue/PR submission versus remain Gambit-only by decision.

This is the actual execution order for Task 4: normalize the baseline first, create the safety bootstrap second, inventory the drift third, then split into replay/overlay/conflict/deployment streams before final promotion.

### Refined micro-slice execution graph (2026-03-22 refinement)

**Global rule now enforced:** the umbrella beads `nerve-dnt`, `nerve-t68`, `nerve-okz`, `nerve-50n`, `nerve-mi0`, and `nerve-hpe` are **coordination/grouping nodes only**. Actual implementation must happen in child `slice/<bead-id>-<slug>` branches, with one coherent fix/feature per branch.

- **`nerve-dnt` — low-risk upstream-candidate replay coordination**
  - `nerve-dnt.1` — watcher default fix; **upstream-candidate**; base = canonical `upstream/master` descendant; approach = **cherry-pick** `cb2c921` if clean, else **manual reconstruction**.
    - **Execution update (2026-03-22):** created dedicated branch `slice/nerve-dnt.1-watcher-default` from `reconcile/2026-03-22-upstream-master-bootstrap`.
    - **What changed:** canonical `upstream/master` already carries the product fix via `eb0eeaf` / `b0f4f77` lineage (`config.workspaceWatchRecursive` defaults false and `server/lib/file-watcher.ts` only enables recursive workspace watching when explicitly requested), so this micro-slice stayed narrow by adding regression coverage instead of replaying a duplicate code patch. Added two focused assertions in `server/lib/config.test.ts` that lock the default-off behavior and the explicit env opt-in (`NERVE_WATCH_WORKSPACE_RECURSIVE=true`).
    - **Tests:** `npm run test -- --run server/lib/config.test.ts` ✅ (43 passed).
    - **Commit:** `a5bb1a6` — `test(watcher): lock recursive watch default off`.
    - **Upstream readiness:** yes as a tiny follow-up/regression-coverage PR, but the original watcher-default product fix itself appears already present upstream, so this branch is mainly useful as proof/coverage rather than as the primary bug-fix submission.
  - `nerve-dnt.2` — websocket reconnect + subagent session visibility; **upstream-candidate**; base = canonical `upstream/master` descendant; approach = **cherry-pick** from preserved upstream publication branch if possible, else **manual reconstruction**.
    - **Execution update (2026-03-23):** created dedicated branch `slice/nerve-dnt.2-realtime-reconnect-session-visibility` from `reconcile/2026-03-22-upstream-master-bootstrap`.
    - **What landed vs preserved source:** preserved commit `1fd6e10` did not cherry-pick cleanly because the reconcile base already carried the widened session-list/subagent-visibility behavior via newer session-list + `spawnedBy` handling. This slice therefore manually reconstructed only the remaining reconnect hardening still missing on the base: `src/hooks/useWebSocket.ts` no longer marks reconnect auth failures as intentional disconnects, so the UI keeps retrying instead of stalling until a manual reload.
    - **Files changed:** `src/hooks/useWebSocket.ts`, `src/hooks/useWebSocket.test.ts`, `.plans/2026-03-18-upstream-alignment-and-branch-pr-workflow.md`.
    - **Tests:** `npm run test -- --run src/hooks/useWebSocket.test.ts` ✅ (16 passed). Validation also included inspecting the preserved commit diff versus the reconcile base to confirm the session-visibility portions were already present and that this branch stayed scoped to the remaining reconnect behavior.
    - **Upstream readiness:** yes — clean later Issue/PR candidate for the reconnect-hardening delta, with the preserved session-visibility evidence documented but not redundantly replayed.
  - `nerve-dnt.3` — gateway `sessions_list` output-shape handling; **upstream-candidate**; base = canonical `upstream/master` descendant; approach = **cherry-pick** if clean, else **manual reconstruction**.
  - `nerve-dnt.4` — missing-transcript model lookup fix; **upstream-candidate**; base = canonical `upstream/master` descendant; approach = **manual reconstruction** or highly selective cherry-pick of the clean bug fix only.

- **`nerve-t68` — Gambit-only overlay coordination** *(all children also depend on `nerve-dnt` so the refreshed product line exists first)*
  - `nerve-t68.1` — Beads board foundation overlay; **Gambit-only**; base = descendant reconciliation branch; approach = **manual reconstruction**.
  - `nerve-t68.2` — Plans linkage + reader workflow overlay; **Gambit-only**; base = descendant reconciliation branch; approach = **manual reconstruction**.
  - `nerve-t68.3` — upload staging + canonical-path overlay; **Gambit-only**; base = descendant reconciliation branch; approach = **manual reconstruction** with selective carry-forward of validated behavior.

- **`nerve-okz` — app/chat/session conflict coordination**
  - `nerve-okz.1` — app shell + top-level navigation; **mixed** (Gambit-first, possible upstreamable subparts later); base = canonical `upstream/master` descendant; approach = **manual reconstruction**.
  - `nerve-okz.2` — chat composer + add-to-chat UX; **mixed** (generic UX subparts may become upstream-candidate later); base = canonical `upstream/master` descendant; approach = **manual reconstruction**.
  - `nerve-okz.3` — chat/session context model reconciliation; **mixed** with reliability-oriented upstream potential; base = canonical `upstream/master` descendant, preferably after the `nerve-dnt` reliability slices settle; approach = **manual reconstruction**.

- **`nerve-50n` — workspace/file-browser conflict coordination**
  - `nerve-50n.1` — workspace panel + navigation behavior; **mixed** with likely upstreamable UX subparts; base = canonical `upstream/master` descendant; approach = **manual reconstruction**.
  - `nerve-50n.2` — file-browser operations + supporting server APIs; **likely upstream-candidate** if kept generic; base = canonical `upstream/master` descendant; approach = **manual reconstruction** or selective cherry-pick of generic fixes.
  - `nerve-50n.3` — workspace-to-plans handoff; **Gambit-only** unless generalized later; base = descendant reconciliation branch after `nerve-50n.1`; approach = **manual reconstruction** or **defer**.

- **`nerve-mi0` — kanban/task-board conflict coordination**
  - `nerve-mi0.1` — generic kanban UI + runtime-store alignment; **upstream-candidate if it stays generic**; base = canonical `upstream/master` descendant; approach = **manual reconstruction**.
  - `nerve-mi0.2` — Beads-backed kanban backend integration; **Gambit-only**; base = descendant reconciliation branch after `nerve-mi0.1`; approach = **manual reconstruction**.
  - `nerve-mi0.3` — kanban plan-linkage affordances; **Gambit-only**; base = descendant reconciliation branch after `nerve-mi0.2`; approach = **manual reconstruction** or **defer**.

- **`nerve-hpe` — gateway/config/setup/package/docs conflict coordination**
  - `nerve-hpe.1` — gateway/config/ws-proxy hardening; **upstream-candidate** where the hardening stays generic; base = canonical `upstream/master` descendant; approach = **selective cherry-pick** or **manual reconstruction**.
  - `nerve-hpe.2` — setup script + package manifest drift; **mixed** (generic installer fixes upstreamable, branch-selection hooks local); base = canonical `upstream/master` descendant or a descendant deployment branch as appropriate; approach = **manual reconstruction**.
  - `nerve-hpe.3` — README/changelog/operator docs drift; **mostly Gambit-only**; base = descendant reconciliation branch after `nerve-hpe.2`; approach = **manual reconstruction** or **defer**.

**Additional child dependency wiring created in Beads:**
- `nerve-t68.1`, `nerve-t68.2`, `nerve-t68.3` all depend on `nerve-dnt`
- `nerve-okz.3` depends on `nerve-dnt`
- `nerve-50n.3` depends on `nerve-50n.1`
- `nerve-mi0.2` depends on `nerve-mi0.1`; `nerve-mi0.3` depends on `nerve-mi0.2`
- `nerve-hpe.3` depends on `nerve-hpe.2`

## Dependencies / Preconditions

- The prior attachment/canonical staged-path stream is now considered complete after live verification on 2026-03-22, so this planning/execution stream is no longer blocked by that prerequisite.
- The canonical comparison target is now validated `upstream/master` from `git@github.com:daggerhashimoto/openclaw-nerve.git`; keep `upstream-old` only as the historical fork-reference remote.
- Runtime-only Beads noise such as `.beads/interactions.jsonl` should not be mistaken for meaningful repo drift.

---

## Final Results

**Status:** ⚠️ Partial — drift audit, reconciliation strategy, durable workflow, executable bead graph, and concrete slice inventory are now defined; implementation/replay work is intentionally still pending

**What We Built:** A living plan that now includes the completed drift audit, the approved hybrid refresh-and-replay strategy, the durable branch/issue/PR workflow, the concrete execution graph required to carry it out, and a replay-oriented slice inventory covering gateway/session reliability, Beads/Plans overlays, upload/canonical-path workflow, app-shell/chat conflicts, workspace/file-browser conflicts, kanban/runtime-store conflicts, and packaging/docs cleanup.

**Commits:**
- Pending

**Lessons Learned:** The important move is separating “how we ship Derrick-ready integrated Nerve” from “how we package upstreamable changes” so our fork stops accumulating unnamed divergence. The stale configured upstream also means every future sync must begin with baseline revalidation instead of assuming the current `upstream` remote is authoritative.

---

*Planned on 2026-03-18*