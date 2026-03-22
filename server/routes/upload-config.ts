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
    inlineImageContextMaxBytes: config.upload.inlineImageContextMaxBytes,
    inlineImageAutoDowngradeToFileReference: config.upload.inlineImageAutoDowngradeToFileReference,
    inlineImageShrinkMinDimension: config.upload.inlineImageShrinkMinDimension,
    inlineImageMaxDimension: config.upload.inlineImageMaxDimension,
    inlineImageWebpQuality: config.upload.inlineImageWebpQuality,
    exposeInlineBase64ToAgent: config.upload.exposeInlineBase64ToAgent,
    imageOptimizationEnabled: config.upload.optimization.enabled,
    imageOptimizationTargetBytes: config.upload.optimization.targetBytes,
    imageOptimizationMaxBytes: config.upload.optimization.maxBytes,
    imageOptimizationMaxDimension: config.upload.optimization.maxDimension,
    imageOptimizationWebpQuality: config.upload.optimization.webpQuality,
  });
});

export default app;
