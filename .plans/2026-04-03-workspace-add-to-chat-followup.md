# Gambit OpenClaw Nerve — workspace Add to chat follow-up

**Date:** 2026-04-03  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Remove the misplaced `Browse by path` helper from below the chat text area and instead add an `Add to chat` action in the workspace viewer context menu so workspace files/folders can be attached from the correct part of the Nerve UI.

---

## Overview

The live dogfood pass validated that the new canonical attachment flow works, including staged upload references from another terminal-backed Nerve session. It also exposed a UX mistake: keeping `Browse by path` beneath the composer teaches the wrong mental model and puts the action in the wrong place. The better product shape is the one already anticipated in the v2 spec: the chat composer should keep one primary paperclip action, while existing workspace items should be attached from the workspace viewer itself.

This follow-up slice should therefore remove the subordinate composer-level `Browse by path` helper, add an `Add to chat` action to the workspace viewer right-click menu, wire it to emit canonical workspace-path-backed attachments through the existing contract, and preserve descriptor/history/subagent compatibility. Because the branch is already dogfoodable enough to gather feedback, this slice should stay narrow and focus on aligning the UI with the intended workspace-first model.

---

## Tasks

### Task 1: Remove the composer-level `Browse by path` helper

**Bead ID:** `nerve-je5w`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-je5w` at start with `bd update nerve-je5w --status in_progress --json`, remove the `Browse by path` helper from below the chat text area while keeping the single-paperclip attachment flow intact, update this plan with the exact files touched, and close the bead on completion with `bd close nerve-je5w --reason "Composer-level Browse by path helper removed" --json`.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/chat/InputBar.tsx`
- `src/features/chat/InputBar.test.tsx`
- `.plans/2026-04-03-workspace-add-to-chat-followup.md`

**Status:** ✅ Complete

**Results:** Removed the subordinate composer-level `Browse by path` affordance from below the message box so the composer now keeps the paperclip as its single primary attachment entry point. Updated the chat input tests to assert that the paperclip remains the primary attachment control and that the obsolete helper no longer appears.

---

### Task 2: Add `Add to chat` to the workspace viewer context menu

**Bead ID:** `nerve-0k9o`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, after the composer cleanup is done, claim bead `nerve-0k9o` at start with `bd update nerve-0k9o --status in_progress --json`, add an `Add to chat` action to the workspace viewer right-click context menu for files/folders, wire it so it inserts a workspace-path-backed attachment/reference into the composer using the existing canonical contract and current compatible descriptor flow, update this plan with the exact files touched, and close the bead on completion with `bd close nerve-0k9o --reason "Workspace viewer Add to chat action implemented" --json`.

**Folders Created/Deleted/Modified:**
- `src/features/file-browser/`
- `src/features/chat/`
- `src/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/App.tsx`
- `src/features/chat/ChatPanel.tsx`
- `src/features/chat/InputBar.tsx`
- `src/features/chat/InputBar.test.tsx`
- `src/features/chat/addToChat.ts`
- `src/features/chat/addToChat.test.ts`
- `src/features/file-browser/FileTreePanel.tsx`
- `src/features/file-browser/FileTreePanel.test.tsx`
- `.plans/2026-04-03-workspace-add-to-chat-followup.md`

**Status:** ✅ Complete

**Results:** Added `Add to chat` to the file tree right-click context menu and wired it through `App` → `ChatPanel` → `InputBar`. File entries now stage a `server_path` / `file_reference` attachment via the existing `/api/upload-reference/resolve` canonical contract, preserving descriptor/history/subagent-forwarding compatibility. Directory entries now append a structured workspace-path context block into the draft so folders can still be referenced from the workspace viewer without inventing a new incompatible attachment descriptor shape.

---

### Task 3: Verify the workspace-driven attachment flow and summarize live-test conclusions

**Bead ID:** `nerve-bwpj`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, after implementation is done, claim bead `nerve-bwpj` at start with `bd update nerve-bwpj --status in_progress --json`, add focused verification for the new workspace `Add to chat` path, confirm the composer still handles normal uploads via the paperclip, summarize the live test conclusion that external uploads are arriving as canonical staged workspace references, update this plan with exact verification results, and close the bead on completion with `bd close nerve-bwpj --reason "Workspace-driven attachment flow verified" --json`.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `src/features/file-browser/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/chat/InputBar.test.tsx`
- `src/features/chat/addToChat.test.ts`
- `src/features/file-browser/FileTreePanel.test.tsx`
- `.plans/2026-04-03-workspace-add-to-chat-followup.md`

**Status:** ✅ Complete

**Results:** Focused verification passed with:
- `npm test -- --run src/features/chat/addToChat.test.ts src/features/chat/InputBar.test.tsx src/features/file-browser/FileTreePanel.test.tsx`
- `npm run build`

Verified behaviors:
- workspace viewer `Add to chat` on a file stages a `server_path` attachment and sends it through the existing canonical file-reference descriptor flow
- workspace viewer `Add to chat` on a directory appends a structured workspace context block to the draft
- the composer still uses the paperclip as the single upload affordance for normal browser uploads
- paperclip/browser uploads still resolve into canonical staged workspace references and preserve the existing forwarding-compatible manifest/descriptor behavior

Live-test conclusion carried forward from dogfood: external uploads are already arriving under canonical staged workspace references rooted at `~/.openclaw/workspace/.temp/nerve-uploads/...`, so this slice only needed to move the user-facing attach entry point to the workspace viewer.

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- Removed the misplaced composer-level `Browse by path` helper so the composer keeps the paperclip as its single primary upload affordance.
- Added `Add to chat` to the workspace file tree context menu and wired it into the existing chat composer attachment pipeline.
- Preserved the existing canonical descriptor/history/subagent-forwarding contract for file attachments by staging file-tree selections as `server_path` file references resolved through `/api/upload-reference/resolve`.
- Kept folder support product-safe by inserting structured workspace path context into the draft rather than inventing a new incompatible folder attachment descriptor.
- Verified both the new workspace-driven flow and the unchanged paperclip/browser upload flow.

**Commits:**
- Pending in this execution slice.

**Lessons Learned:**
- The attachment entry point matters as much as the attachment protocol: keeping paperclip-for-uploads and workspace-viewer-for-existing-files makes the model clearer without disturbing the canonical upload-reference plumbing.
- The live dogfood result reduced risk significantly because the external-upload staging path was already correct; this follow-up only had to realign the UI around that contract.

---

*Completed on 2026-04-03*