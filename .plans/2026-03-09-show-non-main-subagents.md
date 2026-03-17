---
plan_id: plan-2026-03-09-show-non-main-subagents
---
# openclaw-nerve — Show non-`main` subagents in UI

**Date:** 2026-03-09  
**Status:** Draft  
**Agent:** Cookie 🍪🐱‍💻 (Orchestrator)

---

## Goal

Patch **Nerve** (`projects/openclaw-nerve`, Gambit fork) so the UI can display spawned subagents that are **not** under the `main` agent namespace (e.g. `agent:coder:subagent:…`, `agent:research:subagent:…`).

Secondary goal: confirm whether the missing visibility is caused by:
- a Nerve UI bug/assumption (filters only `agent:main:*`),
- an OpenClaw API limitation (backend doesn’t expose cross-agent subagent runs), or
- an `openclaw.json` / gateway config setting that hides them.

---

## Overview

Today we observed a mismatch:
- OpenClaw (tooling) reports an active run: `agent:coder:subagent:…`
- Nerve session list (what Derrick sees) shows **no remaining runs**

That strongly suggests Nerve is filtering by agent kind (main-only) or reading from an endpoint that returns only a subset.

We’ll first instrument Nerve to confirm exactly what data it receives (raw API response), then adjust the query/filters + UI to surface these runs clearly.

---

## Tasks

### Task 1: Reproduce + capture API payload

**SubAgent:** `primary`  
**Prompt:**
- In `projects/openclaw-nerve`, run Nerve in dev mode.
- Reproduce: spawn a `coder` subagent run and confirm Nerve does not show it.
- Capture the exact network calls (endpoint + params) used for “Sessions/Subagents list” and save a sample JSON payload (redact secrets).

**Files Created/Modified:**
- `docs/debug/subagent-visibility-sample.json` (or similar)

**Status:** ⏳ Pending

---

### Task 2: Locate the filter/assumption in Nerve code

**SubAgent:** `coder`  
**Prompt:**
- Find where Nerve fetches sessions/subagents (likely a `sessions_list`-like endpoint).
- Search for filtering patterns:
  - `agent:main` hard-codes
  - `kinds: ["main"]` / `agentId === "main"`
  - `subagent:` assumptions that only exist under `main`
- Determine whether the backend response already includes non-main runs but UI drops them, or whether request params exclude them.

**Files Modified:**
- (to be discovered)

**Status:** ⏳ Pending

---

### Task 3: Implement UI + API changes to show all subagents

**SubAgent:** `coder`  
**Prompt:**
- Update the request so it returns subagents across all agents (main/coder/research/etc).
- Update UI list rendering to include:
  - Agent type (main/coder/research/…)
  - Run label
  - Status (running/done/failed)
  - Runtime
  - Optional: filter toggles (All vs Main-only)
- Ensure the UI still works when a user has *zero* subagents.

**Status:** ⏳ Pending

---

### Task 4: Check for config gating (openclaw.json / gateway)

**SubAgent:** `primary`  
**Prompt:**
- Inspect OpenClaw docs/config for any setting that restricts session listing visibility by agent.
- If found, document the setting and how Nerve should behave (warn user, show only allowed, etc.).

**Status:** ⏳ Pending

---

### Task 5: Verification + ship

**SubAgent:** `primary`  
**Prompt:**
- Spawn at least 3 subagents (coder + research + primary) and verify Nerve shows all 3 while running.
- Verify completed runs appear under “recent” and can be opened.
- Commit + push to `main` in `openclaw-nerve`.

**Status:** ⏳ Pending

---

## Final Results

**Status:** ⏳ Pending

**What We Built:**
- (TBD)

**Commits:**
- (TBD)

*Created on 2026-03-09*
