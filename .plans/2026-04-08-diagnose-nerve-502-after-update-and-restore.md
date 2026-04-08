# Diagnose Nerve 502 After update.sh + restore.sh

**Date:** 2026-04-08  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Diagnose and fix why Chip's Nerve app is failing to start properly after the latest `update.sh` and `restore.sh`, resulting in an HTTP 502 error instead of the Nerve UI.

---

## Overview

After Derrick updated the `openclaw-orchestration-agent` repo and ran `update.sh` plus `restore.sh`, Chip's Nerve app stopped coming up correctly and now returns an HTTP 502 (`derrick-surface-pro-8.tail613fcb.ts.net is currently unable to handle this request`). That usually means the entrypoint or proxy layer is reachable, but the actual Nerve app/backend is not healthy, not listening, crashing on boot, or misconfigured.

The right order is: verify the deployed branch/runtime state, inspect the live process/service/container/log path, identify whether the break came from Nerve code, deployment wiring, environment, or the update/restore scripts, then apply the narrowest fix and re-verify the app. If the fix belongs in the Nerve repo, it should be made there; if the issue is only runtime/deployment state, we should correct that without inventing repo churn.

---

## Tasks

### Task 1: Reproduce and trace the live 502 failure path

**Bead ID:** `nerve-09vk`  
**SubAgent:** `primary`  
**Prompt:** Investigate the live Nerve 502 failure on Chip after `update.sh` and `restore.sh`. Verify process/service state, current deployed branch, listening ports, proxy/upstream health, and recent logs. Determine whether the app failed to boot, is misrouted, or is serving from the wrong branch/runtime. Update this plan with concrete findings.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-diagnose-nerve-502-after-update-and-restore.md`

**Status:** ✅ Complete

**Results:** Traced the live failure on Chip end-to-end. `nerve.service` is installed from `/etc/systemd/system/nerve.service` with `WorkingDirectory=/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, `EnvironmentFile=/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.env`, and `ExecStart=/home/linuxbrew/.linuxbrew/bin/npm run prod`. Tailscale Serve is correctly routing `https://derrick-surface-pro-8.tail613fcb.ts.net/` to `http://127.0.0.1:3080`, and `.env` also matches `PORT=3080` plus `HOST=127.0.0.1`, so the proxy/upstream mapping is not the broken layer. The repo currently deployed by the service is `gambit-openclaw-nerve` on branch `feature/combo-workhorse-all-unmerged-2026-04-07` at commit `3baea33`, not a main/release branch. Recent `journalctl -u nerve.service` logs show the service looping on `npm run build && node server-dist/index.js`, failing during TypeScript compile before the server binds any port: `TabbedContentArea.tsx(146,147) TS2322` because optional callbacks are passed where required props are expected, and `MarkdownRenderer.tsx(19,20) TS2300 Duplicate identifier 'onOpenBeadId'`. `systemctl status nerve.service` showed restart counter ~1317, and `curl -I https://derrick-surface-pro-8.tail613fcb.ts.net/` returned HTTP 502 while `curl` to `127.0.0.1:3000/`, `:4173/`, and `:5173/` failed and `ss -ltnp` showed no listener on `:3080`. Root-cause class: **app failed to boot** with a strong secondary indicator of **wrong branch/runtime deployed** because the systemd unit is running a feature branch that currently does not compile. Narrowest likely fix path: either redeploy the last known-good branch/commit for Chip’s production Nerve service, or minimally fix these specific TS prop/interface regressions in `gambit-openclaw-nerve` so `npm run build` succeeds and `server-dist/index.js` can finally bind `127.0.0.1:3080`. Confidence: high.

---

### Task 2: Apply the narrowest correct fix

**Bead ID:** `nerve-7gx1`  
**SubAgent:** `coder`  
**Prompt:** Based on the diagnosis, apply the narrowest correct fix so Nerve starts cleanly again on Chip. If it is runtime-only, correct the runtime state. If it is code/config, fix the owning repo with minimal scope. Verify the fix locally before declaring success.

**Folders Created/Deleted/Modified:**
- `.plans/`
- owning repo/runtime files as needed

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-diagnose-nerve-502-after-update-and-restore.md`
- `src/features/beads/BeadViewerTab.tsx`
- `src/features/markdown/MarkdownRenderer.tsx`

**Status:** ✅ Complete

**Results:** Applied the narrowest code fix on the deployed `feature/combo-workhorse-all-unmerged-2026-04-07` branch instead of rolling back runtime state. In `src/features/markdown/MarkdownRenderer.tsx`, removed the duplicated `onOpenBeadId` prop declaration that was causing `TS2300`. In `src/features/beads/BeadViewerTab.tsx`, aligned the viewer tab prop contract with the actual optional usage from `TabbedContentArea` by making `onOpenBeadId` and `onOpenWorkspacePath` optional and guarding the related buttons/click handlers, which resolved the `TS2322` startup/build failure without changing unrelated behavior. Verification: `npm run build` now completes successfully (client + server build), `systemctl is-active nerve.service` reports `active`, `systemctl status nerve.service` shows `node server-dist/index.js` running and logging `[openclaw-ui] http://127.0.0.1:3080`, and `curl -I http://127.0.0.1:3080/` now returns `HTTP/1.1 200 OK` instead of failing before bind. Commit/push details are recorded after the code is committed.

---

### Task 3: Verify recovery and document the final state

**Bead ID:** `nerve-xoio`  
**SubAgent:** `primary`  
**Prompt:** Verify that Chip's Nerve app is healthy again, that the expected URL loads without 502, and document the exact cause, fix, and any follow-up needed. Update the plan with final results and commits if any.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-diagnose-nerve-502-after-update-and-restore.md`

**Status:** ✅ Complete

**Results:** Final recovery state verified on the deployed branch `feature/combo-workhorse-all-unmerged-2026-04-07` at commit `77a796256ce88f362ee2ba2934571956832ed7e6` (`Fix Nerve startup TypeScript regressions`). `systemctl is-active nerve.service` is `active`, recent `journalctl -u nerve.service` output shows a clean startup through `npm run prod`, and the app is advertising `[openclaw-ui] http://127.0.0.1:3080` with successful `HEAD / 200` requests instead of crash-looping before bind. End-to-end verification now passes at both layers: `curl -I http://127.0.0.1:3080/` returns `HTTP/1.1 200 OK`, and the public Tailscale-served URL `https://derrick-surface-pro-8.tail613fcb.ts.net/` returns `HTTP/2 200`, confirming the earlier 502 is cleared.

Exact root cause for future sessions: the outage was not a Tailscale Serve or systemd wiring problem. `nerve.service` was launching the deployed feature branch, but `npm run prod` runs a TypeScript build before server start, and that build was failing on two source regressions introduced in the app code: (1) `src/features/markdown/MarkdownRenderer.tsx` declared `onOpenBeadId` twice, causing `TS2300 Duplicate identifier 'onOpenBeadId'`; and (2) `src/features/beads/BeadViewerTab.tsx` required callbacks that `TabbedContentArea` passed as optional, causing `TS2322` prop-type incompatibility. Because the build failed, `server-dist/index.js` never bound `127.0.0.1:3080`, systemd kept restarting the service, and the reverse proxy surfaced the failure as HTTP 502.

Exact fix for future sessions: commit `77a796256ce88f362ee2ba2934571956832ed7e6` removed the duplicate `onOpenBeadId` prop declaration in `MarkdownRenderer.tsx` and changed `BeadViewerTab` to accept the navigation callbacks as optional, guarding the related UI actions so runtime behavior still matches available capabilities. That restored `npm run build`, allowed `npm run prod` to complete its startup path, and brought the Nerve UI back behind the existing proxy without any infrastructure changes.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Restored Chip's deployed Nerve UI from a 502 outage to a healthy end-to-end service on the existing feature branch by fixing the startup-blocking TypeScript regressions, verifying local and public HTTP 200 responses, and documenting the exact failure chain plus recovery point for future incidents.

**Commits:**
- `77a7962` - Fix Nerve startup TypeScript regressions
- `docs(plan): record Nerve 502 recovery verification and root cause`

**Lessons Learned:** Because `npm run prod` performs a TypeScript build before launching the server, compile-time UI regressions can present as an infrastructure-looking 502 at the proxy layer. Future outage checks should verify `journalctl -u nerve.service`, confirm whether `127.0.0.1:3080` ever binds, and treat branch drift on long-lived feature deployments as a production risk even when systemd and proxy config are otherwise correct.

---

*Drafted on 2026-04-08*
