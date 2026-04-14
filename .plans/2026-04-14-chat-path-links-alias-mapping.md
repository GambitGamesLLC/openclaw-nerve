# gambit-openclaw-nerve — CHAT_PATH_LINKS alias mapping

**Date:** 2026-04-14  
**Status:** In Progress  
**Agent:** Chip 🐱‍💻

---

## Goal

Add editable alias mapping support to `CHAT_PATH_LINKS.json` so local shorthand forms like `projects/...` can normalize to canonical `/workspace/...` paths, then validate it in `workhorse-v1` before packaging the upstream Issue + PR.

---

## Overview

This lane is intentionally separate from the earlier `workspace/...` shorthand bugfix. `workspace/...` is now accepted as a portable product shorthand for canonical `/workspace/...`. But other local shorthands such as `projects/...` are installation-specific and should not be hardcoded into product logic.

The chosen design therefore extends `CHAT_PATH_LINKS.json` from a flat `prefixes` array to a richer config shape that also supports `aliases`. Aliases are user-editable shorthand-prefix mappings that normalize to canonical `/workspace/...` prefixes. That keeps host-specific behavior declarative and portable, while preserving the existing canonical path-link behavior and keeping built-in `workspace/...` support as product behavior.

This feature was implemented on a fresh upstream-master branch, independently audited, rolled into `workhorse-v1`, and dogfooded successfully. The remaining step is packaging the upstream Issue + PR for the new canonical branch.

---

## REFERENCES

| ID | Description | Path |
| --- | --- | --- |
| `REF-01` | Current parser/config implementation | `src/features/chat/chatPathLinksConfig.ts` |
| `REF-02` | Current matcher implementation | `src/features/markdown/inlineReferences.tsx` |
| `REF-03` | Existing workspace shorthand follow-up lane | `bugfix/workspace-inline-reference-slice` / PR `#264` |
| `REF-04` | Dogfood branch baseline | `workhorse-v1` |

---

## Tasks

### Task 1: Plan the alias-mapping feature scope and branch strategy

**Bead ID:** `nerve-8pth`  
**SubAgent:** `primary`  
**Status:** ✅ Complete

**Results:** Locked the design to `prefixes: string[]` plus `aliases: Record<string, string>`, where alias keys are shorthand prefixes like `projects/` and alias values must normalize to canonical `/workspace/...` prefixes. Decided that raw template/editor parity is in scope, but a bespoke alias UI is not. Chosen canonical branch: `feature/chat-path-links-aliases`.

---

### Task 2: Implement alias-mapping support on a fresh upstream-master branch

**Bead ID:** `nerve-org2`  
**SubAgent:** `coder`  
**Status:** ✅ Complete

**Results:** Implemented the feature on fresh `upstream/master` branch `feature/chat-path-links-aliases` and pushed commit `085b524` (`Add CHAT_PATH_LINKS alias mapping`). Added shared config plumbing in `src/features/chat/chatPathLinksConfig.ts`, threaded aliases through the app renderer path, updated matcher normalization in `src/features/markdown/inlineReferences.tsx`, and updated raw config creation in `src/features/workspace/tabs/ConfigTab.tsx`. Focused tests and build passed.

---

### Task 3: Audit the alias-mapping feature independently

**Bead ID:** `nerve-7bo4`  
**SubAgent:** `auditor`  
**Status:** ✅ Complete

**Results:** Audit passed on `feature/chat-path-links-aliases` head `085b524`. Verified that prefixes remain supported, aliases normalize only to canonical `/workspace/...`, exactly one alias rewrite pass is applied, token/wrapper boundaries remain intact, and no bespoke alias UI was added. Targeted validation passed.

---

### Task 4: Roll the feature into `workhorse-v1` and dogfood

**Bead ID:** `nerve-skh9`  
**SubAgent:** `coder`  
**Status:** ✅ Complete

**Results:** Rolled the audited feature into `workhorse-v1` via cherry-pick of `085b524`, producing `d912164` (`Add CHAT_PATH_LINKS alias mapping`). Validation on `workhorse-v1` passed. Derrick then ran `update.sh`, updated `CHAT_PATH_LINKS.json` to include an alias such as `"projects/": "/workspace/projects/"`, restarted Nerve, and confirmed that `projects/gambit-openclaw-nerve/src/App.tsx` rendered as a clickable link resolving to the canonical `/workspace/projects/gambit-openclaw-nerve/src/App.tsx` target.

---

### Task 5: Update/open upstream issue and PR after dogfood confirmation

**Bead ID:** `nerve-q493`  
**SubAgent:** `primary`  
**Status:** ✅ Complete

**Results:** Checked the canonical branch `feature/chat-path-links-aliases` against upstream and found no existing upstream issue or PR for the alias-mapping lane. Opened upstream Issue `#269` (`[Feature] Add CHAT_PATH_LINKS alias mappings for portable shorthand prefixes`) at <https://github.com/daggerhashimoto/openclaw-nerve/issues/269> and upstream PR `#270` (`feat(chat): add CHAT_PATH_LINKS alias mapping`) at <https://github.com/daggerhashimoto/openclaw-nerve/pull/270>. Both follow the upstream templates and include an `In Plain English` section. Packaged scope exactly as dogfooded: `CHAT_PATH_LINKS.json` supports `prefixes` plus `aliases`; aliases map shorthand prefixes like `projects/` to canonical `/workspace/...` prefixes; built-in `workspace/...` behavior remains product behavior; no bespoke alias UI in this lane, only raw template/editor parity. Fresh validation on `feature/chat-path-links-aliases` passed via `npm run lint`, `npm run build`, and `npm test -- --run`.

---

## Final Results

**Status:** ✅ Complete

**What We Built:** Alias-mapping support for `CHAT_PATH_LINKS.json`, validated on a fresh upstream branch and in `workhorse-v1` dogfood, then packaged upstream as Issue `#269` and PR `#270`.

**Reference Check:** Verified against the implemented parser, matcher, and dogfood behavior. Packaged scope preserved exact lane boundaries: `CHAT_PATH_LINKS.json` supports `prefixes` plus `aliases`; aliases map shorthand prefixes like `projects/` to canonical `/workspace/...` prefixes; built-in `workspace/...` behavior remains product behavior; no bespoke alias UI was included, only raw template/editor parity.

**Commits:**
- `085b524` - Add CHAT_PATH_LINKS alias mapping
- `d912164` - Add CHAT_PATH_LINKS alias mapping (workhorse-v1 cherry-pick)

*Completed on 2026-04-14*
