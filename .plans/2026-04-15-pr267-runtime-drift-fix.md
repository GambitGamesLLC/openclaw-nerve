# gambit-openclaw-nerve — PR 267 runtime drift fix

**Date:** 2026-04-15  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Fix the server build/runtime drift introduced on the open PR `#267` lane so a clean build emits a startable Nerve backend again, then roll that canonical fix into `workhorse-v1` for retest before updating the PR.

---

## Overview

We proved the Bead viewer parity work is valid, and that the startup failure on Chip is a separate runtime/build problem. Clean rebuilds on `workhorse-v1` emitted only `server-dist/server/*`, while startup still expects `server-dist/index.js`; manual startup from the nested path only worked after copying `package.json` into `server-dist/`. That is a real drift bug, but it does not reproduce on clean `upstream/master`.

The root cause appears tied to our existing open PR `#267` lane. That branch introduced `server/lib/chat-path-links-config.ts` as a server-side re-export from `../../src/features/chat/chatPathLinksConfig.js`. Because that reaches outside `server/`, it changes the server emit layout and breaks the runtime/start contract after a clean build. Since this bug was introduced on that PR lane and that PR already claims to keep runtime build paths correct, the fix belongs on the same canonical branch first, then gets rolled into `workhorse-v1` for dogfood.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Bead viewer parity lane and validation context | `.plans/2026-04-15-bead-viewer-note-links-parity.md` |
| `REF-02` | Local runtime investigation proving stale/drift behavior | `.plans/2026-04-15-local-nerve-bead-regression-investigation.md` |
| `REF-03` | Upstream issue/PR for earlier stale server-dist bug family | upstream Issue `#46`, PR `#47` |
| `REF-04` | Current owning PR lane for the introduced drift | upstream PR `#267` / branch `feature/local-chat-links-self-heal-and-defaults` |

---

## Tasks

### Task 1: Fix PR 267 server build/runtime drift on the canonical branch

**Bead ID:** `nerve-53a5`  
**SubAgent:** `coder`  
**References:** `REF-02`, `REF-03`, `REF-04`  
**Prompt:** Claim the implementation bead, work on the canonical branch for PR `#267`, and fix the runtime/build drift so a clean build produces a startable backend without manual file copying. The fix must keep the chat-path-links helper server-local in reality, not just by intent, and must preserve the functional behavior of PR `#267`. Run relevant validation, commit/push the canonical branch, and update this plan truthfully.

**Folders Created/Deleted/Modified:**
- `.plans/`
- server/lib/

**Files Created/Deleted/Modified:**
- `server/lib/chat-path-links-config.ts`
- `.plans/2026-04-15-pr267-runtime-drift-fix.md`

**Status:** ✅ Complete

**Results:** Implemented the narrow fix on `feature/local-chat-links-self-heal-and-defaults` by replacing the server-side re-export in `server/lib/chat-path-links-config.ts` with a true server-local copy of the helper logic, so the server compiler no longer reaches out into `src/` and no longer shifts the emit root. Validation passed: `npm test -- --run src/features/chat/chatPathLinksConfig.test.ts server/routes/workspace.test.ts` (16 tests), `rm -rf dist server-dist bin-dist && npm run build` (clean build now emits rooted `server-dist/index.js`, `server-dist/app.js`, `server-dist/lib/...`, and no nested `server-dist/server/` tree), and a startup smoke with `PORT=43112 SSL_PORT=43113 npm start` successfully served `http://127.0.0.1:43112` before clean shutdown. Code commit/push: `1b0abcc` — `Fix PR 267 server build output drift`. Per Derrick’s guardrail, the plan update itself is documentation only and is not included in the source-branch commit.

---

### Task 2: Audit the PR 267 runtime drift fix independently

**Bead ID:** `nerve-s5t5`  
**SubAgent:** `auditor`  
**References:** Task 1 implementation, `REF-02`, `REF-04`  
**Prompt:** Independently audit the canonical PR `#267` fix. Verify that clean builds produce the expected root `server-dist/*` layout, that the normal startup path is valid again, and that the chat-path-links functionality from PR `#267` still behaves honestly.

**Folders Created/Deleted/Modified:**
- `.plans/`
- source/test folders for audit as needed

**Files Created/Deleted/Modified:**
- `.plans/2026-04-15-pr267-runtime-drift-fix.md`

**Status:** ✅ Complete

**Results:** Independent audit passed on `feature/local-chat-links-self-heal-and-defaults` at commit `1b0abcc`. I verified the fix is real: `server/lib/chat-path-links-config.ts` is now a server-local implementation instead of a re-export into `src/`, and its logic matches the client helper shape/behavior. Validation run/outcomes: (1) `npm test -- --run src/features/chat/chatPathLinksConfig.test.ts server/routes/workspace.test.ts` → 2 files passed, 16 tests passed, including the local self-heal workspace route coverage; (2) `rm -rf dist server-dist bin-dist && npm run build` → passed from clean state, with rooted server output restored (`server-dist/index.js`, `server-dist/app.js`, `server-dist/lib/...`) and no nested `server-dist/server/*`; (3) verified `server-dist/package.json` is absent after the clean build, proving no manual runtime copy hack was involved; (4) `PORT=43112 SSL_PORT=43113 npm start` from the normal entrypoint succeeded, and `curl http://127.0.0.1:43112` returned the app HTML, confirming the standard startup path works again; (5) loaded `server-dist/lib/chat-path-links-config.js` directly and confirmed default/template output remains honest for PR `#267` behavior, e.g. Linux `/home/derrick/.openclaw/workspace` seeds `['/workspace/', '/home/derrick/.openclaw/workspace/', '/home/derrick/workspace/']`. Conclusion: the runtime build-path claim on PR `#267` is now honest again, with no manual runtime hacks required.

---

### Task 3: Roll the audited fix into `workhorse-v1` and retest

**Bead ID:** `nerve-6cxv`  
**SubAgent:** `coder`  
**References:** Task 1 fix branch, Task 2 audit, `REF-01`  
**Prompt:** Merge or cherry-pick the audited PR `#267` runtime drift fix into `workhorse-v1`, resolve conflicts cleanly, run validation, push `workhorse-v1`, and prepare the exact retest steps for Derrick.

**Folders Created/Deleted/Modified:**
- `.plans/`
- source/test folders as needed

**Files Created/Deleted/Modified:**
- `.plans/2026-04-15-pr267-runtime-drift-fix.md`
- `server/lib/chat-path-links-config.ts`

**Status:** ✅ Complete

**Results:** Cherry-picked the audited canonical fix commit `1b0abcceef4586413213f4e1d66eb9045f50a07c` onto `workhorse-v1` as `6b4030d` — `Fix PR 267 server build output drift`. The cherry-pick applied cleanly with no conflicts. Validation passed on `workhorse-v1`: `npm test -- --run src/features/chat/chatPathLinksConfig.test.ts server/routes/workspace.test.ts` (2 files, 16 tests passed); `rm -rf dist server-dist bin-dist && npm run build` (clean build passed, restoring rooted `server-dist/index.js` and removing the nested `server-dist/server/*` drift); filesystem verification confirmed `server-dist/index.js` exists and `server-dist/server/` does not; startup smoke `PORT=43112 SSL_PORT=43113 npm start` successfully served app HTML from `http://127.0.0.1:43112` before clean shutdown. Retest steps for Derrick: on `workhorse-v1`, run `rm -rf dist server-dist bin-dist && npm run build`, verify `test -f server-dist/index.js` and `test ! -d server-dist/server`, then run `PORT=43112 SSL_PORT=43113 npm start` and confirm `curl http://127.0.0.1:43112/` returns the app HTML.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Fixed the PR `#267` runtime/build drift on the canonical branch, independently audited it, then rolled that exact fix into `workhorse-v1` so clean builds once again emit a startable rooted `server-dist/*` backend with no nested `server-dist/server/*` drift.

**Reference Check:** `REF-02` satisfied by reproducing and clearing the build-layout bug, `REF-04` satisfied by fixing the owning PR lane in place first, and `REF-01` satisfied by carrying the audited fix onto `workhorse-v1` for parity retest. `REF-03` remained context only; no runtime hacks or manual file copying were used.

**Commits:**
- `1b0abcc` - Fix PR 267 server build output drift
- `6b4030d` - Fix PR 267 server build output drift

**Lessons Learned:** When a feature lane quietly changes the TypeScript server emit root, the safest recovery is to restore a genuinely server-local dependency boundary on the owning branch first, then roll that audited commit forward unchanged into downstream work branches.

---

*Completed on 2026-04-15*
