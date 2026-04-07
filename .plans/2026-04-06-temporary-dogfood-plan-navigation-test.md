---
bead_ids:
  - nerve-v8z0
  - nerve-lpkw
  - nerve-t68.2
  - nerve-mi0.3
  - nerve-erw0
---

# Temporary dogfood test plan: plan ↔ bead navigation

**Date:** 2026-04-06  
**Status:** Ready for dogfood  
**Purpose:** Temporary validation artifact for Nerve bead/viewer navigation testing on `feature/bead-viewer-tab-foundation-hidden-workspace`.

> This is a **temporary dogfood test plan** created specifically so Derrick can verify that Nerve can navigate from beads to plans and from plans back to bead views.

## What to test

1. Open a linked bead in Nerve and confirm the plan file is discoverable/openable from the bead viewer.
2. Open this plan file from `.plans/` and confirm the markdown bead links below navigate back to the corresponding bead views.
3. Verify hidden workspace path handling still works for project-local `.plans/` content.

## Linked beads

- Current dogfood task: [Temporary dogfood plan file bead](bead:nerve-v8z0)
- Dogfood validation bead: [Validate locally and prepare dogfood instructions](bead:nerve-lpkw)
- Implementation bead: [Reapply Plans linkage and reader workflow](bead:nerve-t68.2)
- Implementation bead: [Reapply kanban plan-linkage affordances](bead:nerve-mi0.3)
- Follow-up/upstream bead: [Open upstream issue and PR after dogfood approval](bead:nerve-erw0)

## Notes

- This file intentionally lives under the repo-local `.plans/` directory, not the global OpenClaw workspace.
- The frontmatter `bead_ids` block is included so Nerve has a compact structured list to inspect.
- The body now uses explicit `bead:` links so markdown clicks route through Nerve's internal bead viewer flow during dogfood validation.
- On `slice/bead-scheme-markdown-navigation`, the markdown renderer preserves explicit `bead:` URLs via a custom `urlTransform` so `react-markdown` does not strip the scheme before the in-app click handler runs.
