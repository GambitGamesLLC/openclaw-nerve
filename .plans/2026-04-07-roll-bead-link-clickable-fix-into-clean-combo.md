# Roll Bead-Link Clickable Fix into Clean Combo

**Date:** 2026-04-07  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Roll the proven `bead:` link clickable-render fix from the narrow Beads branch into the clean combo branch, verify the combo branch still builds, and prepare Derrick for another live Nerve dogfood test.

---

## Overview

Combo branch `feature/combo-workhorse-all-unmerged-2026-04-07` was confirmed missing the proven fix from `slice/bead-scheme-markdown-navigation` (`8c2c37ef911c0a1649ee2e852a9cb082c1ae2647`). I rolled it in via **cherry-pick with provenance** (`-x`) and resolved conflicts manually to preserve combo-only markdown/navigation behavior while still applying the bead-link fix.

Key conflict-resolution choices:
- Kept combo branch’s richer `MarkdownRenderer` behavior (heading anchors, inline path references, workspace-link fragment handling).
- Added the proven bead-link behavior into that version:
  - preserve `bead:` URLs via `urlTransform` + `defaultUrlTransform`
  - route explicit `bead:` links to `onOpenBeadId` before workspace-path handling
  - keep bare bead IDs (`nerve-xxxx`) treated as workspace links, not bead-scheme links
- Added `src/features/beads/links.ts` + `src/features/beads/links.test.ts` from the proven fix.

---

## Tasks

### Task 1: Merge the proven bead-link fix from the narrow branch into the clean combo branch

**Bead ID:** `nerve-ntmw`  
**SubAgent:** `coder`

**Status:** ✅ Complete

**Results:**
- Used: `git cherry-pick -x 8c2c37ef911c0a1649ee2e852a9cb082c1ae2647`
- Initial cherry-pick conflict due to divergent combo history (including deleted/relocated markdown/beads files).
- Resolved conflicts and completed cherry-pick as:
  - `d2015b8` — `fix(markdown): preserve bead: links through react-markdown transform`
- Push status:
  - `feature/combo-workhorse-all-unmerged-2026-04-07` pushed to origin at `d2015b8`.

---

### Task 2: Verify combo branch build/tests and record Derrick’s retest instructions

**Bead ID:** `nerve-3e1x`  
**SubAgent:** `primary`

**Status:** ✅ Complete

**Results:**
- Focused bead-link tests:
  - `npm run test -- src/features/beads/links.test.ts src/features/markdown/MarkdownRenderer.test.tsx`
  - Result: **PASS** (`2 files`, `37 tests`)
- Build verification:
  - `npm run build`
  - Result: **PASS** (client + server build complete; only existing non-blocking Vite chunk-size/dynamic-import warnings)

**Retest instructions for Derrick (exact):**
1. `cd /home/derrick/.openclaw/workspace`
2. `./scripts/update.sh`
3. `./scripts/restore.sh`
4. Open Nerve on branch `feature/combo-workhorse-all-unmerged-2026-04-07` at commit `d2015b8`.
5. Dogfood bead-link click behavior using an explicit markdown link like:
   - `[viewer](bead:nerve-fms2)`
6. Expected result: link renders clickable and opens the bead viewer path (no fallback to plain text / broken link behavior).

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- Proven bead-link fix rolled into the clean combo branch with cherry-pick provenance.
- Conflict-resolved integration that keeps combo markdown features intact while restoring clickable `bead:` links.
- Verified with focused tests and full build.
- Branch pushed and ready for Derrick retest.

**Commits:**
- `d2015b8` — fix(markdown): preserve bead: links through react-markdown transform (cherry-pick `-x` from `8c2c37ef...`)

---

*Completed on 2026-04-07*
