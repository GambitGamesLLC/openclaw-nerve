import { Hono } from 'hono';
import { rateLimitGeneral } from '../middleware/rate-limit.js';
import {
  deleteStagedUploads,
  getResolvedUploadStagingDir,
  stageUploadFile,
} from '../lib/upload-staging.js';

const app = new Hono();

app.post('/api/upload-stage', rateLimitGeneral, async (c) => {
  try {
    const form = await c.req.formData();
    const files = form.getAll('files').filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return c.json({ ok: false, error: 'At least one file is required.' }, 400);
    }

    const staged = await Promise.all(files.map(async (file) => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      return stageUploadFile({
        originalName: file.name,
        mimeType: file.type,
        bytes,
      });
    }));

    return c.json({
      ok: true,
      root: getResolvedUploadStagingDir(),
      files: staged,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to stage uploads';
    return c.json({ ok: false, error: message }, 500);
  }
});

app.post('/api/upload-stage/cleanup', rateLimitGeneral, async (c) => {
  const body = await c.req.json().catch(() => null) as { paths?: unknown } | null;
  const paths = Array.isArray(body?.paths)
    ? body.paths.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : [];

  if (paths.length === 0) {
    return c.json({ ok: true, deleted: 0 });
  }

  const { deleted } = await deleteStagedUploads(paths);
  return c.json({ ok: true, deleted });
});

export default app;
