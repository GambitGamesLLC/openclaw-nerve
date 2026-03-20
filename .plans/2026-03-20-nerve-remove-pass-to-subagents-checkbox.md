# gambit-openclaw-nerve

**Date:** 2026-03-20  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Remove the visible `pass to subagents` checkbox from the Nerve attachment UI because the human-facing workflow now works without requiring that toggle.

---

## Overview

Recent live validation established the product decision: from Derrick’s perspective, the important outcome is that the main agent can hand image assets to a subagent in a usable way, whether that happens through native forwarding or assistant-mediated reconstruction. Existing Nerve work already made subagent spawns attachment-aware and preserved path-related metadata for `server_path` attachments. Source: `memory/2026-03-18.md#L1-L18`.

This slice focuses on simplifying the Nerve surface area. The visible checkbox should disappear from the compose/attachment UX, while the underlying behavior stays internal/defaulted. The implementation pass should audit the UI, server plumbing, tests, and any Nerve-local configuration assumptions. If execution confirms that shared `restore.sh` or other non-repo setup scripts must change, that follow-up will be tracked as a separate cross-repo bead before code lands there.

The current repo already has in-flight local modifications from the attachment-forwarding slice, so this work should be coordinated carefully against the existing uncommitted changes in `server/lib/subagent-spawn.test.ts`, `server/routes/gateway.test.ts`, `server/routes/gateway.ts`, and `.plans/2026-03-18-subagent-attachment-forwarding-regression-fix.md`.

---

## Tasks

### Task 1: Remove visible checkbox and internalize forwarding default

**Bead ID:** `nerve-ae3`  
**SubAgent:** `coder`  
**Prompt:** Implement bead `nerve-ae3` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`. Start by claiming it with `bd update nerve-ae3 --status in_progress --json`. Remove the visible `pass to subagents` checkbox from the Nerve attachment/chat UI, keep forwarding behavior internal/defaulted, audit any Nerve-local env/config plumbing that no longer needs to be user-exposed, update or add tests, and summarize exactly what changed plus any cross-repo follow-up still needed. Close the bead with `bd close nerve-ae3 --reason "Implemented checkbox removal and internal-default forwarding cleanup" --json` when done.

**Folders Created/Deleted/Modified:**
- `src/features/chat/`
- `server/lib/`
- `server/routes/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/chat/InputBar.tsx`
- `src/features/chat/InputBar.test.tsx`
- `src/features/chat/MessageBubble.tsx`
- `src/features/chat/MessageBubble.uploadSummary.test.tsx`
- `src/features/chat/uploadPolicy.ts`
- `server/lib/config.ts`
- `server/lib/config.test.ts`
- `server/routes/upload-config.ts`
- `server/routes/upload-config.test.ts`
- `.env.example`
- `.plans/2026-03-20-nerve-remove-pass-to-subagents-checkbox.md`

**Status:** ✅ Complete

**Results:** Removed the per-attachment forwarding checkbox from the composer UI and made forwarding internal/defaulted (`policy.forwardToSubagents: true` and `manifest.allowSubagentForwarding: true` on outgoing payloads). Also removed client-visible upload-config plumbing for `allowSubagentForwarding` and retired `NERVE_UPLOAD_ALLOW_SUBAGENT_FORWARDING` from Nerve config/env docs. Removed the user-facing “forwarded to subagents” attachment badge so forwarding is no longer exposed in chat bubbles. Updated/added coverage in InputBar, MessageBubble summary, upload-config route, and config tests. Verified with: `npm run test -- src/features/chat/InputBar.test.tsx src/features/chat/MessageBubble.uploadSummary.test.tsx server/routes/upload-config.test.ts server/lib/config.test.ts`.

---

### Task 2: Human-facing validation after checkbox removal

**Bead ID:** `nerve-5hh`  
**SubAgent:** `primary`  
**Prompt:** Implement bead `nerve-5hh` in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`. Start by claiming it with `bd update nerve-5hh --status in_progress --json`. After the checkbox-removal implementation is complete, validate that attachment delegation still works acceptably from the human perspective for inline and path-style assets, and record any remaining payload-size limits separately from the checkbox decision. Close the bead with `bd close nerve-5hh --reason "Validated post-removal attachment delegation UX" --json` when done.

**Folders Created/Deleted/Modified:**
- `.plans/`
- any test/log capture locations needed during validation

**Files Created/Deleted/Modified:**
- `.plans/2026-03-20-nerve-remove-pass-to-subagents-checkbox.md`
- any validation artifacts deemed worth keeping in-repo

**Status:** ⏳ Pending

**Results:** Handoff prepared for the next session. Live human-facing validation is intentionally deferred until after Derrick runs `update.sh` and refreshes/restarts Nerve outside the mobile UI. Remaining work should continue under bead `nerve-5hh`.

---

## Final Results

**Status:** ⚠️ Partial

**What We Built:** Removed the visible `pass to subagents` checkbox from the Nerve UI, internalized forwarding defaults for attachment payload construction, removed the exposed forwarding status/badge and Nerve-local config knob for this toggle, and verified the targeted implementation tests locally. A next-session live validation pass is still pending after operator-side `update.sh` plus Nerve refresh/restart.

**Commits:**
- `ad73e47` - Simplify subagent forwarding UI and archive validation handoff

**Lessons Learned:** Human-facing success matters more than whether the handoff path is native forwarding or assistant-mediated reconstruction, but larger attachment payload handoff limits should still be tracked separately from the checkbox-removal decision.

---

*Drafted on 2026-03-20*
