# gambit-openclaw-nerve — link dogfood not live after update/restore

**Date:** 2026-04-10  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Diagnose why the latest workspace-linkification changes are not appearing in the live Chip Nerve app after `update.sh` + `restore.sh`, determine whether the issue is deploy state, build/runtime state, caching, or a branch mismatch, and restore the app so the new link behavior is actually visible for dogfood.

---

## Overview

Derrick reported that after running `update.sh` and `restore.sh` and reopening Nerve, the expected new clickable-link behavior still does not appear in the Chip Nerve app. Since the repo-side work was validated locally before rollout, the most likely causes are not the matcher tests themselves but a gap between repo state and what the running app is serving.

The first diagnostic priority is to verify the actual deployed state: which branch/commit the local repo is on, whether `update.sh` preserved local commits or skipped pulling, whether the service rebuilt successfully from the latest `workhorse` tip, and whether the browser is showing stale cached assets. Only after that should we decide whether the problem is runtime/deploy wiring versus another product bug.

This plan is diagnosis-first. We should not assume the matcher logic is wrong until we prove the running app is actually serving the expected commit.

---

## Tasks

### Task 1: Verify deployed branch/commit/runtime state

**Bead ID:** `nerve-lus9`  
**SubAgent:** `primary`  
**Prompt:** Inspect the live Nerve deployment state after the latest `update.sh` + `restore.sh`. Confirm the local repo branch/HEAD, whether `workhorse` still contains the intended commits, service status, recent startup logs, and whether the running app/build appears to match the expected deployed commit.

**Folders Created/Deleted/Modified:**
- `.plans/`
- runtime/service metadata only during inspection

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-link-dogfood-not-live-diagnosis.md`

**Status:** ✅ Complete

**Results:** Verified the live service is running directly from this repo and rebuilt after the latest restore/update cycle. Evidence: the repo is on branch `workhorse` at `5435706853b017d67481d6b1698dc0bfe66b5d27`; `git merge-base --is-ancestor 5435706 HEAD` returned success; `git log` shows `5435706 (HEAD -> workhorse)` as the current tip; `systemctl status nerve.service` / `systemctl show nerve.service` report `WorkingDirectory=/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve` and `ExecStart=/home/linuxbrew/.linuxbrew/bin/npm run prod`; service startup began at `2026-04-10 21:05:32 EDT`; `dist/` assets were regenerated at `21:05:44` and `server-dist/` files at `21:05:47`; and the service is actively serving `node server-dist/index.js` on `127.0.0.1:3080`. The built frontend bundle also contains the workspace-link strings from the recent inline-link work. Conclusion: the live Nerve app appears to be serving a freshly rebuilt local `workhorse` checkout that includes commit `5435706`, so the missing clickable-link behavior is unlikely to be explained by an old branch, stale server build, or the service pointing at the wrong repo.

---

### Task 2: Identify whether this is deploy/runtime drift or a remaining product bug

**Bead ID:** `nerve-5cgt`  
**SubAgent:** `primary`  
**Prompt:** Based on the verified runtime state, determine whether the issue is: (a) the wrong commit/branch/build being served, (b) browser/cache staleness, or (c) a remaining product bug despite the tested changes. Record the most likely cause and the narrowest next action.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-link-dogfood-not-live-diagnosis.md`

**Status:** ⏳ Pending

**Results:** Pending.

---

## Final Results

**Status:** ⏳ Pending diagnosis

**What We Built:** Pending.

**Commits:**
- None yet — diagnosis only

**Lessons Learned:** Pending.

---

*Created on 2026-04-10*
