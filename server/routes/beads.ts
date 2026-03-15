/**
 * Beads board API routes.
 *
 * GET /api/beads/sources       — List safe Beads sources (env + in-app managed)
 * POST /api/beads/sources      — Add a managed Beads source
 * DELETE /api/beads/sources/:id — Remove a managed Beads source
 * POST /api/beads/selection    — Persist the last-viewed Beads source
 * GET /api/beads/board         — Return a four-column Beads-native board projection
 * POST /api/beads/issues/:id/repair-plan-metadata — Manual canonical metadata rewrite for eligible linked plans
 * @module
 */

import { Hono } from 'hono';
import { rateLimitGeneral } from '../middleware/rate-limit.js';
import {
  BeadsAdapterError,
  InvalidBeadsSourceError,
  ManualPlanMetadataRepairError,
  getBeadsBoard,
  listBeadsSourceDtos,
  repairBeadPlanMetadata,
} from '../lib/beads-board.js';
import { config } from '../lib/config.js';
import {
  addManagedBeadsSource,
  getManagedLastSourceId,
  removeManagedBeadsSource,
  setManagedLastSourceId,
} from '../lib/beads-sources.js';

const app = new Hono();

app.get('/api/beads/sources', rateLimitGeneral, (c) => {
  return c.json({
    defaultSourceId: config.beads.defaultSourceId,
    lastSourceId: getManagedLastSourceId(),
    sources: listBeadsSourceDtos(),
  });
});

app.post('/api/beads/sources', rateLimitGeneral, async (c) => {
  const body = await c.req.json().catch(() => null) as { label?: unknown; rootPath?: unknown } | null;
  const rootPath = typeof body?.rootPath === 'string' ? body.rootPath.trim() : '';
  const label = typeof body?.label === 'string' ? body.label.trim() : undefined;

  if (!rootPath) {
    return c.json({ error: 'invalid_request', details: 'rootPath is required' }, 400);
  }

  try {
    const source = await addManagedBeadsSource({ label, rootPath });
    return c.json(source, 201);
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Failed to add Beads source';
    return c.json({ error: 'invalid_beads_source', details }, 400);
  }
});

app.delete('/api/beads/sources/:id', rateLimitGeneral, async (c) => {
  const sourceId = c.req.param('id');
  if (!sourceId?.trim()) {
    return c.json({ error: 'invalid_request', details: 'source id is required' }, 400);
  }

  try {
    await removeManagedBeadsSource(sourceId);
    return c.body(null, 204);
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Failed to remove Beads source';
    const status = details.includes('cannot be removed in-app') ? 403 : 404;
    return c.json({ error: 'invalid_beads_source', details }, status);
  }
});

app.post('/api/beads/selection', rateLimitGeneral, async (c) => {
  const body = await c.req.json().catch(() => null) as { sourceId?: unknown } | null;
  const sourceId = typeof body?.sourceId === 'string' ? body.sourceId : '';

  if (!sourceId.trim()) {
    return c.json({ error: 'invalid_request', details: 'sourceId is required' }, 400);
  }

  try {
    const persistedSourceId = await setManagedLastSourceId(sourceId);
    return c.json({ sourceId: persistedSourceId });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Failed to persist Beads source selection';
    return c.json({ error: 'invalid_beads_source', details }, 404);
  }
});

app.get('/api/beads/board', rateLimitGeneral, async (c) => {
  const sourceId = c.req.query('sourceId') || undefined;

  try {
    const board = await getBeadsBoard(sourceId);
    return c.json(board);
  } catch (error) {
    if (error instanceof InvalidBeadsSourceError) {
      return c.json({ error: 'not_found', details: error.message }, 404);
    }
    if (error instanceof BeadsAdapterError) {
      return c.json({ error: 'beads_adapter_error', details: error.message }, 502);
    }
    throw error;
  }
});

app.post('/api/beads/issues/:id/repair-plan-metadata', rateLimitGeneral, async (c) => {
  const issueId = c.req.param('id')?.trim();
  const body = await c.req.json().catch(() => null) as { sourceId?: unknown } | null;
  const sourceId = typeof body?.sourceId === 'string' && body.sourceId.trim() ? body.sourceId.trim() : undefined;

  if (!issueId) {
    return c.json({ error: 'invalid_request', details: 'issue id is required' }, 400);
  }

  try {
    const result = await repairBeadPlanMetadata(issueId, sourceId);
    return c.json(result);
  } catch (error) {
    if (error instanceof InvalidBeadsSourceError) {
      return c.json({ error: 'not_found', details: error.message }, 404);
    }

    if (error instanceof ManualPlanMetadataRepairError) {
      if (error.code === 'not_found') {
        return c.json({ error: error.code, details: error.message }, 404);
      }

      return c.json({ error: error.code, details: error.message }, 409);
    }

    if (error instanceof BeadsAdapterError) {
      return c.json({ error: 'beads_adapter_error', details: error.message }, 502);
    }

    throw error;
  }
});

export default app;
