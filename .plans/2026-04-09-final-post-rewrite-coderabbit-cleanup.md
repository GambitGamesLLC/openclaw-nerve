# Final Post-Rewrite CodeRabbit Cleanup for PR #253

**Date:** 2026-04-09  
**Status:** Draft  
**Agent:** Chip 🐱‍💻

---

## Goal

Resolve the remaining worthwhile CodeRabbit findings on the cleaned `feature/beads-view-ui` branch while keeping the PR free of `.plans/` noise.

---

## Overview

PR `#253` has already been cleaned to remove accidental `.plans/` contamination, and the rewritten branch is now upstream-safe from a packaging standpoint. After that rewrite, CodeRabbit surfaced a smaller final batch of real follow-up findings. The meaningful remaining items appear to be a symlink-containment hardening fix in `server/lib/beads.ts`, repo-root directory validation before spawning `bd`, canonical tab-id handling for absolute explicit bead links in `src/features/beads/links.ts`, and a small deterministic test cleanup in `src/features/file-browser/MarkdownDocumentView.test.tsx`.

This pass must stay disciplined. We should land only the still-real fixes, rerun focused validation plus lint/build, push once, and re-check PR `#253` directly. Just as importantly, we must avoid reintroducing `.plans/` artifacts into the PR while documenting orchestration work locally.

---

## Tasks

### Task 1: Implement the remaining worthwhile post-rewrite CodeRabbit fixes

**Bead ID:** `Pending`  
**SubAgent:** `coder`  
**Prompt:** In `~/workspace/projects/gambit-openclaw-nerve` on branch `feature/beads-view-ui`, implement only the remaining worthwhile post-rewrite CodeRabbit fixes. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Final post-rewrite CodeRabbit fixes implemented" --json`. Verify and fix only if still real: (1) symlink-safe workspace containment in `server/lib/beads.ts`, (2) repoRoot existence/directory validation before spawning `bd` in `server/lib/beads.ts`, (3) canonical tab IDs for absolute explicit bead links in `src/features/beads/links.ts`, and (4) the small `markdownRendererSpy` test cleanup in `src/features/file-browser/MarkdownDocumentView.test.tsx`. Keep scope tight, add/update focused tests where appropriate, and do not commit any `.plans/` files onto this branch. Record exact files changed and commit hashes for handoff.

**Folders Created/Deleted/Modified:**
- `server/lib/`
- `src/features/beads/`
- `src/features/file-browser/`
- local `.plans/` notes only (must NOT be committed onto PR branch)

**Files Created/Deleted/Modified:**
- `server/lib/beads.ts`
- related bead tests as needed
- `src/features/beads/links.ts`
- related link tests as needed
- `src/features/file-browser/MarkdownDocumentView.test.tsx`
- local planning notes only if needed, not for commit

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 2: Revalidate, push, and re-check PR #253 for any remaining issues

**Bead ID:** `Pending`  
**SubAgent:** `research`  
**Prompt:** In `~/workspace/projects/gambit-openclaw-nerve` on branch `feature/beads-view-ui`, after Task 1, rerun focused validation plus lint/build, push the branch, and re-check PR `#253` directly. Claim the assigned bead at start with `bd update <id> --status in_progress --json` and close it on completion with `bd close <id> --reason "Revalidated PR 253 after final post-rewrite cleanup" --json`. Confirm checks, mergeability, unresolved review threads, and whether any `.plans/` files are present in the PR diff. Do not commit `.plans/` files onto this branch. Return exact commands run, outcomes, push status, and whether only maintainer review remains.

**Folders Created/Deleted/Modified:**
- local `.plans/` notes only (must NOT be committed onto PR branch)

**Files Created/Deleted/Modified:**
- no durable PR-branch plan files expected

**Status:** ⏳ Pending

**Results:** Pending.

---

## Final Results

**Status:** ⏳ Pending

**What We Built:** Pending.

**Commits:**
- Pending

**Lessons Learned:** Pending.

---

*Started on 2026-04-09*
