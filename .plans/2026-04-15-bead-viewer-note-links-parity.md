# gambit-openclaw-nerve — bead viewer note-links parity lane

**Date:** 2026-04-15  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Land a clean upstream-ready Nerve change that makes links rendered inside Bead viewer notes behave with the same markdown/link-rendering capability as Nerve’s main markdown viewer, then dogfood that exact change in `workhorse-v1`, and finally package it as an upstream Issue + PR that we drive through tests and CodeRabbit review.

---

## Overview

We already proved yesterday that the current follow-up bead is `nerve-uqct`: the remaining gap is not general Beads navigation, but specifically that the Bead viewer is not rendering note content with the same link capability as the markdown viewer. Today Derrick clarified the branch-ownership rule for this lane: if the original upstream Beads viewer lane is still open and unmerged, we should land this on that existing branch because the missing parity was part of the intended Beads-viewer feature set; if that lane has already landed in upstream `master`, then we should cut a fresh clean branch from `upstream/master` for the follow-up.

Live check now confirms the upstream Beads viewer PR is still open and unmerged: PR `#253` (`feature/beads-view-ui` → `master`) on `daggerhashimoto/openclaw-nerve` has `state: OPEN` and `mergedAt: null`. So the current canonical source branch for this work is back to `feature/beads-view-ui`, not a fresh branch. `workhorse-v1` still remains the rollup branch used to verify the stack of upstream-facing Nerve changes together; it is not the source of truth for this feature. Once the updated source branch is validated through `workhorse-v1`, we will update the existing upstream artifacts and then work through automated checks and CodeRabbit feedback until the branch is in a maintainable upstream-ready state.

This plan assumes the desired acceptance bar is **behavioral parity**, not necessarily literal component reuse if a thinner implementation is cleaner. The real audit question is: do Bead viewer notes support the same practical markdown-rendered link behavior as the main markdown viewer, including clickable links and future markdown-viewer link enhancements landing naturally for Beads as well? Reserved fresh-branch name if we later need one because PR `#253` lands first: `feature/bead-viewer-markdown-parity`.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Existing open follow-up bead for this lane | `.beads/` via `bd show nerve-uqct --json` |
| `REF-02` | Yesterday’s open-beads review and narrowed Beads-branch conclusions | `.plans/2026-04-14-open-beads-review-and-bug-lane-selection.md` |
| `REF-03` | Session memory capturing the new follow-up bead and branch hygiene expectations | `/home/derrick/.openclaw/workspace/memory/2026-04-14.md` |
| `REF-04` | Prior clean upstream branch packaging pattern for Beads-related work | `.plans/2026-04-08-cut-clean-beads-view-ui-branch-and-package-upstream.md` |
| `REF-05` | Current workhorse rollup baseline | `.plans/2026-04-12-workhorse-v1-rollup.md` |

---

## Tasks

### Task 1: Audit the current Bead viewer rendering path and define the narrowest honest parity contract

**Bead ID:** `nerve-uqct`  
**SubAgent:** `primary`  
**References:** `REF-01`, `REF-02`, `REF-03`  
**Prompt:** Claim `nerve-uqct`, inspect the current Bead viewer note-rendering path versus the main markdown viewer, and prove exactly where parity is missing. Define the narrowest technically honest acceptance contract for “equal rendering capability” so we can implement the feature on a fresh branch from `upstream/master` without silently broadening scope. Record whether the correct path is renderer reuse, shared normalization/linkification, or another parity-preserving approach.

**Folders Created/Deleted/Modified:**
- `.plans/`
- source folders for inspection only

**Files Created/Deleted/Modified:**
- `.plans/2026-04-15-bead-viewer-note-links-parity.md`

**Status:** ✅ Complete

**Results:** Inspected `src/features/beads/BeadViewerTab.tsx`, `src/features/markdown/MarkdownRenderer.tsx`, `src/features/markdown/inlineReferences.tsx`, `src/features/chat/MessageBubble.tsx`, `src/features/chat/ChatPanel.tsx`, `src/features/file-browser/MarkdownDocumentView.tsx`, `src/features/file-browser/TabbedContentArea.tsx`, and `src/App.tsx` (the `chatPathLinks` load + prop plumbing), plus the existing tests in `src/features/markdown/MarkdownRenderer.test.tsx` and `src/features/beads/BeadViewerTab.test.tsx`.

Proven current behavior: Bead viewer notes already use the shared `MarkdownRenderer`, so normal markdown parsing, markdown links, relative-file opens, heading anchors, and explicit `bead:` links are already on the shared path. The actual divergence is narrower: `MarkdownRenderer` only enables CHAT_PATH_LINKS-driven inline path detection/linkification through `pathLinkPrefixes` / `pathLinkAliases`, and those props are currently threaded through the chat rendering path (`App.tsx` → `ChatPanel` → `MessageBubble` → `MarkdownRenderer`) but not through the Bead viewer path (`TabbedContentArea` → `BeadViewerTab` → `MarkdownRenderer`). As a result, Bead notes do **not** get the same inline bare-path / alias / host-absolute workspace path linkification behavior that chat markdown gets. This also means inline-code path references in Bead notes miss the same normalization, because `InlineCodeContent` depends on the same props.

Recommended acceptance contract for implementation on a fresh branch from `upstream/master`: make Bead viewer notes receive the same CHAT_PATH_LINKS config inputs as the main chat markdown viewer, using the same `MarkdownRenderer` behavior rather than a bead-specific parser. Acceptance should be limited to the proven gap:
1. In Bead viewer notes, inline workspace path references that are linkified in chat using configured `pathLinkPrefixes` / `pathLinkAliases` must also be linkified and open the same normalized workspace target.
2. The same parity must apply inside inline code spans in Bead notes, because chat gets that through `InlineCodeContent` in the shared renderer.
3. Existing shared behavior already present in both places (markdown links, relative document links, heading anchors, explicit `bead:` links) must remain unchanged.
4. No new bead-only markdown semantics should be introduced; parity should come from shared prop plumbing into `MarkdownRenderer`, not a forked renderer.

Implementation shape recommendation: shared normalization/linkification via existing component reuse. The renderer is already shared; the missing piece is passing the CHAT_PATH_LINKS config into the Bead viewer path (and only as far as needed for note rendering). If future exact parity with markdown document preview is desired, that can be a separate follow-up, because this diagnosis only proves the chat-vs-bead viewer gap.

---

### Task 2: Implement the parity fix on the canonical upstream source branch

**Bead ID:** `nerve-wkrw`  
**SubAgent:** `coder`  
**References:** `REF-01`, `REF-04`, Task 1 findings  
**Prompt:** After Task 1 defines the parity contract, first verify whether the original Beads viewer upstream lane is still open and unmerged. If PR `#253` / branch `feature/beads-view-ui` is still the honest owning branch, implement the parity fix there. Only cut a fresh branch from `upstream/master` (reserved name: `feature/bead-viewer-markdown-parity`) if `feature/beads-view-ui` has already landed upstream before implementation begins. Do not put planning artifacts or unrelated work onto the source branch. Claim the relevant bead(s), implement the feature, add or update focused tests, run repo-local validation, and push the canonical source branch to the Gambit fork.

**Folders Created/Deleted/Modified:**
- `src/`
- `src/features/beads/`
- `src/features/file-browser/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/App.tsx`
- `src/features/beads/BeadViewerTab.tsx`
- `src/features/beads/BeadViewerTab.test.tsx`
- `src/features/file-browser/TabbedContentArea.tsx`
- `src/features/file-browser/TabbedContentArea.test.tsx`
- `.plans/2026-04-15-bead-viewer-note-links-parity.md`

**Status:** ✅ Complete

**Results:** Implemented the narrow parity fix on `feature/beads-view-ui` by threading the existing chat path-link prefix config through `App.tsx` → `TabbedContentArea.tsx` → `BeadViewerTab.tsx` → `MarkdownRenderer`. Focused validation passed:
- `npm test -- --run src/features/beads/BeadViewerTab.test.tsx src/features/file-browser/TabbedContentArea.test.tsx src/features/markdown/MarkdownRenderer.test.tsx`
- `npx eslint src/App.tsx src/features/beads/BeadViewerTab.tsx src/features/beads/BeadViewerTab.test.tsx src/features/file-browser/TabbedContentArea.tsx src/features/file-browser/TabbedContentArea.test.tsx`

Material branch-state corrections discovered during implementation and intentionally **not** broadened past the current shared renderer contract:
1. This branch currently exposes only `pathLinkPrefixes` in `CHAT_PATH_LINKS`; there is no `pathLinkAliases` prop/config in the repo yet.
2. The current shared `MarkdownRenderer` explicitly does **not** linkify inline-code path text anywhere today (`src/features/markdown/MarkdownRenderer.test.tsx` already asserts that), so the honest parity fix was to preserve that shared inline-code behavior rather than invent bead-only semantics.

Outcome: Bead viewer notes now get the same existing chat path-prefix config for plain-text configured workspace-path linkification, while shared behaviors already present on the common renderer path (markdown links, relative doc links, heading anchors, explicit bead links, and current inline-code behavior) remain unchanged.

Commit / push handoff:
- `bc5ddae` — `Thread chat path prefixes into bead viewer notes`
- pushed to `origin/feature/beads-view-ui`

---

### Task 3: Verify the canonical branch independently before dogfood merge

**Bead ID:** `nerve-goj0`  
**SubAgent:** `auditor`  
**References:** Task 1 contract, Task 2 implementation commits  
**Prompt:** Independently audit the clean branch implementation. Verify that links inside Bead viewer notes now render with the same practical capability as the main markdown viewer, review the diffs and tests, and determine whether the implementation is narrowly honest and maintainable upstream. Close the audit bead only if the feature really matches the accepted contract.

**Folders Created/Deleted/Modified:**
- `.plans/`
- source/test folders for audit as needed

**Files Created/Deleted/Modified:**
- `.plans/2026-04-15-bead-viewer-note-links-parity.md`

**Status:** ✅ Complete

**Results:** Independent audit passed on `feature/beads-view-ui` at `bc5ddae7d7166c7429b44f39a297bcad2b2bbddf` (`Thread chat path prefixes into bead viewer notes`). I verified the branch head, reviewed the exact diff, and checked the surrounding shared-renderer contract in `src/features/markdown/MarkdownRenderer.tsx`, `src/features/markdown/MarkdownRenderer.test.tsx`, `src/features/chat/chatPathLinks.ts`, `src/features/file-browser/TabbedContentArea.tsx`, and `src/features/beads/BeadViewerTab.tsx`.

Accepted contract after audit: this branch honestly supports parity for the **existing shared plain-text configured path-prefix linkification** path only. The implementation correctly threads `pathLinkPrefixes` from `App.tsx` through `TabbedContentArea` into `BeadViewerTab`, which already uses the shared `MarkdownRenderer`; that is the narrowest maintainable fix for the proven gap. The audit confirms two important scope corrections versus the earlier rough wording:
1. This repo state does **not** expose `pathLinkAliases` on this lane yet; `src/features/chat/chatPathLinks.ts` currently defines only `prefixes`.
2. The shared `MarkdownRenderer` explicitly does **not** linkify configured path text inside inline code anywhere on this branch; `src/features/markdown/MarkdownRenderer.test.tsx` asserts that behavior, and the audited change correctly preserves it instead of inventing bead-only inline-code semantics.

Validation I ran:
- `npm test -- --run src/features/beads/BeadViewerTab.test.tsx src/features/file-browser/TabbedContentArea.test.tsx src/features/markdown/MarkdownRenderer.test.tsx` ✅ (`3` test files, `45` tests passed)
- `npx eslint src/App.tsx src/features/beads/BeadViewerTab.tsx src/features/beads/BeadViewerTab.test.tsx src/features/file-browser/TabbedContentArea.tsx src/features/file-browser/TabbedContentArea.test.tsx` ✅

Conclusion: the source branch is now narrowly honest and maintainable for PR `#253` so long as its description/acceptance language is updated to match actual repo capability: Bead viewer notes now inherit the same current chat/workspace plain-text path-prefix linkification via the shared renderer plumbing, while existing shared markdown behavior remains unchanged.

---

### Task 4: Merge the clean branch into `workhorse-v1` for dogfood validation

**Bead ID:** `nerve-qt2g`  
**SubAgent:** `coder`  
**References:** `REF-05`, audited canonical branch head  
**Prompt:** Merge or cherry-pick the audited clean branch into `workhorse-v1`, resolve conflicts cleanly, run the relevant validation, push `workhorse-v1`, and prepare a precise dogfood/retest flow so Derrick can verify the behavior in the live Nerve app. This branch must receive only the integration merge work needed to validate the canonical feature.

**Folders Created/Deleted/Modified:**
- `src/`
- `src/features/beads/`
- `src/features/file-browser/`
- `.plans/`

**Files Created/Deleted/Modified:**
- `src/App.tsx`
- `src/features/beads/BeadViewerTab.tsx`
- `src/features/beads/BeadViewerTab.test.tsx`
- `src/features/file-browser/TabbedContentArea.tsx`
- `src/features/file-browser/TabbedContentArea.test.tsx`
- `.plans/2026-04-15-bead-viewer-note-links-parity.md`

**Status:** ✅ Complete

**Results:** Cherry-picked the audited canonical commit `bc5ddae7d7166c7429b44f39a297bcad2b2bbddf` (`Thread chat path prefixes into bead viewer notes`) onto `workhorse-v1` as `4213c6c` with no merge conflicts.

Because `workhorse-v1` already contains later shared-renderer behavior beyond the audited source branch, the imported Bead viewer test was slightly too specific for this branch state. I made one follow-up **test-only** adjustment in `src/features/beads/BeadViewerTab.test.tsx` so the workhorse verification stays narrowly honest about the intended contract: it now asserts plain-text workspace-path prefix parity without turning this roll-in into an inline-code feature claim. Final workhorse commit for the rolled-in dogfood state is recorded after that adjustment.

Validation on `workhorse-v1`:
- `npm test -- --run src/features/beads/BeadViewerTab.test.tsx src/features/file-browser/TabbedContentArea.test.tsx src/features/markdown/MarkdownRenderer.test.tsx` ✅ (`3` files, `62` tests passed). Vitest emitted the pre-existing nested-button warning from `TabbedContentArea.test.tsx`, but the run passed.
- `npx eslint src/App.tsx src/features/beads/BeadViewerTab.tsx src/features/beads/BeadViewerTab.test.tsx src/features/file-browser/TabbedContentArea.tsx src/features/file-browser/TabbedContentArea.test.tsx` ✅

Precise live dogfood flow for Derrick in Nerve:
1. Start the `workhorse-v1` build of Nerve and open a workspace that has `CHAT_PATH_LINKS` configured.
2. Open a bead in the Bead viewer whose notes include a plain-text workspace path using the configured prefix style already linkified in chat (for example `/workspace/...`).
3. Confirm that plain-text path in bead notes renders as a clickable link.
4. Click the path and verify Nerve opens the same workspace target/file you would get from the chat markdown viewer.
5. In the same bead notes, also spot-check that existing shared behavior still works unchanged: regular markdown links, relative links, heading anchors, and explicit `bead:` links.
6. Keep the wording honest while dogfooding: this roll-in is validating shared plain-text path-prefix linkification parity plumbing for bead notes on `workhorse-v1`; do **not** frame it as new alias support or as a dedicated inline-code feature.

---

### Task 5: Package the validated lane as upstream Issue + PR and drive review completion

**Bead ID:** `nerve-f8zs`  
**SubAgent:** `primary`  
**References:** Task 2–4 outputs, branch head, validation evidence  
**Prompt:** After `workhorse-v1` dogfood passes, create the upstream Issue and PR for this new Bead viewer note-links parity lane from the clean branch, write the maintainer-facing summary accurately, and then work through repo tests and CodeRabbit review until the branch is green and the discussion is up to date.

**Folders Created/Deleted/Modified:**
- `.plans/`
- GitHub metadata only unless follow-up code changes are required

**Files Created/Deleted/Modified:**
- `.plans/2026-04-15-bead-viewer-note-links-parity.md`

**Status:** ⏳ Pending

**Results:** Pending Derrick approval.

---

## Final Results

**Status:** ⏳ Draft

**What We Built:** Diagnostic contract complete. Live branch ownership check confirms PR `#253` / `feature/beads-view-ui` is still open and unmerged upstream, so this parity fix should currently land on that existing source branch rather than a fresh branch.

**Reference Check:** Pending execution.

**Commits:**
- None yet.

**Lessons Learned:** The key branch-ownership rule is clear for this lane: the feature must originate from a fresh `upstream/master` branch, then be rolled into `workhorse-v1` only for dogfood validation.

---

*Completed on 2026-04-15*
