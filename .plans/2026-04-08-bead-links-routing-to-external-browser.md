# Bead Links Route to External Browser Instead of Nerve

**Date:** 2026-04-08  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Fix the remaining `bead:` markdown-link runtime bug so links open inside Nerve instead of falling through as external browser URLs, while keeping the combo branch clean and landing any direct code fix on the Beads feature branch first.

---

## Overview

Yesterday’s fix solved the first half of the markdown-link problem: `bead:` links now survive markdown rendering and show up as clickable anchors. Derrick has now confirmed the remaining failure mode in live dogfood: the links are clickable again, but clicking them resolves as external browser navigation instead of internal Nerve routing.

That means the next debugging target is no longer markdown sanitization; it is the click interception / routing path after anchor creation. We need to reproduce the current behavior, trace where the anchor click escapes the in-app bead handler, implement the narrowest correct fix on the Beads feature branch, verify it in tests and live behavior, and only then roll that proven fix into the clean combo branch.

This plan explicitly preserves the branch discipline Derrick requested:
- `feature/combo-workhorse-all-unmerged-2026-04-07` remains a clean integration branch
- any direct fix lands first on the Beads feature branch
- combo only receives the already-proven fix as a roll-forward/cherry-pick

---

## Tasks

### Task 1: Reproduce the live click-routing bug and trace the runtime path

**Bead ID:** `nerve-d55b`  
**SubAgent:** `coder`  
**Prompt:** Investigate the current `bead:` markdown-link behavior in `gambit-openclaw-nerve`. Reproduce the issue where links in `/home/derrick/.openclaw/workspace/bead-link-dogfood.md` are clickable but open as external browser URLs instead of routing inside Nerve. Claim the bead on start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Reproduced and traced live bead-link routing bug" --json`. Identify the exact runtime click path, the event/default-prevent behavior, and the component(s) responsible for internal routing.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `src/features/markdown/`
- `src/features/beads/`
- `src/features/chat/`
- `src/features/file-browser/`
- app-level navigation wiring in `src/App.tsx`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-bead-links-routing-to-external-browser.md`
- `src/features/markdown/MarkdownRenderer.tsx`
- `src/features/markdown/MarkdownRenderer.test.tsx`
- `src/features/beads/links.ts`
- `src/features/chat/MessageBubble.tsx`
- `src/features/chat/ChatPanel.tsx`
- `src/features/file-browser/MarkdownDocumentView.tsx`
- `src/App.tsx`

**Status:** ✅ Complete

**Results:** Reproduced by code-path trace on the combo branch. Exact runtime path: `MarkdownRenderer.tsx` preserves `bead:` URLs via `transformMarkdownUrl()`, then its custom anchor renderer checks `if (onOpenBeadId && isBeadLinkHref(href))`, calls `event.preventDefault()`, and dispatches `onOpenBeadId(decodeBeadLinkHref(href))`. The live bug happens because the handler is missing at the real render sites: `MessageBubble.tsx` renders `<MarkdownRenderer ... onOpenWorkspacePath={...} />` with no `onOpenBeadId`; `ChatPanel.tsx` only threads `onOpenWorkspacePath`; `MarkdownDocumentView.tsx` also omits `onOpenBeadId`; and `App.tsx` already owns the intended in-app task routing hook (`openTaskInBoard(taskId)`, which sets `pendingTaskId` and switches to `kanban`) but never passes it down into those markdown surfaces. With `onOpenBeadId` undefined, the bead-link branch is skipped, so no `preventDefault()` runs and the anchor falls through to the final external-link render path (`target="_blank" rel="noopener noreferrer"`). Root cause category: missing anchor-handler/routing handoff props, not bad `bead:` href classification and not a broken router dispatch inside the existing handler. Narrowest likely fix: plumb `openTaskInBoard` (or a thin equivalent) from `App.tsx` into chat + markdown document `MarkdownRenderer` call sites, then add integration coverage proving explicit `bead:` links do not receive browser-fallback anchor props and do trigger the kanban/task handoff. Existing unit tests in `MarkdownRenderer.test.tsx` already prove the lower-level interception works when the handler is supplied; the missing coverage is for the prop wiring in the live surfaces.

---

### Task 2: Land the direct fix on the Beads feature branch with focused tests

**Bead ID:** `nerve-1vl5`  
**SubAgent:** `coder`  
**Prompt:** On the Beads feature branch for `gambit-openclaw-nerve`, implement the narrowest safe fix so explicit `bead:` markdown links open inside Nerve instead of falling through to external browser navigation. Claim the bead on start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Implemented and verified internal bead-link routing fix on narrow branch" --json`. Add or update focused tests covering click interception, routing behavior, and any required anchor attributes/default-prevent semantics.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `src/features/chat/`
- `src/features/file-browser/`
- app-level routing in `src/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-bead-links-routing-to-external-browser.md`
- `src/App.tsx`
- `src/features/chat/ChatPanel.tsx`
- `src/features/chat/MessageBubble.tsx`
- `src/features/file-browser/TabbedContentArea.tsx`
- `src/features/file-browser/MarkdownDocumentView.tsx`
- `src/features/chat/ChatPanel.test.tsx`
- `src/features/chat/MessageBubble.test.tsx`
- `src/features/file-browser/MarkdownDocumentView.test.tsx`

**Status:** ✅ Complete

**Results:** Created a fresh narrow branch from the current combo codebase (`slice/nerve-1vl5-bead-link-routing`) because the older Beads slice worktree was based on an earlier bead-viewer-tab experiment and no longer matched the current `openTaskInBoard(taskId)` routing path. Implemented the narrow prop-wiring fix so live markdown surfaces now pass `onOpenBeadId` all the way down to `MarkdownRenderer`: `App.tsx` now hands `openTaskInBoard` into both `ChatPanel` and `TabbedContentArea`; `ChatPanel.tsx` forwards it to `MessageBubble`; `MessageBubble.tsx` forwards it through every markdown render path (thinking, intermediate, and normal message bodies) and includes it in the memo comparator; `TabbedContentArea.tsx` forwards it into markdown document preview; and `MarkdownDocumentView.tsx` now passes it to `MarkdownRenderer` while preserving the existing workspace-path/base-path callback behavior. Added focused regression coverage instead of broad churn: new `ChatPanel.test.tsx` proves the bead handler is forwarded into rendered message bubbles, `MessageBubble.test.tsx` now proves bead-handler prop changes re-render through the memo boundary, and `MarkdownDocumentView.test.tsx` proves markdown preview receives both workspace-path and bead handlers. Verification run: `npm test -- --run src/features/chat/ChatPanel.test.tsx src/features/chat/MessageBubble.test.tsx src/features/file-browser/MarkdownDocumentView.test.tsx src/features/markdown/MarkdownRenderer.test.tsx` → 4 files passed, 43 tests passed.

---

### Task 3: Roll the proven narrow-branch fix into the clean combo branch and verify dogfood readiness

**Bead ID:** `nerve-e50j`  
**SubAgent:** `primary`  
**Prompt:** After the narrow Beads branch fix is committed and proven, roll that exact fix into `feature/combo-workhorse-all-unmerged-2026-04-07` without adding unrelated direct changes. Claim the bead on start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Rolled proven bead-link routing fix into clean combo branch and verified" --json`. Run focused tests and a full build, document the exact commit(s), and prepare Derrick’s dogfood instructions.

**Folders Created/Deleted/Modified:**
- `.plans/`
- the exact code/test folders touched by the proven fix

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-bead-links-routing-to-external-browser.md`
- only the runtime/test files required for the proven roll-forward

**Status:** ⏳ Pending

**Results:** Pending.

---

## Final Results

**Status:** ⏳ Pending

**What We Built:** Pending.

**Commits:**
- Pending

**Lessons Learned:** Pending.

---

*Drafted on 2026-04-08*
