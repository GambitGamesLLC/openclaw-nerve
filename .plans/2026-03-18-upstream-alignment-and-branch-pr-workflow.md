---
plan_id: plan-2026-03-18-upstream-alignment-and-branch-pr-workflow
related_bead_ids:
  - nerve-xaa
  - nerve-dqc
  - nerve-u2h
bead_ids:
  - nerve-b1p
  - Pending
---
# Gambit OpenClaw Nerve — upstream alignment and branch / PR workflow

**Date:** 2026-03-18  
**Status:** Draft  
**Agent:** Chip 🐱‍💻

---

## Goal

Define a durable workflow so `gambit-openclaw-nerve` can stay close to upstream Nerve while our local features and bug fixes live on clean branches, land on our `master` branch for real use, and also map back to upstream issues and PRs whenever appropriate.

---

## Overview

Right now the main pressure is divergence management. Each local Nerve change that ships directly into our fork helps us move fast, but it also increases the cost of future upstream rebases, cherry-picks, and comparisons. The goal of this planning slice is to turn that into an explicit workflow instead of an accidental one.

The intended shape is: upstream Nerve remains the comparison baseline, `gambit-openclaw-nerve` remains the repo Derrick actually uses, and our custom work gets grouped into branch-sized slices that are understandable both locally and upstream. That means each meaningful feature or fix should have a local branch, a linked tracking issue, and—when it makes sense—an upstream issue + PR path. Our `master` branch can still represent the integrated Derrick-ready build, but it should be assembled from named branches/slices rather than undocumented direct drift.

This plan should begin only after the current attachment-forwarding feature slice is verified as bug-free enough to treat as a stable candidate. That verification work is already underway under `nerve-xaa` / `nerve-dqc` / `nerve-u2h`, so this plan can be prepared now and executed once that prerequisite is satisfied.

---

## Tasks

### Task 1: Capture the current divergence and repo relationship model

**Bead ID:** `Pending`  
**SubAgent:** `research`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, audit the current relationship between the fork and upstream Nerve. Summarize remotes, default branches, notable local-only commits/features, and the practical categories of divergence. Claim the assigned bead at start, document findings in this plan, and close the bead when done.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upstream-alignment-and-branch-pr-workflow.md`

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 2: Design the branch strategy for local integrated use vs upstreamable slices

**Bead ID:** `Pending`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, design a branch model that keeps `master` usable for Derrick while ensuring new fixes/features land through named topic branches that can later connect to upstream issues and PRs. Include guidance for integration branches, feature branches, cherry-picks/rebases, and when local-only work should stay out of upstream. Claim the assigned bead at start, update this plan with the real proposal, and close the bead when finished.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upstream-alignment-and-branch-pr-workflow.md`

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 3: Define the issue / PR linkage workflow to upstream Nerve

**Bead ID:** `Pending`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, define a concrete workflow for linking each upstreamable local Nerve change to an upstream issue and PR. Cover naming, tracking fields, when to open the issue, how to reference the local bead/plan/branch, and how merged or rejected upstream changes should be reflected back into our fork workflow. Claim the assigned bead at start, update this plan, and close the bead when complete.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upstream-alignment-and-branch-pr-workflow.md`

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 4: Define the sync and maintenance cadence

**Bead ID:** `Pending`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, define how often we should pull from upstream, how to evaluate conflicts, and what safety checks happen before promoting branch slices into our `master`. Include practical rules for testing, conflict review, and when to pause local divergence work. Claim the assigned bead at start, update this plan with the recommended cadence, and close the bead when complete.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upstream-alignment-and-branch-pr-workflow.md`

**Status:** ⏳ Pending

**Results:** Pending.

---

### Task 5: Convert the approved workflow into executable beads

**Bead ID:** `Pending`  
**SubAgent:** `primary`  
**Prompt:** After Derrick approves the upstream-alignment workflow, create the execution beads needed to implement it in `gambit-openclaw-nerve`, link them to this plan, and sequence them behind the current attachment-forwarding verification work where appropriate. Claim the assigned bead at start, create the beads, update this plan with exact IDs, and close the bead when finished.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/`

**Files Created/Deleted/Modified:**
- `.plans/2026-03-18-upstream-alignment-and-branch-pr-workflow.md`

**Status:** ⏳ Pending

**Results:** Pending.

---

## Dependencies / Preconditions

- The current attachment-forwarding slice should be treated as the immediate feature prerequisite:
  - `nerve-dqc` — implement attachment-aware Nerve subagent spawn path
  - `nerve-u2h` — validate end-to-end image forwarding from Nerve to spawned subagent
- We can design the workflow now, but we should avoid final rollout decisions until the current feature is confirmed stable enough to represent as a clean branch-sized slice.

---

## Final Results

**Status:** ⚠️ Planned

**What We Built:** A draft planning scaffold for reducing fork drift and making local Nerve changes legible both in our fork and upstream.

**Commits:**
- Pending

**Lessons Learned:** The important move is separating “how we ship Derrick-ready integrated Nerve” from “how we package upstreamable changes” so our fork stops accumulating unnamed divergence.

---

*Planned on 2026-03-18*