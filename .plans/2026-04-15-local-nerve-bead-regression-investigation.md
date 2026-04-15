# gambit-openclaw-nerve — local Nerve bead regression investigation

**Date:** 2026-04-15  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Determine why Chip’s local Nerve runtime on `workhorse-v1` fails to open Beads while Byte can now open repo-local Beads successfully, and prove whether the cause is a local stale-runtime/build issue or a real regression introduced on `workhorse-v1`.

---

## Overview

Byte is now a passing comparison point once his repo-local Beads state was repaired and he used a bead that actually belongs to `gambit-openclaw-nerve`. That means the global hypothesis of “Nerve bead opening is broken everywhere” is no longer supported. The investigation should now focus narrowly on Chip’s terminal/runtime state.

The key suspect boundary is the recent `workhorse-v1` roll-in from this session. However, earlier evidence also suggested a local runtime/build mismatch: the source tree and built artifacts disagreed about whether the Beads API route was mounted, and the running process may have been serving stale `server-dist` output. So this investigation must first establish what code the local Nerve process is actually serving before blaming the new branch commits.

The desired outcome is a precise answer in one of three forms: (1) local stale runtime/start issue only, (2) real runtime regression introduced by the new `workhorse-v1` changes, or (3) some other local environment mismatch such as wrong repo/workspace context. Only if we prove an actual product regression should we open a canonical fix lane; otherwise the resolution stays local.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Current bead-viewer parity investigation and workhorse roll-in | `.plans/2026-04-15-bead-viewer-note-links-parity.md` |
| `REF-02` | Current workhorse baseline | `.plans/2026-04-12-workhorse-v1-rollup.md` |
| `REF-03` | Recent workhorse commits for this lane | `workhorse-v1` commits `4213c6c`, `55d6048` |
| `REF-04` | Byte’s repaired passing comparison point | current session notes / live operator report |

---

## Tasks

### Task 1: Diagnose Chip’s local runtime/build state for bead opening

**Bead ID:** `nerve-ly0s`  
**SubAgent:** `primary`  
**References:** `REF-01`, `REF-02`, `REF-03`, `REF-04`  
**Prompt:** Claim the investigation bead, inspect Chip’s local `gambit-openclaw-nerve` runtime on `workhorse-v1`, and determine exactly why local bead opening fails while Byte now passes. Prove what commit/build the running Nerve process is serving, whether `/api/beads` is mounted, whether the running backend matches current source/build output, and whether the failure is attributable to stale runtime state, local environment mismatch, or a real regression from the recent `workhorse-v1` changes. Do not implement a fix yet unless a tiny proving edit is absolutely required. Update this plan truthfully with the diagnosis and recommended next action.

**Folders Created/Deleted/Modified:**
- `.plans/`
- runtime artifacts for inspection only

**Files Created/Deleted/Modified:**
- `.plans/2026-04-15-local-nerve-bead-regression-investigation.md`

**Status:** ✅ Complete

**Results:** Diagnosed as a live runtime/build mismatch on Chip’s local `workhorse-v1`, not evidence against Byte’s passing result and not evidence that `4213c6c` / `55d6048` regressed the backend. Exact evidence:
- Running process proof: `ps` showed `npm run prod -> npm run build && node server-dist/index.js -> node server-dist/index.js` with PID `1487128`, cwd `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, `PORT=3080`, `HOST=127.0.0.1`, and repo `HEAD` at `4fcc6b3` on branch `workhorse-v1`.
- Live HTTP proof: `curl http://127.0.0.1:3080/api/version` returned `200` and `{"version":"1.5.2","name":"openclaw-nerve"}`, proving the local repo process is serving traffic. `curl http://127.0.0.1:3080/api/beads/nerve-ly0s` returned a plain framework `404 Not Found`, meaning the Beads route is not mounted in the live backend. `curl /health` returned `200`, while `/api/health` returned `404`; this matches current route definitions rather than a proxy issue.
- Source/build proof: current source `server/app.ts` imports and mounts both `uploadConfigRoutes` and `beadsRoutes`. The newer compiled artifact `server-dist/server/app.js` also mounts both routes and its matching `server-dist/server/routes/beads.js` exists with timestamp `2026-04-15 09:53`.
- Stale artifact proof: the entrypoint actually executed by package scripts is still `server-dist/index.js`, and it resolves `./app.js` to root `server-dist/app.js`. That root compiled app is older (`2026-04-14 17:20`) and does **not** import or mount `uploadConfigRoutes` or `beadsRoutes`, which exactly explains the live 404s. `server-dist/index.js` itself is also older than the nested `server-dist/server/index.js` that matches current source.
- Commit-scope proof: `git show --name-only 4213c6c 55d6048` shows only frontend files under `src/`; those commits did not touch `server/`, build scripts, or runtime startup wiring.

Best-supported conclusion: Chip’s current bead-opening failure is caused by a stale compiled backend entrypoint/layout mismatch. The live process is serving the correct repo on `workhorse-v1`, but it is executing stale root `server-dist/*.js` output that lacks the Beads route, while fresher matching backend output exists under `server-dist/server/`. That makes the immediate failure local runtime/build-state driven, not a proven backend regression from the recent bead-view UI commits.

Recommended next action: open a narrow fix/verification lane on `workhorse-v1` to prove why `build:server` / startup currently leave or target the wrong `server-dist` entrypoint, then correct the build/start contract (likely clean `server-dist` before compile and/or make the emitted/started entrypoint unambiguous). After that, rebuild/restart Chip’s local Nerve and re-test `/api/beads/:id`. This is repo-bug-worthy because the package/install/start contract points at `server-dist/index.js`, but the freshest matching compiled backend currently lives under `server-dist/server/`.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** A diagnosis proving Chip’s local bead-opening failure comes from a stale/misaligned backend build/start state, not from the two recent bead-view UI commits.

**Reference Check:** `REF-03` disproved as direct backend cause (those commits only touched `src/` UI files). `REF-04` remains consistent: Byte can pass while Chip fails because Chip’s local runtime is serving stale root `server-dist` backend artifacts.

**Commits:**
- None. Diagnosis only.

**Lessons Learned:** Once Byte became a valid passing comparison point, the right question was “what exact artifact is Chip serving?” The decisive evidence was the mismatch between executed `server-dist/index.js -> server-dist/app.js` and fresher matching backend output under `server-dist/server/`.

---

*Completed on 2026-04-15*
