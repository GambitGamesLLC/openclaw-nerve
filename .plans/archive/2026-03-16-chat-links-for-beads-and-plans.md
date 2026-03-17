---
plan_id: plan-2026-03-16-chat-links-for-beads-and-plans
bead_ids:
  - nerve-q0v
  - nerve-0zg
  - nerve-ftx
---
# Chat links for Beads and Plans mentions

**Date:** 2026-03-16  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Make bead and plan mentions in chat render as clickable links styled consistently with Bead and Plan links elsewhere in Nerve, so Derrick can jump directly from chat into the corresponding viewer.

---

## Overview

Right now chat can mention Beads and Plans as plain text, but those mentions are not yet first-class navigation affordances. Derrick wants mentions in chat to behave more like the existing linked Bead/Plan references already shown inside the Beads and Plans viewers: visually recognizable, clickable, and consistent with the existing app styling language.

This belongs in `gambit-openclaw-nerve` because it is a chat rendering and navigation polish change inside Nerve’s UI. The safest implementation path is to inspect how Bead and Plan links are currently rendered in the existing viewers, then reuse that same visual/token pattern in chat rather than inventing a new chip/link style. We also need to verify that clicking from chat opens the correct destination surface and does not regress ordinary markdown/chat rendering.

---

## Tasks

### Task 1: Define the chat mention parsing + link styling/navigation contract

**Bead ID:** `nerve-q0v`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, inspect how Bead and Plan links are currently rendered/styled in the existing Beads and Plans viewers, and inspect the current chat message rendering path. Define the smallest durable implementation for making Bead/Plan mentions in chat clickable and visually consistent with the existing viewer link style. Update this plan with the exact files, mention patterns to support, navigation/open behavior, and validation approach.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-16-chat-links-for-beads-and-plans.md`
- `src/features/markdown/inlineReferences.tsx`
- `src/features/markdown/MarkdownRenderer.tsx`
- `src/features/workspace/tabs/PlansTab.tsx`
- `src/features/chat/ChatPanel.tsx`
- `src/features/chat/MessageBubble.tsx`
- `src/App.tsx`

**Status:** ✅ Complete

**Results:**
- Inspected existing link rendering contract in `src/features/markdown/inlineReferences.tsx` and `src/features/workspace/tabs/PlansTab.tsx`.
- Confirmed existing Bead/Plan visual language already exists as inline chip buttons:
  - Bead chip: `border-primary/25 bg-primary/10 ... text-primary`
  - Plan chip: `border-purple/20 bg-purple/10 ... text-purple`
- Confirmed chat rendering path is `ChatPanel` → `MessageBubble` → `MarkdownRenderer`, but chat did not pass inline reference handlers, so bead/plan text stayed plain markdown text.
- Chosen contract:
  1. Reuse existing `MarkdownRenderer` + `inlineReferences` pipeline in chat (no custom parser in chat).
  2. Wire chat callbacks for `onOpenTask` and `onOpenPlanReference` into `MessageBubble` markdown rendering.
  3. Keep ordinary markdown behavior untouched (normal links remain `<a>` links).
  4. Open Bead mentions through existing board navigation callback (`openTaskInBoard`).
  5. Open Plan mentions through existing plan navigation callback (`openPlanInWorkspace`) and preserve source context where available.
  6. Make `.plans/...md` mentions clickable even when plan metadata is not preloaded in local summaries.

---

### Task 2: Implement clickable Bead/Plan links in chat with shared styling

**Bead ID:** `nerve-0zg`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, implement chat rendering so Bead and Plan mentions become clickable links using the same or deliberately shared styling pattern already used in the Beads and Plans viewers. Preserve normal chat markdown/text rendering, and make sure clicking opens or focuses the corresponding Bead/Plan destination cleanly. Update this plan with exact files changed, validation, and any edge cases.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/markdown/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-16-chat-links-for-beads-and-plans.md`
- `src/features/chat/ChatPanel.tsx`
- `src/features/chat/MessageBubble.tsx`
- `src/features/markdown/inlineReferences.tsx`
- `src/features/workspace/WorkspacePanel.tsx`
- `src/features/workspace/hooks/usePlanReferenceSummaries.ts` (new)
- `src/App.tsx`

**Status:** ✅ Complete

**Results:**
- Wired chat message markdown rendering to the existing inline references system by threading `referencePlans`, `onOpenTaskReference`, and `onOpenPlanReference` from `App` → `ChatPanel` → `MessageBubble` → `MarkdownRenderer`.
- Reused existing inline chip styling from `inlineReferences.tsx` (primary bead chips and purple plan chips) so chat mentions match Plans/Beads visual language.
- Updated inline plan-link matching so `.plans/...md` references are clickable whenever `onOpenPlanReference` is provided, even if that path is not in the currently loaded plan summaries.
- Added lightweight plan summaries loader (`usePlanReferenceSummaries`) so chat tooltips/known bead inference can use current plan metadata without loading full plan documents.
- Updated workspace wiring so plan opens from chat carry `sourceId` through `requestedPlanSourceId` when opening the Plans tab in workspace mode.

---

### Task 3: Validate click-through behavior and visual consistency

**Bead ID:** `nerve-ftx`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, validate that chat-linked Beads and Plans are clickable, visually consistent with existing Bead/Plan links in the app, and navigate to the correct destination without regressing ordinary message rendering. Add or update focused tests as needed, then update this plan with exact validation results and remaining gaps.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/markdown/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-16-chat-links-for-beads-and-plans.md`
- `src/features/chat/MessageBubble.references.test.tsx` (new)
- `src/features/markdown/MarkdownRenderer.references.test.tsx`

**Status:** ✅ Complete

**Results:**
- Added focused chat-level reference behavior coverage in `src/features/chat/MessageBubble.references.test.tsx`:
  - verifies bead ID chip click calls task navigation callback
  - verifies plan path chip click calls plan navigation callback
  - verifies ordinary markdown links still render as standard anchors
- Expanded markdown inline reference test coverage in `src/features/markdown/MarkdownRenderer.references.test.tsx` to ensure `.plans/...md` links work even when plan summaries are absent.
- Ran focused validation commands:
  - `npm test -- src/features/markdown/MarkdownRenderer.references.test.tsx src/features/chat/MessageBubble.references.test.tsx`
  - `npm test -- src/features/workspace/tabs/PlansTab.test.tsx`
  - `npm run build`
- Validation outcome: all targeted tests passed and production build passed (including `build:server`).

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- Chat messages now render Bead IDs and Plan paths as clickable inline chips using the same inline reference styling already used in plans markdown rendering.
- Clicking a Bead mention opens/focuses the Kanban task destination.
- Clicking a Plan mention opens/focuses the Plans destination path cleanly, including source-aware routing when available.
- Existing markdown behavior is preserved for ordinary links/text.
- Derrick performed live Nerve verification and confirmed chat-linked beads and plans can be clicked and auto-navigate into the correct Nerve viewer.

**Commits:**
- Not committed (per instruction: do not commit or push).

**Lessons Learned:**
- Reusing `MarkdownRenderer` + `inlineReferences` in chat was the lowest-risk path and guaranteed visual consistency without adding a second parser.
- Allowing `onOpenPlanReference` to handle unmatched `.plans/...md` paths improves chat robustness when plan summaries are stale or not yet loaded.

---

*Created on 2026-03-16*