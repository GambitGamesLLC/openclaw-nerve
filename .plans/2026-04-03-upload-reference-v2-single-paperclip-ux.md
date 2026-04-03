---
plan_id: plan-2026-04-03-upload-reference-v2-single-paperclip-ux
bead_ids:
  - nerve-umyc
  - nerve-hxbu
  - nerve-2un0
---
# Gambit OpenClaw Nerve — upload/reference v2 single-paperclip UX

**Date:** 2026-04-03  
**Status:** Complete  
**Agent:** Chip 🐱💻

---

## Goal

Simplify the visible attachment UX in `gambit-openclaw-nerve` from the current dual-action model (`Upload files` + `Attach by Path`) to the v2 single-paperclip attachment flow, while preserving the already-landed canonical upload/reference contract and keeping live deployment pinned until the branch is proven ready for reversible dogfooding.

---

## Overview

The previous Phase B slices established the server-side canonical contract and rewired the real attachment flow in the composer to use it end-to-end. That meant the remaining user-facing mismatch was mostly presentational: the composer still taught two parallel attachment concepts even though the underlying transport had already converged.

This slice kept the change narrow. The paperclip is now the single primary attachment affordance and opens the browser file picker directly. The server/workspace path picker remains available, but only as a subordinate helper action (`Browse by path`) in the composer hint row rather than as a peer top-level menu item. The canonical `/api/upload-reference/resolve` flow, descriptor schema, transcript/history parsing, and subagent-forwarding defaults were preserved.

The branch is more aligned with the v2 design after this slice, but this work alone does not justify the future reversible `~/.openclaw/.env` dogfood cutover yet. Focused tests passed, but this run did not perform a live dogfood flip and there are still adjacent legacy/readiness items outside this narrow UX change.

---

## Tasks

### Task 1: Simplify the composer attachment affordance to the v2 single-paperclip flow

**Bead ID:** `nerve-umyc`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-umyc` at start with `bd update nerve-umyc --status in_progress --json`, update the composer attachment UX so users no longer choose between separate `Upload files` and `Attach by Path` entrypoints, and keep the smallest coherent implementation that matches the v2 design and canonical contract already in place. Close the bead on completion with `bd close nerve-umyc --reason "Single-paperclip composer affordance implemented" --json`.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/chat/InputBar.tsx`
- `src/features/chat/InputBar.test.tsx`
- `.plans/2026-04-03-upload-reference-v2-single-paperclip-ux.md`

**Status:** ✅ Complete

**Results:** Replaced the paperclip menu with a direct primary attach action. The paperclip now opens the browser file picker immediately, and the path-based flow moved to a subordinate `Browse by path` helper action in the composer hint row. The path picker dialog title was updated to `Browse workspace files`. No server contract or transport-path logic was changed.

---

### Task 2: Preserve attachment compatibility and add focused UX coverage

**Bead ID:** `nerve-hxbu`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, after the UX change is in place, claim bead `nerve-hxbu` at start with `bd update nerve-hxbu --status in_progress --json`, ensure the single-paperclip change preserves existing attachment descriptor, transcript/history, and subagent-forwarding behavior, and add focused tests around the new interaction model. Close the bead on completion with `bd close nerve-hxbu --reason "Single-paperclip compatibility preserved and UX coverage added" --json`.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/chat/InputBar.test.tsx`
- `.plans/2026-04-03-upload-reference-v2-single-paperclip-ux.md`

**Status:** ✅ Complete

**Results:** Updated the focused composer tests to cover the new interaction model: the paperclip is the only primary affordance, the subordinate `Browse by path` action still opens the validated workspace/server path picker, and server-path attachments still stage as `server_path` + `file_reference`. Existing send/history/rendering compatibility tests remained green, preserving descriptor manifest behavior, transcript/history extraction, and default subagent-forwarding behavior.

---

### Task 3: Verify the single-paperclip slice and assess dogfood-cutover readiness

**Bead ID:** `nerve-2un0`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, after implementation/testing is done, claim bead `nerve-2un0` at start with `bd update nerve-2un0 --status in_progress --json`, run focused verification for the single-paperclip slice, summarize what passed, identify any remaining legacy UX/edge cases, and explicitly assess whether the branch is now ready or not ready for the future reversible `~/.openclaw/.env` dogfood cutover. Close the bead on completion with `bd close nerve-2un0 --reason "Single-paperclip slice verified and dogfood readiness assessed" --json`.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-03-upload-reference-v2-single-paperclip-ux.md`

**Status:** ✅ Complete

**Results:** Focused verification passed via:
- `npm test -- --run src/features/chat/InputBar.test.tsx src/features/chat/operations/sendMessage.test.ts src/features/chat/operations/loadHistory.test.ts src/features/chat/MessageBubble.uploadSummary.test.tsx`

What passed:
- updated composer interaction tests
- upload descriptor generation and send-path behavior
- transcript/history upload manifest extraction
- upload summary rendering for mixed attachment origins/modes

Additional note:
- `npx eslint src/features/chat/InputBar.tsx src/features/chat/InputBar.test.tsx` reported an existing `react-refresh/only-export-components` violation on `InputBar.tsx` because that file already exports the test reset helper alongside the component. This slice did not broaden into a component/helper split.

Remaining legacy UX / edge cases:
- composer test stderr still shows pre-existing React `act(...)` warnings in unrelated existing tests
- this run did not perform any live browser/manual dogfood pass against a flipped `~/.openclaw/.env`
- historical message summaries still intentionally use the old `Upload` / `Attach by Path` wording for compatibility/debug continuity

**Dogfood cutover assessment:** **Not ready yet.** The branch is ready for the visible single-paperclip UX slice, but this run did not validate the future reversible dogfood cutover itself and did not resolve adjacent readiness items outside this narrow change.

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:**
- A narrow v2 single-paperclip composer UX on top of the already-landed canonical upload/reference contract.
- The paperclip is now the single primary attach entrypoint.
- Workspace/server path attachment remains available as a subordinate `Browse by path` action instead of a peer top-level entrypoint.
- Focused tests were updated and compatibility checks stayed green.

**Commits:**
- Not created in this subagent run.

**Lessons Learned:**
- The UX simplification can stay narrow because the canonical attachment contract was already in place.
- Preserving compatibility is easier when the visible affordance changes but descriptor/history contracts remain untouched.
- Dogfood readiness should stay conservative until the branch gets an explicit live cutover validation step, not just unit/integration coverage.

---

*Completed on 2026-04-03*