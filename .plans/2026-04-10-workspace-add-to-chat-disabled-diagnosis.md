# gambit-openclaw-nerve — diagnose workspace Add to chat disabled warning

**Date:** 2026-04-10  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Diagnose why the workspace file-browser right-click `Add to chat` flow now shows `Workspace path attachments are disabled by configuration.`, trace that behavior against the original feature lineage in PR #235, and determine the correct branch ownership for any fix before changing code.

---

## Overview

Derrick confirmed that workspace `Add to chat` was an intentional Nerve feature introduced previously, and prior dogfood memory shows it worked for real workspace files like `avatar.png`. That means the current disabled-by-configuration message is likely a regression, a later guard reading the wrong config state, or a behavior change introduced after the original feature lane.

PR #235 gives us the right lineage anchor. Instead of hunting blindly through current `workhorse`, the first job is to inspect PR #235 and the current code path to answer three concrete questions: where the warning message is emitted, what config/capability it checks, and whether that logic belongs to the original PR branch lineage or to later merged/upstream changes. Only after that ownership mapping should we decide whether the fix belongs on the original feature branch lineage or on a fresh branch from `upstream/master`.

Because Derrick explicitly wants diagnosis first and fix second, this plan stops at verified root-cause + branch-ownership determination. No product changes should be made until the diagnosis is clear.

---

## Tasks

### Task 1: Trace the current warning path and config gate

**Bead ID:** `nerve-q8cp`  
**SubAgent:** `primary`  
**Prompt:** Locate the exact code path that emits `Workspace path attachments are disabled by configuration.`, identify the config/capability value it is checking, and determine whether the disabled state is coming from local Nerve config, server-sourced config, or another upstream capability source.

**Folders Created/Deleted/Modified:**
- `.plans/`
- source files only for inspection

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-workspace-add-to-chat-disabled-diagnosis.md`

**Status:** ✅ Complete

**Results:** Traced the warning to `src/features/chat/InputBar.tsx` in `stageWorkspaceFileReference()`, reached from file-browser `Add to chat` via `FileTreePanel -> App -> ChatPanel -> InputBar.addWorkspacePath()`. The gate is the local client boolean `attachByPathEnabled = uploadConfig.fileReferenceEnabled`. `uploadConfig` starts from `DEFAULT_UPLOAD_FEATURE_CONFIG` in `src/features/chat/uploadPolicy.ts`, where `fileReferenceEnabled` defaults to `false`, and is only updated by a successful `/api/upload-config` fetch in `InputBar`. In the current source tree, `server/app.ts` does not mount any `/api/upload-config` route and there is no source `server/routes/upload-config.ts`; the only matching implementation found is an unmounted `server-dist/routes/upload-config.js`. So the fetch likely returns non-OK/404 and the client silently keeps its default disabled state. This is not coming from `workspaceInfo`, not from gateway capabilities, and not from a server-sourced workspace toggle; it is a local client fallback caused by a missing/unmounted upload-config endpoint.

---

### Task 2: Compare current behavior to PR #235 lineage

**Bead ID:** `nerve-3mrx`  
**SubAgent:** `primary`  
**Prompt:** Inspect PR #235 and compare its implementation to current `workhorse`/upstream state so we can determine whether the regression belongs to the original feature branch lineage, a later merged change, or an upstream/base behavior shift.

**Folders Created/Deleted/Modified:**
- none expected beyond plan updates

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-workspace-add-to-chat-disabled-diagnosis.md`

**Status:** ✅ Complete

**Results:** PR #235 (`slice/workspace-directory-context`) did not introduce a new config source; it stacked directly on #233 and #231. In that lineage, directory `Add to chat` stayed as composer text injection, while file `Add to chat` already routed through `InputBar.addWorkspacePath()` into `stageWorkspaceFileReference()`, which requires `uploadConfig.fileReferenceEnabled`. Both current `workhorse` and `upstream/master` still show the same client behavior: `InputBar.tsx` fetches `/api/upload-config`, uses `DEFAULT_UPLOAD_FEATURE_CONFIG.fileReferenceEnabled = false` as fallback, and gates file-path staging on that flag. But the upstream-stacked branch lineage for #229/#231/#233/#235 only mounted `uploadReferenceRoutes` in `server/app.ts`; it does not contain `server/routes/upload-config.ts`, and `upstream/master` still lacks that route today. The separate local attachment-flow lineage that *did* have `/api/upload-config` was the earlier `e8369ce` / `8b654c9` two-mode/path-attachment work, but those commits are **not** ancestors of current `workhorse`. So this is not a later `workhorse`-only regression after PR #235 landed; it is an upstream lineage mismatch baked into the stacked feature landing, where the file Add-to-chat client path assumed config plumbing that was not present in the merged upstream base.

---

### Task 3: Decide correct owning branch for the eventual fix

**Bead ID:** `nerve-7dpv`  
**SubAgent:** `primary`  
**Prompt:** Based on the warning-path trace and PR #235 comparison, determine the correct branch ownership for a fix: existing PR branch lineage if still appropriate, or a fresh clean branch from `upstream/master` if the relevant feature is already merged upstream. Record the exact recommended next step, but do not implement the fix yet.

**Folders Created/Deleted/Modified:**
- `.plans/`

**Files Created/Deleted/Modified:**
- `.plans/2026-04-10-workspace-add-to-chat-disabled-diagnosis.md`

**Status:** ✅ Complete

**Results:** The fix should be owned as a fresh follow-up on current `workhorse` / `upstream/master`, not as a resurrection of PR #235’s branch stack. PR #235 itself is already merged upstream, and the broken file-path config plumbing is present in upstream master today, so the right ownership is an upstream-compatible follow-up slice that restores or replaces the missing upload-config capability source for the existing file Add-to-chat flow. In other words: current `workhorse` inherited an upstream-baked mismatch; it did not introduce a new fork-local regression.

---

## Final Results

**Status:** ⏳ Pending diagnosis

**What We Built:** Pending.

**Commits:**
- None yet — diagnosis only

**Lessons Learned:** Pending.

---

*Created on 2026-04-10*
