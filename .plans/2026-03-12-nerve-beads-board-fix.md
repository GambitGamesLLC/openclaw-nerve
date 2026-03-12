# Gambit OpenClaw Nerve — Beads board fix

**Date:** 2026-03-12  
**Status:** In Progress  
**Agent:** Byte 🐈‍⬛

---

## Goal

Restore Beads board viewing in the Gambit Nerve UI by fixing the backend/runtime issue behind the current HTTP 502, verify all installed local Nerve apps are sourced from the Gambit fork, and clean up source-of-truth configuration issues around agent naming and Beads project exposure.

---

## Overview

We have a partially working Beads integration in the Nerve UI: the Tasks tab renders, Native/Beads mode switching appears, and the Beads source dropdown is present. The current blocker is that selecting the available source (`/.openclaw/`) returns `Couldn't load Beads board HTTP 502` when the board view is requested.

Based on the last investigation, the strongest current hypothesis is a service-runtime PATH mismatch in the deployed Nerve backend: the shell can find `bd`, but the systemd-managed Nerve service likely cannot. We also saw unrelated update-time issues while running `update.sh`: Dolt install hit `Text file busy`, and Godot emitted a large warning-heavy build log and appears to have been interrupted. Those should be tracked during verification, but they do not currently look like the primary cause of the Beads board 502.

This plan focuses first on confirming the 502 root cause in the deployed service, then fixing the service/env generation path if needed, redeploying/restarting, and re-testing the Beads board endpoint and UI behavior. It also includes a deployment-path audit to verify that all installed Nerve UI app builds in `/home/derrick/.openclaw/workspace/applications/` (Chip, Cookie, and Byte) are sourced from the `gambit-openclaw-nerve` fork rather than the upstream `openclaw-nerve` repo, so future updates land consistently across all local apps.

A second configuration thread also needs cleanup: when we moved to the Gambit fork, agent naming appears not to have been carried over cleanly, so the deployed UI can fall back to `Agent (main)` instead of the intended per-agent name (for me, `Byte`). We should treat that as a source-of-truth wiring problem and fix it at the right layer rather than manually patching each installed app.

A third thread is product/UX design around the Beads source dropdown itself. Right now the exposed Beads projects appear to be derived from environment configuration. Derrick wants those projects to be managed more directly from Nerve via UI and/or CLI so it is obvious how to add, remove, and change exposed Beads project roots without editing env files. That likely means introducing an explicit Nerve-managed configuration surface for Beads sources rather than deriving them implicitly from repo env.

---

## Tasks

### Task 1: Reproduce and verify the Beads 502 root cause

**Bead ID:** `nerve-yi3`  
**SubAgent:** `primary`  
**Prompt:** Investigate the Gambit Nerve Beads board failure in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`. Claim the assigned bead when you start and close it when you finish. Confirm whether `/api/beads/board` is failing because the deployed Nerve service cannot resolve `bd` on PATH, and capture the exact service/runtime mismatch plus any relevant logs or code locations.

**Folders Created/Deleted/Modified:**
- `projects/gambit-openclaw-nerve/`
- `~/.openclaw/` (read-only inspection expected unless a tracked config/script fix is needed)

**Files Created/Deleted/Modified:**
- `server/lib/beads-board.ts` (inspection)
- `server/routes/beads.ts` (inspection)
- `server/lib/config.ts` (inspection)
- `/etc/systemd/system/nerve.service` (runtime inspection)

**Status:** ✅ Complete

**Results:** Confirmed the `HTTP 502` is caused by the deployed Nerve service failing to resolve `bd` on `PATH`. The Beads adapter shells out to bare `bd`, while the running service PATH does not include `/home/derrick/.local/bin` where `bd` is installed. This is a runtime/source-of-truth wiring issue, not a frontend rendering or Beads-data issue. The next patch should update generated service/runtime PATH and harden backend command spawning.

---

### Task 2: Patch the Nerve service/runtime wiring

**Bead ID:** `nerve-ehc`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve` and any directly related OpenClaw deployment scripts, implement the minimal fix required so the deployed Nerve service can resolve `bd` (and any other expected user-installed local tools) at runtime. Claim the assigned bead when you start and close it when you finish. Prefer fixing the source-of-truth service/env generation path instead of making one-off machine-local edits. Document exactly what changed.

**Folders Created/Deleted/Modified:**
- `projects/gambit-openclaw-nerve/`

**Files Created/Deleted/Modified:**
- `server/lib/beads-board.ts`
- `server/lib/beads-board.test.ts`
- `install.sh`
- `server-dist/lib/beads-board.js`

**Status:** ✅ Complete

**Results:** Hardened the backend Beads adapter so it no longer depends on a fragile service PATH: `server/lib/beads-board.ts` now prefers an explicit `BD_BIN` override, otherwise resolves `bd` from common user-local tool locations (`~/.local/bin`, `~/.npm-global/bin`, `~/.volta/bin`, `~/.bun/bin`) before falling back to bare `bd`, and it also prepends those dirs into the child process PATH for runtime execution. Updated `install.sh` systemd generation so future Nerve service installs include the same local tool directories on PATH. Verified with `npm run test -- server/lib/beads-board.test.ts` and `npm run build:server`, which refreshed `server-dist/lib/beads-board.js`.

---

### Task 3: Verify deployed behavior after the fix

**Bead ID:** `nerve-ovq`  
**SubAgent:** `primary`  
**Prompt:** After the patch is applied, claim the assigned bead when you start and close it when you finish. Verify the deployed Nerve service can load Beads sources and return a successful `/api/beads/board` response for the configured `/.openclaw/` source. Also note whether the earlier Dolt install issue and Godot build interruption require separate follow-up work.

**Folders Created/Deleted/Modified:**
- `projects/gambit-openclaw-nerve/`
- `~/.openclaw/` (service/runtime verification)

**Files Created/Deleted/Modified:**
- `Pending verification notes`

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 4: Audit installed Nerve app builds for repo-source alignment

**Bead ID:** `nerve-t4p`  
**SubAgent:** `primary`  
**Prompt:** Inspect the installed Nerve UI app build/deploy wiring for Byte, Chip, and Cookie under `/home/derrick/.openclaw/workspace/applications/` and any related restore/update scripts. Claim the assigned bead when you start and close it when you finish. Verify all three local app builds are pulling from `gambit-openclaw-nerve` rather than the upstream `openclaw-nerve` checkout, identify any remaining drift, and fix the source-of-truth wiring if needed.

**Folders Created/Deleted/Modified:**
- `applications/`
- `scripts/`
- `projects/gambit-openclaw-nerve/`
- `projects/openclaw-nerve/` (inspection only unless a source-of-truth fix requires touching metadata)

**Files Created/Deleted/Modified:**
- `scripts/update.sh` (inspection)
- `scripts/restore.sh` (inspection)
- `applications/launch-nerve-byte.sh` (inspection)
- `applications/launch-nerve-chip.sh` (inspection)
- `applications/launch-nerve-cookie.sh` (inspection)
- `projects/gambit-openclaw-nerve/package.json` (metadata drift noted)
- `projects/gambit-openclaw-nerve/README.md` (metadata drift noted)
- `projects/gambit-openclaw-nerve/install.sh` (metadata drift noted)

**Status:** ✅ Complete

**Results:** Confirmed this host uses one local Nerve service/build plus three launcher wrappers, not three separate app builds. The deployed service and updater already point at `gambit-openclaw-nerve`, so Byte/Chip/Cookie all inherit updates from the Gambit fork on this machine. Remaining drift is repo metadata/docs/install instructions still referencing upstream `openclaw-nerve`, which is confusing but not currently breaking local deployment.

---

### Task 5: Diagnose and implement agent-name source-of-truth propagation in Gambit Nerve deployments

**Bead ID:** `nerve-ip3`  
**SubAgent:** `coder`  
**Prompt:** Investigate why the deployed Gambit Nerve UI/backend can still show `Agent (main)` instead of the correct per-agent name (for this workspace, `Byte`) even though the source-of-truth agent name exists in the root OpenClaw environment. Claim the assigned bead when you start and close it when you finish. Implement the correct source-of-truth propagation path into the Gambit Nerve runtime and avoid per-installed-app manual drift.

**Folders Created/Deleted/Modified:**
- `projects/gambit-openclaw-nerve/`
- `scripts/`
- `applications/` (verification only unless generated artifacts must be refreshed)
- `~/.openclaw/` (inspection and source-of-truth wiring as needed)

**Files Created/Deleted/Modified:**
- `scripts/restore.sh` (expected)
- `projects/gambit-openclaw-nerve/scripts/setup.ts` (expected)

**Status:** ⏳ Pending

**Results:** Diagnosis complete: `server/lib/config.ts` falls back to `Agent` when `AGENT_NAME` is missing, and the Gambit Nerve `.env` currently lacks `AGENT_NAME`. The root source of truth exists, but `restore.sh` syncs gateway settings without propagating agent display name into `projects/gambit-openclaw-nerve/.env`, so deployed runtime falls back to `Agent (main)`. A follow-up implementation bead (`nerve-ip3`) was created to patch the propagation path.

---

### Task 6: Design and, if approved, implement Nerve-managed Beads source configuration

**Bead ID:** `nerve-aow`  
**SubAgent:** `research`  
**Prompt:** Evaluate the current Gambit Nerve design for deciding which Beads project roots appear in the Tasks → Beads dropdown. Claim the assigned bead when you start and close it when you finish. Compare the current env-derived approach against a Nerve-managed UI/CLI configuration model, and recommend a source-of-truth design that makes add/remove/change operations explicit, discoverable, and safe for multi-agent local use.

**Folders Created/Deleted/Modified:**
- `projects/gambit-openclaw-nerve/`
- `docs/` or plan notes if needed

**Files Created/Deleted/Modified:**
- `server/lib/config.ts` (inspection)
- `server/lib/beads-board.ts` (inspection)
- `server/routes/beads.ts` (inspection)
- `src/features/kanban/hooks/useBeadsBoard.ts` (inspection)
- `src/features/kanban/KanbanHeader.tsx` (inspection)
- `.env.example` (inspection)
- `docs/CONFIGURATION.md` (inspection)

**Status:** ✅ Complete

**Results:** Recommended moving from env-derived Beads source registration to a Nerve-managed local configuration registry with explicit UI/CLI management, while keeping env as bootstrap/import only. This would make source registration discoverable, dynamic, and safer for multi-agent local use without losing current server-side validation guardrails.

---

## Final Results

**Status:** ⏳ Draft

**What We Built:** Pending.

**Commits:**
- Pending.

**Lessons Learned:** Pending.

---

*Completed on Pending*
