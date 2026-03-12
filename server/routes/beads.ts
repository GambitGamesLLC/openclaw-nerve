/**
 * Beads board API routes.
 *
 * GET /api/beads/sources       — List safe, env-configured Beads sources
 * GET /api/beads/board         — Return a four-column Beads-native board projection
 * @module
 */

import { Hono } from 'hono';
import { rateLimitGeneral } from '../middleware/rate-limit.js';
import {
  BeadsAdapterError,
  InvalidBeadsSourceError,
  getBeadsBoard,
  listBeadsSourceDtos,
} from '../lib/beads-board.js';
import { config } from '../lib/config.js';

const app = new Hono();

app.get('/api/beads/sources', rateLimitGeneral, (c) => {
  return c.json({
    defaultSourceId: config.beads.defaultSourceId,
    sources: listBeadsSourceDtos(),
  });
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

export default app;
