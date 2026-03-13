# Bead-to-Plan Linkage Model

**Date:** 2026-03-12  
**Status:** Proposed  
**Scope:** Nerve Beads → repo-local `/.plans/` navigation

## Goal

Give Nerve a durable way to move from a bead to its related repo-local plan without depending on brittle raw-path matching.

## Recommendation

Use a **dual-link model**:

1. **Primary bead metadata** stores the linkage in machine-readable form so a Beads-first UI can resolve a plan directly from the bead.
2. **Plan frontmatter** stores a stable `plan_id` plus optional backlinks for reverse lookup and recovery when files move.

This keeps bead → plan navigation fast and explicit while still giving the plan file enough identity to recover from renames, archival moves, or path drift.

## Data Model

### 1) Bead metadata: authoritative link from bead to plan

Store a structured object in the bead `metadata` JSON field.

Example:

```json
{
  "plan": {
    "plan_id": "plan-2026-03-12-nerve-workflow-surface-enhancements",
    "path": ".plans/2026-03-12-nerve-workflow-surface-enhancements.md",
    "title": "Gambit OpenClaw Nerve — workflow surface enhancements"
  }
}
```

Recommended semantics:

- `plan.plan_id`: immutable stable identifier for the plan document
- `plan.path`: last known repo-relative path, used as the first lookup target
- `plan.title`: optional cached display value for degraded/fallback display

Why put the link on the bead:

- the user journey starts from a bead in Nerve
- beads are already the execution-state record
- it avoids forcing Nerve to scan all plan files just to answer a simple bead-detail question
- it supports explicit per-bead linking even when multiple plans exist in one repo

### 2) Plan frontmatter: stable file identity + recovery hook

Add YAML frontmatter to plan files as they are touched.

Example:

```yaml
---
plan_id: plan-2026-03-12-nerve-workflow-surface-enhancements
plan_title: Gambit OpenClaw Nerve — workflow surface enhancements
status: in_progress
bead_ids:
  - nerve-hf2
  - nerve-m84
  - nerve-lbj
  - nerve-413
  - nerve-ux7
  - nerve-0lv
---
```

Recommended semantics:

- `plan_id`: immutable source of file identity
- `plan_title`: optional explicit title for resolvers/previews
- `status`: optional normalized plan lifecycle (`draft`, `in_progress`, `complete`, `archived`)
- `bead_ids`: optional backlink/index for reverse lookup and migration help

The `bead_ids` list is useful, but it should be treated as a **secondary index**, not the primary linkage source. It will drift more easily because humans may forget to maintain it when tasks change.

## Source of Truth

Choose this split explicitly:

- **Source of truth for "which plan does this bead point to?"**
  - the bead metadata `metadata.plan`
- **Source of truth for "which file is this plan, even if it moved?"**
  - the plan file's `plan_id` frontmatter

That gives Nerve one crisp resolution path:

1. read bead metadata
2. try `plan.path`
3. if the path is missing or mismatched, find a plan file with matching `plan_id`

This is better than choosing raw path alone as the only truth, because paths are the part most likely to change.

## Resolution Algorithm in Nerve

For a bead that has `metadata.plan`:

1. **Fast path:** try opening `metadata.plan.path`
2. If the file exists, read frontmatter
   - if `frontmatter.plan_id === metadata.plan.plan_id`, resolve as **active**
   - if frontmatter is absent but the file exists, resolve as **legacy path-only** and offer a soft migration hint
3. If the path does not exist or the `plan_id` mismatches:
   - scan repo-local `/.plans/**/*.md` including `/.plans/archive/**/*.md`
   - find a file whose `frontmatter.plan_id` matches `metadata.plan.plan_id`
4. If found under `/.plans/archive/`, resolve as **archived**
5. If no match is found, resolve as **missing**

Suggested result states:

- `active`
- `archived`
- `moved`
- `legacy_path_only`
- `missing`

## Weak-Link Fallback When Files Move

When `plan.path` is stale:

- Nerve should attempt `plan_id` recovery before showing an error
- if a matching `plan_id` is found at a new path, Nerve should:
  - open the recovered plan
  - display a subtle `Moved` badge
  - optionally offer a small "refresh bead metadata" action in a later implementation

This keeps the stored bead link durable without requiring immediate write-back on every file move.

## Archived or Removed Plans

### Archived plans

If the plan is found under `/.plans/archive/`:

- treat the link as valid
- show an `Archived` badge in the bead detail surface
- allow open/read/preview normally
- preserve original bead linkage; archive is a lifecycle state, not a broken reference

### Removed plans

If no matching path or `plan_id` is found:

- show a `Missing plan` state rather than a dead clickable link
- display the last known path and `plan_id`
- keep the bead detail readable even when the plan is gone
- optionally surface a lightweight recovery CTA later: "search plans" or "attach plan"

Nerve should not silently erase the metadata just because the file is gone.

## Display Model in Nerve

### Beads card / drawer

Do not overload board cards. Put the richer behavior in the existing Beads detail drawer first.

Recommended drawer treatment:

- `Plan` row with one of:
  - plan title
  - repo-relative path
  - archived/moved/missing badge
- primary action: `Open plan`
- secondary affordances (later if helpful):
  - hover preview of first heading + status
  - `Copy path`
  - `Reveal in plans`

### Hover preview

Good first-pass preview payload:

- plan title
- plan status
- repo-relative path
- first 8-12 lines of meaningful content after frontmatter

Do not parse the entire plan into a complex structured model for this feature. A small preview keeps it cheap and robust.

## Migration / Incremental Rollout

### Phase 1 — document the contract

- adopt this model in docs and active planning guidance
- no mandatory code changes yet

### Phase 2 — support frontmatter on new/touched plans

- add `plan_id` frontmatter to new plans
- backfill frontmatter only when a plan is already being edited
- avoid a one-shot repo-wide rewrite

### Phase 3 — bead metadata write path

- when a plan is intentionally linked to a bead, write `metadata.plan = { plan_id, path, title }`
- this can happen from CLI workflow, future Nerve UI actions, or both

### Phase 4 — Nerve resolver

- implement server-side resolution logic with the fallback sequence above
- expose resolved state (`active`, `moved`, `archived`, `missing`) to the UI
- surface the link in the Beads detail drawer before adding card-level chrome

### Phase 5 — gentle repair tools

Optional later work:

- one-click metadata refresh when a moved plan is recovered by `plan_id`
- reverse lookup from plan pages to linked beads via `bead_ids`
- migration helper that suggests missing `plan_id` frontmatter for legacy plans

## Why this model

This avoids the two brittle extremes:

- **Path-only linking** is easy but breaks on rename/archive moves.
- **Frontmatter/backlink-only linking** makes bead-first navigation expensive and ambiguous because Nerve must discover the relationship by scanning plans.

A bead-stored explicit link plus a plan-stored stable identity gives the cleanest durability/ergonomics tradeoff.

## Non-Goals

- no plan editing UI yet
- no automatic cross-repo linkage in this phase
- no full-text heuristic matching between bead titles and plan titles
- no mandatory migration of every existing historical plan before UI work can ship
