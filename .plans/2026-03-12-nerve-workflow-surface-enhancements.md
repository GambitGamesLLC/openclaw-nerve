# Gambit OpenClaw Nerve — workflow surface enhancements

**Date:** 2026-03-12  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Plan the next wave of Nerve UI improvements that reduce context-switching by making Beads metadata, plans, bead IDs, plan references, and filesystem paths more directly explorable from the UI.

---

## Overview

The Beads board is now working live in Nerve, including a first-class Closed column. The next high-value improvements are less about raw board rendering and more about workflow ergonomics: helping Derrick move from discussion to context without dropping into file trees, terminal commands, or manual path hunting.

There are two layers here. The first is Beads-native enrichment inside the existing board: richer card metadata, dependency/blocked indicators, and better UX for the Closed column. The second is broader workflow surfacing in Nerve itself: treating `/.plans/` as a first-class navigation surface, making bead IDs and plan references clickable or hoverable, and making valid local folder paths openable so discussion can turn directly into inspection.

These should remain separate but related tracks. The Beads board should become a stronger Beads-native interface, while Nerve more broadly becomes a better orchestration cockpit where plans, beads, and repo/file paths are connected instead of isolated.

---

## Tasks

### Task 1: Beads metadata pass

**Bead ID:** `nerve-hf2`  
**SubAgent:** `coder`  
**Prompt:** Improve the Beads board and detail UI so cards surface more Beads-native metadata. At minimum, evaluate adding issue id, owner, priority, issue type, labels, dependency/dependent counts, and timestamp/raw-status details in the drawer. Keep the board readable and do not overload cards.

**Folders Created/Deleted/Modified:**
- `src/`
- `server/` (if needed)
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/kanban/**/*`
- `server/lib/beads-board.ts` (if DTO expansion is needed)
- `.plans/2026-03-12-nerve-workflow-surface-enhancements.md`

**Status:** ✅ Complete

**Results:** Implemented and verified live. The board now carries richer Beads-native metadata into card surfaces, Beads card clicks open a read-only `BeadsDetailDrawer`, and the live Nerve UI/API were verified against the real `~/.openclaw` Beads source. Durable work shipped in commits `0181bfd` and `033e90d`.

---

### Task 2: Closed-column UX pass

**Bead ID:** `nerve-m84`  
**SubAgent:** `coder`  
**Prompt:** Improve UX for the Beads Closed column so it remains first-class without overwhelming active work. Evaluate collapsed-by-default behavior, show/hide toggles, reduced visual weight, and lightweight summarization patterns that preserve access to closed items.

**Folders Created/Deleted/Modified:**
- `src/features/kanban/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/features/kanban/BeadsBoard.tsx`
- `src/features/kanban/BeadsBoard.test.tsx`
- `.plans/2026-03-12-nerve-workflow-surface-enhancements.md`

**Status:** ✅ Complete

**Results:** Implemented a conservative Closed-column ergonomics pass without redesigning the Beads board. Closed items now collapse by default when any exist, a compact summary rail keeps Closed visible as a first-class lane without dominating the board, a top-right show/hide toggle allows quick expansion/collapse, and the expanded Closed lane uses reduced visual weight so To Do / In Progress / Done stay visually primary. Access to closed cards and the existing detail drawer is preserved. Validation: `npm test -- --run src/features/kanban/BeadsBoard.test.tsx src/features/kanban/beads.test.ts src/features/kanban/BeadsDetailDrawer.test.tsx` ✅, `npm run build` ✅. Committed in `ade8f0c` (`Improve Beads closed-column ergonomics`). Bead closed with reason: `Implemented Closed-column UX pass and verified locally`.

---

### Task 3: Bead/plan linkage model

**Bead ID:** `nerve-lbj`  
**SubAgent:** `research`  
**Prompt:** Design a durable linkage model between Beads issues and repo-local plans so humans can move from a bead to its related plan from within Nerve. Consider explicit plan-path metadata on beads, plan frontmatter/backlinks, weak-link fallback behavior when files move, hover previews, and graceful handling when plans are archived or removed.

**Folders Created/Deleted/Modified:**
- `docs/` (if design notes belong there)
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-12-nerve-workflow-surface-enhancements.md`
- optional design doc if helpful

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 4: Treat /.plans/ as a first-class Nerve surface

**Bead ID:** `nerve-413`  
**SubAgent:** `coder`  
**Prompt:** Design and implement an initial `/.plans/` workflow surface in Nerve so plans can be browsed directly without manual folder navigation. Keep scope realistic for a first pass: plan discovery, readable display, and useful navigation are more important than full editing.

**Folders Created/Deleted/Modified:**
- `src/`
- `server/`
- `.plans/`

**Files Created/Deleted/Modified:**
- plan-related UI/server files to be determined
- `.plans/2026-03-12-nerve-workflow-surface-enhancements.md`

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 5: Clickable references and hover summaries

**Bead ID:** `nerve-ux7`  
**SubAgent:** `coder`  
**Prompt:** Add a safe reference-rendering layer so bead IDs, plan references, and recognized local file/folder paths mentioned in Nerve UI surfaces can become clickable and/or hoverable. Prefer conservative detection and safe local actions over aggressive autolinking.

**Folders Created/Deleted/Modified:**
- `src/`
- `server/` (if resolver endpoints are needed)
- `.plans/`

**Files Created/Deleted/Modified:**
- UI rendering components and helpers to be determined
- `.plans/2026-03-12-nerve-workflow-surface-enhancements.md`

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 6: Local path opening integration for Zorin workflow

**Bead ID:** `nerve-0lv`  
**SubAgent:** `research`  
**Prompt:** Research the safest and simplest way for Nerve on this Zorin host to open valid local folders/files from clickable paths into the desktop file explorer. Prefer a narrow local-only integration with clear path validation and no arbitrary command execution risk.

**Folders Created/Deleted/Modified:**
- `docs/` (optional)
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-12-nerve-workflow-surface-enhancements.md`
- optional design notes

**Status:** ⏳ Pending

**Results:** Pending.

---

## Final Results

**Status:** ⚠️ Partial — Tasks 1-2 complete, Tasks 3-6 pending

**What We Built:** The Beads board now ships richer Beads-native metadata and a first conservative Closed-column UX pass. Closed issues remain directly accessible, but active workflow columns stay visually primary via collapsed-by-default treatment, a compact Closed summary rail, and a reduced-weight expanded Closed lane.

**Commits:**
- `0181bfd` - Surface richer Beads metadata on board cards and details
- `033e90d` - Add Beads detail drawer and live board wiring
- `ade8f0c` - Improve Beads closed-column ergonomics

**Lessons Learned:** Treating Closed as a first-class workflow surface does not require giving it equal visual dominance. A compact summary + explicit reveal control is a better first pass than a broader board redesign.

---

*Completed on Pending*
