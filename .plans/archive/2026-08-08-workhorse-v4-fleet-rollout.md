# Workhorse v4 Fleet Rollout

**Date:** 2026-08-08  
**Status:** Complete  
**Last Updated:** 2026-08-08 08:47 EDT  
**Blocked Reason:** None  
**Agent:** `byte`

---

## Goal

Roll the latest local `workhorse-v4` Nerve sync, including the Cookie duplicate assistant-final fix, to Byte, Chip, and Pico via SSH/Tailscale using `update.sh --skip-gateway-restart`.

---

## Overview

Derrick confirmed that the Cookie-only duplicate-final fix should now move to the rest of the agent fleet. The deployment should keep the OpenClaw gateway running and only restart Nerve through the repository updater path.

The rollout target is the latest reachable `workhorse-v4` state that contains local fix commit `2ba668a` (`Fix assistant final history aliasing`) and the Cookie-tested head `1a8ecfbe6675`. Verification must prove each target is on `workhorse-v4`, contains `2ba668a`, and reports a healthy Nerve service after `update.sh --skip-gateway-restart`.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Prior upstreaming and Cookie deployment plan | `.plans/2026-08-07-workhorse-v4-upstreaming.md` |
| `REF-02` | Nerve project README and updater context | `README.md` |

---

## Tasks

### Task 1: Roll out latest workhorse-v4 to Byte, Chip, and Pico

**Bead ID:** `oc-bgn`  
**SubAgent:** `primary` (for `coder` workflow role)  
**Role:** `coder`  
**References:** `REF-01`, `REF-02`  
**Prompt:** Spawn a `primary` SubAgent in the `coder` role. It must read `README.md` first, claim bead `oc-bgn` on start, and roll out the latest `workhorse-v4` to Byte, Chip, and Pico via SSH/Tailscale using `update.sh --skip-gateway-restart`. It must verify after each target that the checked-out branch is `workhorse-v4`, the deployed head contains commit `2ba668a`, Nerve is running/healthy, and the OpenClaw gateway was not restarted intentionally. It must close the bead only after all targets pass, or leave it active with exact failure details.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-08-08-workhorse-v4-fleet-rollout.md`
- `.beads/`

**Status:** ✅ Complete

**Results:** Rolled out using `NERVE_DEPLOY_BRANCH=workhorse-v4 /home/derrick/.openclaw/workspace/scripts/update.sh --skip-gateway-restart` over non-interactive SSH for `byte`, `chip`, and `pico`. Each updater run completed with `Update Summary: SUCCESS` and recorded `openclaw-gateway-restart-skipped`; only the Nerve service was restarted intentionally.

### Task 2: Verify rollout and document final state

**Bead ID:** `oc-bgn`  
**SubAgent:** `primary` (for `qa` / `auditor` workflow roles)  
**Role:** `qa` / `auditor`  
**References:** `REF-01`, `REF-02`  
**Prompt:** After rollout, verify the deployed fleet state independently against the plan and bead. Confirm Byte, Chip, and Pico are on `workhorse-v4`, contain commit `2ba668a`, and have healthy Nerve after the skip-gateway updater path. Update the plan with actual results and ensure Beads status reflects the rollout outcome.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-08-08-workhorse-v4-fleet-rollout.md`
- `.beads/`

**Status:** ✅ Complete

**Results:** Verification passed on all rollout targets:

| Target | Hostname | Branch | Deployed HEAD | Contains `2ba668a` | Nerve health |
| --- | --- | --- | --- | --- | --- |
| `byte` | `derrick-samsung-book` | `workhorse-v4` | `2ae9e8288c06ff888a372843c2eaadd6dc46728e` | yes | `{"status":"ok","gateway":"ok"}` |
| `chip` | `derrick-Surface-Pro-8` | `workhorse-v4` | `2ae9e8288c06ff888a372843c2eaadd6dc46728e` | yes | `{"status":"ok","gateway":"ok"}` |
| `pico` | `derrick-Legion-Go-8APU1` | `workhorse-v4` | `2ae9e8288c06ff888a372843c2eaadd6dc46728e` | yes | `{"status":"ok","gateway":"ok"}` |

Additional verification: system `nerve.service` was active on all three hosts and `127.0.0.1:3080` was listening. Parent-side verification checked `GET /health` on all three targets and got `{"status":"ok","gateway":"ok"}`. Gateway health returned `{"ok":true,"status":"live"}` directly from `127.0.0.1:18789`. Chip reported a non-fatal updater warning that the active shell Node was `v25.4.0` while the pin is `22.22.3`; the updater still completed successfully and Nerve health passed.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Rolled out the latest reachable `workhorse-v4` Nerve sync containing duplicate assistant-final fix commit `2ba668a` to Byte, Chip, and Pico.

**Reference Check:** Passed. All three targets are on branch `workhorse-v4`, deployed at `2ae9e8288c06ff888a372843c2eaadd6dc46728e`, and contain `2ba668a`.

**Commits:** Deployed HEAD `2ae9e8288c06ff888a372843c2eaadd6dc46728e`; required fix `2ba668a` is an ancestor.

**Lessons Learned:** The canonical updater must be invoked with `NERVE_DEPLOY_BRANCH=workhorse-v4` for this rollout, because its default branch resolution follows the remote default when the deploy branch is not supplied. Nerve health is exposed at `/health`; `/api/health` is not the right verification endpoint on this branch.

---

*Completed on 2026-08-08 08:44 EDT*
