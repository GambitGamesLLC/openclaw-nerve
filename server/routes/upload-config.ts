import { Hono } from 'hono';
import { config } from '../lib/config.js';
import { rateLimitGeneral } from '../middleware/rate-limit.js';

const app = new Hono();

app.get('/api/upload-config', rateLimitGeneral, (c) => {
  return c.json({
    twoModeEnabled: config.upload.twoModeEnabled,
    inlineEnabled: config.upload.inlineEnabled,
    fileReferenceEnabled: config.upload.fileReferenceEnabled,
    modeChooserEnabled: config.upload.modeChooserEnabled,
    inlineAttachmentMaxMb: config.upload.inlineAttachmentMaxMb,
    exposeInlineBase64ToAgent: config.upload.exposeInlineBase64ToAgent,
    allowSubagentForwarding: config.upload.allowSubagentForwarding,
  });
});

export default app;
