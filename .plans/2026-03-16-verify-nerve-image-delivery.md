---
plan_id: plan-2026-03-16-verify-nerve-image-delivery
bead_ids:
  - nerve-3sj
---
# Verify Nerve image delivery into chat sessions

**Date:** 2026-03-16  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Verify whether images sent through the Nerve chat UI actually arrive in the assistant session with usable image payload/context.

---

## Overview

This verification focuses on the end-to-end image path from Nerve UI attachment selection through `chat.send` RPC into OpenClaw runtime dispatch. The key distinction is whether images are only rendered locally in the UI vs. actually delivered to the model run as image inputs.

Code inspection confirms Nerve is building and sending `attachments` with base64 image payloads, and OpenClaw gateway `chat.send` converts those into structured image blocks passed to the agent run (`replyOptions.images`). We still need one live operator send to conclusively verify behavior in-session with a known image-specific prompt.

---

## Tasks

### Task 1: Define and run a controlled Nerve image-delivery verification

**Bead ID:** `nerve-3sj`  
**SubAgent:** `coder`

**Status:** ⚙️ In Progress (awaiting live operator send)

**Files inspected (Nerve repo):**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/InputBar.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/image-compress.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/operations/sendMessage.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/operations/sendMessage.test.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/contexts/ChatContext.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/operations/loadHistory.ts`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/src/features/chat/MessageBubble.tsx`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/server/lib/ws-proxy.ts`

**Runtime-path reference files inspected (OpenClaw runtime):**
- `/home/derrick/.openclaw/workspace/projects/openclaw/src/gateway/server-methods/chat.ts`
- `/home/derrick/.openclaw/workspace/projects/openclaw/src/gateway/chat-attachments.ts`
- `/home/derrick/.openclaw/workspace/projects/openclaw/src/auto-reply/types.ts`
- `/home/derrick/.openclaw/workspace/projects/openclaw/src/auto-reply/reply/agent-runner-execution.ts`
- `/home/derrick/.openclaw/workspace/projects/openclaw/src/gateway/server.chat.gateway-server-chat.test.ts`

**Runtime/data path involved:**
1. `InputBar.tsx` accepts/drag-drops/pastes image files, compresses to base64 (`image-compress.ts`), stores pending images.
2. On send, `ChatContext.handleSend` calls `sendChatMessage`.
3. `sendChatMessage.ts` sends RPC `chat.send` with:
   - `message` (possibly empty)
   - `attachments: [{ mimeType, content(base64) }]`
4. Nerve `ws-proxy.ts` forwards `chat.send` payload unchanged to gateway.
5. OpenClaw gateway `chat.ts` normalizes attachments and calls `parseMessageWithAttachments(...)`.
6. `chat-attachments.ts` validates base64, sniffs mime, drops non-images, produces `images: [{ type:"image", data, mimeType }]`.
7. Gateway dispatch passes `replyOptions.images` into agent runner (`agent-runner-execution.ts`), where provider runs receive images as true model image input.

**Commands/tests used:**
- `bd update nerve-3sj --status in_progress --json`
- `grep -RIn --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=server-dist "attachments" src server`
- `npm test -- src/features/chat/operations/sendMessage.test.ts` ✅ (16/16 passing)

**Likely bugs/gaps found from inspection:**
- No obvious code-path break found in Nerve→Gateway image handoff.
- Most likely remaining risk is environmental/live (wrong session selection, stale gateway connection, or image content that model can’t interpret), not missing attachment plumbing.

**Exact live verification procedure (Derrick + Chip):**
1. In Nerve, select the intended session (prefer `main` for a clean check).
2. Attach a small, obvious test image (e.g., screenshot containing a distinct word or colored shape).
3. Send this prompt with the image:  
   `Describe this image in 3 concrete details and quote any visible text exactly.`
4. Expected if delivery works:
   - User bubble shows attached thumbnail immediately (UI-level only).
   - Assistant reply includes concrete visual details and correctly quoted image text (model-level confirmation).
5. Hard confirmation (optional but recommended): run gateway history and confirm image block exists in user message content:
   - `openclaw gateway call chat.history --params '{"sessionKey":"main","limit":5}'`
   - In latest user message, expect `content` array containing an `{"type":"image", ...}` block (base64 data/mime).
6. Negative control (optional): send same prompt without image; response should lose image-specific certainty.

**Current outcome:**
- ⚠️ **Awaiting live send** (not yet fully confirmed in-session by operator action).
- Bead `nerve-3sj` remains open/in-progress until Derrick performs the live image send and we validate expected behavior in the resulting assistant reply/history.

---

## Final Results

**Status:** ⚠️ Partial (code path verified; live validation pending)

**What We Built:**
- A precise end-to-end runtime map for image attachments.
- A deterministic live validation procedure with success criteria and optional hard RPC-level confirmation.

**Commits:**
- None (per instruction).

**Lessons Learned:**
- The attachment plumbing appears in place; conclusive verification requires one controlled live send with an image-dependent prompt and observed response.

---

*Updated on 2026-03-16*