# Gambit OpenClaw Nerve — Beads metadata pass

**Date:** 2026-03-12  
**Status:** Draft  
**Agent:** Chip 🐱‍💻

---

## Goal

Make the Nerve Beads board feel more Beads-native by surfacing high-value issue metadata on cards and in the detail view without overloading the board.

---

## Overview

The Beads board is now live in Nerve with four working columns: To Do, In Progress, Done, and Closed. The next step is not more status reshaping, but better information density. Right now the board proves the transport and projection model works, but it still leaves too much Beads context hidden.

This pass should keep card surfaces compact while adding genuinely useful Beads-native signals: issue id, owner, priority, issue type, labels, dependency/dependent counts, and richer timestamps/raw status in a detail surface. The goal is faster scanning and less context-switching, not maximal detail everywhere. Cards should get the smallest set of fields that improve triage; the drawer/detail layer should absorb the richer metadata.

Because the current Beads board is largely read-only, this is also a good chance to clarify how a Beads card differs from a native Nerve task card without pretending the two models are identical.

---

## Tasks

### Task 1: Expand backend/frontend Beads metadata model

**Bead ID:** `nerve-hf2`  
**SubAgent:** `coder`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-hf2` at start and close it on completion. Expand the Beads DTO + frontend normalization path so the UI has the metadata needed for a useful Beads-native presentation. At minimum, evaluate/support issue id, owner, priority, issue type, labels, dependency count, dependent count, created/updated/closed timestamps, and raw status. Only add fields that can be surfaced coherently in the UI.

**Folders Created/Deleted/Modified:**
- `server/`
- `src/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `server/lib/beads-board.ts`
- `server/lib/beads-board.test.ts`
- `src/features/kanban/beads.ts`
- `src/features/kanban/beads.test.ts`
- `src/features/kanban/types.ts`
- `.plans/2026-03-12-beads-metadata-pass.md`

**Status:** ✅ Complete

**Results:** Claimed `nerve-hf2`, switched the server Beads adapter from `bd list --all --json` to `bd export` JSONL parsing so the DTO can preserve richer issue metadata, and extended the shared frontend normalization path to carry Beads-native metadata on normalized tasks. Added support for Beads labels in the DTO and a `task.beads` metadata bag containing issue id, raw status, owner, type, label list, dependency/dependent counts, comment count, and created/updated/closed timestamps. Verified with targeted Vitest coverage for both the server projection and frontend normalization paths, then closed the bead once the metadata model was in place.

---

### Task 2: Add compact Beads-native card metadata

**Bead ID:** `nerve-whn`  
**SubAgent:** `coder`  
**Prompt:** After the data model is ready, add compact Beads-native metadata to Beads board cards in `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`. Prioritize scanability: issue id, owner, priority/type cues, limited labels, and dependency/dependent indicators are candidates. Keep the card readable and avoid turning it into a dense record dump.

**Folders Created/Deleted/Modified:**
- `src/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/kanban/KanbanCard.tsx`
- `src/features/kanban/KanbanCard.test.tsx`
- `.plans/2026-03-12-beads-metadata-pass.md`

**Status:** ✅ Complete

**Results:** Claimed `nerve-whn` and added a Beads-specific compact metadata strip inside board cards rather than dumping extra data into the generic label row. Beads cards now surface the issue id, a compact priority chip, issue type, owner, up to two real labels with overflow count, and dependency/dependent indicators while leaving native Nerve cards unchanged. Verified with targeted component and normalization tests so the scanability-oriented card treatment is covered before moving on to the richer detail surface.

---

### Task 3: Add richer Beads detail surface and verify live UX

**Bead ID:** `nerve-rfd`  
**SubAgent:** `primary`  
**Prompt:** After card metadata is in place, add or improve a Beads-specific detail surface so richer metadata is available without cluttering the board. Then verify live in Nerve against the `~/.openclaw` Beads source that cards remain readable and the richer Beads information is accessible. Use real data already present in `~/.openclaw`.

**Folders Created/Deleted/Modified:**
- `src/`
- `projects/gambit-openclaw-nerve/`
- `/home/derrick/.openclaw/` (verification only unless sample data adjustment is truly needed)
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/kanban/BeadsDetailDrawer.tsx`
- `src/features/kanban/BeadsDetailDrawer.test.tsx`
- `src/features/kanban/KanbanPanel.tsx`
- `.plans/2026-03-12-beads-metadata-pass.md`

**Status:** ✅ Complete

**Results:** Claimed `nerve-rfd`, added a read-only `BeadsDetailDrawer`, and wired Beads card clicks through `KanbanPanel` so richer issue metadata is available without bloating board cards. The drawer surfaces source label, raw status, description, owner, labels, dependency/dependent counts, comment count, and Beads timestamps. Verified the live API against `http://127.0.0.1:3080/api/beads/board?sourceId=openclaw`, rebuilt Nerve, restarted the local `node server-dist/index.js` process so the updated assets were served, and validated in the live UI that `~/.openclaw` cards stayed compact while the drawer exposed the richer details on click.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Expanded the Beads board DTO and normalization path to carry Beads-native metadata, added compact scan-friendly Beads card chrome, and introduced a dedicated read-only Beads detail drawer so richer metadata is available on demand without cluttering the board. Live verification against the real `~/.openclaw` Beads source passed after rebuilding and restarting the local Nerve server.

**Commits:**
- `bd5a714` - Add Beads-native metadata cards and drawer

**Lessons Learned:** Restarting the local packaged Nerve server matters after frontend bundle changes; otherwise the browser can keep serving stale assets and produce misleading runtime errors during verification.

---

*Completed on 2026-03-12*
