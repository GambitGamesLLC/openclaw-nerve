# gambit-openclaw-nerve — diagnose missing chatPathLinks workspace endpoint

**Date:** 2026-04-10  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Diagnose why the client is requesting `/api/workspace/chatPathLinks?agentId=main` and receiving 404, determine whether the endpoint is missing, unmounted, or incorrectly routed in the current Nerve build, and identify the correct owning branch for the fix before changing code.

---

## Overview

The live dogfood issue now has a stronger root-cause signal than browser caching: the app is surfacing a 404 for `/api/workspace/chatPathLinks?agentId=main` during startup/reload. Since the workspace-linkification feature depends on `chatPathLinks` configuration, that missing endpoint would explain why the frontend can have matching code while the live app still does not activate the behavior.

This shape mirrors the earlier `upload-config` diagnosis: the client-side contract appears present, but the expected server plumbing may be absent or no longer mounted. Before making changes, we should trace the endpoint owner in current source, compare it against the earlier feature lineage that introduced editable chat path links, and determine whether this is a current-base mismatch or a regression tied to a specific branch stack.

This plan is diagnosis-first. We should identify the exact route owner, whether it exists in source but is unmounted, whether the URL shape changed, and what branch should own the eventual fix.

---

## Tasks

### Task 1: Trace the current `chatPathLinks` request path and 404 owner

**Bead ID:** `nerve-d8ps`  
**SubAgent:** `primary`  
**Prompt:** Locate where the client requests `/api/workspace/chatPathLinks?agentId=main`, identify the server-side route/module that is supposed to serve it, and determine why the current build returns 404 (missing route file, unmounted route, wrong path shape, or other mismatch).

**Folders Created/Deleted/Modified:**
- `.plans/`
- source files only for inspection

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-chat-path-links-endpoint-diagnosis.md`

**Status:** ✅ Complete

**Results:** Traced the request from `src/App.tsx` into the mounted Nerve workspace route. The endpoint is not missing or unmounted in current `workhorse` source/build: `server/app.ts` mounts `workspaceRoutes`, and `server/routes/workspace.ts` explicitly allowlists `chatPathLinks -> CHAT_PATH_LINKS.json`. Local repro against `server-dist/app.js` returns a route-level 404 body `{ ok: false, error: "File not found" }`, not a framework 404. Immediate cause: the handler looks for `/home/derrick/.openclaw/workspace/CHAT_PATH_LINKS.json`, then falls back to gateway `agents.files.get`, but OpenClaw gateway ownership (`projects/openclaw/src/gateway/server-methods/agents.ts`) still rejects `CHAT_PATH_LINKS.json` as unsupported because it is not in `ALLOWED_FILE_NAMES`. Follow-up local file check confirms the repo does not contain a committed `CHAT_PATH_LINKS.json`, and Derrick’s active main workspace also currently lacks `/home/derrick/.openclaw/workspace/CHAT_PATH_LINKS.json`. The Nerve UI treats this file as an optional user-created workspace config (`ConfigTab` offers a “Create CHAT_PATH_LINKS.json” action with a default template), not a bootstrap/restored default file. So the live 404 is a plumbing/data-availability mismatch: the frontend and Nerve route know about `chatPathLinks`, but the gateway file service does not, and if the file is absent locally the request necessarily resolves to 404.

---

### Task 2: Compare current endpoint state to the feature lineage

**Bead ID:** `nerve-orex`  
**SubAgent:** `primary`  
**Prompt:** Compare the current `chatPathLinks` endpoint state to the earlier feature lineage that introduced editable chat path links, so we can determine whether the current 404 is an upstream/base mismatch, an unmerged branch expectation, or a regression introduced later.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-chat-path-links-endpoint-diagnosis.md`

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 3: Decide correct owning branch for the eventual fix

**Bead ID:** `nerve-p9r5`  
**SubAgent:** `primary`  
**Prompt:** Based on the route trace and lineage comparison, determine the correct owning branch for the eventual fix and record the narrowest next implementation step, but do not change code yet.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-chat-path-links-endpoint-diagnosis.md`

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
