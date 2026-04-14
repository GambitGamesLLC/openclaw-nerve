# gambit-openclaw-nerve — PR #270 CodeRabbit follow-up

**Date:** 2026-04-14  
**Status:** Draft  
**Agent:** Chip 🐱‍💻

---

## Goal

Resolve the current CodeRabbit findings on upstream PR `#270` (`feature/chat-path-links-aliases`) while preserving the verified alias-mapping scope, then keep the branch ready for further upstream review.

---

## Overview

The new alias-mapping lane is already in good shape mechanically: it was implemented from fresh `upstream/master`, audited, rolled into `workhorse-v1`, dogfooded successfully, and packaged upstream as Issue `#269` and PR `#270`. The immediate priority now is not more product scope; it is review follow-through.

That means we should inspect the current CodeRabbit / PR feedback on `#270`, categorize each finding by severity and correctness, then land the narrowest valid fixes on the owning branch `feature/chat-path-links-aliases`. As with the other Nerve lanes, we should keep the fix history on the existing branch, rerun relevant validation, and only then report the branch as review-ready again.

Separately, Derrick asked that we preserve the earlier Beads-view note-link problem as future work. That work is now captured in bead `nerve-uqct`, explicitly scoped toward feature parity with the `CHAT_PATH_LINKS` path-link systems rather than being folded into this PR follow-up lane.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Upstream issue for alias mapping | `#269` |
| `REF-02` | Upstream PR for alias mapping | `#270` |
| `REF-03` | Alias-mapping feature plan | `.plans/2026-04-14-chat-path-links-alias-mapping.md` |
| `REF-04` | Future bead-view note-link parity follow-up | `bead:nerve-uqct` |

---

## Tasks

### Task 1: Audit current PR #270 review findings

**Bead ID:** `Pending`  
**SubAgent:** `primary`  
**References:** `REF-01`, `REF-02`, `REF-03`  
**Prompt:** Inspect all current review feedback on PR `#270`, especially CodeRabbit findings. Summarize each actionable issue, determine whether it is valid, and recommend the smallest correct implementation response on the existing branch `feature/chat-path-links-aliases`.

**Folders Created/Deleted/Modified:**
- `.plans/`
- GitHub metadata for inspection only

**Files Created/Deleted/Modified:**
- `.plans/2026-04-14-pr270-coderabbit-followup.md`

**Status:** ✅ Complete

**Results:** Reviewed the current PR `#270` feedback. The only substantive CodeRabbit finding is valid: alias rewrite currently uses first-match order, which can choose the wrong target when aliases overlap (for example a shorter alias winning before a longer, more specific alias). CodeRabbit also emitted docstring-coverage warnings, but those are advisory/style-only and not a correctness blocker for this lane. CI build noise was checked as part of the review pass. Recommended response: keep the branch `feature/chat-path-links-aliases`, implement longest-prefix alias matching in `rewriteAliasPrefix(...)`, add focused overlap tests, rerun validation, and leave the broader scope unchanged.

---

### Task 2: Implement valid PR #270 review fixes on `feature/chat-path-links-aliases`

**Bead ID:** `Pending`  
**SubAgent:** `coder`  
**References:** Task 1 findings, `REF-02`  
**Prompt:** On branch `feature/chat-path-links-aliases`, implement the valid CodeRabbit/review fixes with the smallest correct changes, rerun relevant validation, commit/push, and keep the branch scope limited to the alias-mapping lane.

**Folders Created/Deleted/Modified:**
- repo source/test folders as needed
- `.plans/`

**Files Created/Deleted/Modified:**
- source/test files as needed
- `.plans/2026-04-14-pr270-coderabbit-followup.md`

**Status:** ⏳ Pending

**Results:** Pending execution.

---

### Task 3: Audit the follow-up fixes independently

**Bead ID:** `Pending`  
**SubAgent:** `auditor`  
**References:** Task 2 output, `REF-02`  
**Prompt:** Independently audit the PR `#270` follow-up fixes, verify the review findings were addressed correctly without widening scope, and confirm the branch is ready for continued upstream review.

**Folders Created/Deleted/Modified:**
- repo source/test folders as needed
- `.plans/`

**Files Created/Deleted/Modified:**
- source/test files only if needed to prove an audit blocker
- `.plans/2026-04-14-pr270-coderabbit-followup.md`

**Status:** ⏳ Pending

**Results:** Pending execution.

---

## Final Results

**Status:** ⏳ Draft

**What We Built:** Draft plan only. No review fixes landed yet.

**Reference Check:** Pending.

**Commits:**
- None yet.
