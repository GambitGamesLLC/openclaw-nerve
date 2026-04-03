# Gambit OpenClaw Nerve — post-dogfood cleanup and upstream prep

**Date:** 2026-04-03  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Turn the successful upload/reference v2 dogfood branch into a concrete cleanup/polish and upstream-prep plan we can execute next, without changing live deployment config or implementing new code in this pass.

---

## Overview

`feature/upload-reference-v2` is now validated in dogfood for the three behaviors that mattered most:
- paperclip uploads resolve to canonical staged workspace references under `~/.openclaw/workspace/.temp/nerve-uploads/...`
- workspace file-tree `Add to chat` on a file creates a direct workspace file reference
- workspace file-tree `Add to chat` on a directory inserts structured workspace context into the draft

That means commit `9a5b03a` proved the product direction. The next move should not be “keep adding more feature surface.” It should be a short stabilization/polish slice that removes leftover v1/v2 transition baggage, tightens the maintainer story, and shrinks the eventual upstream diff to the parts that are genuinely generic.

This audit was planning-only. I did not change `~/.openclaw/.env`, did not alter deployment targets, and did not implement code changes. I audited the branch, the touched files, the earlier v2 plans/spec, and the current UI/server code. I also re-ran focused verification to confirm the path we are planning around is still green.

Verification run used during this audit:
- `npm test -- --run src/features/chat/addToChat.test.ts src/features/chat/InputBar.test.tsx src/features/file-browser/FileTreePanel.test.tsx server/lib/upload-reference.test.ts server/routes/upload-reference.test.ts`
- Result: `5` test files passed, `46` tests passed
- Noise still present: React `act(...)` warnings in some `InputBar` / `FileTreePanel` tests, plus Beads-source config warnings in isolated upload-reference tests

---

## Audit findings — cleanup and polish list

### High-priority cleanup before more dogfood or upstream pitching

1. **Remove the now-dead composer attach-by-path internals from `InputBar`.**
   - Current state: the visible composer helper is gone, but `InputBar.tsx` still contains hidden `showAttachByPathDialog` state, path-picker fetch/loading/error state, dialog rendering, and helper functions (`loadPathPickerDirectory`, `attachSelectedServerPath`).
   - Why it matters: this is branch baggage from the transition to the single-paperclip + workspace-context-menu model. It increases component size, keeps extra fetch/UI code alive, and makes the upstream story less honest.
   - Recommendation: make `InputBar` own only the surviving model — paperclip uploads + programmatic workspace `Add to chat` inserts.

2. **Fix transcript/debug copy that still teaches the old mental model.**
   - Current state: `MessageBubble.tsx` still summarizes attachments with language like `via Upload`, `via Attach by Path`, `ATTACH BY PATH`, `UPLOAD`, and `FILE_REF`.
   - Why it matters: dogfood validated the new product model, but the message UI still explains the old one. Upstream reviewers will notice the conceptual mismatch immediately.
   - Recommendation: default message copy should emphasize durable canonical references (`Workspace file`, `Imported file`, or simply `File`) and leave low-level origin labels for debug/advanced views only.

3. **Resolve the contract overlap between `/api/upload-stage` and `/api/upload-reference/resolve`.**
   - Current state: the branch’s new flow uses `/api/upload-reference/resolve`, but the older `/api/upload-stage` route is still mounted and documented as the canonical contract in `docs/ARCHITECTURE.md`.
   - Why it matters: two apparently canonical upload paths is confusing internally and a non-starter upstream.
   - Recommendation: decide explicitly whether `upload-stage` is (a) a temporary compatibility layer to retire, or (b) an internal staging helper hidden behind `upload-reference`. Then update docs and route ownership accordingly.

4. **Document the actual v2 contract in API / architecture docs.**
   - Current state: `docs/API.md` does not describe `/api/upload-reference/resolve`, and `docs/ARCHITECTURE.md` still describes `/api/upload-stage` as the canonical path-backed upload contract.
   - Why it matters: we now have a validated contract but the docs still describe the pre-v2 shape.
   - Recommendation: add a narrow docs slice covering direct workspace reference vs imported workspace reference, server-side validation, and the canonical-path invariant.

### Medium-priority polish

5. **Trim test noise before upstream prep.**
   - Current state: targeted tests pass, but React `act(...)` warnings still fire in `InputBar` / `FileTreePanel` tests.
   - Why it matters: not a product bug, but it makes future refactors noisier and makes CI output less trustworthy.
   - Recommendation: fix the warnings in the first stabilization slice so later upstream PRs have cleaner evidence.

6. **Reduce config/test warning noise in isolated upload-reference tests.**
   - Current state: upload-reference tests emit repeated `[config] ⚠ Skipping Beads source ...` warnings because test homes only partially mirror the full workspace config.
   - Why it matters: this is distracting and will bury real failures over time.
   - Recommendation: add a test-local config override or narrower fixture setup for these route/lib tests.

7. **Split surviving product logic from file-object transport hacks.**
   - Current state: `InputBar` creates synthetic `File` objects with injected `path` / `size` properties so the rest of the pipeline can reuse existing upload descriptor code.
   - Why it matters: it works, but it is an implementation shortcut, not a clean upstream story.
   - Recommendation: keep it if needed for local velocity, but for upstream prep consider a cleaner resolved-attachment view model that does not pretend server-known references are browser-native `File` objects.

### Lower-priority / later polish

8. **Consider tightening attachment summary presentation after stabilization.**
   - Current state: message bubbles expose a lot of low-level optimization/preparation detail.
   - Why it matters: useful locally, but probably too much by default for upstream.
   - Recommendation: do not mix this with the first stabilization slice; revisit when preparing transcript/message polish.

9. **Review naming consistency around `server_path`.**
   - Current state: internal descriptors still use `origin: 'server_path'` even though the UX now speaks in terms of workspace/direct references.
   - Why it matters: this is acceptable internal legacy for now, but it is not a good final upstream vocabulary.
   - Recommendation: defer renaming until after the hidden attach-by-path residue is gone and the route contract is settled.

---

## Classification for upstream readiness

### A. Local-only / Gambit-specific in current form

1. **Exact staging root choice: `~/.openclaw/workspace/.temp/nerve-uploads/...`**
   - Keep the behavior locally.
   - Do **not** upstream the OpenClaw-specific absolute path convention as-is.
   - Upstream story should be “workspace-scoped canonical staging area,” not our exact home-directory layout.

2. **Subagent-forwarding manifest details and current attachment metadata shape**
   - The local `<nerve-forwarded-server-paths>` handoff and current payload/debug richness are valuable for OpenClaw/Gambit workflows.
   - Do **not** make that part of the first upstream pitch.
   - Upstream first needs the simpler attachment contract, not the full downstream orchestration story.

3. **Directory `Add to chat` as structured draft text, in its current exact format**
   - The behavior is practical locally and validated in dogfood.
   - But it is still a product choice, not an obvious universal upstream contract.
   - The exact `Workspace context:` block format should stay local unless/until we simplify and pitch it separately.

4. **Verbose transcript/debug badges and optimization artifacts shown inline by default**
   - Useful for local debugging.
   - Not suitable to upstream in current default presentation.

### B. Clearly upstream-ready, or close enough after a small cleanup slice

1. **Server-side canonical resolution contract**
   - `direct_workspace_reference` for validated workspace files
   - `imported_workspace_reference` for external files staged into workspace temp
   - Server-side validation, symlink escape rejection, and canonical path production are maintainer-friendly and generic.

2. **Single paperclip mental model for chat attachments**
   - Dogfood validated that the user should not pick between “upload” and “attach by path” in the composer.
   - This is the strongest product-level upstream story.

3. **Workspace file-tree `Add to chat` for files**
   - File-only `Add to chat` is easy to explain and aligns cleanly with the canonical reference contract.
   - This is a good separate upstream slice after the core contract lands.

4. **Canonical-path-first transcript/history semantics**
   - The durable file reference is the real long-term artifact.
   - Upstream should prefer that framing over origin-specific jargon.

### C. Needs more simplification before upstreaming

1. **`InputBar` implementation shape**
   - Right now it still contains hidden dialog/state baggage from the old attach-by-path flow.
   - Upstreaming before trimming that would make the PR look larger and less settled than it really is.

2. **Legacy/internal naming: `server_path`, `file_reference`, `ATTACH BY PATH`**
   - These names leak the old product model.
   - The behavior is right; the language still needs consolidation.

3. **Dual-route story: `upload-stage` + `upload-reference`**
   - Upstream should see one coherent contract path, not evidence of a transition in progress.

4. **Synthetic-`File` plumbing for server-known references**
   - Acceptable locally for reuse.
   - Needs a cleaner abstraction if we want to upstream the client slice without extra explanation.

---

## Explicit “do not upstream yet” callouts

These are the pieces we should **not** upstream in current form:

- the exact OpenClaw staging path under `~/.openclaw/workspace/.temp/nerve-uploads`
- the current directory `Add to chat` draft-block format (`Workspace context:` block) as a core attachment feature
- transcript/default UI language that still says `ATTACH BY PATH`, `UPLOAD`, or over-exposes `FILE_REF` / optimizer internals
- the hidden composer attach-by-path dialog code path that remains in `InputBar`
- the full current attachment/subagent manifest/debug payload surface as part of the first maintainer-facing pitch
- any PR that mixes the clean attachment contract with unrelated Gambit/OpenClaw workflow affordances

---

## Recommended next execution order

### 1) First stabilization slice

**Title:** remove leftover dual-mode composer baggage and align user-visible wording with v2

**What to do:**
- remove hidden attach-by-path dialog/state/helpers from `InputBar`
- keep only the single paperclip flow plus workspace-driven `addWorkspacePath(...)`
- update message bubble summaries/badges so default UI stops teaching `Upload` vs `Attach by Path`
- fix the current `act(...)` warnings in focused upload/workspace tests
- update plan/docs notes with the exact surviving model

**Why first:**
- smallest slice with the best payoff
- shrinks the conceptual diff before any upstream discussion
- makes later screenshots/video/demo evidence cleaner and more maintainable

**What not to include in this slice:**
- no deployment changes
- no `.env` edits
- no route/API renaming unless directly needed to remove dead code
- no attempt to upstream yet

### 2) First upstream issue / discussion artifact

**Title:** simplify Nerve attachments to one attach flow backed by canonical workspace references

**Artifact should cover:**
- problem: current/legacy dual-mode language is confusing
- validated behavior from dogfood: one paperclip can yield either direct workspace references or imported staged references
- attachment invariant: every successful attachment resolves to one durable canonical workspace path
- separable workspace-browser action: `Add to chat` for existing workspace files
- explicit non-goal: directory-as-context and subagent-forwarding details are not required for the first upstream decision

**Why this issue first:**
- gets maintainer buy-in on product shape before code slicing
- lets us present the validated behavior without dumping local-only workflow details

### 3) First likely upstream PR slice

**Title:** server-side canonical attachment resolution contract

**Scope:**
- add or pitch the minimal route/helper that resolves:
  - direct workspace references for validated workspace files
  - imported workspace references for external files
- include trust-boundary checks, canonical path normalization, and basic tests
- avoid composer UX churn in this first PR

**Why this is the first PR, not the UI:**
- it is the most generic and maintainer-reviewable slice
- it establishes the contract the later UI can lean on
- it avoids shipping our transient client-side complexity before we simplify it

### Suggested sequence after that

1. stabilization cleanup slice in Gambit fork
2. maintainer-facing issue/discussion artifact
3. upstream PR 1: canonical resolution contract
4. upstream PR 2: single-paperclip composer simplification
5. upstream PR 3: workspace file-tree `Add to chat` for files only
6. optional later discussion/PR for directory context insertion, only if still desired after upstream feedback

---

## Tasks

### Task 1: Audit the dogfood branch for cleanup and polish items

**Bead ID:** `nerve-8l00`  
**SubAgent:** `primary`

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-03-post-dogfood-cleanup-and-upstream-prep.md`

**Status:** ✅ Complete

**Results:**
- Claimed `nerve-8l00`, audited the branch, earlier v2 planning docs, current server/client code, and dogfood conclusions.
- Re-ran focused verification:
  - `npm test -- --run src/features/chat/addToChat.test.ts src/features/chat/InputBar.test.tsx src/features/file-browser/FileTreePanel.test.tsx server/lib/upload-reference.test.ts server/routes/upload-reference.test.ts`
  - result: `46` tests passed across `5` test files
- Wrote a concrete cleanup/polish list instead of generic advice.
- Main concrete findings:
  - hidden attach-by-path dialog/state still exists in `InputBar`
  - message/transcript wording still teaches the old `Upload` vs `Attach by Path` model
  - docs still describe `upload-stage` as canonical while the shipped flow now uses `upload-reference/resolve`
  - focused tests are green but still noisy (`act(...)` warnings + config warnings)

---

### Task 2: Classify the branch changes into local-only vs upstream-ready slices

**Bead ID:** `nerve-lm7i`  
**SubAgent:** `primary`

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-03-post-dogfood-cleanup-and-upstream-prep.md`

**Status:** ✅ Complete

**Results:**
- Claimed `nerve-lm7i` and classified the validated work into:
  - local-only / Gambit-specific
  - clearly upstream-ready
  - needs-more-simplification
- Strongest upstream-ready pieces are the canonical server-side resolution contract, single-paperclip user model, file-only workspace `Add to chat`, and canonical-path-first transcript semantics.
- Explicitly called out what **not** to upstream yet, including the exact OpenClaw staging path, current directory-context insertion format, hidden composer legacy code, and the full current forwarding/debug payload surface.

---

### Task 3: Propose the next execution order for stabilization and upstream prep

**Bead ID:** `nerve-3gjt`  
**SubAgent:** `primary`

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-03-post-dogfood-cleanup-and-upstream-prep.md`

**Status:** ✅ Complete

**Results:**
- Claimed `nerve-3gjt` and turned the audit into an immediate execution order.
- Recommended first slice:
  - remove remaining dual-mode composer baggage
  - align transcript/default UI wording with v2
  - clean focused test noise
- Recommended first maintainer artifact:
  - issue/discussion framing the single attach flow + canonical workspace references
- Recommended first upstream PR:
  - server-side canonical resolution/import contract only
- Kept the sequence practical and maintainer-aware rather than trying to upstream the whole dogfood branch.

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- Converted the successful dogfood outcome into a concrete post-dogfood cleanup and upstream-prep plan.
- Recorded the current validated behavior and the exact areas that still need polish before more execution.
- Produced a maintainer-aware classification of what should remain local, what is upstream-ready, and what still needs simplification.
- Proposed the next execution order so the next plan can create Beads and start work immediately.

**Commits:**
- None in this planning-only pass.
- Branch context audited: `9a5b03a` — `feat(attachments): ship upload/reference v2 attachment flow`

**Lessons Learned:**
- Dogfood proved the behavior; it did **not** automatically prove the current code/doc shape is ready for upstream.
- The main risk now is not correctness. It is carrying transitional complexity and local vocabulary into a maintainer-facing slice.
- The right next move is a short cleanup/stabilization pass, then a small issue/contract-first upstream sequence.

*Completed on 2026-04-03*