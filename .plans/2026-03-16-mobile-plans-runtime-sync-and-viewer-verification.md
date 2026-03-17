---
plan_id: plan-2026-03-16-mobile-plans-runtime-sync-and-viewer-verification
bead_ids:
  - nerve-02u
  - Pending
---
# Nerve mobile Plans runtime sync and viewer verification

**Date:** 2026-03-16  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Determine why the mobile Plans reader still looks unchanged on Derrick’s phone, then fix whichever layer is actually stale: source, build, runtime config, restore/update propagation, or live deployment.

---

## Overview

Yesterday’s repo-local work says the mobile Plans reader parity fix was implemented and committed in `gambit-openclaw-nerve`, including hiding the remaining Plans header/search chrome on compact viewports and leaving a single `Back to plans` affordance. Derrick’s report this morning is that the mobile UI still looks the same, which means we should treat this as a verification/deployment problem until proven otherwise, not assume the code is either missing or correct.

The likely failure modes are straightforward: the fix is in git but not in the running Nerve instance; the fix depends on code/config only picked up by `restore.sh` or `update.sh`; the mobile web app is serving an older build or cached assets; or the implementation landed but does not actually match the real phone behavior and needs another UI adjustment. This plan keeps the work narrow: first verify the code + deployment path on Chip, then only patch the UI/runtime once we know where the mismatch lives.

This work belongs in `gambit-openclaw-nerve` because the user-visible symptom is in the Nerve Plans UI, but it may also touch `~/.openclaw/workspace/scripts/restore.sh` or the local Nerve runtime/deployment flow if the issue is stale rollout rather than incorrect React behavior.

---

## Tasks

### Task 1: Verify whether the mobile Plans overlay-reader fix is actually present in source and live runtime

**Bead ID:** `nerve-02u`  
**SubAgent:** `research`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-02u` at start with `bd update nerve-02u --status in_progress --json` and close it on completion only if the investigation is fully complete. Verify whether the mobile Plans overlay-reader parity fix is present in the current repo state and whether the local running Nerve instance is actually serving that code. Check the relevant plan history, git state, recent commits, any runtime/env wiring for top-level Plans, and the normal local deployment/update path Derrick uses. Determine which of these is true: (a) code is present but runtime is stale, (b) code/config requires restore/update to roll forward, (c) browser/mobile caching is likely masking the change, or (d) implementation is incomplete and needs another UI fix. Update this plan with exact findings, files touched for evidence, and recommended next action.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/`
- `/home/derrick/.openclaw/workspace/scripts/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-16-mobile-plans-runtime-sync-and-viewer-verification.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/dist/assets/PlansTab-2plAGcRt.js`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.env`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/server/lib/config.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/server-dist/lib/config.js`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-mobile-plans-reader-behavior.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-mobile-plans-overlay-reader-parity.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-mobile-plans-layout-and-search-surfaces.md`

**Status:** ✅ Complete

**Results:** Investigated the repo state, plan history, source, built artifacts, env wiring, and the currently running Nerve process. The fix from `fix(plans): hide mobile reader chrome` (`14d04bf`, 2026-03-15 23:20:20 -0400) is present in source and in the built assets that the live server is serving. Concrete evidence:
- `src/features/workspace/tabs/PlansTab.tsx` contains the compact/mobile reader gating plus the sticky `Back to plans` affordance, including the hidden outer Plans header/search chrome while a compact reader is open.
- `dist/assets/PlansTab-2plAGcRt.js` contains the same `Back to plans` string and compact-reader logic, so the built frontend already includes the parity fix.
- `.env` has `NERVE_TOP_LEVEL_PLANS=true`, and `server/lib/config.ts` / `server-dist/lib/config.js` both wire that flag, so the top-level Plans surface is enabled in both source and runtime.
- The live process is `node server-dist/index.js` started at `Sun Mar 15 23:24:40 2026`, which is after commit `14d04bf`, so the runtime is not older than the fix.
- `curl -I http://127.0.0.1:3080/assets/index-WZEQIEiJ.js` shows `cache-control: public, max-age=31536000, immutable`, which is correct for hashed assets but also means a phone can stay on an older hashed bundle until the document shell is refreshed/revalidated.
- No app-owned service worker or PWA registration was found outside dependency code, so the most likely stale layer is normal browser/home-screen caching of an older hashed bundle or an older tab/webview session, not repo code or a missing restore/update rollout.

Diagnosis: option **(c) browser/mobile caching is likely masking the change**. I did not find evidence for option (a) stale runtime, option (b) `restore.sh`/`update.sh` being required to roll this specific fix forward, or option (d) an incomplete implementation in the current codebase.

---

### Task 2: Apply the smallest durable fix for the mismatch and validate on mobile

**Bead ID:** `Pending`  
**SubAgent:** `coder`  
**Prompt:** After Task 1 identifies the real mismatch, claim the follow-up bead, apply the smallest durable fix in the correct layer (UI code, rollout wiring, restore/update propagation, or deployment/runtime refresh), validate with focused tests/build checks plus a concrete mobile-facing verification path, and update this plan with what actually changed.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-16-mobile-plans-runtime-sync-and-viewer-verification.md`

**Status:** ✅ Not Needed

**Results:** No code, test, build, or deployment artifact changes were needed. The investigation showed the local repo, built dist, env wiring, and live `server-dist` process already reflect the mobile overlay-reader parity fix. Recommended next action is client-side verification on the phone by forcing the mobile browser/home-screen instance to fetch a fresh document shell and current hashed assets (for example: close the old tab/PWA instance, reopen the app URL directly, and if it is a saved home-screen app remove/re-add or clear that site’s stored data if the stale UI persists). Because the runtime already contains the fix, asking Derrick to run `restore.sh` or `update.sh` would not be evidence-based here.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Completed the runtime/source verification pass and narrowed Derrick’s phone symptom to likely client-side caching, not missing repo code. The mobile Plans overlay-reader parity fix is already present in `PlansTab`, in the built `dist` assets, in the enabled `NERVE_TOP_LEVEL_PLANS` runtime config, and in the currently running `server-dist` process started after the fix commit landed. The smallest evidence-based next step is to refresh/clear the phone’s cached site state rather than changing source or asking for `restore.sh` / `update.sh`.

**Commits:**
- None. No durable code/config change was required.

**Lessons Learned:** When a phone still shows old UI after a same-day frontend fix, verify the full chain in order: source commit timestamp, built artifact contents, env flag wiring, live process start time, and asset cache headers. In this case every host-side layer had already rolled forward; the remaining stale surface is most plausibly the mobile client holding on to an older hashed bundle or old app shell.

---

*Created on 2026-03-16*
