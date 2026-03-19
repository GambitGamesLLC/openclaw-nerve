---
plan_id: plan-2026-03-18-nerve-prod-build-break-fix
bead_ids:
  - nerve-h40
---
# gambit-openclaw-nerve

**Date:** 2026-03-18  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Restore a working `npm run prod` path for Nerve by fixing the current TypeScript build failure introduced by recent updates.

---

## Overview

Derrick reported that after running `update.sh` and `restore.sh`, Nerve no longer starts. The immediate blocker is a TypeScript compile error in `src/features/chat/InputBar.tsx` complaining that `UploadMode` cannot be found.

The plan is to hand the repair to a coding sub-agent with the exact failing signal, require bead lifecycle updates during execution, then verify the resulting production build locally before reporting back. If the first fix exposes additional regressions, the plan will be updated with the follow-on work and results.

---

## Tasks

### Task 1: Repair the missing `UploadMode` type and any directly related compile fallout

**Bead ID:** `nerve-h40`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-h40` at start with `bd update nerve-h40 --status in_progress --json`. Investigate the `npm run prod` failure reported by Derrick: `src/features/chat/InputBar.tsx(54,9): error TS2304: Cannot find name 'UploadMode'.` Fix the code with the smallest correct change, run the relevant build verification (`npm run build` or `npm run prod` if practical), summarize exactly what changed, and close the bead with `bd close nerve-h40 --reason "Fixed missing UploadMode type and verified the build" --json` when done. Do not commit.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`

**Files Created/Deleted/Modified:**
- `src/features/chat/InputBar.tsx`
- Any directly related type/module files required for the fix

**Status:** ✅ Complete

**Results:** A coder sub-agent fixed the compile break by adding the missing `UploadMode` type import in `src/features/chat/InputBar.tsx`. I verified the repair locally with `npm run build`, which now completes successfully. A subsequent `npm run prod` attempt gets past the TypeScript failure and build stage, but the server start still collides with port `3080` already being in use in the local environment.

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:** Restored a valid production build by repairing the missing `UploadMode` type reference in the chat input bar.

**Commits:**
- None yet.

**Lessons Learned:** The immediate startup failure Derrick saw was caused by a compile regression, but `npm run prod` can still fail after build if the local runtime port is already occupied. Build health and runtime port availability need to be checked separately.

---

*Completed on 2026-03-18*
