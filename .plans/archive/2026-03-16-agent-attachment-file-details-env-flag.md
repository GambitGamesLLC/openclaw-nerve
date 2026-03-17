---
plan_id: plan-2026-03-16-agent-attachment-file-details-env-flag
bead_ids:
  - nerve-osr
  - nerve-jk9
  - nerve-6n2
  - nerve-ufi
---
# Optional attachment file-details exposure for agents and subagents

**Date:** 2026-03-16  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Ship an implementation-ready two-mode upload design in `gambit-openclaw-nerve` that keeps small uploads inline/base64, supports explicit file-reference mode for large/tool workflows, gates rollout via `.env`, and keeps subagent forwarding explicit.

---

## Current-state findings (repo inspection)

### Current upload/chat path

1. `InputBar.tsx`
   - only accepts image files (`accept="image/*"`, drop/paste also image-only)
   - immediately compresses to base64 via `compressImage`
   - enforces per-file raw cap via `MAX_ATTACHMENT_BYTES` and count via `MAX_ATTACHMENTS`
2. `sendMessage.ts`
   - sends `rpc('chat.send')` with `attachments: [{ mimeType, content }]`
   - no mode field, no metadata descriptor, no file-reference path
3. `types.ts` + `MessageBubble.tsx`
   - message image payload is inline/base64 preview oriented
   - no attachment mode/debug metadata rendered in-chat
4. `server/lib/config.ts`
   - env-backed config pattern already exists and is the right place for upload flags
   - no existing upload mode flags
5. `.env.example`
   - no upload mode keys documented today

### Design baseline

The repo currently behaves as a single-mode inline image uploader. Two-mode behavior, non-image file handling, explicit file-reference contract, and forwarding policy are not implemented yet.

---

## Implementation-ready contract

## 1) Chooser UX on attach / drag-drop

When both modes are enabled:
- opening attach or dropping files creates a **staging list** (not auto-send)
- Nerve opens an `Upload mode` chooser panel with per-file default mode:
  - default `inline` when `mimeType startsWith("image/")` and `sizeBytes <= inline cap`
  - default `file_reference` otherwise
- user can switch mode per file before send
- staged files render chips in composer: `INLINE` / `FILE_REF` + name + size

When only one mode is enabled:
- no chooser modal; mode auto-assigned to enabled mode
- invalid files for that mode show deterministic error and are not staged

## 2) Inline mode contract (base64-backed)

Inline descriptor (client-side canonical shape):

```json
{
  "id": "att_xxx",
  "mode": "inline",
  "name": "screenshot.png",
  "mimeType": "image/png",
  "sizeBytes": 382918,
  "inline": {
    "encoding": "base64",
    "base64": "...",
    "previewUrl": "data:image/...",
    "compressed": true
  },
  "policy": {
    "forwardToSubagents": false
  }
}
```

Send contract:
- `chat.send.attachments[]` remains the transport for inline image bytes (`mimeType + content`)
- inline files are eligible for model vision behavior (existing path)

Hard guardrail:
- file rejected from inline mode when `sizeBytes > NERVE_INLINE_ATTACHMENT_MAX_MB`
- no implicit downgrade to file-ref unless file-ref mode is enabled and user confirms switch

## 3) File-reference mode contract (large/tool-oriented)

File-reference descriptor shape:

```json
{
  "id": "att_xxx",
  "mode": "file_reference",
  "name": "capture.mov",
  "mimeType": "video/quicktime",
  "sizeBytes": 84234122,
  "reference": {
    "kind": "local_path",
    "path": "/abs/path/inside/workspace/or-user-selected",
    "uri": "file:///abs/path/inside/workspace/or-user-selected"
  },
  "policy": {
    "forwardToSubagents": false
  }
}
```

Rules:
- local path semantics are allowed **only** in `file_reference` mode
- file-reference attachments are not converted to base64
- model-vision behavior is **not** implied for file-reference mode

## 4) Agent-visible metadata + base64 exposure policy

To avoid depending on gateway support for unknown RPC fields, Nerve appends a structured manifest block to the user message text when two-mode feature is enabled:

```text
<nerve-upload-manifest>{...json...}</nerve-upload-manifest>
```

Manifest includes descriptor metadata per file.

Base64 policy:
- default: manifest includes `base64Bytes` only (no raw base64)
- optional flag can include raw base64 in manifest for inline files (off by default)

## 5) Subagent forwarding policy (explicit, not automatic)

Default behavior:
- `forwardToSubagents = false` for every attachment mode
- selecting file-reference mode does **not** auto-forward

Explicit forwarding:
- optional per-file toggle appears only for file-reference items when forwarding env flag is enabled
- toggle writes `policy.forwardToSubagents=true` in manifest
- no hidden inheritance to spawned subagents

## 6) In-chat visibility / debug summary

User bubble renders an `Attachments` summary strip from local message metadata:
- each item shows mode chip (`INLINE` / `FILE_REF`), name, size
- file-ref item shows shortened path tail (or basename) for operator confirmation
- collapsed text fallback includes: `Attachments: 2 (1 inline, 1 file_ref)`

## 7) Fallback behavior when one mode is disabled

- **inline enabled, file-ref disabled:**
  - inline-only behavior
  - large files fail with explicit guidance: `File exceeds inline cap; enable file-reference mode or choose smaller file.`
- **inline disabled, file-ref enabled:**
  - all uploads become file references
  - warning for images: `Inline vision disabled; image sent as file reference only.`
- **both disabled:**
  - attach button disabled + tooltip `Uploads disabled by configuration`

---

## Env flags and defaults

Add to server config + `.env.example`:

- `NERVE_UPLOAD_TWO_MODE_ENABLED=false`
- `NERVE_UPLOAD_INLINE_ENABLED=true`
- `NERVE_UPLOAD_FILE_REFERENCE_ENABLED=false`
- `NERVE_UPLOAD_MODE_CHOOSER_ENABLED=false` (requires two-mode + both modes enabled)
- `NERVE_INLINE_ATTACHMENT_MAX_MB=4`
- `NERVE_UPLOAD_EXPOSE_INLINE_BASE64_TO_AGENT=false`
- `NERVE_UPLOAD_ALLOW_SUBAGENT_FORWARDING=false`

Rollout intent:
- default config preserves current behavior (inline images only)
- advanced behavior appears only when explicitly enabled in `.env`

---

## Tasks

### Task 1: Define the two-mode upload contract and env-flag design

**Bead ID:** `nerve-osr`  
**SubAgent:** `coder`

**Status:** ✅ Complete

**Results:**
- Inspected existing upload path and identified exact extension points:
  - `src/features/chat/InputBar.tsx`
  - `src/features/chat/image-compress.ts`
  - `src/features/chat/operations/sendMessage.ts`
  - `src/features/chat/types.ts`
  - `src/features/chat/MessageBubble.tsx`
  - `src/lib/constants.ts`
  - `server/lib/config.ts`
  - `.env.example`
- Locked down implementation-ready two-mode contract, explicit forwarding policy, and fallback behavior.

---

### Task 2: Implement two-mode chooser + inline guardrails

**Bead ID:** `nerve-jk9`  
**SubAgent:** `coder`

**Status:** ✅ Complete

**Scope:**
- add chooser/staging UX for attach+drag/drop
- add inline cap guardrails + warnings
- keep current inline transport behavior for model-compatible images

**Files changed:**
- `src/features/chat/InputBar.tsx`
- `src/features/chat/uploadPolicy.ts`
- `src/features/chat/uploadPolicy.test.ts`
- `src/features/chat/InputBar.test.tsx`
- `server/lib/config.ts`
- `server/lib/config.test.ts`
- `server/routes/upload-config.ts`
- `server/routes/upload-config.test.ts`
- `server/app.ts`
- `.env.example`

**Commands run:**
- `bd update nerve-jk9 --status in_progress --json`
- `npm test -- src/features/chat/uploadPolicy.test.ts src/features/chat/InputBar.test.tsx src/features/chat/operations/sendMessage.test.ts server/lib/config.test.ts server/routes/upload-config.test.ts`
- `npx eslint src/features/chat/InputBar.tsx src/features/chat/uploadPolicy.ts src/features/chat/uploadPolicy.test.ts src/features/chat/InputBar.test.tsx server/lib/config.ts server/lib/config.test.ts server/routes/upload-config.ts server/routes/upload-config.test.ts server/app.ts`

**Validation results:**
- Focused chooser/default/guardrail unit coverage added in `uploadPolicy.test.ts`.
- `InputBar.test.tsx` now verifies:
  - chooser defaults (small image inline, larger image file_reference)
  - inline guardrail refusal when switching oversized files
  - inline send still uses existing `chat.send.attachments[]` transport path
- Server config coverage extended for upload env defaults + overrides in `config.test.ts`.
- New `upload-config` route test added.
- Targeted test run: **80 passed / 0 failed**.
- Targeted eslint run: **no issues**.

**Results:**
- Chat composer now stages drag/drop and attach files instead of immediately sending.
- When two-mode + chooser flags are enabled, each staged file shows an upload-mode selector.
- Default mode selection follows design intent: small images inline, larger/non-image files file_reference.
- Inline mode enforces hard file-size guardrails with explicit warnings.
- Inline attachments continue to send via the existing attachment transport.
- File-reference mode is intentionally UI-scaffolded only in this slice; send path remains unimplemented and warns clearly.

---

### Task 3: Implement file-reference payload + env-gated policy

**Bead ID:** `nerve-6n2`  
**SubAgent:** `coder`

**Status:** ✅ Complete

**Scope:**
- implement file-reference descriptor flow
- implement manifest injection and base64 exposure policy flag
- enforce explicit forwarding default false

**Files changed:**
- `src/features/chat/types.ts`
- `src/features/chat/uploadPolicy.ts`
- `src/features/chat/InputBar.tsx`
- `src/features/chat/InputBar.test.tsx`
- `src/features/chat/operations/sendMessage.ts`
- `src/features/chat/operations/sendMessage.test.ts`
- `src/contexts/ChatContext.tsx`
- `src/features/chat/ChatPanel.tsx`
- `server/routes/upload-config.ts`
- `server/routes/upload-config.test.ts`

**Commands run:**
- `bd update nerve-6n2 --status in_progress --json`
- `npm test -- src/features/chat/uploadPolicy.test.ts src/features/chat/InputBar.test.tsx src/features/chat/operations/sendMessage.test.ts server/lib/config.test.ts server/routes/upload-config.test.ts`
- `npm test -- src/features/chat/uploadPolicy.test.ts src/features/chat/InputBar.test.tsx src/features/chat/operations/sendMessage.test.ts server/lib/config.test.ts server/routes/upload-config.test.ts` (rerun after fixing one failing assertion timing issue)
- `npx eslint src/features/chat/InputBar.tsx src/features/chat/types.ts src/features/chat/uploadPolicy.ts src/features/chat/InputBar.test.tsx src/features/chat/operations/sendMessage.ts src/features/chat/operations/sendMessage.test.ts src/contexts/ChatContext.tsx src/features/chat/ChatPanel.tsx server/routes/upload-config.ts server/routes/upload-config.test.ts`

**Validation results:**
- Focused test suite: **87 passed / 0 failed**.
- `sendMessage` tests now verify `<nerve-upload-manifest>...</nerve-upload-manifest>` injection, file-reference metadata inclusion, and base64 exposure flag behavior.
- `InputBar` tests now verify file-reference selections are sent as descriptor metadata (with `local_path` reference and `forwardToSubagents=false`) while inline transport remains unchanged.
- Upload-config route test now verifies `exposeInlineBase64ToAgent` and `allowSubagentForwarding` flags are exposed to the client.
- Targeted eslint run produced only pre-existing `react-hooks/exhaustive-deps` warnings in `ChatContext.tsx` and `ChatPanel.tsx`; no new lint errors in scoped files.

**Results:**
- File-reference mode is now wired into send flow: selecting `file_reference` no longer hard-errors; descriptors are generated with `reference.kind=local_path`, `path`, and `file://` URI.
- Outgoing user message payload now supports env-gated manifest injection via `<nerve-upload-manifest>{...}</nerve-upload-manifest>` appended to `chat.send.message` when `twoModeEnabled` is true.
- Inline bytes continue to flow through existing `chat.send.attachments[]` transport (preserved from `nerve-jk9`).
- Base64 exposure policy is implemented: inline descriptor base64 is redacted in manifest by default and only included when `NERVE_UPLOAD_EXPOSE_INLINE_BASE64_TO_AGENT=true`.
- Subagent forwarding metadata is explicitly present and defaults to `forwardToSubagents=false`; `allowSubagentForwarding` is plumbed through upload config for future UI toggle work.

---

### Task 4: Render mode/debug summaries + forwarding UX/tests

**Bead ID:** `nerve-ufi`  
**SubAgent:** `coder`

**Status:** ✅ Complete

**Scope:**
- in-chat attachment summary rendering from `ChatMsg.uploadAttachments`
- per-file forwarding toggle (flag-gated by `allowSubagentForwarding`; currently plumbing-only)
- fallback and mode-disable tests (both modes disabled, inline-disabled/file-ref-only warnings)
- optional path-unavailable UX polish for file-reference mode on browser-only file objects

**Files changed:**
- `src/features/chat/InputBar.tsx`
- `src/features/chat/InputBar.test.tsx`
- `src/features/chat/MessageBubble.tsx`
- `src/features/chat/MessageBubble.uploadSummary.test.tsx`
- `.plans/2026-03-16-agent-attachment-file-details-env-flag.md`

**Commands run:**
- `bd update nerve-ufi --status in_progress --json`
- `npm test -- src/features/chat/InputBar.test.tsx src/features/chat/MessageBubble.uploadSummary.test.tsx` *(initial run: 1 failing test, then fixed)*
- `npm test -- src/features/chat/InputBar.test.tsx src/features/chat/MessageBubble.uploadSummary.test.tsx src/features/chat/operations/sendMessage.test.ts src/features/chat/uploadPolicy.test.ts server/routes/upload-config.test.ts server/lib/config.test.ts` *(initial run: 4 failing tests, then fixed and rerun green)*
- `npx eslint src/features/chat/InputBar.tsx src/features/chat/InputBar.test.tsx src/features/chat/MessageBubble.tsx src/features/chat/MessageBubble.uploadSummary.test.tsx`

**Validation results:**
- Focused suite covering upload policy + chat upload rendering: **93 passed / 0 failed**.
- `InputBar` tests now cover:
  - explicit per-file subagent forwarding toggle when env-allowed
  - default forwarding remains false until operator opt-in
  - both-modes-disabled attach behavior
  - inline-disabled file-reference-only image warning
  - inline-only large-file guidance
  - file-reference-only path-unavailable rejection guidance
- New `MessageBubble` test verifies in-chat attachment summary rendering from `uploadAttachments`, including mode chips, file-ref path tail, and forwarding badge.
- Targeted eslint run: **no issues** in scoped files.

**Results:**
- User chat bubbles now render local upload metadata summaries (`Attachments: N (...)`) plus per-file mode chips and file-reference path tails.
- File-reference items can be explicitly marked `forwardToSubagents=true` only via a visible checkbox when `allowSubagentForwarding` is enabled; default remains false.
- Fallback behavior is now explicit and tested for disabled-mode combinations, including inline-disabled vision guidance and inline-only large-file guidance.
- File-reference-only staging now fails fast for browser-only files without resolvable local paths, with actionable guidance.

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- implementation-ready feature design contract for two-mode uploads
- concrete env-gating/defaults
- end-to-end two-mode implementation across beads:
  - `nerve-jk9` -> `nerve-6n2` -> `nerve-ufi`

**Commits:**
- Pending closeout commit in this repo (to be filled during finalization pass)

**Lessons Learned / Follow-up:**
- The code-level two-mode upload slice is complete behind env flags, but operational rollout still needs a follow-up bead in `~/.openclaw/workspace` to update `scripts/restore.sh` so restored runtime `.env` templates expose and/or preserve the new Nerve upload flags consistently.
- Do **not** bundle that `restore.sh` rollout into this feature commit; treat it as the next session’s infra/config enablement step.

---

*Updated on 2026-03-16*