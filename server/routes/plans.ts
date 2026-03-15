/**
 * Repo-local plans API routes.
 *
 * GET /api/plans            — list repo-local markdown plans under .plans/
 * GET /api/plans/read?path= — read one repo-local plan for preview
 */

import { Hono } from 'hono';
import { rateLimitGeneral } from '../middleware/rate-limit.js';
import { listRepoPlans, readRepoPlan } from '../lib/plans.js';
import { resolveManagedBeadsSource } from '../lib/beads-sources.js';

const app = new Hono();

app.get('/api/plans', rateLimitGeneral, async (c) => {
  const sourceId = c.req.query('sourceId') || undefined;
  const source = sourceId ? resolveManagedBeadsSource(sourceId) : null;
  if (sourceId && !source) {
    return c.json({ ok: false, error: 'Unknown plans source' }, 404);
  }

  try {
    const plans = await listRepoPlans(source?.rootPath);
    return c.json({
      ok: true,
      source: source ? {
        id: source.id,
        label: source.label,
      } : undefined,
      plans,
      counts: {
        total: plans.length,
        active: plans.filter(plan => !plan.archived).length,
        archived: plans.filter(plan => plan.archived).length,
      },
    });
  } catch (err) {
    console.error('[plans] list error:', err);
    return c.json({ ok: false, error: 'Failed to list plans' }, 500);
  }
});

app.get('/api/plans/read', rateLimitGeneral, async (c) => {
  const relativePath = c.req.query('path');
  const sourceId = c.req.query('sourceId') || undefined;
  if (!relativePath) {
    return c.json({ ok: false, error: 'Missing path parameter' }, 400);
  }

  const source = sourceId ? resolveManagedBeadsSource(sourceId) : null;
  if (sourceId && !source) {
    return c.json({ ok: false, error: 'Unknown plans source' }, 404);
  }

  const plan = await readRepoPlan(relativePath, source?.rootPath);
  if (!plan) {
    return c.json({ ok: false, error: 'Plan not found' }, 404);
  }

  return c.json({ ok: true, plan });
});

export default app;
