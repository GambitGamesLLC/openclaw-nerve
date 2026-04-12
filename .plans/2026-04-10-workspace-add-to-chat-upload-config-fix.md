# gambit-openclaw-nerve — restore workspace file Add to chat upload-config plumbing

**Date:** 2026-04-10  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Restore the workspace file-browser `Add to chat` flow so real workspace files can be attached/referenced again, by fixing the missing `/api/upload-config` plumbing (or equivalent config path) on a fresh clean branch from current `upstream/master`, then rolling that clean fix into `workhorse` for dogfood.

---

## Overview

Diagnosis showed that the current warning — `Workspace path attachments are disabled by configuration.` — is not coming from a true user-configured disable switch. The file `Add to chat` path in `InputBar` depends on `uploadConfig.fileReferenceEnabled`, which defaults to `false` and is only enabled if the client successfully fetches `/api/upload-config`. In current `workhorse` and `upstream/master`, that client fetch path still exists, but the corresponding server route/config plumbing is absent, so the client silently falls back to the disabled default.

PR #235 helped pin the lineage: this is not just a late local regression on `workhorse`, and it is not best fixed by going back to the old stacked branch lineage. The right ownership is a fresh follow-up branch from current `upstream/master`, because the mismatch is effectively baked into the current upstream/base state. Once fixed and validated on that clean branch, we can replay it into `workhorse` for local dogfood.

The fix itself may be one of two shapes: restore/mount the intended `/api/upload-config` server contract, or simplify the client/server contract so the file-reference capability comes from an already-mounted route/source instead of a missing endpoint. The implementation pass should choose the narrowest correct option that restores the intended product behavior without reintroducing dead configuration plumbing.

---

## Tasks

### Task 1: Design the narrowest correct capability-plumbing fix

**Bead ID:** `nerve-6o13`  
**SubAgent:** `primary`  
**Prompt:** Based on the completed diagnosis, inspect the existing client/server upload-reference plumbing and decide the narrowest correct fix for the missing `fileReferenceEnabled` capability path. Explicitly compare at least two options: (A) restore/mount `/api/upload-config`, or (B) source the capability from an already-mounted server/config path and remove the dead fetch dependency. Recommend the cleanest upstreamable design before implementation.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `server/routes/`
- `server/`
- `src/features/chat/`
- `docs/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-workspace-add-to-chat-upload-config-fix.md`
- `server/app.ts`
- `server/routes/upload-config.ts` (planned)
- `server/routes/upload-config.test.ts` (planned)
- `src/features/chat/InputBar.test.tsx` (verify whether fixture/default expectations need adjustment)
- `docs/API.md` (planned)
- `docs/ARCHITECTURE.md` (planned)

**Status:** ✅ Complete

**Results:** Inspected the current client/server contract in detail. `src/features/chat/InputBar.tsx` still fetches `GET /api/upload-config` on mount and gates workspace-path attachments plus file-reference fallback behind `uploadConfig.fileReferenceEnabled`, but `server/app.ts` does not mount any `upload-config` route. By contrast, the real file-reference plumbing is already present and mounted: `POST /api/upload-reference/resolve` in `server/routes/upload-reference.ts`, plus workspace browsing via `GET /api/files/tree` in `server/routes/file-browser.ts`. Compared two fix shapes: **(A) restore the missing dedicated `GET /api/upload-config` route** vs **(B) remove the dead fetch and infer capability from an already-mounted route or hard-coded client defaults**. Recommendation: **Option A** is the narrowest clean upstreamable fix because it restores the contract the client and tests already expect, keeps upload capability policy centralized behind one endpoint, avoids repurposing unrelated routes, and preserves a future server-owned toggle/config surface. Option B would either hard-code capability in the browser or smear capability inference across unrelated endpoints/probes, which is broader semantically despite looking smaller in line count. Validation gate before rolling into `workhorse`: fresh branch from current `upstream/master`, then passing focused route tests plus chat attachment tests/build (at minimum the new upload-config route test and the existing `InputBar` / upload-policy coverage) before any replay or dogfood.

---

### Task 2: Implement the fix on a fresh upstream-master branch

**Bead ID:** `nerve-od5t`  
**SubAgent:** `coder`  
**Prompt:** Create a fresh clean branch from current `upstream/master`, implement the chosen fix for the missing upload-config/file-reference capability plumbing, and keep the diff tightly scoped to the real ownership path.

**Folders Created/Deleted/Modified:**
- owning client/server source folders only

**Files Created/Deleted/Modified:**
- pending design decision

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 3: Validate workspace file `Add to chat` behavior on the clean branch

**Bead ID:** `nerve-6did`  
**SubAgent:** `coder`  
**Prompt:** Run focused validation for the restored file-reference capability on the clean branch, including the relevant tests/build checks and, if available, an endpoint/config sanity check that proves the client will no longer fall back to disabled defaults.

**Folders Created/Deleted/Modified:**
- `server/`
- `src/features/chat/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `server/app.ts`
- `server/lib/upload-config.ts`
- `server/routes/upload-config.ts`
- `server/routes/upload-config.test.ts`
- `.plans/2026-04-10-workspace-add-to-chat-upload-config-fix.md`

**Status:** ✅ Complete

**Results:** On `fix/upload-config-capability`, confirmed the branch remains a clean one-commit delta on top of current `upstream/master`: `git merge-base HEAD upstream/master` matched `git rev-parse upstream/master`, and `git diff --name-only upstream/master...HEAD` stayed limited to `server/app.ts`, `server/lib/upload-config.ts`, `server/routes/upload-config.ts`, and `server/routes/upload-config.test.ts` with no `.plans`, `.beads`, or orchestration files in the branch diff. Re-ran the focused regression tests with `npm test -- --run server/routes/upload-config.test.ts src/features/chat/InputBar.test.tsx` and got 18/18 passing across 2 files. Then ran the full app build path with `npm run build` (which executes `tsc -b`, `vite build`, and `npm run build:server`) and it completed successfully, giving confidence that the restored route is mounted and compiles through the full client+server application path rather than only the isolated server build. Build output included pre-existing Vite chunk-size/dynamic-import warnings only; no route-specific failures or new type/build errors were observed. This is sufficient validation to justify rolling the clean fix forward into `workhorse`, but that integration step has not been performed yet.

---

### Task 4: Roll the clean fix into `workhorse` and prepare dogfood

**Bead ID:** `nerve-5pmc`  
**SubAgent:** `coder`  
**Prompt:** Once the clean branch is validated, roll it into `workhorse` using the cleanest appropriate method, rerun the minimum focused validation there, and prepare a concrete manual dogfood sequence for right-click `Add to chat` on a real workspace file such as `/workspace/avatar.png`.

**Folders Created/Deleted/Modified:**
- integration branch only after canonical fix exists

**Files Created/Deleted/Modified:**
- `server/app.ts`
- `server/lib/upload-config.ts`
- `server/routes/upload-config.ts`
- `server/routes/upload-config.test.ts`
- `.plans/2026-04-10-workspace-add-to-chat-upload-config-fix.md`

**Status:** ✅ Complete

**Results:** Switched to `workhorse` and rolled the validated clean fix forward by **cherry-picking commit `5b2b092`**. The replay hit a single expected integration conflict in `server/app.ts` because `workhorse` already had an additional `beadsRoutes` mount in the route list; resolved it by preserving the existing `workhorse` route lineup and adding `uploadConfigRoutes` alongside the existing file-browser/upload-reference routes, then continued the cherry-pick successfully. The resulting `workhorse` integration commit is **`40e9e14` — `fix(server): restore upload config endpoint`**.

Re-ran the minimum focused validation directly on `workhorse` with `npm test -- --run server/routes/upload-config.test.ts src/features/chat/InputBar.test.tsx`. Result: **2 test files passed, 18/18 tests passed**. `server/routes/upload-config.test.ts` confirmed the restored `GET /api/upload-config` contract and env-driven capability flags, while `src/features/chat/InputBar.test.tsx` confirmed the chat composer still stages workspace file `Add to chat` actions as `server_path` file references when the capability is enabled. The run emitted the same pre-existing React `act(...)` warnings from `InputBar` tests seen earlier, but there were **no failures** and no new integration regressions in the scoped validation.

Dogfood handoff after Derrick runs `update.sh` and `restore.sh` manually:
1. Stay on `workhorse` at commit `40e9e14` and start/restart the local Nerve instance from this repo in the usual dogfood mode.
2. Open Nerve in the browser and make sure the workspace/file browser is visible.
3. Browse to a real workspace file such as `/workspace/avatar.png`.
4. Right-click that file and choose **Add to chat**.
5. Expected composer result: the file is staged immediately with a **Path Ref** chip/attachment, and the prior warning **`Workspace path attachments are disabled by configuration.`** does **not** appear.
6. Send a short prompt referencing the attached file. Expected behavior: the attachment stays represented as a workspace path/server reference rather than being blocked by the missing capability fetch.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Restored the missing `/api/upload-config` capability endpoint on a clean branch, replayed that narrow fix into `workhorse`, and revalidated the exact upload-config + composer path needed for workspace file `Add to chat` dogfooding.

**Commits:**
- `5b2b092` - fix(server): restore upload config endpoint
- `40e9e14` - fix(server): restore upload config endpoint

**Lessons Learned:** The clean branch was the right place to prove ownership and scope, but `workhorse` had already diverged in `server/app.ts`, so the lowest-risk roll-forward was a one-commit cherry-pick with a tiny manual route-list resolution rather than a broader merge. Keeping the validation focused on the restored route plus `InputBar` coverage was enough to justify dogfood without re-running the full build on the integration branch.

---

*Created on 2026-04-10*
*Updated on 2026-04-10*
