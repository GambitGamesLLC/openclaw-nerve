# Gambit OpenClaw Nerve — linkage migration polish

**Date:** 2026-03-14  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Evaluate and implement the highest-value remaining bead↔plan linkage polish from `nerve-1w9` without dragging in Cookie/Byte verification or broader unrelated work.

---

## Overview

The core linkage stack is now in place. Slice 1 gave plans stable `plan_id` / `bead_ids` identity and backlinks. Slice 2 made bead metadata authoritative with metadata-first resolution and explicit `active`, `archived`, `moved`, and `missing` states. The follow-up repair slice added an explicit manual metadata refresh path for stale-but-recoverable links.

What remains in `nerve-1w9` is polish, not foundation: whether `legacy_path_only` deserves to be surfaced, whether plan pages should expose richer reverse lookup/navigation into linked beads, and whether any additional migration helper is justified now that lazy normalization and manual repair exist. Because these are lower-risk, lower-certainty items, the right move is another validation-first pass rather than jumping straight into code.

This plan keeps the work bead-only and linkage-only. No Cookie/Byte dependency, no broad migration wave, and no detour into unrelated Nerve features. Execution is now authorized. Repo-local execution Beads are created as `nerve-73h` (epic), `nerve-pfc` (validation), `nerve-fq2` (execution Beads / plan update), `nerve-rc4` (implementation), and `nerve-s8k` (final verification/commit/push). The umbrella follow-up bead remains `nerve-1w9`; this plan is the concrete execution breakdown.

---

## Proposed Tasks

### Task 1: Validate remaining linkage polish candidates

**Bead ID:** `nerve-pfc`  
**SubAgent:** `research`  
**Prompt:** Review the current post-repair linkage implementation and determine which remaining `nerve-1w9` polish item is actually highest-value now. Compare the practical value of surfacing `legacy_path_only`, richer reverse lookup/navigation from plan pages, and any remaining migration-helper polish. Update this living plan with a compact recommendation for the next implementation slice.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `docs/` (read-only unless a tiny clarification is truly needed)

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-linkage-migration-polish.md`

**Status:** ✅ Complete

**Results:** Validated the current post-repair linkage state against the shipped server/UI code, the prior slice plans, and `docs/BEAD-PLAN-LINKAGE.md`.

Findings:
- The repair-helper slice already covered the only still-urgent migration ergonomics gap. We now have metadata-first resolution, lazy metadata normalization during board projection, and an explicit manual repair endpoint/CTA for stale-but-resolvable links. There is no clear remaining pain that justifies another migration-helper pass right now.
- `legacy_path_only` remains a documented-but-unshipped edge state. In practice, the active workflow now backfills/maintains `plan_id` + `bead_ids` on plans and canonical `metadata.plan` on beads, which keeps the realistic surface area for a frontmatter-less-but-still-linked file quite small. Surfacing it now would add state/UI complexity for a rare case without materially improving the common path.
- Reverse lookup/navigation from plan pages is the only remaining polish area with routine day-to-day value, but it is partly shipped already: `PlansTab` renders linked `beadIds` in the selected-plan header, those IDs can already open the task in the board via `onOpenTask`, markdown inline bead references can already route to tasks, and plans are already searchable by `beadIds`.
- Because the basics are already present, the next slice should **not** be a broad reverse-lookup feature wave. The gap is narrower: improve plan→bead navigation so linked tasks are easier to inspect/open from a selected plan without bouncing through search or losing context.

Recommended next polish slice:
- Implement a **small Plans-side reverse-navigation polish pass**.
- Keep it scoped to richer navigation from a selected plan into already-linked beads — for example, clearer linked-task affordances and/or lightweight task context in the Plans surface — rather than inventing new linkage states or migration flows.
- Treat this as workflow polish, not linkage recovery.

Explicit answers:
- **Highest-value remaining `nerve-1w9` item now:** a compact reverse lookup/navigation polish from plan pages.
- **`legacy_path_only` surfaced state:** still defer; too edge-case-heavy relative to the current maintained metadata/frontmatter substrate.
- **Remaining migration-helper polish beyond lazy normalization + manual repair:** none justified now.
- **Would richer plan-page reverse navigation reduce context switching?** Yes, but only if scoped to sharpening the existing plan→task affordances rather than building a whole new reverse-lookup subsystem.

This keeps Task 2 unblocked. It should shape the next bead set around a small Plans-side navigation polish slice and explicitly defer `legacy_path_only` plus any new migration-helper wave.

---

### Task 2: Create execution Beads for the chosen polish slice

**Bead ID:** `nerve-fq2`  
**SubAgent:** `primary`  
**Prompt:** Convert the validated `nerve-1w9` recommendation into a compact repo-local Beads set. Keep the implementation path focused on the single highest-value polish slice, and split non-blocking leftovers into deferred follow-up only if truly needed. Update this living plan with the real bead IDs and dependency order.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-linkage-migration-polish.md`
- repo-local Beads state under `.beads/`

**Status:** ✅ Complete

**Results:** Claimed and completed `nerve-fq2`, then tightened the execution Beads to match the validated scope with no extra micro-beads.

Execution Beads for this slice:
- `nerve-73h` (epic): Linkage migration polish
- `nerve-pfc` (closed): validation pass
- `nerve-fq2` (closed): execution Bead shaping + plan update
- `nerve-rc4` (open): implementation task, narrowed to compact Plans-side reverse-navigation polish using existing `beadIds`
- `nerve-s8k` (open): verification/commit/push
- `nerve-1w9` (open umbrella follow-up): explicitly narrowed to deferred leftovers only (`legacy_path_only`, migration-helper expansion beyond lazy normalization + manual repair, and broad reverse-lookup subsystem)

Dependency order:
- Main execution chain: `nerve-pfc` → `nerve-fq2` → `nerve-rc4` → `nerve-s8k`
- Deferred umbrella gate: `nerve-s8k` → `nerve-1w9`

Scope cuts encoded for Task 3:
- Do **not** surface `legacy_path_only` in this slice.
- Do **not** add migration-helper work beyond existing lazy normalization + manual repair flow.
- Do **not** build a broad reverse-lookup subsystem.

---

### Task 3: Implement the selected linkage polish slice

**Bead ID:** `nerve-rc4`  
**SubAgent:** `coder`  
**Prompt:** Claim `nerve-rc4`, then implement a compact Plans-side reverse-navigation polish pass using the existing `beadIds` substrate. Start in the selected-plan linked-bead/task surface (Plans UI) and improve plan → task inspection/open flow without requiring search detours. Keep scope explicitly narrow: no surfaced `legacy_path_only` state, no migration-helper expansion beyond current lazy normalization + manual repair, and no broad reverse-lookup subsystem. Run targeted tests + build, update this living plan with exact files changed and verification, then close `nerve-rc4`.

**Folders Created/Deleted/Modified:**
- `src/features/workspace/tabs/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/workspace/tabs/PlansTab.tsx`
- `src/features/workspace/tabs/PlansTab.test.tsx`
- `.plans/2026-03-14-nerve-linkage-migration-polish.md`

**Status:** ✅ Complete

**Results:** Implemented a compact Plans-side linked-task context panel in the selected plan header, reusing existing `beadIds`.

What changed:
- Kept existing plan metadata badges, but replaced the raw bead-id badge list with a compact "Linked tasks" section.
- Added a lightweight context extractor that maps each `beadId` to the first matching markdown line (frontmatter stripped), normalizes bullets/headings, truncates to a short snippet, and annotates line number.
- Each linked task row now keeps one-click `onOpenTask(beadId)` navigation while showing contextual snippet text, making plan → task transitions understandable without detouring through search.
- Added fallback copy for linked bead IDs that are not explicitly present in the markdown body.
- Added/updated test coverage to assert the linked-task context panel renders and exposes expected snippet text while preserving existing open-task/open-path behavior.

Validation run:
- `npm run test -- src/features/workspace/tabs/PlansTab.test.tsx`
- `npm run build`

Explicit scope notes for this slice:
- No surfaced `legacy_path_only` state.
- No migration-helper expansion beyond current lazy normalization/manual repair paths.
- No broad reverse-lookup subsystem or server/API plumbing changes.
- Remaining follow-up stays with `nerve-s8k` (verification/commit/push) and umbrella `nerve-1w9` deferred items.

---

### Task 4: Verify, commit, and push

**Bead ID:** `nerve-s8k`  
**SubAgent:** `primary`  
**Prompt:** Verify the completed linkage polish work, ensure this living plan reflects what actually happened, then commit and push the durable repo changes to `master`. Record final commit hashes, final status, and any remaining deferred follow-up.

**Folders Created/Deleted/Modified:**
- `.plans/`
- relevant source/test folders based on executed work

**Files Created/Deleted/Modified:**
- `.plans/2026-03-14-nerve-linkage-migration-polish.md`
- relevant source/test files based on executed work

**Status:** ✅ Complete

**Results:** Verified the shipped polish diff and reran final confidence checks before release.

Verification performed:
- Inspected working tree diffs for `PlansTab.tsx` and `PlansTab.test.tsx` to confirm only the scoped linked-task context panel/test polish landed.
- Re-ran targeted validation:
  - `npm run test -- src/features/workspace/tabs/PlansTab.test.tsx`
  - `npm run build`
- Confirmed `origin` uses SSH (`git@github.com:GambitGamesLLC/openclaw-nerve.git`) for push.

Release outcome:
- Committed durable UI/test polish in `3e015a3` (`feat(plans): show linked task context for bead references`).
- Final plan closeout commit recorded in `24a30cd` (`docs(plan): finalize linkage migration polish execution record`).
- Pushed both commits to `origin/master`.
- Deferred leftovers remain explicitly tracked in umbrella follow-up bead `nerve-1w9`.

---

## Validated Recommendation

Priority order after validating the shipped post-repair behavior:

1. **Compact reverse lookup/navigation polish from plan pages**
   - highest-value remaining slice, but scope it narrowly to improving selected-plan → linked-task navigation/context rather than inventing a whole new reverse-lookup system
2. **Defer `legacy_path_only` surfaced state**
   - still too edge-case-heavy for the current maintained metadata/frontmatter flow
3. **Defer additional migration-helper polish**
   - lazy normalization plus the manual repair path already cover the real recovery needs for now

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Delivered a compact Plans-side reverse-navigation polish pass by upgrading selected-plan linked bead badges into a linked-task context panel. Each linked bead keeps one-click board navigation and now includes a short in-plan context snippet/line hint when available, reducing plan→task context switching without introducing new linkage states or migration systems.

**Commits:**
- `3e015a3` - feat(plans): show linked task context for bead references
- `24a30cd` - docs(plan): finalize linkage migration polish execution record

**Lessons Learned:**
- Metadata-first linkage plus explicit manual repair is now sufficient for current migration reliability; additional migration-helper expansion should stay deferred until a concrete pain point appears.
- The highest practical usability gain came from sharpening existing plan→task affordances (context + direct open) instead of adding new linkage state surface area.
- Keeping deferred scope explicit in both plan text and bead follow-up (`nerve-1w9`) prevented feature creep during closeout.

---

*Started on 2026-03-14*
