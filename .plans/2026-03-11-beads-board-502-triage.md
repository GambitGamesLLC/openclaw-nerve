---
plan_id: plan-2026-03-11-beads-board-502-triage
bead_ids:
  - nerve-q0f
---
# Beads Board 502 Triage

**Date:** 2026-03-11  
**Status:** In Progress  
**Agent:** Byte 🐈‍⬛

---

## Goal

Diagnose why the deployed Nerve UI returns HTTP 502 for the Beads board when selecting the `~/.openclaw` source.

---

## Overview

The Beads UI is visible and the source selector appears, which means the frontend deployment largely worked. The failure is specifically on loading board data, so the likely causes are in the backend adapter, repo/source resolution, runtime environment, or `bd` availability from the Nerve service context.

This plan focuses on triaging the deployed system first: service logs, direct API calls, and `bd` behavior under the service/runtime environment. Once the cause is clear, we can decide whether the fix belongs in `gambit-openclaw-nerve` itself or in local deployment/runtime wiring.

---

## Tasks

### Task 1: Inspect deployed Nerve logs and Beads API behavior

**Bead ID:** `nerve-q0f`  
**SubAgent:** `primary`
**Prompt:** Inspect the deployed Nerve service logs and the `/api/beads/*` behavior to determine why the Beads board returns HTTP 502 for the `~/.openclaw` source.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-11-beads-board-502-triage.md`

**Status:** ✅ Complete

**Results:** Confirmed the frontend is fine and the backend Beads adapter is the failing layer. `GET /api/beads/sources` returns 200, while `GET /api/beads/board` returns 502 with `beads_adapter_error`. The deployed `nerve.service` unit sets `PATH=/usr/bin:/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`, but `bd` is installed at `/home/derrick/.local/bin/bd`, so the Nerve process cannot execute `bd` even though it works in the interactive shell. Root cause: service PATH does not include `~/.local/bin` (and likely should also include `~/.npm-global/bin`).

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Triaged the deployed Beads-board 502 and isolated it to a runtime PATH mismatch in `nerve.service`, not a frontend problem or a Beads source-resolution problem.

**Commits:**
- None yet

**Lessons Learned:** For server-side tool adapters, success in an interactive shell is not enough; the systemd service PATH must include the tool install locations used by the runtime (`~/.local/bin`, etc.).

---

*Completed on 2026-03-11*
