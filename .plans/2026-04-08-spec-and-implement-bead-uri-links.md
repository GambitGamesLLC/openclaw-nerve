# Spec and Implement Explicit `bead://` URI Links

**Date:** 2026-04-08  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Define and implement an upstream-friendly explicit `bead://` URI format on `feature/bead-viewer` so bead links can resolve across arbitrary Beads stores without relying on local workspace layout assumptions, then roll the finished fix into combo for testing.

---

## Overview

The current `bead:<id>` handling works for routing, but root-workspace dogfood exposed a portability problem: cross-repo bead lookup currently depends on Nerve's local repo context, which is too implicit and too environment-specific for an upstream Issue + PR.

We want an explicit URI-based solution that works for all users, not just one workspace layout. The agreed direction is:
- support a `bead://` URI form
- allow both absolute and relative paths
- avoid assuming where Beads are stored unless the link explicitly says so
- preserve the simpler local/current-context behavior only where it remains appropriate

This task will first write down the spec clearly, then implement it on `feature/bead-viewer`, verify it, and finally roll the corrected Beads branch into combo for dogfood.

---

## Proposed Spec

### Finalized explicit form

`bead://<repo-path-or-.beads-path>#<bead-id>`

Examples:
- `bead:///home/alice/work/repos/virtra-apex-docs#virtra-apex-docs-id2`
- `bead:///home/alice/work/repos/virtra-apex-docs/.beads#virtra-apex-docs-id2`
- `bead://../projects/virtra-apex-docs#virtra-apex-docs-id2`
- `bead://../projects/virtra-apex-docs/.beads#virtra-apex-docs-id2`

### Parsing model

Treat `bead://` as a **custom application URI**, not a WHATWG/URL-authority URL.

Concretely:
- the substring after `bead://` and before `#` is the filesystem target payload
- the substring after `#` is the bead ID
- parsing should be done with a small custom parser, not `new URL(...)`

That keeps the agreed explicit shape while still allowing relative paths like `../repo`, which standard authority-based URL parsing would treat awkwardly.

### Resolution rules

1. The fragment is required and is the bead ID. It must satisfy the existing bead ID validation already used for `bead:<id>`.
2. The path payload is required and may point to either:
   - a repo root, or
   - that repo's `.beads` directory
3. If the path payload is absolute, use it as-is.
4. If the path payload is relative, resolve it relative to the **directory containing the current markdown document**.
   - For a markdown file at `docs/specs/links.md`, `bead://../repo#x` resolves relative to `docs/specs/`
   - If there is no current document path available for the render surface, relative explicit bead URIs are invalid there; require an absolute path in that context
5. After path resolution:
   - if the target ends in `.beads`, normalize to that Beads store's owning repo root for server lookup
   - otherwise treat the target as the repo root
6. The server lookup must execute `bd show <id> --json` against that resolved repo context, instead of defaulting to Nerve's own `process.cwd()` repo.
7. If the explicit target does not resolve to a valid repo / Beads context, return a precise error describing whether the failure was:
   - invalid URI shape
   - missing/invalid bead ID fragment
   - unresolved relative path
   - target path not found
   - target path not a repo root or `.beads` directory
   - bead not found in the explicitly targeted context

### Legacy behavior

- Keep `bead:<id>` unchanged for same-context / current-repo lookup.
- `bead:<id>` remains the simple shorthand when the current repo context is already the correct Beads store.
- Do **not** make implicit cross-repo guessing the primary model.
- Use `bead://...#id` whenever the author wants to target a different repo or a non-default Beads context explicitly.

### Non-goals

- No global workspace scan guessing by default.
- No hardcoded assumptions about `workspace/projects/*`.
- No requirement that bead prefixes map to repo names.
- No attempt to infer cross-repo location from `bead:<id>` alone beyond existing same-context behavior.

---

## Tasks

### Task 1: Finalize the `bead://` URI spec against the current code paths

**Bead ID:** `nerve-eqef`  
**SubAgent:** `research`  
**Prompt:** Review the current `bead:` link routing and lookup code on `feature/bead-viewer`, then refine and document the `bead://<path>#<bead-id>` spec so it fits the existing markdown renderer, app routing, and server lookup model with minimal churn.

**Folders Created/Deleted/Modified:**
- `.plans/`
- inspected `src/features/markdown/`
- inspected `src/features/beads/`
- inspected `src/features/file-browser/`
- inspected `server/lib/`
- inspected `server/routes/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-spec-and-implement-bead-uri-links.md`

**Status:** ✅ Complete

**Results:** Reviewed the current branch wiring and finalized the explicit URI recommendation around the existing architecture instead of inventing a new routing model. Current flow is: `MarkdownRenderer` intercepts `bead:` links, `App.tsx` opens bead tabs keyed as `bead:<...>`, `useBeadDetail()` fetches `/api/beads/:id`, and `server/lib/beads.ts` currently runs `bd show` in `process.cwd()`. The key refinement is that `bead://` should stay an explicit cross-context form whose path payload is parsed manually and resolved before server lookup, while legacy `bead:<id>` remains same-context shorthand. Practical implementation notes for Task 2:
- extend the bead link helpers to decode either legacy `bead:<id>` or explicit `bead://<path>#<id>` into a structured bead target
- keep markdown interception precedence ahead of workspace-path handling, just as current `bead:` links already do
- keep the UI tab model lightweight by continuing to open a bead viewer tab through the existing bead-tab path, but preserve enough explicit-target info for fetches
- extend `/api/beads/:id` with explicit context input (prefer a repo-root path after normalization) so `getBeadDetail()` can execute against the requested Beads context instead of defaulting to Nerve's repo
- normalize explicit `.beads` targets to the owning repo root before invoking `bd show`
- reject relative explicit bead URIs on render surfaces that do not have a current document path available, rather than silently guessing
- do not use `new URL()` for `bead://` parsing because the agreed relative examples are better handled as a custom application URI payload than as authority-based URLs

---

### Task 2: Implement explicit `bead://` URI parsing and resolution on `feature/bead-viewer`

**Bead ID:** `nerve-tt2l`  
**SubAgent:** `coder`  
**Prompt:** On `feature/bead-viewer`, implement support for explicit `bead://<path>#<bead-id>` links with relative and absolute path resolution, keeping legacy `bead:<id>` support for same-context lookup. Update the client/server lookup path with the narrowest design that satisfies the spec, and add focused tests.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `server/lib/`
- `server/routes/`
- `src/features/beads/`
- `src/features/chat/`
- `src/features/file-browser/`
- `src/features/markdown/`
- `src/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-spec-and-implement-bead-uri-links.md`
- `server/lib/beads.ts`
- `server/lib/beads.test.ts`
- `server/routes/beads.ts`
- `server/routes/beads.test.ts`
- `src/App.tsx`
- `src/features/beads/BeadViewerTab.tsx`
- `src/features/beads/index.ts`
- `src/features/beads/links.ts`
- `src/features/beads/links.test.ts`
- `src/features/beads/types.ts`
- `src/features/beads/useBeadDetail.ts`
- `src/features/chat/ChatPanel.tsx`
- `src/features/chat/MessageBubble.tsx`
- `src/features/file-browser/MarkdownDocumentView.tsx`
- `src/features/file-browser/MarkdownDocumentView.test.tsx`
- `src/features/file-browser/TabbedContentArea.tsx`
- `src/features/file-browser/TabbedContentArea.test.tsx`
- `src/features/markdown/MarkdownRenderer.tsx`
- `src/features/markdown/MarkdownRenderer.test.tsx`

**Status:** ✅ Complete

**Results:** Implemented explicit `bead://<path>#<bead-id>` support on `feature/bead-viewer` while preserving legacy `bead:<id>` shorthand. The client now parses legacy and explicit bead URIs with a custom parser, carries explicit lookup context through bead tab state and `/api/beads/:id`, and keeps bead interception ahead of workspace-path handling. Relative explicit targets are only accepted when a current markdown document path is available; otherwise they are rejected on that render surface instead of guessed. The server now resolves explicit target paths against the current markdown document context, normalizes `.beads` targets back to repo roots before invoking `bd show`, and executes lookup in the resolved repo context instead of defaulting to Nerve's `process.cwd()`. Focused tests were added/updated for link parsing, explicit/relative resolution, markdown interception behavior, tab plumbing, and route/server lookup context handling. Verification run completed successfully with `npx vitest run src/features/beads/links.test.ts src/features/markdown/MarkdownRenderer.test.tsx src/features/file-browser/MarkdownDocumentView.test.tsx src/features/file-browser/TabbedContentArea.test.tsx server/lib/beads.test.ts server/routes/beads.test.ts server/routes/file-browser.test.ts` and `npm run build`.

---

### Task 3: Roll the finished `feature/bead-viewer` URI fix into combo and document dogfood usage

**Bead ID:** `nerve-65rz`  
**SubAgent:** `primary`  
**Prompt:** After the `feature/bead-viewer` implementation is verified, roll the explicit `bead://` URI fix into combo, verify the resulting behavior, and document the final dogfood syntax and expectations in this plan.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-spec-and-implement-bead-uri-links.md`

**Status:** ⏳ Pending

**Results:** Pending.

---

## Final Results

**Status:** ⏳ Pending

**What We Built:** Pending.

**Commits:**
- Pending.

**Lessons Learned:** Pending.

---

*Drafted on 2026-04-08*
