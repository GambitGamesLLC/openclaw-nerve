---
plan_id: plan-2026-03-11-byte-nerve-auth-debug
---
# Byte Nerve Auth Debug

**Date:** 2026-03-11  
**Status:** Draft  
**Agent:** Chip 🐱‍💻

---

## Goal

Diagnose and fix Byte's Nerve web app authentication failure when connecting to the OpenClaw gateway.

---

## Overview

From the prior handoff, the routing problem is already resolved: Byte now opens Nerve instead of the OpenClaw dashboard. The remaining blocker is a gateway auth/token mismatch during Nerve connection.

The debugging focus should stay narrow on auth wiring: compare the gateway token source in `~/.openclaw/.env`, the Nerve-side config in `workspace/projects/openclaw-nerve/.env`, and any Byte-specific values such as `NERVE_BYTE_AUTH`. Then verify whether `restore.sh` or related setup logic is generating or syncing the wrong value or format into the Nerve environment.

---

## Tasks

### Task 1: Investigate Byte auth/token configuration

**SubAgent:** `primary`  
**Prompt:** Inspect the relevant Byte/OpenClaw/Nerve configuration and auth flow for the current gateway token mismatch. Compare `~/.openclaw/.env`, `workspace/projects/openclaw-nerve/.env`, and any Byte-specific auth env such as `NERVE_BYTE_AUTH`. Identify the exact mismatch and propose the smallest correct fix. Do not make changes until the diagnosis is clear.

**Folders Created/Deleted/Modified:**
- `plans/openclaw-nerve/`

**Files Created/Deleted/Modified:**
- `plans/openclaw-nerve/2026-03-11-byte-nerve-auth-debug.md`
- `~/.openclaw/.env`
- `workspace/projects/openclaw-nerve/.env`
- `workspace/scripts/restore.sh`
- `workspace/scripts/update.sh`

**Status:** ⏳ Pending

**Results:** Pending

---

### Task 2: Apply targeted fix

**SubAgent:** `coder`  
**Prompt:** Based on the diagnosis, implement the minimal fix for Byte's Nerve auth mismatch. Prefer fixing the source of truth or sync logic rather than a one-off manual workaround, unless the investigation shows the mismatch is host-local state only.

**Folders Created/Deleted/Modified:**
- `workspace/scripts/`
- `workspace/projects/openclaw-nerve/`

**Files Created/Deleted/Modified:**
- `workspace/scripts/restore.sh`
- `workspace/scripts/update.sh`
- `workspace/projects/openclaw-nerve/.env`
- other auth-related config files as needed

**Status:** ⏳ Pending

**Results:** Pending

---

### Task 3: Verify connection path

**SubAgent:** `primary`  
**Prompt:** Verify the fix by checking the resulting config values and, if feasible, validating that Byte's Nerve can authenticate successfully against the gateway. Record exactly what was verified and any remaining unknowns.

**Folders Created/Deleted/Modified:**
- `plans/openclaw-nerve/`

**Files Created/Deleted/Modified:**
- `plans/openclaw-nerve/2026-03-11-byte-nerve-auth-debug.md`

**Status:** ⏳ Pending

**Results:** Pending

---

## Final Results

**Status:** ⏳ Pending

**What We Built:** Pending

**Commits:**
- Pending

**Lessons Learned:** Pending

---

*Completed on 2026-03-11*
