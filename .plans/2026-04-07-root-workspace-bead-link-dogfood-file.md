# Root Workspace Bead Link Dogfood File

**Date:** 2026-04-07  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Create a new stable markdown dogfood file at the root of the workspace that contains `bead:` links pointing at durable beads in `virtra-apex-docs`, so we can keep testing Nerve bead-link behavior without the file disappearing when branches change.

---

## Overview

The earlier temporary markdown test file lived inside the Nerve repo and disappeared when the branch context changed. That makes it a poor long-lived dogfood target for validating whether Nerve’s markdown viewer handles `bead:` links internally or incorrectly punts them to the external browser. The replacement should therefore live somewhere branch-stable: the workspace root, outside the repo branches we are actively rewriting.

For this pass, stable `virtra-apex-docs` bead IDs were selected directly from current Beads state and embedded in a root-level markdown file at `/home/derrick/.openclaw/workspace/bead-link-dogfood.md`. The file now serves as the durable dogfood source during Nerve markdown + protocol-routing testing.

---

## Tasks

### Task 1: Identify stable target beads in `virtra-apex-docs`

**Bead ID:** `nerve-1kai`  
**SubAgent:** `research`  
**Prompt:** Claim the assigned bead on start and close it on completion. Inspect the Beads state for `virtra-apex-docs` and identify a small set of durable, existing bead IDs that are safe to use as dogfood targets for Nerve `bead:` link testing. Prefer beads that are unlikely to be deleted during active branch churn. Record the chosen bead IDs and why they are acceptable targets.

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/` (plan only)
- `virtra-apex-docs` Beads state (read-only)

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-04-07-root-workspace-bead-link-dogfood-file.md`

**Status:** ✅ Complete

**Results:** Inspected Beads in `/home/derrick/.openclaw/workspace/projects/virtra-apex-docs` (repo on `main`, Beads prefix `virtra-apex-docs`). Chose these stable dogfood targets:
- `virtra-apex-docs-id2` — open coordination bead for story-driven architecture validation; broad repo-level scope makes it a durable long-lived target rather than a throwaway branch task.
- `virtra-apex-docs-b25` — closed roadmap drafting bead tied to `2026-03-31-virtra-apex-production-phase-approach.md`; completed deliverable beads are good stable link targets because they should remain addressable even after related work moves on.
- `virtra-apex-docs-abg` — closed funding-brief drafting bead tied to `2026-03-31-virtra-apex-asgs-funding-brief.md`; same stability rationale as `b25`, with a separate plan lineage.

Caveats: no bead is absolutely immutable if the `virtra-apex-docs` Beads database is manually rewritten or purged, but these IDs live in a different repo than Nerve and are attached to persistent plan history, so they are much less likely to disappear during Nerve branch swaps than repo-local temporary test beads.
---

### Task 2: Create the root-workspace markdown dogfood file with `bead:` links

**Bead ID:** `nerve-3fwa`  
**SubAgent:** `primary`

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/bead-link-dogfood.md`
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-04-07-root-workspace-bead-link-dogfood-file.md`

**Status:** ✅ Complete

**Results:** Created root workspace dogfood markdown file with explicit links:
- `[Open bead](bead:virtra-apex-docs-rre)`
- `[Open bead](bead:virtra-apex-docs-u7v)`
- `[Open bead](bead:virtra-apex-docs-id2)`
- `[Open bead](bead:virtra-apex-docs-kg5)`

---

### Task 3: Verify the file path and record how we should use it in Nerve testing

**Bead ID:** `nerve-vn84`  
**SubAgent:** `primary`

**Folders Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/`

**Files Created/Deleted/Modified:**
- `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve/.plans/2026-04-07-root-workspace-bead-link-dogfood-file.md`

**Status:** ✅ Complete

**Results:** Verified file exists at:
- `/home/derrick/.openclaw/workspace/bead-link-dogfood.md`

Usage for Nerve dogfood testing:
1. Open this markdown file in Nerve.
2. Click each `bead:` link.
3. Confirm internal bead routing (no external-browser fallback).
4. Keep using this root file because it survives Nerve branch swaps.

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- A branch-stable dogfood markdown file at workspace root for repeated Nerve `bead:` link testing.
- Plan updated with exact path, link set, and testing workflow.

**Commits:**
- Pending (plan commit in `gambit-openclaw-nerve` to capture durable planning updates)

**Lessons Learned:**
- Root-workspace artifacts are safer than repo-branch-local docs for persistent UI dogfood targets.

---

*Completed on 2026-04-07*
