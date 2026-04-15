# gambit-openclaw-nerve — PR 253 / PR 267 review cleanup

**Date:** 2026-04-15  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Clear the remaining review/merge blockers on upstream PR `#253` first, then re-check and clean up any remaining actionable review state on PR `#267`.

---

## Overview

After validating the Beads viewer lane and fixing the separate runtime drift bug on the owning PR `#267` lane, both upstream PRs remain open but are not yet fully merge-ready. PR `#253` is the higher-priority cleanup target because it is currently `DIRTY` and still has a more substantial CodeRabbit backlog. PR `#267` is in better shape — green checks, only `BEHIND` — but still needs a sanity pass against stale-looking review comments.

This plan keeps the work split by ownership: first, re-audit and address the current real blocker set on `feature/beads-view-ui` / PR `#253`; second, revisit `feature/local-chat-links-self-heal-and-defaults` / PR `#267` only after `#253` is stabilized. The key rule is to verify every review item against current code before changing anything, since both PRs have accumulated review history across multiple pushes.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Current Beads viewer lane | `.plans/2026-04-15-bead-viewer-note-links-parity.md` |
| `REF-02` | Current PR 267 runtime drift fix lane | `.plans/2026-04-15-pr267-runtime-drift-fix.md` |
| `REF-03` | Live PR state check from 2026-04-15 | current session / `gh pr view` + `gh pr checks` results |

---

## Tasks

### Task 1: Audit and clean up the remaining real blockers on PR 253

**Bead ID:** `nerve-wl1q`  
**SubAgent:** `coder`  
**References:** `REF-01`, `REF-03`  
**Prompt:** Verify the current review and merge blocker set on PR `#253` (`feature/beads-view-ui`) against the current branch head, identify which CodeRabbit/merge issues are still real, fix the real ones narrowly, run validation, push the branch, and summarize what remains if anything.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `server/lib/`
- `src/features/beads/`

**Files Created/Deleted/Modified:**
- `server/lib/beads.ts`
- `server/lib/beads.test.ts`
- `src/features/beads/useBeadDetail.ts`
- `src/features/beads/useBeadDetail.test.ts`
- `.plans/2026-04-15-pr253-pr267-review-cleanup.md`

**Status:** ✅ Complete

**Results:** Verified the current PR 253 review state against branch head and found two still-real issues: (1) shorthand `bead:<id>` lookup fallback in `server/lib/beads.ts` still returned raw `process.cwd()` when a requested workspace was provided and the server cwd sat outside the default workspace, so shorthand lookups were not reliably anchored to the requested workspace; (2) `src/features/beads/useBeadDetail.ts` still guarded state updates after unmount/tab switch but did not abort the underlying fetch, so stale `/api/beads/:id` requests could continue running after the UI stopped caring. The previously reported path-resolution / tab-id / test-cleanup items checked in this pass were stale or already addressed on current head, so they were intentionally left unchanged. Fixed the two real issues narrowly, added a focused hook test for stale-fetch abort behavior, updated the server lookup test to assert workspace anchoring, and validated with `npm test -- --run server/lib/beads.test.ts src/features/beads/useBeadDetail.test.ts` plus `npm run lint` (pass with the same pre-existing hook-deps warnings in `src/contexts/ChatContext.tsx` and `src/hooks/useDashboardData.ts`). Committed as `3ef9164` (`Fix remaining PR 253 bead review blockers`) and ready to push from `feature/beads-view-ui`.

---

### Task 2: Re-check PR 267 after PR 253 stabilization

**Bead ID:** `nerve-9x7h`  
**SubAgent:** `primary`  
**References:** `REF-02`, `REF-03`  
**Prompt:** After Task 1, verify whether PR `#267` still has any real actionable review items beyond being behind base. If needed, prepare the narrowest truthful follow-up; if not, summarize the exact next maintainer-facing step.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-15-pr253-pr267-review-cleanup.md`

**Status:** ✅ Complete

**Results:** Re-checked live PR `#267` directly via `gh pr view`, `gh pr checks`, and GraphQL review-thread state. Current branch head is commit `1b0abcce` (`Fix PR 267 server build output drift`), CI `build` is green, CodeRabbit status is green, and the only actual review thread on the PR is marked `isResolved: true` + `isOutdated: true` for the original cross-boundary client/server import concern in `src/features/chat/chatPathLinksConfig.ts`, which is stale because the shared implementation now lives under `src/features/chat/chatPathLinksConfig.ts` and the client imports from `@/features/chat/chatPathLinks`. The still-visible CodeRabbit summary/nitpick text is also stale on current head: `ConfigTab.test.tsx` already captures the PUT body and asserts it after the click, and `ConfigTab.tsx` already seeds `createChatPathLinksTemplate()` from browser platform plus `/api/files/tree` workspace-root context via `createSeededChatPathLinksTemplate(agentId)`. No real actionable code-review blocker remains from the visible review set; the branch mainly just needs refresh/rebase from `master` and then maintainer/human review because GitHub still reports `mergeStateStatus: BEHIND` and `reviewDecision: REVIEW_REQUIRED`.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Verified the real remaining blocker state on both cleanup PR lanes: PR `#253` still needed two narrow fixes and received them; PR `#267` does not appear to need more code work beyond a normal branch refresh.

**Reference Check:** `REF-02` revalidated against current PR `#267` head and live review state; `REF-03` refreshed with current `gh pr view` / `gh pr checks` / review-thread evidence.

**Commits:**
- `3ef9164` - Fix remaining PR 253 bead review blockers
- `1b0abcce` - Fix PR 267 server build output drift

**Lessons Learned:** Review-summary comments can stay visible long after the underlying inline thread is resolved, so the branch head plus actual thread state matter more than stale summary text.

---

*Completed on 2026-04-15*
