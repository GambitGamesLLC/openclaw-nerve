---
plan_id: plan-2026-04-02-upload-reference-v2-upstream-spec-and-local-rollout
bead_ids:
  - nerve-081y
  - nerve-byli
  - nerve-snio
---
# Gambit OpenClaw Nerve — upload/reference v2 upstream spec and local rollout

**Date:** 2026-04-02  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Define a cleaner v2 attachment model for Nerve that unifies uploads and workspace file references, write the upstream-facing product/technical spec plus a realistic issue/PR slicing plan, and prepare a safe local testing path for Derrick’s working Nerve instance if the design is approved.

---

## Overview

The current Gambit upload/reference system proves that durable workspace-backed file references are valuable, especially for agent/subagent handoff. But the current UI and concept surface are heavier than they need to be for upstream: chat exposes both `Upload files` and `Attach by Path`, while the implementation carries multiple origin/mode distinctions that are useful internally but not ideal as the human-facing mental model.

The proposed v2 direction is simpler: the chat paperclip remains a single attach action. If the selected file is already inside the workspace and can be proven to resolve safely under the workspace root, Nerve should reference its canonical workspace path directly. If the file is external, Nerve should import it into durable workspace staging and reference that staged canonical path instead. Separately, the workspace browser can expose an explicit `Add to chat` action for existing workspace files, preserving the powerful direct-reference workflow without forcing the composer UI to expose a second attachment mode.

Upstreaming this requires more than a feature pitch. We need a product spec, architecture/spec split, a decomposition strategy into maintainer-digestible slices, and a local testing strategy for the working Nerve deployment. Because Derrick wants to test the new behavior on the live install once it is ready, the plan also needs to cover the deployment side: how `~/.openclaw/.env` and the `update.sh` / `restore.sh` flow can temporarily point Nerve at a feature branch safely and reversibly. Execution order is explicit: **A then B** — finish the spec/slicing/rollout design first, and only then prototype + switch the deployment target for testing when the branch is ready.

This plan deliberately builds on validated Gambit work already in the repo: canonical upload staging under `~/.openclaw/workspace/.temp/nerve-uploads`, attachment-aware subagent forwarding, preserved `server_path` semantics, and previous UX cleanup around origin-aware uploads. The v2 change is therefore a product simplification and contract-tightening pass, not a restart from scratch.

---

## Product / UX Spec — upload/reference v2

### Product thesis

Nerve should treat “attaching a file” as one human action with one primary result: the chat message carries a durable, explicit file reference that agents and subagents can reuse later. The system may reach that result in two different ways internally:

1. **Direct reference** when the file is already inside the workspace root.
2. **Imported reference** when the file originates outside the workspace and must be staged into a canonical workspace path first.

The user-facing model is therefore **one attach affordance, one durable reference outcome**. Origin is implementation detail unless it materially affects trust, permissions, or debugging.

### Primary user stories

- As a user, I can click the paperclip, pick a file, and trust that Nerve will either reference it directly or import it safely without making me choose between modes.
- As a user, I can browse files already in the workspace and explicitly add one to chat without re-uploading it.
- As a user, I can revisit old messages and still see stable file references that make sense for later handoff or re-use.
- As an operator, I can tell whether a file was referenced in place or imported, but that distinction should not clutter the default composer UX.
- As an upstream maintainer, I can reason about a small number of clear contracts: workspace-root validation, staging/import rules, transcript semantics, and forwarding semantics.

### Desired user-visible behavior

#### 1) Single paperclip flow in chat

- The composer shows a single paperclip / attach entrypoint.
- The action label should be generic (`Attach files`, `Attach`, or icon-only with accessible label), not mode-specific.
- The picker may allow selecting files from the local machine and, where platform support exists, already-known paths; but the UI should not force the user to decide between “upload” and “path attach” as separate concepts.
- After selection, the composer preview shows each item as a pending attachment with:
  - display name
  - size if known
  - final canonical reference path once resolved, or a temporary “Importing…”/“Resolving…” state while the system finalizes it
  - file type indicator / thumbnail where appropriate

#### 2) Direct canonical references for workspace files

When the selected file already lives inside the workspace root and safely resolves to a canonical workspace-relative path:

- Nerve should keep the file in place.
- The outgoing attachment should reference the canonical workspace path directly.
- The user should not see “uploaded” wording for this case.
- Optional secondary copy can say `Linked from workspace` or `Added from workspace` in advanced/debug surfaces, but not as noisy default chrome.

#### 3) Imported canonical references for external files

When the selected file is outside the workspace root:

- Nerve should import the file into the canonical staging/import area under the workspace.
- The outgoing attachment should reference that staged canonical path, not a transient browser blob path or an optimization-cache derivative.
- The UI can briefly communicate `Imported into workspace` during resolution, but after send the durable reference path is the important artifact.

#### 4) Separate workspace-browser action: Add to chat

The workspace browser should expose a deliberate `Add to chat` action for existing workspace files.

Why this matters:

- It preserves the power-user direct-reference workflow.
- It makes workspace-first usage discoverable without bloating the chat composer.
- It lets Nerve say “this came from the workspace browser” without teaching the user a second composer mode.

Expected behavior:

- Invoking `Add to chat` inserts the file into the composer attachment list.
- The inserted attachment behaves exactly like a direct canonical workspace reference.
- No re-copy/import occurs.
- The user lands back in chat with the attachment visible and send-ready.

#### 5) Transcript/history behavior

After the message is sent:

- The message should preserve a stable, human-readable file reference summary.
- Default transcript copy should emphasize the canonical path and file identity, not the acquisition mode.
- The transcript should remain understandable even weeks later when a user or subagent revisits it.
- Advanced surfaces may still preserve origin/debug metadata for operators, but the default badge language should prefer something like `File`, `Workspace file`, or `Imported file` over `Upload vs Attach by Path` jargon.

### What v2 intentionally removes from the current UX

#### Remove

- Separate composer entrypoints for `Upload files` and `Attach by Path`.
- Any user choice that asks humans to decide the transport/origin model up front.
- Wording that implies a browser-origin upload can remain an external transient object after send.
- Transcript emphasis on origin-specific jargon when the durable path is what actually matters.
- A misleading sense that “upload” and “path attach” are distinct long-term attachment types in the conversation model.

#### Preserve underneath

- The system may still track origin internally (`workspace_direct`, `imported`, legacy `server_path`, etc.) for debugging, policy, and analytics.
- Forwarding logic may still branch based on whether a descriptor was directly linked vs imported.
- Inline/image optimization can still exist as an optional delivery optimization, but it must never replace the canonical durable reference.
- Existing safeguards around workspace-root validation, path normalization, subagent forwarding, and large-file guardrails remain important.

### UX guardrails

- If a selected path cannot be proven safe under the workspace root, it must not be treated as a direct reference.
- If import/staging fails, the composer must show a clear error and avoid sending a half-resolved attachment.
- If a file is too large or unsuitable for optional inline preview/optimization, the durable reference path still remains the baseline successful path when import/reference succeeds.
- If a referenced file later disappears, the transcript should still show the historical path that was sent; broken later resolution is an access/runtime issue, not a reason to hide history.

### Non-goals for v2

- Not redesigning the entire workspace browser.
- Not changing the underlying subagent spawn product surface beyond keeping attachment semantics coherent.
- Not turning Nerve into a general external file-sync system.
- Not changing live deployment config during this phase.

---

## Technical Contract + upstream slicing plan

### Technical contract

#### Canonical reference invariant

Every attachment that successfully leaves the composer must have one primary durable reference path under the workspace model:

- **Direct workspace file:** canonical workspace-relative path to the original file.
- **Imported external file:** canonical workspace-relative staged path to the imported copy.

That primary reference path is the source of truth for:

- transcript/history rendering
- subagent forwarding metadata
- tool-facing file reference descriptors
- future reopen/reuse flows

Optimized derivatives, thumbnails, or inline payloads are secondary artifacts only.

#### Canonical path rules

A path may be treated as a direct workspace reference only if all of the following hold:

1. The path resolves successfully on the server/host side.
2. The fully resolved real path is under the configured workspace root.
3. Normalization removes `.` / `..`, duplicate separators, and platform-specific ambiguity.
4. Symlink resolution cannot escape the workspace root.
5. The final stored/reference form is canonical and stable enough for later re-resolution.

If any of those checks fail, Nerve must not emit a direct workspace reference for that path.

#### Import / staging rules

For any external file selection:

- Nerve imports the file into the canonical workspace staging/import root.
- The imported path becomes the primary reference path.
- The import location should continue to align with the existing Gambit convention rooted under `~/.openclaw/workspace/.temp/nerve-uploads` unless upstream chooses a different canonical workspace temp name.
- Import should be copy-based, not move-based.
- Filename preservation is preferred when safe, with collision-resistant suffixing when needed.
- Imported paths should remain durable long enough for transcript reuse, agent handoff, and short/medium-lived operator workflows; if eventual cleanup is introduced, it must be explicit policy rather than accidental breakage.

#### Descriptor / payload semantics

The outgoing attachment descriptor should center on one primary `reference.path`-style field containing the canonical path. Additional metadata may include:

- display name
- mime type
- size
- source/origin classification
- whether the file was imported or directly linked
- optional optimized derivative info
- optional inline preview info

But these must not replace the primary canonical path.

#### Trust boundary checks

Boundary enforcement happens server-side, not only in the browser UI. The server must be the final authority on:

- workspace-root membership
- canonicalization
- symlink escape prevention
- import destination validity
- whether a path is safe to expose as a reference

Client-side hints are convenience only.

#### History / transcript semantics

The transcript record should store enough information to reconstruct the sent attachment summary even if the file later moves or disappears. Minimum durable history fields:

- display label/name at send time
- canonical path at send time
- origin/import classification
- mime/type and size if known

Transcript rendering should not depend on re-inspecting the current filesystem for basic history display.

#### Subagent forwarding semantics

Forwarded attachments to spawned subagents should preserve the same durable path-first contract:

- child sessions receive the canonical reference path for each referenced file
- imported files forward as their staged canonical paths
- direct workspace files forward as their canonical workspace paths
- optional inline bytes/previews may accompany the forwarded descriptor where policy allows, but they are not the only representation

This keeps the main-session and subagent mental models aligned and preserves the already-validated Gambit work on attachment-aware spawn + path semantics.

#### Backward compatibility / migration posture

v2 should prefer additive contract tightening over transcript rewrites. Existing historical messages created with explicit `Upload files` / `Attach by Path` language can remain as-is. The migration target is forward behavior for new messages, not retroactive data mutation.

### Recommended implementation shape

#### Layer 1: resolution service

Create or tighten one server-side resolution path that takes a user-selected item and returns one of two final outcomes:

- `direct_workspace_reference`
- `imported_workspace_reference`

Both outcomes must produce the same downstream descriptor shape from the composer’s point of view.

#### Layer 2: composer attachment model

The client composer should stop carrying a user-facing mode split and instead track:

- pending
- resolving
- resolved (with canonical path)
- failed

The resolved item can still retain internal origin/import metadata, but the UI should not require the user to reason about it.

#### Layer 3: transcript rendering

Transcript rendering should simplify around the canonical path and file identity while keeping advanced/debug metadata available if needed.

#### Layer 4: workspace browser integration

The file browser’s `Add to chat` flow should insert already-resolved direct workspace references into the composer using the same resolved attachment shape.

### Upstream slicing strategy

The key upstream risk is overwhelming the maintainer with a large “attachment rewrite” PR. The safer plan is a small sequence where each slice has a clean story.

#### Slice 0 — RFC / issue-level spec (no code)

Open a design issue or discussion that frames:

- the problem with dual-mode composer UX
- the desired single-attach mental model
- the canonical path invariant
- the separate workspace-browser `Add to chat` affordance

This spec-first artifact should include a short before/after UX summary and one diagram of resolution outcomes.

#### Slice 1 — canonical resolution contract

Land or propose the minimal server contract that resolves selections into:

- direct workspace reference
- imported workspace reference

This slice should focus on validation, normalization, import rules, and descriptor shape. No major composer redesign yet.

#### Slice 2 — unify composer UI to single attach entrypoint

Replace `Upload files` + `Attach by Path` with one paperclip flow that uses the new resolution contract. Keep the PR narrowly focused on composer UX and state transitions.

#### Slice 3 — workspace browser Add to chat integration

Add the explicit file-browser action for existing workspace files. This is cleanly separable from the composer simplification and easy to review independently.

#### Slice 4 — transcript/message polish

Adjust default transcript chips/copy to emphasize canonical file references instead of origin jargon. This is intentionally a presentation slice, not mixed with the core resolution logic.

#### Slice 5 — regression tests / forwarding confirmation

Add or expand focused tests covering:

- direct workspace reference path
- imported external file path
- path escape rejection
- stable transcript rendering
- subagent forwarding preserving canonical path semantics

If upstream prefers, parts of this slice can be folded into earlier PRs, but the conceptual checklist should stay intact.

### Minimal issue / PR sequence

1. **Issue / discussion:** “Simplify Nerve attachments to a single attach flow with canonical workspace references.”
2. **PR 1:** server-side resolution/import contract.
3. **PR 2:** composer UX simplification to one attach flow.
4. **PR 3:** workspace browser `Add to chat` integration.
5. **PR 4:** transcript/badge polish and regression coverage follow-ups.

That sequence keeps the hard architecture slice first and prevents the UI from getting ahead of the contract.

### Acceptance criteria for the upstream-ready design

- A user can attach a file without choosing between upload/path modes.
- Workspace files resolve to direct canonical references without being recopied.
- External files import into a canonical workspace staging area and send as that canonical path.
- Transcript/history preserves stable file-reference summaries.
- Subagent forwarding receives path-first descriptors that match the main-session contract.
- The workspace browser offers a first-class `Add to chat` action.

---

## Local rollout / testing plan for Gambit and Derrick’s live Nerve install

### Phase boundary

This section is explicitly **Phase A planning only**.

What we do now:

- define branch strategy
- define test matrix
- define manual verification scenarios
- define rollback and future cutover process

What we do **not** do now:

- do not implement upload/reference v2 yet
- do not change `~/.openclaw/.env` yet
- do not point live update flows at a feature branch yet
- do not cut over Derrick’s working deployment until a future prototype branch exists and Derrick approves the switch

### Branch strategy

Recommended branch shape:

1. **Stable deployment branch remains unchanged**
   - Keep whatever branch/tag/snapshot Derrick’s live Nerve install already tracks today.
   - No `.env` edits in this phase.

2. **Prototype branch in `gambit-openclaw-nerve`**
   - Create a dedicated feature branch for v2 prototype work in Phase B.
   - Suggested name: `feature/upload-reference-v2`.

3. **Optional review slices off the prototype branch**
   - If the implementation grows, spin smaller branches/PRs from the prototype branch or as cherry-pickable slices:
     - `slice/upload-reference-v2-resolution-contract`
     - `slice/upload-reference-v2-composer`
     - `slice/upload-reference-v2-workspace-add-to-chat`
     - `slice/upload-reference-v2-transcript-polish`

4. **Upstream-facing branches later**
   - Once Gambit validates the prototype, branch or cherry-pick upstream-friendly slices onto cleaner PR branches for the upstream repo.

### Proposed Phase B implementation order

1. Implement/tighten canonical resolution/import contract.
2. Switch composer to a single attach affordance.
3. Add workspace browser `Add to chat` action.
4. Simplify transcript badges/copy.
5. Run focused regression tests.
6. Only then prepare live dogfood cutover.

### Test matrix

#### A. Resolution contract tests

- workspace file under root resolves as direct canonical reference
- nested workspace file resolves correctly
- external file imports into canonical staging root
- duplicate filename imports resolve collision safely
- path with `..` escape is rejected as direct reference
- symlink escaping workspace is rejected as direct reference
- nonexistent source path fails cleanly

#### B. Composer behavior tests

- paperclip shows one attach entrypoint
- attaching a workspace file produces resolved canonical reference
- attaching an external file shows resolving/importing then canonical staged path
- failed resolution/import leaves item unsent and visibly errored
- multiple mixed attachments resolve independently
- composer state survives window resize/fullscreen changes

#### C. Transcript/history tests

- sent message shows stable canonical path summary
- imported vs direct metadata does not break display
- historical message remains readable even if the file is later missing
- optimized inline/image derivative metadata never overwrites canonical path

#### D. Workspace browser tests

- file browser shows `Add to chat` on files
- `Add to chat` inserts the file into composer without copying
- inserting from browser returns the user to a send-ready composer state

#### E. Subagent forwarding tests

- direct workspace reference forwards canonical workspace path
- imported file forwards canonical staged path
- mixed direct + imported attachment sets forward coherently
- optional preview/inline metadata remains secondary to path semantics

#### F. Deployment/dogfood tests

- local dev run uses prototype branch cleanly
- update flow can target prototype branch after approval
- restore flow preserves intended repo/branch wiring
- rollback back to stable branch is fast and deterministic

### Manual verification scenarios for Derrick

#### Scenario 1 — attach a workspace file from chat

- Open chat composer.
- Click paperclip.
- Select a file already under the workspace root.
- Confirm the composer resolves it as a canonical workspace path without import copy messaging.
- Send it.
- Confirm transcript shows durable file reference.

#### Scenario 2 — attach an external desktop/download file

- Click paperclip.
- Select a file outside the workspace.
- Confirm composer briefly indicates import/resolution.
- Confirm final attachment points to canonical staging path under workspace temp/import root.
- Send it and verify transcript summary.

#### Scenario 3 — add an existing workspace file via browser

- Open workspace browser.
- Use `Add to chat` on an existing file.
- Confirm the composer receives the file with no re-upload/import.
- Send and verify transcript consistency with Scenario 1.

#### Scenario 4 — mixed attachment set

- Add one direct workspace file and one external imported file.
- Send both in one message.
- Confirm transcript preserves both canonical references clearly.
- Spawn/launch a subagent workflow that should inherit attachments.
- Confirm child context preserves both canonical path semantics.

#### Scenario 5 — large image/file safety

- Attach a large image or other payload that would previously stress inline limits.
- Confirm the canonical path reference succeeds even if optional inline optimization is reduced, skipped, or downgraded.
- Confirm the system does not silently fall back to a transient-only representation.

#### Scenario 6 — failure path

- Attempt to attach a path that cannot be resolved safely.
- Confirm the composer blocks send for that item and explains why.
- Confirm no partial/bogus canonical reference appears in transcript.

### Rollback plan

#### Code rollback

- If the prototype branch misbehaves in local testing, revert or abandon the prototype branch without touching stable deployment config.
- If the live install has already been switched during a future approved dogfood window, rollback means restoring the previous stable branch target and pulling/restarting via the normal update flow.

#### Config rollback

- Keep a copy of the pre-cutover branch target values before any future `.env` change.
- Treat rollback as a branch-target restore, not an ad hoc hand edit done from memory.
- Document the exact old and new values in the Phase B execution plan when cutover is actually attempted.

### Future reversible `~/.openclaw/.env` branch switch process

This is the **future** process once the prototype branch exists and Derrick explicitly approves dogfooding. It is documented now so the later cutover is deliberate and reversible.

#### Preconditions before any `.env` change

- prototype branch exists remotely and is pushed
- local repo is clean or intentionally staged for deployment
- focused tests are green enough for operator dogfood
- Derrick explicitly approves cutover
- the current stable branch target is written down in the plan before editing anything

#### Switch procedure (future, not now)

1. Identify the exact `.env` variables that tell `update.sh` / `restore.sh` which Nerve repo/branch to use.
2. Record the current stable values in the execution log/plan.
3. Change only the Nerve branch target from stable to the approved prototype branch.
4. Run the normal update/restore flow used by Derrick’s install.
5. Verify the running Nerve instance reports the expected prototype branch/commit.
6. Run the manual dogfood scenarios above on the live install.

#### Revert procedure (future, not now)

1. Restore the recorded stable branch target values in `~/.openclaw/.env`.
2. Re-run the normal update/restore flow.
3. Verify the running Nerve instance is back on the stable branch/commit.
4. Re-run a short smoke test: launch Nerve, send a plain message, verify workspace/browser still loads.

### Entry criteria for Phase B

Proceed to implementation only when Derrick confirms:

- the v2 mental model is the right upstream story
- the branch strategy is acceptable
- the live install should remain untouched until the prototype branch is demonstrably ready

---

## Tasks

### Task 1: Write the product/UX spec for upload/reference v2

**Bead ID:** `nerve-081y`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-081y` at start with `bd update nerve-081y --status in_progress --json` and close it on completion with `bd close nerve-081y --reason "Product/UX spec written" --json`. Write a maintainer-facing and operator-friendly product/UX spec for the proposed upload/reference v2 model. Cover the single paperclip flow, direct canonical references for files already in the workspace, staged imports for external files, and a separate workspace-browser `Add to chat` action. Also document what behavior we intentionally remove from the current UX and what capability is preserved underneath.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-02-upload-reference-v2-upstream-spec-and-local-rollout.md`

**Status:** ✅ Complete

**Results:** Claimed bead `nerve-081y` and wrote the concrete product/UX spec directly into this plan. The spec now defines the single-paperclip mental model, direct canonical references for workspace files, imported canonical references for external files, the separate workspace-browser `Add to chat` action, transcript expectations, explicit UX removals, and non-goals. The v2 story is framed as product simplification on top of already-validated Gambit attachment work, not a net-new upload system.

---

### Task 2: Write the technical spec and upstream slicing plan

**Bead ID:** `nerve-byli`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-byli` at start with `bd update nerve-byli --status in_progress --json` and close it on completion with `bd close nerve-byli --reason "Technical spec and upstream slicing plan written" --json`. Using the product spec, define the technical contract and a realistic upstream slicing plan for upload/reference v2. Identify the canonical path rules, trust/boundary checks, staging/import rules, history/transcript semantics, subagent forwarding semantics, and the minimal issue/PR sequence needed to land this in upstream without overwhelming the maintainer.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-02-upload-reference-v2-upstream-spec-and-local-rollout.md`

**Status:** ✅ Complete

**Results:** Claimed bead `nerve-byli` and added the technical contract plus upstream slicing plan into the same plan file. The spec now defines the canonical path invariant, workspace-root validation and symlink escape checks, import/staging rules, descriptor semantics, transcript durability requirements, subagent forwarding semantics, and a five-slice upstream landing strategy anchored around a small RFC + sequential contract/UI/browser/transcript PRs.

---

### Task 3: Define the local implementation and testing plan for Derrick’s working Nerve instance

**Bead ID:** `nerve-snio`  
**SubAgent:** `primary`  
**Prompt:** In `/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve`, claim bead `nerve-snio` at start with `bd update nerve-snio --status in_progress --json` and close it on completion with `bd close nerve-snio --reason "Local rollout/testing plan written" --json`. Add a local rollout/testing section to the plan covering how to implement and test upload/reference v2 in the Gambit fork before upstreaming. Include branch strategy, test matrix, manual verification scenarios, rollback path, and how `~/.openclaw/.env` plus `update.sh` / `restore.sh` should temporarily target a feature branch for live testing **only after the prototype branch is ready for testing**. Be explicit about what should and should not be changed until Derrick approves the branch cutover.

**Folders Created/Deleted/Modified:**
- `.plans/`
- potentially `~/.openclaw/` later if execution is approved

**Files Created/Deleted/Modified:**
- `.plans/2026-04-02-upload-reference-v2-upstream-spec-and-local-rollout.md`
- potentially `~/.openclaw/.env` later if execution is approved

**Status:** ✅ Complete

**Results:** Claimed bead `nerve-snio` and wrote the local rollout/testing section. The plan now spells out Phase A vs Phase B boundaries, recommended branch structure, implementation order, automated test matrix, manual verification scenarios for Derrick, rollback posture, and a future reversible `.env` branch-switch process for `update.sh` / `restore.sh`. It also explicitly records that no implementation or live `.env` cutover occurs during this planning pass.

---

## Final Results

**Status:** ✅ Complete

**What We Built:**
- Completed the full spec package for upload/reference v2 in one living plan document.
- Defined the product/UX story: one paperclip flow, direct canonical workspace references, imported canonical references for external files, and a workspace-browser `Add to chat` path.
- Defined the technical contract: canonical path invariants, trust boundary enforcement, import rules, transcript semantics, and path-first subagent forwarding.
- Defined an upstream slicing plan that should be digestible for maintainers instead of shipping one giant attachment rewrite.
- Defined the Gambit-local rollout/testing strategy, including prototype branch structure, test matrix, manual dogfood scenarios, rollback path, and the future reversible `~/.openclaw/.env` branch-switch process once a branch is ready.
- Intentionally deferred both implementation work and any live deployment / `.env` cutover to the next execution phase.

**Commits:**
- None in this planning-only pass.

**Lessons Learned:**
- The strongest upstream story is not “uploads vs attach-by-path,” but “one attach action that always yields a durable canonical reference.”
- Existing Gambit work already proved most of the hard mechanics; the remaining challenge is product simplification, contract tightening, and clean slicing.
- Dogfooding on Derrick’s live install is feasible, but only if the branch switch is treated as an explicit, reversible operator action after the prototype is stable enough to test.

*Updated on 2026-04-03*