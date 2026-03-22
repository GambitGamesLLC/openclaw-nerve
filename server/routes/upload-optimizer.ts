import { Hono } from 'hono';
import { rateLimitGeneral } from '../middleware/rate-limit.js';
import { deleteOptimizedUploads, optimizeUploadImage } from '../lib/upload-optimizer.js';

const app = new Hono();

app.post('/api/upload-optimizer', rateLimitGeneral, async (c) => {
  const body = await c.req.json().catch(() => null) as {
    path?: string;
    mimeType?: string;
  } | null;

  if (!body?.path || typeof body.path !== 'string') {
    return c.json({ ok: false, error: 'path is required' }, 400);
  }

  try {
    const result = await optimizeUploadImage({
      sourcePath: body.path,
      sourceMimeType: body.mimeType,
    });

    return c.json({
      ok: true,
      optimized: result.optimized,
      original: result.original,
      optimizedArtifact: result.optimizedArtifact,
      artifacts: result.artifacts,
      cleanupPath: result.cleanupPath,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to optimize upload image';
    return c.json({ ok: false, error: message }, 500);
  }
});

app.post('/api/upload-optimizer/cleanup', rateLimitGeneral, async (c) => {
  const body = await c.req.json().catch(() => null) as { paths?: unknown } | null;
  const paths = Array.isArray(body?.paths)
    ? body.paths.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : [];

  if (paths.length === 0) {
    return c.json({ ok: true, deleted: 0 });
  }

  const { deleted } = await deleteOptimizedUploads(paths);
  return c.json({ ok: true, deleted });
});

export default app;
