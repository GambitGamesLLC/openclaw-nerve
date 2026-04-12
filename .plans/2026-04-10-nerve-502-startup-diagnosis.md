# gambit-openclaw-nerve — Nerve 502 startup diagnosis after update/restore

**Date:** 2026-04-10  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Diagnose why the local Nerve app is returning HTTP 502 after `update.sh` + `restore.sh`, identify whether the cause is service state, branch/deploy drift, runtime startup failure, or reverse-proxy/bind configuration, and restore the app to a working state.

---

## Overview

After Derrick ran `update.sh` and `restore.sh`, the Nerve app started failing with HTTP 502. The update output also reported that local `workhorse` was ahead of `origin/workhorse`, so the deploy step intentionally skipped auto-pull to preserve local state. That warning may or may not be causal, but it is an important branch/deploy clue.

The likely owners are the Nerve systemd service, the local Nerve process itself, or the layer that fronts the app and returns 502 when the service is unavailable or unhealthy. We should first verify the actual service state and logs before making any branch or config changes. If the service is crash-looping or failing startup, logs should tell us whether the cause is code-level regression, missing dependency/build output, port/bind mismatch, or environment/config drift. Only after we have that evidence should we decide whether to restart, rebuild, roll back, or patch.

Because this is product/runtime work in `gambit-openclaw-nerve`, the plan belongs in that repo. Execution should happen via subagents, and the plan should capture what failed, what we verified, and the exact recovery path.

---

## Tasks

### Task 1: Inspect Nerve service/runtime failure and identify root cause

**Bead ID:** `nerve-g1a7`  
**SubAgent:** `primary`  
**Prompt:** Claim the bead, inspect the Nerve service/process/log state on this host after the reported 502, and determine the most likely root cause. Check systemd status, recent journal logs, effective working directory/exec config, current branch/repo state, and any obvious port/bind or runtime errors. Do not change anything yet unless a harmless read-only check requires it.

**Folders Created/Deleted/Modified:**
- `.plans/`
- runtime/service metadata only during inspection

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-nerve-502-startup-diagnosis.md`

**Status:** ✅ Complete

**Results:** `nerve.service` is not failing at the proxy layer; it is failing during its own startup build step. `systemctl status nerve.service` and `journalctl -u nerve.service` show a repeated restart loop where `ExecStart` runs `npm run prod`, which expands to `npm run build && node server-dist/index.js`, and the build exits with TypeScript errors from `src/features/markdown/inlineReferences.tsx` (`TS2339: Property 'index' does not exist on type 'never'` at lines 25/26/29 and `Property 'prefix' does not exist on type 'never'` at line 31). A direct `npm run build` in the repo reproduces the same failure with exit code 2. `systemctl cat nerve.service` confirms the service always rebuilds on startup, so no server process ever binds an app port; `ss -ltnp` only showed :443 listening, with no local Nerve listener while the service was stuck in `tsc -b`. Repo inspection shows local branch `workhorse` is ahead of `origin/workhorse` by one commit: `4e3c8fb fix(markdown): linkify embedded workspace path slices`, and that exact commit modifies `src/features/markdown/inlineReferences.tsx`, the file now failing compilation. Most likely root cause: the local ahead commit introduced TypeScript control-flow that does not compile under the current local TypeScript 5.9.3 build, so the 502 is a symptom of Nerve never finishing startup. The `ahead of origin` warning is therefore likely causal in the sense that it preserved the local unpulled commit that now fails to build, rather than incidental.

---

### Task 2: Apply the narrowest safe recovery

**Bead ID:** `nerve-x0vv`  
**SubAgent:** `coder`  
**Prompt:** Once the failure cause is known, apply the narrowest safe fix to restore Nerve. This may involve restarting the service, correcting branch/deploy state, reinstalling dependencies/build artifacts, or patching a regression if the just-landed work caused startup failure. Validate that the service comes up and that the app no longer returns 502.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `src/features/markdown/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-nerve-502-startup-diagnosis.md`
- `src/features/markdown/inlineReferences.tsx`

**Status:** ✅ Complete

**Results:** Fixed the compile regression first on the canonical source branch `bugfix/workspace-inline-reference-slice` by replacing the `prefixes.forEach(...)` closure in `findConfiguredPathSlice()` with a `for...of` loop so TypeScript 5.9 can preserve the `bestMatch` narrowing. That produced source-branch commit `d3d3a64 fix(markdown): narrow inline path match typing`. Validation on the source branch passed with `npm run build`, `npx vitest run src/features/markdown/MarkdownRenderer.test.tsx`, and `npx eslint src/features/markdown/inlineReferences.tsx src/features/markdown/MarkdownRenderer.tsx src/features/markdown/MarkdownRenderer.test.tsx`. The fix was then replayed cleanly onto `workhorse` as commit `2b064f0 fix(markdown): narrow inline path match typing`, after which `npm run build` and `npx vitest run src/features/markdown/MarkdownRenderer.test.tsx` also passed on `workhorse`. `nerve.service` was already back up once the build stopped failing, and local verification showed the app serving successfully on `http://127.0.0.1:3080/` with `/api/server-info` returning 200, which is strong evidence the original 502 condition is cleared. A manual `systemctl restart nerve.service` attempt timed out instead of replacing the already-running process, so the service was left in its healthy active state rather than forcing a riskier restart during recovery.

---

### Task 3: Verify runtime health and capture follow-up

**Bead ID:** `nerve-n6to`  
**SubAgent:** `primary`  
**Prompt:** After recovery, verify the Nerve app is healthy, confirm whether the `workhorse ahead of origin` warning was relevant or incidental, and document any follow-up needed so this failure mode does not recur.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-nerve-502-startup-diagnosis.md`

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

*Created on 2026-04-10*
