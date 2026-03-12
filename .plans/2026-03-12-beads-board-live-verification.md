# Gambit OpenClaw Nerve — Beads board live verification

**Date:** 2026-03-12  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Verify that the Beads board integration in `gambit-openclaw-nerve` works end-to-end on this machine after Byte’s latest fix, and fix any remaining deployment/runtime issue if the board still fails.

---

## Overview

Byte pushed the Beads board implementation plus a fix intended to resolve the deployed HTTP 502 caused by the Nerve service not being able to resolve `bd` at runtime. Derrick could not verify that fix from Byte’s terminal because he was unable to connect and run the local deployment flow.

This execution plan focuses on the real machine in front of us: update the local `gambit-openclaw-nerve` checkout to the latest `master`, run the normal local deployment/update path, verify the Beads API and UI behavior against the configured `~/.openclaw` source, and capture the exact outcome. If the board still fails, follow the failing layer immediately (service unit, PATH/runtime env, source registry, backend route, or frontend state) and apply the minimal durable source-of-truth fix.

---

## Tasks

### Task 1: Sync repo and run local deployment/update for Beads board verification

**Bead ID:** `nerve-hfm`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim the assigned bead at start and close it on completion. Fast-forward the local repo to the latest `origin/master`, confirm the new Beads-board plan/code is present, run the appropriate local deployment/update flow on this machine so the live Nerve service uses the latest Gambit fork code, and record the exact repo state plus deployment result. Prefer the normal local source-of-truth path (`update.sh` / service wiring) rather than ad hoc file copying.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `scripts/` (inspection/run expected)
- `projects/gambit-openclaw-nerve/`
- `~/.openclaw/` (deployment/runtime verification)

**Files Created/Deleted/Modified:**
- `.plans/2026-03-12-beads-board-live-verification.md`
- deployment/runtime artifacts only as produced by the normal update flow

**Status:** ✅ Complete

**Results:** Verified local checkout was one commit behind `origin/master` (`9c84005` vs `5d928f9`). Confirmed Byte’s Beads board files were present (`server/routes/beads.ts`, `server/lib/beads-board.ts`, `src/features/kanban/BeadsBoard.tsx`, related tests) along with the active plans in `.plans/`. Ran the repo’s installer in branch mode against this checkout: `bash ./install.sh --dir /home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve --branch master --skip-setup`. That fast-forwarded the repo to `5d928f9`, ran dependency install, client build, server build, and speech-model check successfully. The installer then hit a `sudo` password prompt while trying to update an already-existing systemd unit, so I finished the live rollout by restarting the existing `nerve.service` directly with `systemctl restart nerve.service` (the installed unit already points at this repo and runs `npm run prod`). Runtime result: brief expected downtime during rebuild/restart, then `GET /health` recovered successfully with fresh uptime and gateway OK.

---

### Task 2: Verify Beads board API + UI against the configured source

**Bead ID:** `nerve-c0j`  
**SubAgent:** `primary`  
**Prompt:** After deployment, claim the assigned bead at start and close it on completion. Verify `GET /api/beads/sources` and `GET /api/beads/board` succeed for the configured `openclaw` source, then verify in the live Nerve UI that Tasks → Beads mode loads and the source dropdown can successfully render board data for `~/.openclaw`. Capture any exact errors if it fails.

**Folders Created/Deleted/Modified:**
- `projects/gambit-openclaw-nerve/`
- `~/.openclaw/` (runtime verification)

**Files Created/Deleted/Modified:**
- `.plans/2026-03-12-beads-board-live-verification.md`

**Status:** ✅ Complete

**Results:** API verification passed. Exact checks: `curl -sS -D /tmp/beads-sources.headers http://127.0.0.1:3080/api/beads/sources -o /tmp/beads-sources.json` returned HTTP 200 with `{"defaultSourceId":"openclaw","sources":[{"id":"openclaw","label":"~/.openclaw","kind":"openclaw","isDefault":true}]}`. `curl -sS -D /tmp/beads-board.headers 'http://127.0.0.1:3080/api/beads/board?sourceId=openclaw' -o /tmp/beads-board.json` returned HTTP 200 with the expected Beads board payload for the `openclaw` source. Current live data is an empty board (`totalCount: 0`) rather than an error, which is valid for this source state. UI verification also passed in the live Nerve app at `http://127.0.0.1:3080`: Tasks view opened, switching to Beads mode succeeded, the source dropdown rendered `~/.openclaw`, and the page rendered the Beads board state with `To Do 0`, `In Progress 0`, `Done 0`, plus the empty-state message `No Beads issues in this source`. No UI error banner or API failure was observed.

---

### Task 3: If needed, patch the remaining blocker and re-verify

**Bead ID:** `nerve-d33`  
**SubAgent:** `coder`  
**Prompt:** Only if verification still fails, claim the assigned bead at start and close it on completion. Diagnose the smallest remaining blocker preventing Beads-board loading on this machine and implement the minimal durable fix in the correct source-of-truth layer. Re-run the failed verification step and document the exact fix and outcome.

**Folders Created/Deleted/Modified:**
- `projects/gambit-openclaw-nerve/`
- `~/.openclaw/` (only if the durable source-of-truth wiring truly lives there)

**Files Created/Deleted/Modified:**
- whichever repo/runtime source files are actually required by the discovered fix
- `.plans/2026-03-12-beads-board-live-verification.md`

**Status:** ⏭️ Not Needed

**Results:** Not needed. Deployment and end-to-end verification passed after Task 1 + Task 2, so no additional code/runtime fix or commit was required.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Verified the live local Nerve deployment is now serving the latest Gambit `master` Beads-board code and that the Beads API + Tasks → Beads UI work against the configured `openclaw` source on this machine. The live source currently returns an empty board, but it loads successfully end-to-end with the correct source dropdown and empty-state rendering.

**Commits:**
- No new commit required. Live verification passed without an additional code fix.

**Lessons Learned:** The repo’s installer branch flow is the right source-of-truth path for syncing/building this checkout, but on this machine it still falls into a `sudo` prompt when refreshing an already-installed systemd unit. Because the installed unit already targets this repo and `systemctl restart nerve.service` works directly for this user, the practical live rollout path here is: installer/build first, then restart the existing service and verify runtime behavior.

---

*Completed on 2026-03-12*
