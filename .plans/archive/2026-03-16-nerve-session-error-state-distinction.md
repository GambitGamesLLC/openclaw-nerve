---
plan_id: plan-2026-03-16-nerve-session-error-state-distinction
bead_ids:
  - nerve-3mx
  - nerve-7v8
  - nerve-zus
---
# Nerve Session Error State Distinction

**Date:** 2026-03-16  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Make Nerve distinguish a transient model/provider failure from a truly dead/crashed session so the UI stops implying the whole session died when the runtime is still healthy.

---

## Overview

We do not yet trust the exact reason behind the error state. What we do know is that this failure mode is severe in practice: once it happens, the current Nerve presentation pushes us into a reset/restart path, which makes the bug expensive to study and easy to misclassify. The immediate goal is not to overfit to one guessed root cause, but to trace the actual state pipeline and prove where the bad state gets introduced.

There is also an important comparative clue: Chip is repeatedly hitting this issue while the other OpenClaw agents (Cookie and Byte) are not, even though they are on the same OpenAI-Codex subscription. That suggests the right diagnosis may involve local runtime/session handling, embedded-run state translation, or Nerve’s interpretation layer rather than a blanket account-level provider problem.

The fix path stays the same but the bar is higher: first identify the exact code path that turns a transient run/request failure into session `ERROR`, then change Nerve so provider/request failure and true dead-session/crash are represented differently, and finally validate the resulting behavior with focused tests and targeted checks. The work will stay inside `gambit-openclaw-nerve` and be tracked with repo-local Beads.

---

## Tasks

### Task 1: Trace current session ERROR mapping in Nerve

**Bead ID:** `nerve-3mx`  
**SubAgent:** `main`  
**Prompt:** Audit `gambit-openclaw-nerve` session status/state mapping to find where transient embedded-run failures become session `ERROR` in Nerve. Claim bead `nerve-3mx` on start with `bd update nerve-3mx --status in_progress --json`, document the exact files/functions/components involved, and close it on completion with `bd close nerve-3mx --reason "Mapped transient run failure to current UI/session error handling" --json`. Include implementation guidance for the next bead.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-16-nerve-session-error-state-distinction.md`

**Status:** ✅ Complete

**Results:** Evidence trace completed (no fix implemented). Exact ERROR derivation is local to Nerve UI state mapping, not proven provider/account-only:
- `src/contexts/SessionContext.tsx`
  - `setGranularStatus` treats anything not `IDLE`/`DONE` as busy (`busyState`), so `ERROR` is treated as running (`lines 66-73`).
  - Agent lifecycle `phase === 'error'` maps directly to `setGranularStatus(..., { status: 'ERROR' })` (`lines 476-487`).
  - Chat `state === 'error'` also maps directly to `status: 'ERROR'` (`lines 506-523`).
  - Legacy agent `state === 'error'` maps to `status: 'ERROR'` too (`lines 531-547`).
  - Only `DONE` auto-clears to `IDLE` after 3s; `ERROR` has no auto-clear path (`lines 136-156`).
- `src/features/sessions/SessionList.tsx` + `src/features/sessions/SessionNode.tsx` + `src/features/sessions/statusUtils.ts`
  - Sidebar status badge prefers granular status, so mapped `ERROR` is rendered as hard red `ERROR` badge (`SessionNode lines 183-191`, `statusUtils lines 15-27`).
  - `running` derives from `busyState`, so `ERROR` sessions are considered running and expose abort affordances (`SessionList line 175`, `SessionNode lines 145-148`).
- Comparison evidence:
  - **Transient embedded-run failure:** in `src/features/chat/operations/streamEventHandler.ts`, lifecycle `phase === 'error'` is classified as `lifecycle_end` (line 92), and `ChatContext` handles it like end/recovery, not explicit chat-error poison (`ChatContext lines 290-305`).
  - **Transient request/chat failure:** `chat state=error` becomes `chat_error` (`streamEventHandler line 139`) and then `SessionContext` still marks session `ERROR`.
  - **True dead-session handling:** no dedicated per-session death detector found in Nerve (no health/presence/session-liveness mapping; only generic presence logging and websocket connection state).
- Guidance for `nerve-7v8` (minimal change):
  1. Split run-level failure from session-liveness in `SessionContext` (new granular status such as `FAILED` or `RUN_ERROR` for transient run failure).
  2. Exclude transient failure status from `busyState` running derivation (keep running only for active states).
  3. Keep `ERROR` reserved for confirmed dead/unreachable session criteria (to be explicitly defined), not generic `chat error`/`lifecycle error`.
  4. Update badge rendering so transient run failure is visually distinct from dead session.


---

### Task 2: Implement distinct UI/session-state handling for request failure vs dead session

**Bead ID:** `nerve-7v8`  
**SubAgent:** `main`  
**Prompt:** Implement the Nerve-side session state/UI changes so transient provider/request failures do not present as the same hard `ERROR` state as a truly dead/crashed session. Claim bead `nerve-7v8` on start with `bd update nerve-7v8 --status in_progress --json`, make the code/test changes, and close it on completion with `bd close nerve-7v8 --reason "Implemented distinct session-state handling for request failure vs dead session" --json`. Reference the findings from bead `nerve-3mx` before changing code.

**Folders Created/Deleted/Modified:**
- `src/contexts/`
- `src/features/sessions/`

**Files Created/Deleted/Modified:**
- `src/types.ts`
- `src/contexts/SessionContext.tsx`
- `src/features/sessions/granularStatus.ts` (new)
- `src/features/sessions/statusUtils.ts`
- `src/features/sessions/granularStatus.test.ts` (new)
- `src/features/sessions/statusUtils.test.ts` (new)

**Status:** ✅ Complete

**Results:** Implemented focused session-state split between transient run/request failures and hard session failures:
- Added new granular status `FAILED` to represent transient provider/request/run failures.
- Updated event mapping in `SessionContext` so lifecycle/chat/legacy `error` states map to `FAILED` instead of `ERROR`.
- Added a dedicated mapping utility (`granularStatus.ts`) and centralized run/busy determination via `isStatusRunning`.
- Updated busy-state derivation so only active states (`THINKING`, `STREAMING`) are treated as running; `FAILED` is explicitly non-running.
- Reserved hard `ERROR` for explicit dead/unreachable legacy session states (`dead`, `crashed`, `unreachable`, `terminated`).
- Updated badge styling to render `FAILED` distinctly from hard `ERROR`.
- Added tests covering:
  - transient lifecycle/chat/legacy errors map to `FAILED`
  - `FAILED` is not treated as running
  - hard `ERROR` remains distinct and rendered differently from `FAILED`
- Validation command:
  - `npm test -- src/features/sessions/granularStatus.test.ts src/features/sessions/statusUtils.test.ts` ✅ (2 files, 4 tests passed).

---

### Task 3: Validate the new state distinctions and update the plan with actual behavior

**Bead ID:** `nerve-zus`  
**SubAgent:** `main`  
**Prompt:** Validate the new Nerve session-state behavior with focused tests/builds and summarize the resulting UX/state distinctions. Claim bead `nerve-zus` on start with `bd update nerve-zus --status in_progress --json`, run the relevant validation, and close it on completion with `bd close nerve-zus --reason "Validated session-state distinction behavior" --json`. Include exact commands and outcomes.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-16-nerve-session-error-state-distinction.md`

**Status:** ✅ Complete

**Results:** Validation completed against `nerve-7v8` implementation with focused tests plus broader compile/build:
- `bd update nerve-zus --status in_progress --json` ✅ (bead claimed)
- `npm test -- --run src/features/sessions/granularStatus.test.ts src/features/sessions/statusUtils.test.ts` ✅
  - 2 test files passed (`granularStatus.test.ts`, `statusUtils.test.ts`)
  - 4 tests total passed
  - Confirms transient lifecycle/chat/legacy errors map to `FAILED`, `FAILED` is not running/busy, and dead/unreachable legacy states remain `ERROR`.
- `npm run build` ✅
  - TypeScript build + Vite client build + server build all completed successfully.
  - Non-blocking existing Vite chunking warning for CodeMirror dynamic/static import overlap; no compile/test failure.

Caveats/remaining risk:
- Validation is currently automated/unit-level for mapping and running-state semantics; no live runtime/manual UI interaction replay was executed in this task.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Nerve now cleanly distinguishes transient run/request failures from true dead-session failures in session state rendering and running-state semantics, and that behavior is validated with focused tests plus successful project build. Derrick also captured a live repro after rollout showing `FAILED` (not hard `ERROR`) on Chip, and the session recovered after a simple follow-up bump message, which supports the new classification even though the underlying transient terminal/runtime failure path still needs future root-cause work.

**Commits:**
- None in this validation task (verification + plan update only).

**Lessons Learned:**
- Keeping state-mapping logic isolated (`granularStatus` + `isStatusRunning`) makes behavioral validation straightforward and explicit.
- A focused test pass plus full build gives strong confidence for this kind of UI state refactor, though live runtime replay remains the last-mile confidence step.

---

*Completed on 2026-03-16*
