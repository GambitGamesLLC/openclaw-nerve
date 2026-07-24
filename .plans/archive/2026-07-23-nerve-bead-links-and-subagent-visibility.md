# Nerve Bead Links and Subagent Visibility Validation

**Date:** 2026-07-23
**Status:** Complete
**Last Updated:** 2026-07-23 20:25 EDT
**Blocked Reason:** None
**Agent:** `byte`

---

## Goal

Document the current bead-link failure in `workhorse-v2` and run a one-at-a-time Nerve subagent visibility matrix so we can characterize what session shapes the UI reliably surfaces.

---

## Overview

Derrick tested `workhorse-v2` from mobile. Standard workspace/file-path links work correctly, but bead-related links do not. Earlier upstream history review shows that upstream Nerve intentionally supports explicit bead links like `bead:...` and `bead://...#...`, while raw bead IDs were never part of the upstreamed plain-text auto-link behavior. However, Derrick's mobile results show something stronger: even explicit bead-link forms fail in the current build, while generic workspace path links continue to work. That makes the immediate issue a likely bead-link integration regression or missing runtime wiring in `workhorse-v2`, not merely the absence of raw bead-ID smart-linking.

The second seam is subagent visibility. Derrick can currently see the two baseline research subagents created through the standard orchestrator path (`sessions_spawn`, `runtime: subagent`, `mode: run`, `cleanup: keep`). We want to turn that into a controlled one-at-a-time matrix so we can identify which spawn/session shapes remain visible in Nerve and where visibility falls off.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Our Nerve fork | `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve` |
| `REF-02` | Existing Byte research plan with upstream parity findings | `/home/derrick/.openclaw/workspace/projects/openclaw-byte/.plans/2026-07-20-nerve-openclaw-upstream-research-and-plan-triage.md` |
| `REF-03` | Existing Byte regression-check plan with bead-link test setup | `/home/derrick/.openclaw/workspace/projects/openclaw-byte/.plans/2026-07-23-nerve-bead-link-regression-check.md` |
| `REF-04` | Derrick's current-session mobile link results | `current session` |
| `REF-05` | Relevant upstreamed bead-link implementation files | `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/beads/links.ts` |
| `REF-06` | Relevant markdown/path linkification files | `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/markdown/MarkdownRenderer.tsx` |

---

## Tasks

### Task 1: Capture bead-link bug summary in the Nerve fork plan

**Bead ID:** `oc-igk`
**SubAgent:** `primary` (for `research` workflow role)
**Role:** `research`
**References:** `REF-01`, `REF-02`, `REF-03`, `REF-04`, `REF-05`, `REF-06`
**Prompt:** In /home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve, claim the linked bead, review the recorded link-test findings plus the current local source/tests, and produce a concise bug-summary update for this plan. The summary must clearly distinguish: (a) raw bead IDs not linking is probably expected upstream behavior, versus (b) explicit `bead:` / `bead://...#...` links failing in `workhorse-v2`, which likely indicates a real regression or missing integration. Include evidence pointers to the relevant files/tests. Claim the bead on start and close it when complete.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-07-23-nerve-bead-links-and-subagent-visibility.md`

**Status:** ✅ Complete

**Results:** Bug summary captured. Current evidence splits the symptom into two buckets: **(a)** raw bead IDs like `nerve-fms2` not auto-linking is probably expected upstream behavior, not the primary bug, because the local source/tests only recognize explicit bead hrefs and explicitly reject bare bead IDs (`src/features/beads/links.ts`; `src/features/beads/links.test.ts`, especially `it('rejects bare bead ids and normal file paths as markdown bead links')`; `src/features/markdown/MarkdownRenderer.test.tsx`, especially `it('does not treat bare bead ids as bead links when a workspace handler is also present')`). **(b)** explicit bead-link forms failing on mobile in `workhorse-v2` looks like the real regression or missing integration, because this fork still contains parser and renderer coverage for `[viewer](bead:nerve-fms2)` and explicit `bead:///.../.beads#...` / `bead://../...#...` flows (`src/features/beads/links.ts`; `src/features/markdown/MarkdownRenderer.test.tsx` cases for explicit bead-scheme links opening in-app, preserving cross-context metadata, and routing explicit bead links before workspace/browser fallback). Session findings remain: workspace/file-path links pass, while raw bead IDs, `bead:...`, and `bead://...#...` all fail from Derrick's mobile `workhorse-v2` surface. So the actionable bug is not “restore raw bead-ID smart-linking” unless we intentionally want new behavior beyond upstream; it is “why does `workhorse-v2` fail to honor explicit bead links that local Nerve source/tests still support?” This matches the earlier regression-check and upstream-parity plan findings in `/home/derrick/.openclaw/workspace/projects/openclaw-byte/.plans/2026-07-23-nerve-bead-link-regression-check.md` and `/home/derrick/.openclaw/workspace/projects/openclaw-byte/.plans/2026-07-20-nerve-openclaw-upstream-research-and-plan-triage.md`.

---

### Task 2: Define and run a one-at-a-time Nerve subagent visibility matrix

**Bead ID:** `oc-p2p`
**SubAgent:** `primary` (for `research` workflow role)
**Role:** `research`
**References:** `REF-01`, `REF-02`, `REF-04`
**Prompt:** In /home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve, claim the linked bead, define a small one-at-a-time visibility matrix for Nerve subagent/session discovery, and prepare the first controlled test step. The matrix should start with the baseline standard run-spawn path Derrick already confirmed visible, then advance one spawn/session shape at a time so he does not miss them. Include exact spawn settings and the expected visibility outcome per step. Claim the bead on start and close it when complete.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-07-23-nerve-bead-links-and-subagent-visibility.md`

**Status:** ✅ Complete

**Results:** Added a compact one-at-a-time Nerve visibility matrix so Derrick can watch each session shape appear without overlapping noise. The confirmed control is the standard orchestrator spawn already visible in Nerve: `sessions_spawn` with `runtime=subagent`, `mode=run`, `cleanup=keep`. From there, the matrix intentionally changes only one dimension per step:

| Step | Purpose | Settings relative to control | Expected Nerve visibility |
| --- | --- | --- | --- |
| `S0` | Control / reconfirm baseline | `sessions_spawn`, `runtime=subagent`, `mode=run`, `cleanup=keep` | **Visible**. Confirms the current known-good path still shows up. |
| `S1` | Vary cleanup only | Same as `S0`, but `cleanup=auto` (or the nearest non-`keep` cleanup mode available in the active spawn surface) | **Likely visible while running; may disappear sooner after completion** if Nerve is keying off retained session records. |
| `S2` | Vary mode only | Reset to control settings, but switch `mode=run` → the nearest alternate supported mode in the same spawn API surface | **Uncertain / likely degraded**. If Nerve's list is tuned to long-running run-mode sessions, alternate mode may not surface the same way. |
| `S3` | Vary runtime only | Reset to control settings, but switch `runtime=subagent` → the nearest alternate runtime supported by the same spawn surface | **Likely not visible or differently visible** if Nerve specifically recognizes subagent-backed sessions. |

This is deliberately sequential rather than exhaustive. The first controlled test step to execute next is **`S1` (cleanup-only variation)** because it preserves the same standard spawn path and changes the smallest possible thing after the known-good control. If `S1` stays visible, move to `S2`; if it drops out, cleanup retention becomes the first concrete suspect for Nerve visibility behavior.

### Task 3: Execute visibility matrix step S1 (cleanup-only variation)

**Bead ID:** `oc-jky`
**SubAgent:** `primary` (for `research` workflow role)
**Role:** `research`
**References:** `REF-01`, `REF-04`
**Prompt:** In /home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve, claim bead `oc-jky`, then launch a single visible control-adjacent Nerve visibility test using the same standard spawn path as the known-good case but changing only cleanup away from `keep` to the nearest supported non-`keep` cleanup mode. The spawned child should remain simple and clearly identifiable so Derrick can watch whether it appears in Nerve. Record the exact spawn settings used, the spawned child session key if available, and whether the test was launched successfully. Do not start further matrix steps. Update this plan with launch details and leave the user to report visibility from the Nerve UI. Close the bead with a clear reason when complete.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-07-23-nerve-bead-links-and-subagent-visibility.md`

**Status:** ✅ Complete

**Results:** Launched the single `S1` cleanup-only visibility probe successfully. The active `sessions_spawn` surface on this gateway only supports `cleanup` values `keep` and `delete`, so the nearest non-`keep` mode used was `delete` (not `auto`). Exact child spawn settings used: parent launch surface = a single internal agent turn against session `agent:main:main` / session ID `ee1ed36d-cbae-4b94-ba4f-57f00fb18ec2`, which then called `sessions_spawn` once with `runtime="subagent"`, `mode="run"`, `cleanup="delete"`, `cwd="/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve"`, `taskName="nerve-s1-cleanup-delete"`, and child task `You are a visibility marker child for Nerve matrix step S1. Reply with exactly NERVE-S1-CLEANUP-DELETE-VISIBLE and then stop.` The spawned child session key reported by the tool path was `agent:primary:subagent:36468630-5bb0-4c9d-b892-27a335afaa90`. No further matrix steps were launched. Derrick later reported he had missed the observation window, so a single rerun bead (`oc-lci`) was created to repeat the same `S1` probe while he watches Nerve live.

### Task 4: Re-run visibility matrix step S1 live for Derrick observation

**Bead ID:** `oc-lci`
**SubAgent:** `primary` (for `research` workflow role)
**Role:** `research`
**References:** `REF-01`, `REF-04`
**Prompt:** In /home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve, claim bead `oc-lci`, then re-run the single S1 visibility marker child using the same standard settings as the prior S1 probe: `runtime=subagent`, `mode=run`, `cleanup=delete`, `cwd=/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, with a clearly identifiable label so Derrick can watch Nerve live. Record the exact child session key and leave the result awaiting Derrick's visibility report. Do not launch any additional matrix steps. Close the bead with a clear reason when complete.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-07-23-nerve-bead-links-and-subagent-visibility.md`

**Status:** ✅ Complete

**Results:** Re-ran the single `S1` cleanup-only visibility probe using the same effective launch shape as the prior probe: a single internal agent turn against session `agent:main:main` / session ID `ee1ed36d-cbae-4b94-ba4f-57f00fb18ec2`, requesting one child with `runtime="subagent"`, `mode="run"`, `cleanup="delete"`, `cwd="/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve"`, task label `nerve-s1-cleanup-delete-rerun-live`, and child task `You are a visibility marker child for Nerve matrix step S1 rerun. Reply with exactly NERVE-S1-CLEANUP-DELETE-RERUN-VISIBLE and then stop.` The returned child session key was `agent:primary:subagent:77edce69-dede-4f79-9d2d-eea3d8f0ca20`. No additional matrix steps were launched. Result is now awaiting Derrick's live visibility report from Nerve.

### Task 5: Execute visibility matrix step S2 (mode-only variation)

**Bead ID:** `oc-hr5`
**SubAgent:** `primary` (for `research` workflow role)
**Role:** `research`
**References:** `REF-01`, `REF-04`
**Prompt:** In /home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve, claim bead `oc-hr5`, then launch a single visible Nerve visibility test for matrix step S2 by resetting to the standard subagent runtime and varying only `mode` away from the known-good `run` setting to the nearest alternate supported mode on the same spawn surface. Keep other settings control-adjacent and make the child clearly identifiable so Derrick can watch Nerve live. Record the exact spawn settings and child session key in this plan, leave the result awaiting Derrick's visibility report, and do not launch any further matrix steps. Close the bead with a clear reason when complete.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-07-23-nerve-bead-links-and-subagent-visibility.md`

**Status:** ✅ Complete

**Results:** Attempted the single `S2` mode-only probe through the same working internal agent-turn surface used for `S1`: an `openclaw agent` turn against parent session `agent:main:main` / session ID `ee1ed36d-cbae-4b94-ba4f-57f00fb18ec2`, instructing that parent to call `sessions_spawn` exactly once. Reset settings to the standard native control where possible: `runtime="subagent"`, `cleanup="keep"`, `cwd="/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve"`, `taskName="nerve-s2-mode-session"`, `label="nerve-s2-mode-session"`, and child marker text `NERVE-S2-MODE-SESSION-VISIBLE`. The nearest alternate native mode from the known-good `run` setting was `mode="session"`; the minimal additional requirement applied was `thread=true` because native `session` mode requires thread binding on this surface. The parent run returned a compact JSON result with `spawnSurface="sessions_spawn"`, `runtime="subagent"`, `mode="session"`, `cleanup="keep"`, `thread=true`, `accepted=false`, and note: `Tried the nearest alternate mode (session) with minimal required thread binding (thread=true), but this surface reported: session mode is unavailable for this target.` The response also included a provisional child session key string `agent:primary:subagent:faab948f-a439-4f5a-bb3c-a7ba70446008`, but because the spawn was not accepted, treat that key as non-launched / not a valid live-visibility target unless later evidence proves otherwise. Derrick later provided screenshot evidence from the same moment showing exactly that failed-spawn JSON appearing as a normal chat post in the timeline while no corresponding live child appeared in the Nerve agents tab. That resolves the ambiguity: the visible artifact was the failure report message itself, not a successfully launched `mode="session"` child. No further matrix steps were launched. This leaves `S2` blocked at the current target surface rather than awaiting a Nerve visibility observation.

### Task 6: Find a reachable surface that supports native subagent session mode

**Bead ID:** `oc-kiz`
**SubAgent:** `primary` (for `research` workflow role)
**Role:** `research`
**References:** `REF-01`, `REF-04`
**Prompt:** In /home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve, claim bead `oc-kiz`, then determine the safest reachable surface/target available from this session for a native `sessions_spawn` test with `runtime=subagent` and `mode=session`. The goal is to answer whether session-mode subagents can launch anywhere we currently control, independent of Nerve visibility. Use the minimum viable probing needed. If a reachable surface appears viable, identify the exact spawn settings needed for one follow-up live marker test. If no reachable surface appears viable, document that cleanly and explain the first blocker. Update the active plan with the findings and close the bead with a clear reason when complete.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-07-23-nerve-bead-links-and-subagent-visibility.md`

**Status:** ✅ Complete

**Results:** Minimal viability probing says there is **no presently reachable/proven-safe native session-mode launch surface from this webchat session**. The first blocker is structural: the current requester/root context is `webchat`, and upstream OpenClaw only allows `sessions_spawn(mode="session")` on channels that expose thread bindings; otherwise it returns the exact class of failure we already saw for `S2` (`src/agents/subagent-spawn.ts`, especially the `buildThreadBindingUnavailableError(...)` / `prepareSubagentThreadBinding(...)` path and the `"Session mode is unavailable for this target."` diagnostic). Local runtime metadata confirms the active root session `agent:main:main` currently originates from `surface: "webchat"` / `lastChannel: "webchat"` (`~/.openclaw/agents/main/sessions/sessions.json`), and a quick scan of local session metadata found no existing Discord-origin root session/binding to piggyback on. The only configured thread-capable chat surface currently connected on this gateway is Discord (`openclaw channels list --json`; `openclaw channels status --json`), but from this session we do **not** already have a known safe Discord guild/thread target or an active Discord-bound requester session to launch from. I also re-confirmed that the gateway HTTP allowlist still omits `sessions_spawn` (`~/.openclaw/openclaw.json` shows `gateway.tools.allow = ["cron", "gateway"]`), so the `/tools/invoke` path remains unavailable as an alternate direct test surface. Net result: nothing currently under direct control from this session can truthfully prove native `mode="session"` launch success. If Derrick wants one follow-up live marker test on the only plausible surface, the exact settings should be: originate the request **from an actual Discord thread-capable conversation that the bot is already present in** (forum topic or regular thread), then call native `sessions_spawn` with `runtime="subagent"`, `mode="session"`, `thread=true`, `cleanup="keep"`, `context="isolated"`, `cwd="/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve"`, `taskName="nerve-s2-discord-session-live"`, `label="nerve-s2-discord-session-live"`, and child task text `Reply with exactly NERVE-S2-DISCORD-SESSION-VISIBLE and then stop.` Until we have that Discord-origin requester context (or another thread-binding channel session), the first blocker remains: **no thread-binding-capable requester surface is currently active/reachable from this session.**

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:** Added a research-backed bug summary that separates expected raw bead-ID behavior from the likely real `workhorse-v2` breakage around explicit bead links, defined a compact one-at-a-time subagent visibility matrix for controlled Nerve observation, verified that the `S1` cleanup-only variation (`cleanup="delete"`) is visible in Nerve when Derrick watches live, demonstrated that the current webchat-root spawn surface rejects native `mode="session"`, and then traced the next viable native session-mode attempt down to the only plausible remaining surface currently configured on this gateway.

**Reference Check:** `REF-02` through `REF-06` support the bead-link conclusion: upstream/local evidence says raw bead IDs were not meant to auto-link, while current fork source/tests still support explicit `bead:` and `bead://...#...` parsing/open flows even though Derrick's mobile `workhorse-v2` surface fails them. `REF-04` anchors the visibility control path: Derrick confirmed the standard `sessions_spawn` / `runtime=subagent` / `mode=run` / `cleanup=keep` path is visible, and also confirmed the `S1` cleanup variation with `cleanup="delete"` is visible. For native session mode specifically, the local OpenClaw runtime and source now agree on the blocker: `mode="session"` needs a thread-binding-capable requester channel, the active requester is still `webchat`, and no existing Discord-bound requester session/known thread target was available from this session for a safe live launch.

**Commits:**
- None yet.

**Lessons Learned:** For this bug, “raw bead IDs do not link” and “explicit bead links fail” must stay separate. For session visibility, change exactly one spawn dimension at a time; otherwise Nerve discovery failures will be hard to attribute. On this gateway surface the practical cleanup-only comparison is `keep` vs `delete`, and the HTTP `/tools/invoke` path still blocks `sessions_spawn`, so the usable launch path here remains an internal agent turn through the normal tool pipeline. More importantly, native `mode="session"` is not just a generic alternate flag: it is coupled to a live thread-binding requester surface. In this environment that means a Discord-origin thread/forum-topic session (or another thread-capable channel session), not webchat.

---

*Completed on 2026-07-23 (partial / blocked only for native session-mode surface discovery beyond webchat)*
