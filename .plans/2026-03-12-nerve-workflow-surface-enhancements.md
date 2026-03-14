---
plan_id: plan-2026-03-12-nerve-workflow-surface-enhancements
bead_ids:
  - nerve-hf2
  - nerve-m84
  - nerve-lbj
  - nerve-413
  - nerve-ux7
  - nerve-0lv
---
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

**Results:** Implemented a conservative Closed-column ergonomics pass without redesigning the Beads board. Closed items now collapse by default when any exist, a compact summary rail keeps Closed visible as a first-class lane without dominating the board, a top-right show/hide toggle allows quick expansion/collapse, and the expanded Closed lane uses reduced visual weight so To Do / In Progress / Done stay visually primary. Access to closed cards and the existing detail drawer is preserved. Validation: `npm test -- --run src/features/kanban/BeadsBoard.test.tsx src/features/kanban/beads.test.ts src/features/kanban/BeadsDetailDrawer.test.tsx` ✅, `npm run build` ✅. Committed in `220dbbf` (`Improve Beads closed-column ergonomics`). Bead closed with reason: `Implemented Closed-column UX pass and verified locally`.

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
- `docs/BEAD-PLAN-LINKAGE.md`

**Status:** ✅ Complete

**Results:** Produced a durable bead-to-plan linkage design note in `docs/BEAD-PLAN-LINKAGE.md` and linked the recommendation back into this living plan. Recommended model: store the explicit bead → plan link in bead `metadata.plan` (`plan_id`, repo-relative `path`, optional cached `title`) while giving each plan a stable `plan_id` in frontmatter plus optional `bead_ids` backlinks as a secondary index. Nerve should resolve by path first, then recover by `plan_id`, and classify the result as active/moved/archived/missing rather than treating path drift as a hard failure. Archived plans remain valid targets with an Archived badge; removed plans should degrade to a Missing state that still shows last-known path/id. Migration should be incremental: adopt frontmatter on touched plans, add bead metadata when links are intentionally created, then implement a server-side resolver and drawer-level UI before broader autolinking. Validation: `git diff --check` ✅ plus a small Node check that confirmed the design doc exists and this plan references it. Committed with message `Document bead-to-plan linkage model`.

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
- `server/app.ts`
- `server/lib/plans.ts`
- `server/lib/plans.test.ts`
- `server/routes/plans.ts`
- `src/App.tsx`
- `src/features/workspace/WorkspacePanel.tsx`
- `src/features/workspace/WorkspaceTabs.tsx`
- `src/features/workspace/hooks/usePlans.ts`
- `src/features/workspace/tabs/index.ts`
- `src/features/workspace/tabs/PlansTab.tsx`
- `src/features/workspace/tabs/PlansTab.test.tsx`
- `.plans/2026-03-12-nerve-workflow-surface-enhancements.md`

**Status:** ✅ Complete

**Results:** Implemented the first-pass plans surface end to end. Nerve now exposes repo-local `/.plans/` files through a dedicated workspace tab backed by new server routes for plan discovery and plan-content reads. The UI groups active vs archived plans, supports search across titles/paths/status/plan ids/bead ids, previews the selected plan as rendered markdown, shows plan metadata badges, and provides an optional “Open in Editor” handoff for direct file navigation. The finishing pass fixed the last failing UI test semantically rather than weakening the feature: `PlansTab.test.tsx` now asserts against the plan row buttons and scoped list state instead of using an ambiguous global `getByText('Active Plan')` query, which matches the intended UI that renders the title in multiple places. Validation: `npm test -- --run server/lib/plans.test.ts src/features/workspace/tabs/PlansTab.test.tsx` ✅, `npm run build` ✅.

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
- `src/features/markdown/MarkdownRenderer.tsx`
- `src/features/markdown/inlineReferences.tsx`
- `src/features/markdown/MarkdownRenderer.references.test.tsx`
- `src/features/workspace/tabs/PlansTab.tsx`
- `src/features/workspace/tabs/PlansTab.test.tsx`
- `src/features/workspace/WorkspacePanel.tsx`
- `.plans/2026-03-12-nerve-workflow-surface-enhancements.md`

**Status:** ✅ Complete

**Results:** Shipped a conservative first pass scoped to the new Plans surface so references become useful without over-linking arbitrary text or inventing new open behavior. `MarkdownRenderer` now routes plain markdown text through a small inline-reference layer that only recognizes three safe classes: known `/.plans/*.md` references, conservative repo-relative paths under existing safe prefixes (`src/`, `server/`, `docs/`, plus a short allowlist of root config files), and conservative bead IDs (`nerve-*`, `oc-*`, plus bead IDs already surfaced by known plans). Recognized plan references open inside the existing Plans preview surface when possible, which reuses the Task 4 plans UI rather than jumping straight to a new path-opening flow; recognized repo-relative file paths reuse the existing editor handoff; recognized bead IDs reuse the existing board navigation hook and are also clickable from selected-plan bead badges. Hover summaries are intentionally lightweight via button titles: plan refs show title/status/archive/path, and bead refs indicate board navigation (including linked-plan context when available). Detection remains single-token and markdown-text-only, so inline code, external links, and arbitrary hyphenated prose are left alone. Validation: `npm test -- --run src/features/markdown/MarkdownRenderer.references.test.tsx src/features/workspace/tabs/PlansTab.test.tsx server/lib/plans.test.ts` ✅, `npm run build` ✅. Local UX verification: the new interactions were exercised through component tests and production build output; an existing local Nerve instance on port 3080 was reachable but was sitting at the gateway connect screen, so full end-to-end browser verification against a live connected session was limited by gateway availability. Bead closed successfully with reason `Implemented safe clickable reference rendering and verified locally`.

---

### Task 6: Local path opening integration for Zorin workflow

**Bead ID:** `nerve-0lv`  
**SubAgent:** `research`  
**Prompt:** Research and, if appropriate for a small first pass, implement the safest and simplest way for Nerve on this Zorin host to open valid local folders/files from clickable paths. If the target path is inside the exposed workspace and is already openable in Nerve UI, prefer opening it inside Nerve itself (for example as a new Nerve UI tab in the workspace/file-view area) so it works from remote viewers like a mobile phone as well as on-host sessions. Only fall back to host-local desktop/file-explorer opening for paths or actions that are not meaningfully openable inside Nerve. Keep path validation narrow and avoid arbitrary command execution risk. Critically, design explicit fallback behavior for remote viewers (for example mobile phone or any terminal/browser that is not the same machine/session as the running agent): path clicks must not assume local desktop-open is possible. The UX should safely account for non-local viewing contexts and degrade gracefully, for example by preferring Nerve-internal file viewing when available, otherwise showing copyable paths, an explanatory tooltip/state, an alternate "open in editor on host" handoff, or another safe host-routed fallback rather than a broken or misleading local-open action.

**Folders Created/Deleted/Modified:**
- `docs/` (optional)
- `src/` (if a small UI pass is included)
- `server/` (if a small host-routed integration is included)
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-12-nerve-workflow-surface-enhancements.md`
- optional design notes
- optional narrow implementation files if a safe first pass is obvious

**Status:** ✅ Complete

**Results:** Shipped a narrow workspace-first path-opening pass instead of adding any host-desktop launcher assumptions. Safe clickable path handling now resolves the target through a new server-side `/api/files/resolve` classifier, then prefers Nerve-native actions: workspace text files open in existing editor tabs, image files continue to open inline via the existing file viewer, and directories (plus non-inline binary files) are revealed/selected in the existing file explorer. That means remote viewers and non-local-terminal sessions still get a meaningful in-Nerve result instead of a broken `xdg-open`-style handoff. I deliberately did **not** add host-local desktop/file-explorer launching in this pass because it would be less safe, less portable, and ambiguous for phone/remote viewers; the product now degrades gracefully by staying inside Nerve whenever possible and revealing the path in the workspace tree otherwise. Implementation details: added `/api/files/resolve`, threaded a generic `onOpenPath` flow through the Plans surface, taught the file tree hook/panel to reveal nested targets by expanding/selecting them, and updated inline path affordance copy from “open in editor” to “open inside Nerve.” Exact files changed: `server/routes/file-browser.ts`, `server/routes/file-browser.test.ts`, `src/App.tsx`, `src/features/file-browser/FileTreePanel.tsx`, `src/features/file-browser/hooks/useFileTree.ts`, `src/features/file-browser/hooks/useFileTree.test.ts`, `src/features/workspace/WorkspacePanel.tsx`, `src/features/workspace/tabs/PlansTab.tsx`, `src/features/workspace/tabs/PlansTab.test.tsx`, `src/features/markdown/inlineReferences.tsx`, and this plan file. Validation: `npm test -- --run server/routes/file-browser.test.ts src/features/workspace/tabs/PlansTab.test.tsx src/features/markdown/MarkdownRenderer.references.test.tsx src/features/file-browser/hooks/useFileTree.test.ts` ✅, `npm run build` ✅. Local UX verification: production UI loaded against the existing local Nerve instance on `http://127.0.0.1:3080`; gateway connection succeeded and the workspace/file explorer surface rendered. I did not perform a fully scripted end-to-end click path inside a live plan preview, but the runtime loaded cleanly and the new path-opening behavior is covered by focused route/component/hook tests. Committed on the current branch with message `Open workspace paths inside Nerve first`. Push/close details follow in final results.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Completed the first-pass Nerve workflow-surface buildout around Beads, Plans, references, and safe workspace path opening. The resulting UX now covers the full path Derrick wanted: live Beads board metadata, a quieter but still first-class Closed lane, a documented durable bead↔plan linkage model, first-class `/.plans/` browsing, conservative clickable references, and workspace-first path opening that stays inside Nerve whenever possible so the same links remain useful from remote viewers like a phone.

**Commits:**
- `0181bfd` - Surface richer Beads metadata on board cards and details
- `033e90d` - Add Beads detail drawer and live board wiring
- `220dbbf` - Improve Beads closed-column ergonomics
- `720cef5` - Update workflow enhancement plan status
- `371d7e0` - Document bead-to-plan linkage model
- `90be573` - Finalize bead-plan linkage plan notes
- `8f41ecd` - Add first-pass plans workspace surface
- `371f4f3` - Add safe clickable references to plans surface
- `862be27` - Open workspace paths inside Nerve first

**Lessons Learned:** Treating Closed as a first-class workflow surface does not require giving it equal visual dominance. A compact summary + explicit reveal control is a better first pass than a broader board redesign. For bead/plan navigation, path-only links are too brittle; the durable compromise is an explicit bead-side link plus a plan-side stable identity for recovery. For reference rendering and path opening, the safest first move is to reuse already-safe internal surfaces (plan preview selection, existing editor/file viewer tabs, existing file tree) rather than jumping straight to host-local launch behavior that breaks down for remote viewers.

**Next Session Handoff:** This plan is complete. If Derrick wants to continue Nerve work next session, the best follow-up is a light review/usability pass against the now-shipped workflow surfaces in a real connected session, plus any targeted polish that falls out of real-world use rather than another large feature wave.

---

*Completed on 2026-03-12*
