# gambit-openclaw-nerve — chat link hardening lane

**Date:** 2026-04-11  
**Status:** Complete  
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

*Completed on 2026-04-11*
