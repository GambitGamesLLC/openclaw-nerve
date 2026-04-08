# Finish Bead-Link Routing in Markdown Document Preview

**Date:** 2026-04-08  
**Status:** Draft  
**Agent:** Chip 🐱‍💻

---

## Goal

Complete the remaining `bead:` link routing gap on `feature/bead-viewer` so explicit `bead:` references inside markdown file preview resolve in-app and open the bead viewer instead of falling through as external URLs.

---

## Overview

We verified that `feature/bead-viewer` already contains the renderer-level `bead:` preservation/interception logic and that the chat-rendered markdown path appears wired for `onOpenBeadId`. The remaining gap is in markdown file preview: `TabbedContentArea.tsx` exposes `onOpenBeadId`, but `MarkdownDocumentView.tsx` does not currently accept or forward that handler into `MarkdownRenderer`.

That means explicit `bead:` links inside markdown file preview can still degrade to external-link behavior because the renderer never receives the app-level bead-open callback in that surface. The fix should be narrow: wire `onOpenBeadId` through `MarkdownDocumentView`, add focused tests for markdown document preview behavior, verify the branch, and then keep `feature/bead-viewer` as the canonical Beads source branch.

Combo remains integration-only and is out of scope unless a later follow-up explicitly asks to roll this fix in for dogfood.

---

## Tasks

### Task 1: Trace and document the exact markdown-document-preview routing gap on `feature/bead-viewer`

**Bead ID:** `nerve-gj3s`  
**SubAgent:** `research`  
**Prompt:** Inspect `feature/bead-viewer` in `gambit-openclaw-nerve` and document the exact remaining routing gap for `bead:` links inside markdown document preview. Verify where `onOpenBeadId` stops being threaded and confirm whether chat-rendered markdown is already wired while markdown file preview is not.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `src/features/file-browser/`
- `src/features/markdown/`
- `src/features/chat/`
- `src/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-finish-bead-link-routing-in-markdown-document-preview.md`
- `src/App.tsx`
- `src/features/file-browser/TabbedContentArea.tsx`
- `src/features/file-browser/MarkdownDocumentView.tsx`
- `src/features/chat/ChatPanel.tsx`
- `src/features/chat/MessageBubble.tsx`
- `src/features/markdown/MarkdownRenderer.tsx`

**Status:** ✅ Complete

**Results:** Traced both live routes on `feature/bead-viewer`. Chat path is fully wired: `App.tsx` passes `onOpenBeadId={openBeadId}` into `ChatPanel`, `ChatPanel.tsx` forwards it into each `MessageBubble`, and `MessageBubble.tsx` passes it into every `MarkdownRenderer` render site. Markdown file preview is the remaining broken surface: `App.tsx` passes `onOpenBeadId` into `TabbedContentArea`, and `TabbedContentArea.tsx` accepts it, but the markdown-file branch renders `MarkdownDocumentView` without forwarding `onOpenBeadId`. `MarkdownDocumentView.tsx` also does not declare an `onOpenBeadId` prop and therefore renders `MarkdownRenderer` without it. Because `MarkdownRenderer.tsx` only intercepts `bead:` hrefs when `onOpenBeadId` is present, markdown document preview is the exact remaining gap. Expected fix location: add/forward `onOpenBeadId` in `MarkdownDocumentView.tsx` and pass it from the markdown branch in `TabbedContentArea.tsx`.

---

### Task 2: Fix markdown file preview so `bead:` links open the bead viewer in-app

**Bead ID:** `nerve-1uac`  
**SubAgent:** `coder`  
**Prompt:** On `feature/bead-viewer`, implement the narrowest safe fix so explicit `bead:` references inside markdown document preview route internally and open the bead viewer. Wire `onOpenBeadId` through the necessary file-browser components into `MarkdownRenderer`, preserve existing workspace-path behavior, and add/update focused tests.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `src/features/file-browser/`
- tests adjacent to changed code

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-finish-bead-link-routing-in-markdown-document-preview.md`
- `src/features/file-browser/MarkdownDocumentView.tsx`
- `src/features/file-browser/TabbedContentArea.tsx`
- `src/features/file-browser/MarkdownDocumentView.test.tsx`
- `src/features/file-browser/TabbedContentArea.test.tsx`

**Status:** ✅ Complete

**Results:** Implemented the narrow file-browser handoff fix on `feature/bead-viewer` without touching combo. `TabbedContentArea.tsx` now passes `onOpenBeadId` into the markdown-file branch, and `MarkdownDocumentView.tsx` now declares and forwards `onOpenBeadId` into `MarkdownRenderer` while preserving the existing workspace-path fallback (`basePath ?? file.path`). Added focused tests in `MarkdownDocumentView.test.tsx` to verify bead-handler forwarding plus workspace-path fallback preservation, and added `TabbedContentArea.test.tsx` to verify the markdown preview branch receives `onOpenBeadId`. Focused verification passed: `npm test -- src/features/file-browser/MarkdownDocumentView.test.tsx src/features/file-browser/TabbedContentArea.test.tsx` (6 tests passed). Vitest emitted a pre-existing nested-button DOM warning from the tab UI during the new `TabbedContentArea` test, but the test passed and this task did not modify that structure.

---

### Task 3: Verify the corrected `feature/bead-viewer` branch and document dogfood readiness

**Bead ID:** `nerve-musx`  
**SubAgent:** `primary`  
**Prompt:** Verify the corrected `feature/bead-viewer` branch with focused tests and update this plan with the final results, exact commit(s), and the expected dogfood behavior for `bead:` links clicked from markdown document preview.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-finish-bead-link-routing-in-markdown-document-preview.md`

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
