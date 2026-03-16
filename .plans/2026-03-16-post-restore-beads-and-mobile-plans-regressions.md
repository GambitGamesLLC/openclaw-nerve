---
plan_id: plan-2026-03-16-post-restore-beads-and-mobile-plans-regressions
bead_ids:
  - Pending
---
# Nerve post-restore Beads and mobile Plans regressions

**Date:** 2026-03-16  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Diagnose and fix the regressions Derrick found after running `update.sh` and `restore.sh`: the `gambit-openclaw-nerve` Beads board 502 on Chip, the desktop Plans reader still using the old split layout, and the mobile Plans reader still showing old chrome/back-button behavior.

---

## Overview

Derrick has now done the interactive host-side rollout step, which changes the shape of the problem. Earlier evidence suggested the mobile Plans reader code and built assets were present locally, but the fresh post-`update.sh`/`restore.sh` report says the live behavior on both desktop and mobile still does not match the intended reader-first UX, and the top-level Beads surface for `gambit-openclaw-nerve` is now failing with a 502 on Chip itself. That means we should stop treating this as only phone-side cache and instead re-verify the actual post-restore runtime, source-selection path, and current UI implementation together.

This turned out to be a mixed bucket with two very different causes. The Beads 502 is not a Nerve frontend regression at all: the live API (`GET /api/beads/board?sourceId=gambit-openclaw-nerve`) returns 502 because `bd export` for this repo fails directly with `column "no_history" could not be found in any table in scope`, and even `bd create` fails with `Unknown column 'no_history' in 'issues'`. The repo-local Beads store is on Dolt/server mode and the current `bd` binary (`0.61.0`) expects a `no_history` column that this source’s schema does not currently have. That makes the Beads board failure a backend/runtime/source-schema mismatch in the repo, not a stale Nerve asset problem.

The desktop Plans symptom is also not a runtime mismatch. The current source, tests, and live UI all agree that desktop/tablet keeps the split list + reader layout. `src/features/workspace/tabs/PlansTab.tsx` still intentionally uses `grid grid-rows-[minmax(220px,38%)_minmax(0,1fr)]` outside compact/mobile viewports, and `src/features/workspace/tabs/PlansTab.test.tsx` explicitly asserts that desktop keeps the header/search visible while previewing. So the “desktop should behave like Beads and pan over from the side” expectation does not match what the earlier Plans work actually specified or implemented.

The mobile Plans symptom was real, but narrower than first described. `PlansTab` already hid its own header/search/list chrome on compact viewports, so the earlier report was not caused by stale assets after `restore.sh` / `update.sh`. The remaining chrome was coming from the parent `PlansPanel` wrapper, which always rendered the top-level `Plans` heading, source selector, and source-management controls even while the compact reader was active. That was an implementation gap in the top-level Plans surface, and it was fixable locally.

---

## Tasks

### Task 1: Reproduce the post-restore failures and isolate the Beads 502 root cause

**Bead ID:** `Pending`  
**SubAgent:** `research`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, reproduce Derrick’s post-restore issues after `update.sh` and `restore.sh`: (1) top-level Beads for source `gambit-openclaw-nerve` returns HTTP 502 on Chip, (2) desktop Plans still opens in the old split lower-half view, and (3) mobile Plans still shows old header/search/back-button chrome instead of a Beads-like focused reader. Claim the assigned bead at start, gather concrete evidence from the live runtime plus current source, and determine whether each symptom is a backend/source failure, stale asset/runtime mismatch, or implementation gap. Update this plan with exact findings and recommended fixes.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/`
- `/home/derrick/.openclaw/workspace/scripts/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-16-post-restore-beads-and-mobile-plans-regressions.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.test.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/plans/PlansPanel.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/plans/PlansPanel.test.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.beads/dolt-server.log`

**Status:** ✅ Complete

**Results:** Reproduced all three symptoms against the live runtime and current repo.
- **Beads 502:** `curl -i http://127.0.0.1:3080/api/beads/board?sourceId=gambit-openclaw-nerve` returned `HTTP/1.1 502 Bad Gateway` with `{"error":"beads_adapter_error"...}`. In the repo itself, `bd export` failed with `Error 1105 (HY000): column "no_history" could not be found in any table in scope`, and the existing create failure reproduced in `.beads/dolt-server.log` as `Unknown column 'no_history' in 'issues'`. `bd context --json` shows this repo is using Dolt/server mode on `bd version 0.61.0`. Category: **backend/runtime/source failure** caused by a repo-local Beads schema mismatch, not by stale Nerve assets.
- **Desktop Plans split view:** live desktop behavior matched current implementation. After clicking a plan in the top-level Plans surface, the app still rendered the split list + reader layout, and the source confirms that is intentional on non-compact viewports. `PlansTab.test.tsx` has a desktop assertion that header/search stay visible while previewing. Category: **expectation mismatch from prior plan wording / implementation history**, not a post-restore regression.
- **Mobile Plans chrome still visible:** reproduced at `390x844`. Before the fix, selecting a plan still showed the top-level `Plans` heading, source selector, and wrapper controls even though the inner `PlansTab` compact reader logic was already active. Search was already hidden by `PlansTab`; the remaining visible chrome was coming from `PlansPanel`. The still-textual `Back to plans` affordance was *not* a new regression from restore/update; that label/style matches the prior scoped implementation, which explicitly kept a sticky back control instead of building a Beads-style side drawer. Category: **implementation gap/regression** for the extra wrapper chrome, plus **expectation mismatch** if the desired end state is a literal Beads drawer-style transition.

Extra evidence: Bead creation in this repo is currently broken for the same schema reason (`Unknown column 'no_history' in 'issues'`), so I did not try to force creating or claiming a new bead. That failure should be treated as part of the Beads diagnosis, not as separate noise.

---

### Task 2: Fix the Beads board failure for `gambit-openclaw-nerve`

**Bead ID:** `Pending`  
**SubAgent:** `coder`  
**Prompt:** After Task 1 identifies the Beads 502 cause for the `gambit-openclaw-nerve` source, claim the assigned bead, apply the smallest durable fix in the correct layer (repo source discovery, server Beads loading, runtime env, or regression in the board pipeline), validate it, and update this plan with files changed, tests run, and results.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.beads/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-16-post-restore-beads-and-mobile-plans-regressions.md`
- repo-local Dolt schema in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.beads/dolt/nerve` (runtime data; ignored by git)

**Status:** ✅ Complete

**Results:** Repaired the actual failing source instead of touching Nerve.
- **Exact mismatch:** this repo’s Beads store reported `config.schema_version=7`, so `bd` skipped schema initialization/migrations, but the live Dolt schema in database `nerve` was missing `no_history` on both `issues` and `wisps`. That is why `bd export` failed with `column "no_history" could not be found in any table in scope` and creates failed with `Unknown column 'no_history' in 'issues'`.
- **Owning layer / smallest durable repair path:** the immediate failure lived in the repo-local Beads source, so the smallest safe repair was to patch that source DB directly and commit the schema change in Dolt. I added `no_history TINYINT(1) DEFAULT 0` to both `issues` and `wisps`, then staged/committed those table changes inside the repo-local Dolt store.
- **Why this happened:** the deeper bug appears to be upstream in Beads, not in Nerve. `bd`/Beads source currently has `currentSchemaVersion = 7` while also expecting the later `add_no_history_column` migration, so an older repo can claim to be up to date even when the actual schema is missing that column. I did **not** patch upstream Beads from this repo because the task here was to restore this source safely; that follow-up belongs in the Beads codebase.

**Validation:**
- `bd export` now succeeds in this repo (73 JSONL lines written during validation instead of failing)
- `bd ready --json` succeeds
- created and immediately closed a temporary validation bead `nerve-id4` to confirm writes work again
- `curl -i http://127.0.0.1:3080/api/beads/board?sourceId=gambit-openclaw-nerve` now returns `HTTP/1.1 200 OK` with board JSON instead of 502

**Dolt commit inside repo-local Beads store:**
- `4t2vptijt2a8sensrlvhv0f6sad3rku2` - `schema: add missing no_history columns`

---

### Task 3: Fix Plans reader behavior so desktop and mobile match the intended focused-reader UX

**Bead ID:** `Pending`  
**SubAgent:** `coder`  
**Prompt:** After Task 1 identifies why Plans is still behaving like the old split view on desktop/mobile, claim the assigned bead, update the implementation so the actual desktop/mobile behavior matches the intended focused-reader UX Derrick described, validate with tests/build and a concrete verification path, and update this plan with what changed and why.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-16-post-restore-beads-and-mobile-plans-regressions.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.test.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/plans/PlansPanel.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/plans/PlansPanel.test.tsx`

**Status:** ✅ Complete

**Results:** Landed the desktop Plans UX change Derrick confirmed we want, using the smallest durable extension of the existing mobile reader-first flow instead of inventing a new modal system.
- **Desktop + mobile reader-first behavior:** `PlansTab` no longer keeps desktop in the old split list/lower-preview layout. Opening a plan now reuses the existing reader-first state across all viewports: the top-level header/search/list chrome hides, the selected plan becomes the primary surface, and the sticky **Back to plans** affordance restores the list.
- **Wrapper chrome stays coherent:** the earlier `PlansPanel` wrapper fix remains in place, so when the focused reader is active the parent `Plans` heading/source selector stays hidden on both mobile and desktop.
- **Preserved behaviors:** this keeps the existing selected-plan reader, markdown links, Add to Chat, linked task buttons, requested-plan deep links, source switching reset, and explicit return-to-list flow intact.
- **Tests updated with the new intent:** desktop tests now assert the same focused-reader/back-to-list behavior instead of asserting the legacy split layout. The existing mobile tests still pass, confirming the mobile wrapper/readers were not regressed.

**Validation:**
- `npm test -- --run src/features/plans/PlansPanel.test.tsx src/features/workspace/tabs/PlansTab.test.tsx`
- `npm run build`
- Live verification: not completed in-browser in this subagent run after the desktop change, but the focused test coverage and production build both passed for the exact reader-flow paths changed here.

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:** Diagnosed the post-restore Beads + Plans report, repaired the broken repo-local Beads source, and confirmed the top-level Nerve Beads board for `gambit-openclaw-nerve` is healthy again. The Beads failure was a source-local Dolt schema mismatch: the DB claimed `schema_version=7` but was still missing `no_history` on `issues` and `wisps`, so `bd 0.61.0` could not read or write the source. After adding those columns directly in the repo-local Dolt DB and committing the schema change there, `bd export`, `bd ready`, bead creation/closure, and the Nerve board endpoint all worked again.

The Plans work remains a separate track. Desktop split view was not a restore regression, while the mobile wrapper chrome issue was a genuine implementation gap already being addressed elsewhere in this plan.

**Commits:**
- No git commit from this task run.
- Repo-local Dolt commit (ignored runtime data): `4t2vptijt2a8sensrlvhv0f6sad3rku2` - `schema: add missing no_history columns`

**Lessons Learned:** A stored Beads schema version is not trustworthy by itself; the actual Dolt tables can still be stale. For this incident, Nerve was correctly surfacing a backend/source failure, and the smallest correct repair was in the source DB, while the underlying version-gating bug should be fixed upstream in Beads.

---

*Created on 2026-03-16*
