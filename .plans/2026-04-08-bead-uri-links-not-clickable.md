# Bead URI Links Not Clickable in Root Markdown Dogfood

**Date:** 2026-04-08  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Fix the regression where explicit `bead://...#...` links in root-workspace markdown render as plain text instead of clickable links in Nerve.

---

## Overview

The latest dogfood pass confirms the markdown file at the workspace root is using the new explicit `bead://<path>#<bead-id>` syntax, but those links are not appearing as clickable anchors in Nerve. That strongly suggests the URI is being filtered or transformed before our custom bead-link interception logic can act on it.

This is likely the same class of issue we previously saw with `bead:` links: markdown rendering/sanitization is not preserving the custom scheme or shape we now rely on. The right path is to diagnose this on the canonical `feature/bead-viewer` branch, fix it there, verify the explicit URI syntax renders and routes correctly, then roll that corrected Beads branch into combo for another dogfood pass.

---

## Tasks

### Task 1: Trace why `bead://` links are not rendering as clickable anchors

**Bead ID:** `nerve-67o3`  
**SubAgent:** `research`  
**Prompt:** On `feature/bead-viewer`, inspect the markdown rendering path for explicit `bead://...#...` links and determine exactly why they are not rendering as clickable anchors in Nerve. Identify whether `react-markdown` URL transforms, custom link classification, or another render-stage filter is stripping the href before the bead-link handler can act.

**Folders Created/Deleted/Modified:**
- `.plans/`
- markdown/beads rendering paths as needed for inspection

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-bead-uri-links-not-clickable.md`

**Status:** ✅ Complete

**Results:** Traced the failure to the markdown URL-preservation stage, not the click handler stage. Exact root cause: `src/features/markdown/MarkdownRenderer.tsx` uses `urlTransform={transformMarkdownUrl}`, but `transformMarkdownUrl(url)` calls `isBeadLinkHref(url)` with no render context. For explicit relative URIs like `bead://projects/virtra-apex-docs#virtra-apex-docs-rre`, `src/features/beads/links.ts` → `parseBeadLinkHref()` intentionally returns `null` unless a `currentDocumentPath` is provided for non-absolute target paths. Because `urlTransform` runs before the custom `<a>` renderer and has no document context, the relative `bead://...#...` URI is misclassified as not-a-bead-link and falls through to `react-markdown`’s `defaultUrlTransform`, which strips the custom-scheme href. Once that happens, the custom anchor renderer receives no `href` and returns a `<span>`, so the link renders as plain text / non-clickable. Files/functions implicated: `src/features/markdown/MarkdownRenderer.tsx` (`transformMarkdownUrl`, custom `a` renderer), `src/features/beads/links.ts` (`parseBeadLinkHref`, `isBeadLinkHref`), and upstream `react-markdown` `defaultUrlTransform` behavior. Narrowest likely fix path: preserve syntactically valid `bead://...#<bead-id>` links during markdown URL sanitation without requiring `currentDocumentPath` at transform time, while keeping the stricter context-aware parse in the click/open path; the smallest shape is likely a lightweight bead-scheme predicate used only by `transformMarkdownUrl`. Missing regression coverage is specifically relative explicit `bead://...#...` markdown links; current tests cover legacy `bead:` and absolute explicit bead targets, but not relative explicit ones.

---

### Task 2: Fix `bead://` rendering/clickability on `feature/bead-viewer`

**Bead ID:** `nerve-lt29`  
**SubAgent:** `coder`  
**Prompt:** On `feature/bead-viewer`, implement the narrowest correct fix so explicit `bead://...#...` links render as clickable anchors and still route into the bead viewer using the explicit lookup context. Add focused tests for markdown rendering and click interception.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `src/features/beads/`
- `src/features/markdown/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-bead-uri-links-not-clickable.md`
- `src/features/beads/index.ts`
- `src/features/beads/links.ts`
- `src/features/beads/links.test.ts`
- `src/features/markdown/MarkdownRenderer.tsx`
- `src/features/markdown/MarkdownRenderer.test.tsx`

**Status:** ✅ Complete

**Results:** Implemented the narrow render-stage preservation fix on `feature/bead-viewer` without loosening the actual click/open path. `src/features/beads/links.ts` now exports a syntax-only explicit URI predicate so render-time markdown URL preservation can recognize valid `bead://...#<id>` links even when `currentDocumentPath` is not yet available. `src/features/markdown/MarkdownRenderer.tsx` now uses that lightweight predicate only inside `transformMarkdownUrl(...)`, while the anchor click path still relies on strict `parseBeadLinkHref(...)` resolution with document context. Added focused regression coverage in `src/features/beads/links.test.ts` and `src/features/markdown/MarkdownRenderer.test.tsx` for: (1) relative explicit bead URIs being preserved as anchors, (2) href preservation through markdown render on context-free surfaces, and (3) in-app interception still happening only when the stricter parse has current-document context. Focused verification passed via `npm test -- --run src/features/beads/links.test.ts src/features/markdown/MarkdownRenderer.test.tsx` (45 tests passed).

---

### Task 3: Roll the corrected `feature/bead-viewer` fix into combo and document dogfood readiness

**Bead ID:** `nerve-bf5y`  
**SubAgent:** `primary`  
**Prompt:** After the fix is verified on `feature/bead-viewer`, roll it into combo, verify the root markdown dogfood behavior, and document the final expected clickable/rendered behavior for explicit `bead://` links.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-bead-uri-links-not-clickable.md`

**Status:** ✅ Complete

**Results:** Rolled the canonical `feature/bead-viewer` fix into combo by cherry-picking `7104d97` onto `feature/combo-workhorse-all-unmerged-2026-04-07`, producing combo commit `c2c64e9` (`Preserve explicit bead URIs during markdown rendering`). The cherry-pick applied cleanly with no conflicts, so combo now carries the exact canonical fix rather than a combo-only patch. Focused verification on combo passed via `npm test -- --run src/features/beads/links.test.ts src/features/markdown/MarkdownRenderer.test.tsx` (45 tests passed across 2 files). Expected dogfood behavior after this roll-forward: explicit relative markdown links like `bead://projects/...#<bead-id>` now survive markdown URL transform, render as clickable anchors, and still defer actual in-app bead interception/opening to the stricter context-aware parse path.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Combo now carries the canonical bead-viewer render-stage preservation fix so explicit `bead://...#...` markdown links remain clickable anchors instead of degrading to plain text. The combo branch inherits the exact canonical behavior: markdown rendering preserves syntactically valid explicit bead URIs, while actual bead opening still requires the stricter context-aware parse path.

**Commits:**
- `c2c64e9` - Preserve explicit bead URIs during markdown rendering

**Lessons Learned:** For custom-scheme markdown links, render-time URL sanitization and click-time routing need different levels of strictness. Preserving syntactically valid bead URIs during markdown transform avoids losing the anchor before document-context-aware parsing has a chance to run.

---

*Completed on 2026-04-08*
