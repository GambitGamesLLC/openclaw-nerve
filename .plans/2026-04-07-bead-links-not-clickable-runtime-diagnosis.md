# Bead Links Not Clickable in Nerve Runtime Diagnosis

**Date:** 2026-04-07  
**Status:** Complete  
**Agent:** Chip 🐱‍💻

---

## Goal

Diagnose why `bead:` links in `/home/derrick/.openclaw/workspace/bead-link-dogfood.md` were not rendering as clickable links in Nerve’s markdown viewer on the narrow Beads branch, then land the smallest safe fix with focused tests.

---

## Diagnosis Summary

Root cause was in the markdown runtime layer (`MarkdownRenderer`) rather than the bead click handler.

- `react-markdown` applies a default URL transform/sanitization pass.
- The default transform does not preserve custom schemes like `bead:`.
- As a result, markdown links such as `[x](bead:nerve-1234)` were downgraded before runtime click interception, so they did not appear as usable clickable bead links in the intended in-app path.

The prior partial fix in bead link parsing helpers was insufficient on its own because it did not affect `react-markdown`’s URL transform stage.

---

## Fix Implemented (narrow Beads branch only)

### Runtime fix

Updated `src/features/markdown/MarkdownRenderer.tsx`:

- imported `defaultUrlTransform` from `react-markdown`
- added `transformMarkdownUrl(url)`
  - preserves explicit `bead:` URLs unchanged when `isBeadLinkHref(url)` is true
  - delegates all other URLs to `defaultUrlTransform(url)`
- passed `urlTransform={transformMarkdownUrl}` to `<ReactMarkdown />`

This keeps normal markdown URL safety behavior while explicitly allowing `bead:` links through to the in-app link handling path.

### Link classification tightening

Updated `src/features/beads/links.ts`:

- `isBeadLinkHref` now requires explicit `bead:` scheme.
- bare bead IDs are no longer treated as markdown bead links.

This avoids ambiguity with workspace-path routing and aligns markdown behavior to explicit scheme-based linking.

### Focused tests

Updated tests in:

- `src/features/markdown/MarkdownRenderer.test.tsx`
- `src/features/beads/links.test.ts`

Coverage added/updated for:

- explicit `bead:` links are routed to bead handler
- rendered anchor keeps `href="bead:..."` and does not force `_blank`
- bare bead IDs are not treated as bead-scheme links

---

## Commands Run

From worktree: `/home/derrick/.openclaw/workspace/.temp/gambit-openclaw-nerve-bead-scheme-nav`

1. `npm test -- --run src/features/beads/links.test.ts src/features/markdown/MarkdownRenderer.test.tsx`
   - ✅ pass (`2` files, `21` tests)
2. `npm run build`
   - ✅ pass (client + server build)
   - non-blocking existing Vite chunk warnings only

---

## Files Changed

- `.plans/2026-04-06-temporary-dogfood-plan-navigation-test.md`
- `.plans/2026-04-07-bead-links-not-clickable-runtime-diagnosis.md`
- `src/features/beads/links.ts`
- `src/features/beads/links.test.ts`
- `src/features/markdown/MarkdownRenderer.tsx`
- `src/features/markdown/MarkdownRenderer.test.tsx`

---

## Branch + Handoff

- Fix branch: `slice/bead-scheme-markdown-navigation`
- Scope: narrow Beads branch only; do **not** roll to combo until dogfood retest confirms behavior.

### Exact retest instructions

1. Checkout branch `slice/bead-scheme-markdown-navigation` and start Nerve normally.
2. Open markdown file:
   - `/home/derrick/.openclaw/workspace/bead-link-dogfood.md`
3. In markdown viewer, click links that use `bead:<id>`.
4. Confirm each click opens or focuses the corresponding Bead tab in-app (no external browser handoff).
5. Confirm link remains visibly clickable in markdown (anchor styling + hover/click behavior).

If all checks pass, this branch is ready for explicit combo roll-forward/cherry-pick.

---

## Final Results

**Status:** ✅ Complete  
**What We Built:** runtime URL-transform preservation for explicit `bead:` markdown links plus focused tests verifying render + interception behavior on the narrow branch.  
**Commits:** pending below once committed.

---

*Completed on 2026-04-07*
