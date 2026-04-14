# gambit-openclaw-nerve — open beads review and bug lane selection

**Date:** 2026-04-14  
**Status:** Draft  
**Agent:** Chip 🐱‍💻

---

## Goal

Review the currently open Nerve bug beads, choose one repair lane, land the fix on the correct clean branch from `upstream/master` (or on the already-owning upstream branch if one exists), merge that fix into `workhorse-v1` for dogfood validation, and then package the result as the appropriate upstream Issue + PR update once the fix is confirmed.

---

## Overview

The current working rule remains the same as the earlier `workhorse` and `workhorse-v1` packaging passes: product fixes should not live only on the integration branch. `workhorse-v1` is the dogfood rollup branch, not the canonical home for new bug-fix history. So for whichever open bug bead we choose, we first need to determine whether the bug belongs on an already-open source branch / PR or whether it deserves a fresh clean branch cut directly from `upstream/master`.

The open bug backlog currently contains a mix of fresh product regressions and older packaging / follow-up tasks. The two most immediately actionable recent bug reports are: (1) missing subagent visibility in the Nerve UI, which appears related to existing upstream PR `#226` / branch `slice/nerve-sv1-sessions-subagent-visibility`, and (2) file/path-like links in chat that still do not resolve as clickable/valid links in Nerve. After Derrick’s follow-up clarification, Bug 2 now looks more specifically like a sibling of the existing Beads-link and workspace-link rendering logic: the UI likely expects real markdown bead URIs such as `bead:nerve-5olj` or explicit `bead://...#nerve-5olj`, while my plain spoken `nerve-5olj` mentions are being rendered as styled tokens rather than anchor hrefs that the Beads navigation code can intercept.

This plan is intentionally structured so we do the branch-ownership decision before any implementation. The current leading hypothesis is that the next fix may not be “bead viewer broken” so much as “message content is not being transformed into the exact bead-link format that the current resolver expects.” Once the chosen bug is fixed on its canonical branch, we will merge or cherry-pick that exact fix into `workhorse-v1`, run the relevant repo-local validation, and only then decide whether we update an existing upstream PR or open a new Issue + PR pair.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Current `workhorse-v1` rollup and included branch stack | `.plans/2026-04-12-workhorse-v1-rollup.md` |
| `REF-02` | Prior packaging / provenance rules for chat-links and upload-config lanes | `.plans/2026-04-11-workhorse-packaging-and-chat-links-hardening.md` |
| `REF-03` | Memory note capturing earlier priority on subagent-visibility Bug 1 and branch hygiene guardrails | `/home/derrick/.openclaw/workspace/memory/2026-04-09.md` |
| `REF-04` | Recent bug bead evidence for missing subagent visibility | `/home/derrick/.openclaw/workspace/.temp/nerve-uploads/2026/04/13/image-7112aba2.png` |
| `REF-05` | Recent bug bead evidence for unresolved file/path links | `/home/derrick/.openclaw/workspace/.temp/nerve-uploads/2026/04/14/image-19f4a5ac.png` |

---

## Tasks

### Task 1: Diagnose the bead-linking failure mode before choosing a repair lane

**Bead ID:** `Pending`  
**SubAgent:** `primary`  
**References:** `REF-01`, `REF-02`, `REF-03`, `REF-04`, `REF-05`  
**Prompt:** Diagnose the current bead-linking failure mode in Nerve before choosing an implementation lane. Specifically determine whether the problem is: (a) chat rendering not recognizing / preserving `bead:` protocol links the way markdown documents do, (b) assistant output / orchestration guidance not requiring bead-compatible markdown links when bead IDs are referenced in chat, or (c) both. Compare plan-markdown rendering behavior versus chat-message rendering behavior, and recommend the smallest correct next lane only after the failure mode is proven.

**Folders Created/Deleted/Modified:**
- `.plans/`
- `.beads/` (after execution approval)

**Files Created/Deleted/Modified:**
- `.plans/2026-04-14-open-beads-review-and-bug-lane-selection.md`
- `/home/derrick/.openclaw/workspace/chat-bead-link-dogfood.md`

**Status:** ⏳ Pending

**Results:** Derrick approved the diagnostic-first direction and requested a workspace-root markdown dogfood file with bead-link variants so document rendering and chat rendering can be compared manually before any branch / issue / PR decision.

---

### Task 2: Determine canonical owning branch and execution path

**Bead ID:** `nerve-5bg4`  
**SubAgent:** `primary`  
**References:** `REF-01`, `REF-02`, selected bug bead and any related branch / PR refs  
**Prompt:** After Task 1 proves the actual failure mode, determine whether the repair belongs on an already-existing clean branch / upstream PR or on a brand-new branch cut from fresh `upstream/master`. This decision must distinguish between product-code fixes in Nerve and contract/guidance fixes in our orchestration docs/prompts. Record the exact branch strategy, related PR/issue lineage, and the merge path back into `workhorse-v1` for testing if a Nerve code fix is needed.

**Folders Created/Deleted/Modified:**
- `.plans/`
- git refs / worktrees as needed

**Files Created/Deleted/Modified:**
- `.plans/2026-04-14-open-beads-review-and-bug-lane-selection.md`

**Status:** ✅ Complete

**Results:** Audited the existing Beads lineage and found that the clean upstream lane (`feature/beads-view-ui`, Issue `#251`, PR `#253`) definitely includes chat-touching files (`src/features/chat/ChatPanel.tsx`, `src/features/chat/MessageBubble.tsx`) and remains **open upstream**, so Derrick chose to continue from that branch rather than fork a new lane immediately. Current working decision: treat chat bead-link parity as work on `feature/beads-view-ui` / PR `#253` unless implementation proves the scope is materially larger than expected.

---

### Task 3: Implement the chosen fix on the canonical branch

**Bead ID:** `nerve-cl1v`  
**SubAgent:** `coder`  
**References:** selected bug bead, Task 2 branch decision, relevant source/test files  
**Prompt:** Claim the selected bug bead, implement chat bead-link parity on the canonical branch `feature/beads-view-ui`, run all relevant repo-local validation, and commit/push the work on that canonical branch. Do not put planning noise or Beads artifacts onto the upstream PR branch. Acceptance target: bead-compatible markdown links that work in markdown documents should also work in chat; separate from that, our agent guidance should require that Beads are always referenced with bead-compatible links rather than bare bead IDs.

**Folders Created/Deleted/Modified:**
- repo source/test folders as needed
- `.plans/`

**Files Created/Deleted/Modified:**
- source/test files to fix the bug
- `.plans/2026-04-14-open-beads-review-and-bug-lane-selection.md`

**Status:** ✅ Complete

**Results:** Implemented the canonical fix on `feature/beads-view-ui` and pushed commit `4ce866c` (`Fix chat bead-link parity during streaming`). The fix narrowed the bug to the streaming-chat path and routed streaming content through the shared `MarkdownRenderer` so chat now uses the same bead/workspace link handling stack as markdown documents. Changed files: `src/features/chat/components/StreamingMessage.tsx`, `src/features/chat/ChatPanel.tsx`, `src/hooks/useChatStreaming.ts`, `src/contexts/ChatContext.tsx`, and `src/features/chat/components/StreamingMessage.test.tsx`. Validation passed: `npm run lint`, `npm test -- --run`, `npm run build`, and `npm test -- --run src/features/chat/components/StreamingMessage.test.tsx`.

---

### Task 4: Audit the canonical fix independently before rolling into `workhorse-v1`

**Bead ID:** `nerve-9872`  
**SubAgent:** `auditor`  
**References:** `REF-01`, canonical fix commit(s) from Task 3  
**Prompt:** Independently audit the chat bead-link parity fix on `feature/beads-view-ui` after the coder finishes. Verify the implementation against the accepted goal: chat should support the same bead-compatible markdown link forms that already work in markdown documents. Review diffs, tests, and behavior carefully. If the work passes, close the audit bead with a clear reason; if it fails, report the gap and leave the bead open.

**Folders Created/Deleted/Modified:**
- repo source/test folders as needed
- `.plans/`

**Files Created/Deleted/Modified:**
- source/test files if merge conflict resolutions are required
- `.plans/2026-04-14-open-beads-review-and-bug-lane-selection.md`

**Status:** ✅ Complete

**Results:** Independent audit passed. The auditor verified that the bug was specifically in streaming chat, not settled message bubbles, and confirmed the fix preserves the accepted contract: chat now supports the same bead-compatible markdown link forms as markdown documents, while bare/raw bead IDs do not become supported user-facing syntax. Audit reruns passed: `npm test -- --run src/features/chat/components/StreamingMessage.test.tsx src/features/markdown/MarkdownRenderer.test.tsx src/features/beads/links.test.ts`, `npm test -- --run src/features/chat/MessageBubble.test.tsx`, `npm run build`, and `npm run lint -- ...changed files...` (no new errors; only pre-existing unrelated warnings). The fix is ready to merge into `workhorse-v1`.

---

### Task 5: Roll the audited fix into `workhorse-v1` and prepare dogfood

**Bead ID:** `nerve-zp1m`  
**SubAgent:** `coder`  
**References:** `REF-01`, canonical fix commit(s) from Task 3  
**Prompt:** Merge or cherry-pick the audited chat bead-link parity fix from `feature/beads-view-ui` into `workhorse-v1`, resolve any conflicts cleanly, run the relevant repo-local validation, and summarize the exact retest flow for Derrick.

**Folders Created/Deleted/Modified:**
- repo source/test folders as needed
- `.plans/`

**Files Created/Deleted/Modified:**
- source/test files if merge conflict resolutions are required
- `.plans/2026-04-14-open-beads-review-and-bug-lane-selection.md`

**Status:** ✅ Complete

**Results:** Rolled the audited canonical fix into `workhorse-v1` via cherry-pick (`524c89d` from canonical commit `4ce866c`) and added a branch-specific follow-up `46f4e63` (`Fix MarkdownRenderer memo deps on workhorse-v1`) so lint/build passed cleanly on the rollup branch. Pushed `origin/workhorse-v1`. Validation passed: `npm test -- --run src/features/chat/components/StreamingMessage.test.tsx`, `npm run lint`, and `npm run build` (with only pre-existing warnings / non-blocking chunk warnings).

---

### Task 6: Audit renderer-path divergence before accepting the fix rationale

**Bead ID:** `nerve-gm34`  
**SubAgent:** `primary`  
**References:** canonical fix commit `4ce866c`, rollup commits `524c89d`, `46f4e63`, relevant chat/markdown renderer files  
**Prompt:** Audit the product and maintainer impact of replacing the streaming chat HTML rendering path with the shared `MarkdownRenderer`. Compare the old `renderMarkdown`/sanitized-HTML streaming behavior against the new shared markdown-renderer behavior, identify any feature or rendering differences, and determine whether the chat parity fix is truly a narrow bugfix or effectively a renderer-convergence decision with broader product implications. Produce a concrete evidence-backed explanation suitable for maintainers.

**Folders Created/Deleted/Modified:**
- `.plans/`
- source files for inspection only

**Files Created/Deleted/Modified:**
- `.plans/2026-04-14-open-beads-review-and-bug-lane-selection.md`

**Status:** ⏳ Pending

**Results:** Derrick requested this audit before we treat the current fix rationale as accepted, because swapping streaming chat from the HTML path to `MarkdownRenderer` may be a broader maintainer-facing design decision than a simple Beads enhancement. After updating locally and restarting Nerve, Derrick manually verified that bead links now work both while the assistant message is streaming and after it settles, confirming the converged renderer path behaves correctly in practice. Decision: keep the product conclusion, but split upstream handling into two lanes — a narrow bead-link parity lane and a separate broader renderer-convergence lane for maintainer review.

---

### Task 7: Audit narrow bead-link parity viability without renderer convergence

**Bead ID:** `nerve-c868`  
**SubAgent:** `primary`  
**References:** old streaming renderer path, canonical fix commit `4ce866c`, renderer divergence audit `nerve-gm34`  
**Prompt:** Determine whether chat bead-link parity can be implemented while preserving the old streaming HTML renderer path. Identify the narrowest technically honest approach, what it would support, what it would not support, and whether the complexity/risk is preferable to renderer convergence. Produce a maintainer-facing recommendation.

**Folders Created/Deleted/Modified:**
- `.plans/`
- source files for inspection only

**Files Created/Deleted/Modified:**
- `.plans/2026-04-14-open-beads-review-and-bug-lane-selection.md`

**Status:** ⏳ Pending

**Results:** Derrick chose to split the upstream story into two lanes and asked for this audit first so we can see whether a truly narrow bead-link parity fix exists without changing the streaming renderer architecture. Follow-up decision after the audit: do **not** pursue the narrow stopgap fix. The existing Beads branch / PR should be updated only as needed so it correctly reflects the landed non-streaming chat behavior; streaming-renderer convergence is a separate broader design choice, nice-to-have only, and should live in its own future branch / issue / PR rather than blocking the current priority lane.

---

### Task 8: Narrow the Beads branch back to landed-chat + markdown scope

**Bead ID:** `nerve-gzdv`  
**SubAgent:** `coder`  
**References:** `feature/beads-view-ui`, PR `#253`, commits `4ce866c`, `524c89d`, renderer-divergence audits `nerve-gm34`, `nerve-c868`  
**Prompt:** Update `feature/beads-view-ui` so the branch reflects the agreed final scope: support markdown documents and landed/non-streaming chat, but do not claim or carry streaming-renderer convergence in this lane. Remove or revert the streaming-only convergence change as needed, preserve the valid Beads functionality, run validation, and push the narrowed branch.

**Folders Created/Deleted/Modified:**
- repo source/test folders as needed
- `.plans/`

**Files Created/Deleted/Modified:**
- source/test files as needed to restore the agreed scope
- `.plans/2026-04-14-open-beads-review-and-bug-lane-selection.md`

**Status:** ✅ Complete

**Results:** Narrowed `feature/beads-view-ui` to the agreed final scope by reverting the streaming-only convergence patch with commit `d96e475` (`Revert "Fix chat bead-link parity during streaming"`). The branch now supports markdown documents and landed/non-streaming chat paths that already use `MarkdownRenderer`, while explicitly not carrying streaming-renderer convergence in this lane. Validation passed on the narrowed branch: focused Beads/markdown/chat tests and `npm run build`.

---

### Task 9: Audit narrowed Beads scope before workhorse-v1 roll-in

**Bead ID:** `nerve-n923`  
**SubAgent:** `auditor`  
**References:** Task 8 output, PR `#253` scope, final scope agreement  
**Prompt:** Independently audit the narrowed `feature/beads-view-ui` branch after the coder updates it. Confirm the branch now honestly supports markdown documents plus landed/non-streaming chat, does not depend on streaming-renderer convergence, and remains suitable for PR `#253`.

**Folders Created/Deleted/Modified:**
- repo source/test folders as needed
- `.plans/`

**Files Created/Deleted/Modified:**
- source/test files only if an audit blocker must be proven
- `.plans/2026-04-14-open-beads-review-and-bug-lane-selection.md`

**Status:** ✅ Complete

**Results:** Independent audit passed on `feature/beads-view-ui` head `d96e475`. The auditor confirmed the branch honestly supports markdown documents plus landed/non-streaming chat paths through `MarkdownRenderer`, keeps core Beads functionality intact, and no longer depends on streaming-renderer convergence. Full validation passed: targeted renderer/chat/Beads tests, full test suite, `npm run lint`, and `npm run build`.

---

### Task 10: Roll narrowed Beads branch into `workhorse-v1` for final dogfood

**Bead ID:** `nerve-vms3`  
**SubAgent:** `coder`  
**References:** narrowed branch head `d96e475`, final scope agreement  
**Prompt:** Roll the audited narrowed `feature/beads-view-ui` branch into `workhorse-v1`, resolve conflicts if needed, run relevant validation, push the updated dogfood branch, and prepare Derrick’s final `update.sh` / restart retest instructions.

**Folders Created/Deleted/Modified:**
- repo source/test folders as needed
- `.plans/`

**Files Created/Deleted/Modified:**
- source/test files only if merge resolution requires changes
- `.plans/2026-04-14-open-beads-review-and-bug-lane-selection.md`

**Status:** ⏳ Pending

**Results:** Pending execution.

---

### Task 11: Package upstream follow-through after confirmation

**Bead ID:** `Pending`  
**SubAgent:** `primary`  
**References:** Task 2-4 outputs, related upstream issue/PR state  
**Prompt:** After local `workhorse-v1` validation and Derrick confirmation, either update the already-owning upstream PR or open the correct new Issue + PR pair. Record the final branch, commit, validation, and review links in the plan.

**Folders Created/Deleted/Modified:**
- `.plans/`
- GitHub metadata only unless follow-up code changes are required

**Files Created/Deleted/Modified:**
- `.plans/2026-04-14-open-beads-review-and-bug-lane-selection.md`

**Status:** ⏳ Pending

**Results:** Pending Derrick confirmation.

---

## Initial Open-Bead Snapshot

Most relevant current open bug candidates in `gambit-openclaw-nerve`:

- `nerve-5olj` — Investigate why valid-looking file/path links are not resolving in Nerve messages
  - Fresh bug report from today
  - Likely tied to existing chat-links / inline-reference lineage
  - Good candidate if we want a narrowly scoped, likely-fast bug lane
- `nerve-4lmx` — Investigate missing subagent visibility in Nerve UI
  - Fresh bug report from yesterday
  - Earlier memory notes indicate this was already considered Bug 1 priority before Bug 2
  - Strong chance the fix belongs on existing branch / PR `slice/nerve-sv1-sessions-subagent-visibility` / PR `#226`
- `nerve-p9r5` / `nerve-aqou` / `nerve-j5ey`
  - Related chatPathLinks endpoint / missing-file diagnosis and follow-through
  - More packaging/repair-path oriented than a single fresh user-facing symptom right now
- Older open epics such as `nerve-3vk0`, `nerve-grmd`, `nerve-gfue`, `nerve-mj7f`, `nerve-8e5d`, and `nerve-0i9w`
  - These look like broader upstream PR / review umbrellas rather than the cleanest next dogfood bug pick for this cycle

### Initial Recommendation

Derrick’s latest clarification changes the shape of the work.

Updated recommendation: **do not choose the repair lane yet**.

We now have at least two plausible failure modes:

1. **chat-renderer / product problem**
   - plan markdown documents understand and preserve `bead:` links correctly,
   - but chat-message rendering may not recognize, preserve, or route the same protocol the same way;
2. **output-contract / orchestration problem**
   - Nerve may already behave correctly when it receives proper bead-compatible markdown links,
   - but my responses and/or our agent guidance may not be strict enough about emitting full bead-compatible links instead of bare bead IDs in prose.

There may also be a mixed failure where both are true.

Concrete diagnostic checks to run first:

- confirm whether chat messages containing explicit markdown bead links like `[nerve-5olj](bead:nerve-5olj)` become clickable and route correctly;
- compare that behavior directly against plan-document rendering, since that path is already known-good;
- confirm whether bare bead IDs are intended to auto-link at all, or whether that should instead be enforced as an assistant-output contract / guidance rule.

Only after that should we decide whether the owning fix belongs to:

- the existing Beads branch / PR lineage (`feature/beads-view-ui` / PR `#253`),
- a chat-renderer-specific fresh branch from `upstream/master`, or
- our own orchestration docs / prompting rules rather than Nerve product code.

---

## Diagnostic Findings (2026-04-14)

Manual dogfood results from `/home/derrick/.openclaw/workspace/chat-bead-link-dogfood.md`:

- Sections 1–3 (`bead:` markdown links, explicit absolute bead links, explicit relative bead links): **all clickable** and opened the correct bead when rendered inside a markdown document.
- Sections 4–6 (plain bead IDs, inline-code bead IDs / URIs, raw bead URIs in prose): **not clickable** and **not rendered as links**.
- Section 7 (workspace-plan markdown links): **all clickable** and markdown files rendered as expected.

Diagnosis so far:

- The core Bead resolver/linking implementation for markdown documents is working for the supported explicit link formats.
- Bare bead IDs are not auto-linked in markdown documents, which appears to be current expected behavior rather than proof of a resolver defect.
- The remaining product gap is now specifically **chat parity**: Derrick wants bead-link behavior in chat to match markdown-document behavior, and current chat rendering does not provide that parity even though markdown-document rendering does.
- This strongly suggests the next implementation lane should target chat rendering / chat markdown handling for bead links, plus a guidance-contract update so agents **always** emit bead-compatible `bead:` markdown links when referencing Beads in user-facing output, rather than sometimes falling back to bare bead IDs.

## Final Results

**Status:** Draft → Diagnosis complete, execution not started

**What We Built:** A workspace-root bead-link dogfood markdown file and a proven diagnosis that markdown-document bead links work for supported formats while chat currently lacks bead-link parity.

**Reference Check:** `REF-01`, `REF-02`, `REF-03`, plus Derrick’s live manual dogfood results.

**Commits:**
- None yet.

**Lessons Learned:** The key question is no longer whether the Bead resolver works at all; it does in markdown documents. The open question is where chat rendering diverges and whether we should also tighten assistant-output rules so chat replies emit proper bead-compatible markdown links instead of bare IDs.
