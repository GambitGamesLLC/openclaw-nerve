# Correct Beads Branch Layout and Delete Stray Branch

**Date:** 2026-04-08  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Correct the branch model for Beads work in `gambit-openclaw-nerve` so the upstream PR branch remains a single Beads feature branch based on upstream `master`, and delete the mistakenly created extra branch to avoid future confusion.

---

## Overview

I incorrectly created a new narrow branch for the `bead:` routing fix off the combo branch. Derrick clarified the intended model: the Beads work is a single feature branch based on upstream `master`, and it should contain the full Beads scope intended for the Issue + PR, including the specialized bead viewer and `bead:` link resolution/routing behavior.

Combo is only the integration/dogfood branch. It may temporarily carry rolled-in Beads work for testing, but it is not the source-of-truth feature branch for the upstream Beads PR.

This correction task will reconcile the branch mental model and remove the accidental extra branch so future sessions do not mistake it for the canonical Beads branch.

### Verified branch model (2026-04-08)

- **Canonical model Derrick confirmed:** one Beads feature branch, based directly on `upstream/master`, containing the full Beads scope for the upstream issue/PR.
- **That full scope includes:** specialized bead viewer behavior plus `bead:` markdown link preservation and in-app routing.
- **Combo branch role:** `feature/combo-workhorse-all-unmerged-2026-04-07` is only a rolled-up dogfood/integration branch, not the source-of-truth Beads PR branch.
- **Mistaken stray routing-fix branch:** `slice/nerve-1vl5-bead-link-routing`.
- **Stray branch remote status:** local-only; no matching `origin/slice/nerve-1vl5-bead-link-routing` remote branch exists.
- **Deletion completed:** local branch `slice/nerve-1vl5-bead-link-routing` was deleted with `git branch -D slice/nerve-1vl5-bead-link-routing` while checked out on `feature/combo-workhorse-all-unmerged-2026-04-07`.
- **Relevant Beads-related branches still present:** `feature/bead-viewer-tab-foundation`, `feature/bead-viewer-tab-foundation-hidden-workspace`, `design/beads-integration-baseline-2026-04-06`, and `slice/bead-scheme-markdown-navigation`.
- **Confirmed ambiguity:** the repo still has multiple Beads-related branches, and none is cleanly named as the single canonical upstream Beads feature branch. The older feature/design branches are also not based on current `upstream/master`, while the deleted routing-fix branch had been based on current `upstream/master` but was explicitly the accidental extra branch, not the canonical one.

---

## Tasks

### Task 1: Identify the canonical Beads branch and record the correct branch model

**Bead ID:** `nerve-fcnx`  
**SubAgent:** `primary`  
**Prompt:** Inspect the current local and remote branches in `gambit-openclaw-nerve`, identify the canonical Beads feature branch based on upstream `master`, and update this plan with the correct branch model Derrick specified. Do not delete anything yet. If Beads branch naming/history is ambiguous, document the ambiguity precisely.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-correct-beads-branch-layout-and-delete-stray-branch.md`

**Status:** ✅ Complete

**Results:** Verified the current branch set and recorded the corrected branch model. Exact Beads-related branches found: `feature/bead-viewer-tab-foundation`, `feature/bead-viewer-tab-foundation-hidden-workspace`, `design/beads-integration-baseline-2026-04-06`, `slice/bead-scheme-markdown-navigation`, and the mistaken extra branch `slice/nerve-1vl5-bead-link-routing`. Confirmed `slice/nerve-1vl5-bead-link-routing` is local-only. Confirmed `feature/combo-workhorse-all-unmerged-2026-04-07` is an integration/dogfood branch only. Remaining ambiguity: the repo still does not have one clearly designated single canonical Beads feature branch name that matches Derrick's intended model.

---

### Task 2: Delete the mistaken extra branch created during the routing-fix error

**Bead ID:** `nerve-a95w`  
**SubAgent:** `primary`  
**Prompt:** Delete the mistaken extra branch created during the routing-fix work so it does not confuse future sessions. Confirm the exact branch name before deletion, verify it is not the canonical Beads feature branch, then delete it locally and remotely if a remote branch exists. Record exactly what was deleted and what remains.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-08-correct-beads-branch-layout-and-delete-stray-branch.md`

**Status:** ✅ Complete

**Results:** Verified the current checked-out branch was `feature/combo-workhorse-all-unmerged-2026-04-07`, so the stray branch was safe to delete. Deleted only `slice/nerve-1vl5-bead-link-routing` locally with `git branch -D slice/nerve-1vl5-bead-link-routing`; Git reported `Deleted branch slice/nerve-1vl5-bead-link-routing (was 26166bb).` No remote deletion was needed because no matching `origin/slice/nerve-1vl5-bead-link-routing` branch exists. Remaining relevant Beads-related branches still present: `feature/bead-viewer-tab-foundation`, `feature/bead-viewer-tab-foundation-hidden-workspace`, `design/beads-integration-baseline-2026-04-06`, and `slice/bead-scheme-markdown-navigation`.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Recorded the corrected Beads branch model, deleted the accidental local-only branch `slice/nerve-1vl5-bead-link-routing`, and documented the relevant Beads-related branches that still remain in the repo.

**Commits:**
- Pending

**Lessons Learned:** Branch naming drift created ambiguity. The canonical Beads work should be consolidated around one clearly designated branch based on current `upstream/master`, while combo remains dogfood-only.

---

*Drafted on 2026-04-08*
