# gambit-openclaw-nerve — chat link hardening lane

**Date:** 2026-04-11  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Harden local `CHAT_PATH_LINKS.json` behavior so missing configs self-heal, richer local defaults come from one shared helper, and manual template creation reuses that same source of truth.

---

## Overview

This lane was implemented on a fresh `upstream/master` branch named `feature/local-chat-links-self-heal-and-defaults`, intentionally avoiding both `workhorse` and the older `feature/chat-path-links` history.

The implementation adds one shared helper module for chat-path-links config generation, normalization, parsing, and JSON serialization. The local workspace route now self-heals `CHAT_PATH_LINKS.json` on read when it is missing, writes the generated file immediately, logs a warning, and returns the generated content in the same request. The existing client-side fallback safety remains unchanged.

`ConfigTab` no longer carries its own hard-coded `CHAT_PATH_LINKS.json` template. It now uses the shared helper, which keeps self-heal generation and manual creation aligned.

---

## Tasks

### Task 1: Fresh upstream implementation branch

**Bead ID:** `nerve-et4p`  
**SubAgent:** `primary`  
**Status:** ✅ Complete

**Results:** Created worktree-backed branch `feature/local-chat-links-self-heal-and-defaults` from fresh `upstream/master` (`a5f7973` base), isolating the lane from unrelated dirty work in the main checkout.

### Task 2: Shared helper + local self-heal

**Bead ID:** `nerve-et4p`  
**SubAgent:** `primary`  
**Status:** ✅ Complete

**Files Created/Modified:**
- `src/features/chat/chatPathLinksConfig.ts`
- `src/features/chat/chatPathLinks.ts`
- `server/routes/workspace.ts`

**Results:** Added a shared helper as the source of truth for:
- richer default prefix generation
- normalization/deduping
- JSON parsing
- JSON serialization/template creation

Local `GET /api/workspace/chatPathLinks` now:
- checks local workspace status first
- regenerates `CHAT_PATH_LINKS.json` when missing
- writes the generated JSON to disk
- logs a warning
- returns the generated content immediately

Remote/gateway behavior was intentionally left unchanged.

### Task 3: ConfigTab template unification

**Bead ID:** `nerve-et4p`  
**SubAgent:** `primary`  
**Status:** ✅ Complete

**Files Modified:**
- `src/features/workspace/tabs/ConfigTab.tsx`

**Results:** Replaced the hard-coded `CHAT_PATH_LINKS.json` create-template string with `createChatPathLinksTemplate()` from the shared helper.

### Task 4: Tests and validation

**Bead ID:** `nerve-et4p`  
**SubAgent:** `primary`  
**Status:** ✅ Complete

**Files Modified:**
- `server/routes/workspace.test.ts`
- `src/features/chat/chatPathLinksConfig.test.ts`
- `src/features/workspace/tabs/ConfigTab.test.tsx`

**Validation Run:**
- `npm test -- --run server/routes/workspace.test.ts src/features/chat/chatPathLinksConfig.test.ts src/features/workspace/tabs/ConfigTab.test.tsx`
- `npm run build`

**Results:**
- added route coverage for local self-heal and persisted regenerated content
- added helper coverage for richer defaults, normalization, deduping, and template serialization
- added ConfigTab coverage proving manual creation uses the shared template
- full build passed

**Notes / Surprises:**
- The fresh upstream branch did not contain `.plans/`, so this plan file was added in-branch for documentation.
- Browser-side create-template generation still uses the shared helper but does not attempt extra host probing; the local runtime self-heal path is the authoritative richer local generation path.

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- one shared chat-path-links config helper
- local runtime self-heal for missing `CHAT_PATH_LINKS.json`
- warning log on regeneration
- unified `ConfigTab` template creation
- focused regression coverage and successful build validation

**Files Touched:**
- `.plans/2026-04-11-chat-link-hardening-lane.md`
- `server/routes/workspace.ts`
- `server/routes/workspace.test.ts`
- `src/features/chat/chatPathLinks.ts`
- `src/features/chat/chatPathLinksConfig.ts`
- `src/features/chat/chatPathLinksConfig.test.ts`
- `src/features/workspace/tabs/ConfigTab.tsx`
- `src/features/workspace/tabs/ConfigTab.test.tsx`

**Commits:**
- Pending

**Lessons Learned:**
- Keeping the config template logic in one helper prevents future drift between runtime defaults and UI-driven file creation.
- Local self-heal is a clean repo-local win even while gateway parity remains deferred.

---

## Follow-up — final workhorse dogfood reroll

### Task 5: Re-roll the fully fixed feature-branch commit set into `workhorse`

**Bead ID:** `nerve-lp9p`  
**SubAgent:** `primary`  
**Status:** ✅ Complete

**Results:** Inspected `workhorse` against clean branch `feature/local-chat-links-self-heal-and-defaults` and confirmed:
- `7bc75f2` (`feat(chat): self-heal missing local chat path links config`) was already present on `workhorse` as equivalent cherry-pick `d9db0a1`.
- `a69f7bc` (`fix(chat): keep chat path links helper in server tree`) was missing and was replayed onto `workhorse` as `fb9778b`.
- `868c042` was a documentation-only plan commit on the clean branch and was not cherry-picked; this Task 5 update records the downstream reroll instead.

New local `workhorse` HEAD:
- `fb9778b` — `fix(chat): keep chat path links helper in server tree`

Focused validation run on the rerolled `workhorse` commit:
- `npm test -- server/routes/workspace.test.ts`
- `npm run build:server`
- Result: passed on a clean local clone/worktree used for the replay (`11/11` workspace route tests passed; server TypeScript build passed)

Manual dogfood outcome:
- Dogfood passed after reroll.
- Verified behavior:
  - `CHAT_PATH_LINKS.json` self-healed on fresh startup and on refresh after deletion
  - local chat links rendered/resolved correctly
  - `/api/upload-config` returned `200`
  - `/api/workspace/chatPathLinks?agentId=main` returned `200`
  - `/api/workspace?agentId=main` reported `chatPathLinks` exists
  - runtime file was recreated at `/home/derrick/.openclaw/workspace/CHAT_PATH_LINKS.json`
  - server log emitted: `[workspace] Missing CHAT_PATH_LINKS.json; regenerated local default template at /home/derrick/.openclaw/workspace/CHAT_PATH_LINKS.json`

Remaining packaging note before upstream Issue/PR:
- Derrick requested we improve Windows-aware default generation too before packaging, while keeping Linux/mac support intact. That follow-up should happen on the clean feature branch first, then be rerolled into `workhorse` for one more Linux dogfood pass.

---

### Task 6: Add Windows-aware default generation on the clean feature branch

**Bead ID:** `nerve-wmm4`  
**SubAgent:** `primary`  
**Status:** ✅ Complete

**Files Modified:**
- `server/lib/chat-path-links-config.ts`
- `src/features/chat/chatPathLinksConfig.test.ts`
- `.plans/2026-04-11-chat-link-hardening-lane.md`

**Validation Run:**
- `npm test -- --run server/routes/workspace.test.ts src/features/chat/chatPathLinksConfig.test.ts`
- `npm run build:server`

**Results:** Extended the shared default-generation helper so Windows-aware defaults are produced without regressing Linux/macOS behavior:
- `/workspace/` remains the first/default prefix.
- Explicit `workspaceRoot` values are still included directly.
- Home-directory inference now derives from the actual `workspaceRoot` when it matches `.openclaw/workspace*` or `workspace*`, which lets Windows paths carry their real drive/root instead of assuming Linux-style locations.
- Username/platform fallback now includes Windows (`win32` / `windows`) and uses the conventional `C:/Users/<user>` shape when no better root is available.
- Added focused test coverage for both workspace-root-derived Windows defaults and username-only Windows fallback, while retaining existing Linux coverage and route self-heal validation.

**Caveats:**
- Windows inference is intentionally conservative and path-shape-based; it improves reasonable local defaults without trying to enumerate every possible custom Windows profile layout.
- `workhorse` has not been rerolled yet; Linux dogfood should happen after Task 7 replays this clean-branch commit downstream.

---

### Task 7: Re-roll Windows-aware defaults into `workhorse` and verify Linux dogfood

**Bead ID:** `nerve-afuj`  
**SubAgent:** `primary`  
**Status:** ✅ Complete

**Files Modified:**
- `server/lib/chat-path-links-config.ts`
- `src/features/chat/chatPathLinksConfig.test.ts`
- `.plans/2026-04-11-chat-link-hardening-lane.md`

**Results:** Re-rolled the Windows-aware default-generation improvement onto local `workhorse` without undoing the earlier server-tree helper fix.

New local `workhorse` HEAD for the reroll:
- `98ebff7` — `feat(chat): add windows-aware path link defaults`

**Validation Run:**
- `npm test -- --run server/routes/workspace.test.ts src/features/chat/chatPathLinksConfig.test.ts`
- `npm run build:server`

**Validation Outcome:**
- passed on Linux/Zorin
- `server/routes/workspace.test.ts`: `11/11` tests passed
- `src/features/chat/chatPathLinksConfig.test.ts`: `5/5` tests passed, including new Windows-aware coverage
- server TypeScript build passed

**Notes:**
- `workhorse` had a half-applied replay in the index that would have moved the helper back out of `server/lib`; this reroll was applied directly against the current `workhorse` layout instead.
- The Windows-aware logic now derives home paths from `workspaceRoot` when possible and falls back to `C:/Users/<user>` for Windows-only username/platform context, while preserving existing Linux/mac behavior.
- Ready for Derrick to run the local dogfood sequence (`update.sh`, `restore.sh`, reopen Nerve) and verify that Linux chat links still self-heal and resolve correctly after pulling in `98ebff7`.

---

---

### Task 8: Package the hardening lane upstream from the clean feature branch

**Bead ID:** `nerve-5de1`  
**SubAgent:** `primary`  
**Status:** ✅ Complete

**Results:** Packaged the clean branch upstream after dropping the in-branch plan-doc commit from the PR diff and pushing `feature/local-chat-links-self-heal-and-defaults` to `origin`.

Created upstream issue:
- #266 — `Bug: harden local chat path links config regeneration and defaults`
- <https://github.com/daggerhashimoto/openclaw-nerve/issues/266>

Opened upstream PR:
- #267 — `fix(chat): harden local chat path links config defaults and self-heal`
- <https://github.com/daggerhashimoto/openclaw-nerve/pull/267>

Packaging/frame used upstream:
- local-host hardening only in `openclaw-nerve`
- self-heal missing `CHAT_PATH_LINKS.json` on local read
- shared source-of-truth helper/template + `ConfigTab` template unification
- richer Linux/macOS/Windows-aware local defaults
- remote/gateway parity explicitly deferred to a separate upstream `openclaw` lane
- settings/editor UX explicitly kept out of scope

---

---

### Task 9: Address CodeRabbit feedback on PR #267

**Bead ID:** `nerve-6vu6`  
**SubAgent:** `primary`  
**Status:** ✅ Complete

**Files Modified:**
- `server/lib/chat-path-links-config.ts`
- `src/features/chat/chatPathLinksConfig.ts`
- `src/features/workspace/tabs/ConfigTab.tsx`
- `src/features/workspace/tabs/ConfigTab.test.tsx`

**Validation Run:**
- `npm test -- --run src/features/chat/chatPathLinksConfig.test.ts src/features/workspace/tabs/ConfigTab.test.tsx server/routes/workspace.test.ts`
- `npm run build`

**Results:** Verified all three CodeRabbit comments against the current branch and applied the two code fixes plus the test cleanup:
- The client/server module-boundary comment was valid. `src/features/chat/chatPathLinksConfig.ts` was only a re-export of the server-only path, so the actual shared implementation was moved into `src/features/chat/chatPathLinksConfig.ts`, and `server/lib/chat-path-links-config.ts` now acts as a thin server wrapper that re-exports from the shared app-safe module.
- The ConfigTab asymmetry comment was directionally valid and feasible. Manual `CHAT_PATH_LINKS.json` creation now seeds template generation with browser-detectable platform plus `workspaceRoot` fetched from the existing `/api/files/tree` response, allowing UI creation to reuse the richer shared defaults when that context is available.
- The test nit was valid. `ConfigTab.test.tsx` now captures the PUT request body and asserts it after the interaction instead of asserting inside the fetch mock.

**Outcome:** Focused tests passed (`19/19`) and the full build passed. The feature branch is ready to commit/push for re-review.

---

---

### Task 10: Fix the remaining CI failure on PR #267

**Bead ID:** `nerve-fk4k`  
**SubAgent:** `primary`  
**Status:** ✅ Complete

**Files Modified:**
- `src/features/workspace/tabs/ConfigTab.test.tsx`
- `.plans/2026-04-11-chat-link-hardening-lane.md`

**Validation Run:**
- `npm test -- --run src/features/workspace/tabs/ConfigTab.test.tsx`
- `npm test -- --run src/features/chat/chatPathLinksConfig.test.ts server/routes/workspace.test.ts`

**Results:** The remaining CI failure was caused by test-state leakage, not product behavior. The first `ConfigTab` test intentionally persists an unsaved `alpha soul draft` to `localStorage`; because the suite did not clear `localStorage` between tests, the later seeded-template test could start in editing mode with that stale draft loaded, producing the CI mismatch (`alpha soul draft` vs `alpha soul`). Fixed this with explicit `localStorage.clear()` in `beforeEach`/`afterEach`, keeping coverage strict while restoring test isolation. Focused `ConfigTab` coverage and adjacent chat-path-links/workspace route tests all passed locally.

---

*Updated on 2026-04-11*
