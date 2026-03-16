---
plan_id: plan-2026-03-15-add-to-chat-context-and-mobile-compose-expand
bead_ids:
  - nerve-8hu
  - nerve-7z4
---
# Nerve Add to Chat context + mobile composer expansion

**Date:** 2026-03-15  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Improve `Add to Chat` so injected plan/bead context identifies its source repo clearly and expands the mobile composer immediately after injection.

---

## Overview

The new `Add to Chat` flow is working, which means the basic bridge from browsing plans/beads into the chat composer is solid. Derrick’s first mobile pass found two UX gaps. First, the injected payload was missing enough repo/source context, so a bare bead ID or path was not self-evident once it landed in chat. Second, on mobile the composer stays visually collapsed/small until the user starts typing, even though injected content is already present; the expected behavior is that the composer should expand into its larger readable state immediately when content is appended.

This work belongs in `gambit-openclaw-nerve` because both issues are local to the new Add to Chat interaction design and mobile composer presentation. This update keeps scope strictly to the payload/context slice for Task 1; composer expansion remains separate follow-up work in Task 2.

---

## Tasks

### Task 1: Add repo/source context to Add to Chat payloads

**Bead ID:** `nerve-8hu`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, update the Add to Chat payload format so plans and beads clearly identify the source/project they came from. Keep the injected text concise but self-explanatory. For plans, include source/project plus title and path; for beads, include source/project plus title and bead ID. Update this plan with the exact chosen format, files changed, validation, and results.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/kanban/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-add-to-chat-context-and-mobile-compose-expand.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/addToChat.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/addToChat.test.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/kanban/BeadsDetailDrawer.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/kanban/BeadsDetailDrawer.test.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/hooks/usePlans.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/workspace/tabs/PlansTab.test.tsx`

**Status:** ✅ Complete

**Results:**
- Adopted a concise 4-line/3-line payload format that keeps source first for quick chat scanning, especially on mobile:
  - Plans:
    ```text
    Plan context:
    - Source: <source label>
    - Title: <plan title>
    - Path: <full repo-relative plan path>
    ```
  - Beads:
    ```text
    Bead context:
    - Source: <source label>
    - Title: <bead title>
    - ID: <bead id>
    ```
- Updated the shared Add to Chat formatter to accept optional `source` metadata and omit the line when blank.
- Wired plan Add to Chat to use the resolved Plans source label from the `/api/plans` response, falling back to `sourceId` if needed.
- Wired bead Add to Chat to use the existing board/drawer `sourceLabel`.
- Added targeted helper/UI tests to verify both payload shapes and the new source line.
- Validation passed:
  - `npm test -- --run src/features/chat/addToChat.test.ts src/features/workspace/tabs/PlansTab.test.tsx src/features/kanban/BeadsDetailDrawer.test.tsx`
  - `npm run build`
- Commit:
  - `2781322` — `Add source context to Add to Chat payloads`

---

### Task 2: Expand the mobile composer immediately after Add to Chat injection

**Bead ID:** `nerve-7z4`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, fix the mobile composer behavior so when Add to Chat appends plan/bead context, the composer opens into its larger readable state immediately rather than staying visually collapsed until the user types. Update this plan with files changed, validation, and results.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-03-15-add-to-chat-context-and-mobile-compose-expand.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/InputBar.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/InputBar.test.tsx`

**Status:** ✅ Complete

**Results:**
- Traced the current path as `PlansTab` / `BeadsDetailDrawer` → shared `format*AddToChat` helper → `App.addToChat()` → `ChatPanel.injectText()` → `InputBar.injectText()`.
- Identified the mobile-specific failure mode: the textarea resized immediately while the chat panel was still hidden during the view switch, so the browser measured the injected draft at the old hidden width/one-line height. The composer only re-measured after manual typing.
- Implemented the smallest durable fix in `InputBar.injectText()`: keep the existing immediate resize/focus, then schedule a double-`requestAnimationFrame` deferred resize so the textarea re-measures after the chat panel becomes visible and layout settles. The caret is restored at the end of the injected draft after the deferred pass.
- Added a focused regression test that mocks `scrollHeight` changing between the immediate injection pass and the deferred post-layout pass, asserting the textarea height expands without manual typing.
- Validation passed:
  - `npm test -- --run src/features/chat/InputBar.test.tsx src/features/chat/addToChat.test.ts src/features/workspace/tabs/PlansTab.test.tsx src/features/kanban/BeadsDetailDrawer.test.tsx`
  - `npm run build`
- Commit:
  - `4d76ca1` — `Expand composer after Add to Chat injection`

---

## Final Results

**Status:** ✅ Complete

**What We Built:** `Add to Chat` now does both parts of the intended polish: plans and beads inject concise source-aware context into chat, and the composer visibly expands into its larger readable state immediately after injection on mobile instead of waiting for manual typing.

**Commits:**
- `2781322` - Add source context to Add to Chat payloads
- `4d76ca1` - Expand composer after Add to Chat injection

**Lessons Learned:** When injected text lands while a panel is hidden, the first textarea auto-size pass can measure against the wrong layout. A targeted post-layout resize is enough to keep the uncontrolled composer behavior intact without broadening scope.

---

*Updated on 2026-03-15*