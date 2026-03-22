import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';

describe('GET /api/upload-config', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.NERVE_INLINE_IMAGE_CONTEXT_MAX_BYTES;
    delete process.env.NERVE_INLINE_IMAGE_SHRINK_MIN_DIMENSION;
    delete process.env.NERVE_INLINE_IMAGE_MAX_DIMENSION;
    delete process.env.NERVE_INLINE_IMAGE_WEBP_QUALITY;
    delete process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_TARGET_BYTES;
    delete process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_MAX_BYTES;
    delete process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_MAX_DIMENSION;
    delete process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_WEBP_QUALITY;
    process.env.NERVE_INLINE_IMAGE_MAX_DIMENSION = '2048';
    process.env.NERVE_INLINE_IMAGE_WEBP_QUALITY = '82';
    process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_TARGET_BYTES = '1048576';
    process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_MAX_BYTES = '1310720';
    process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_MAX_DIMENSION = '4096';
    process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_WEBP_QUALITY = '90';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns upload feature gating config for the client', async () => {
    const app = new Hono();
    const route = await import('./upload-config.js');
    app.route('/', route.default);

    const res = await app.request('/api/upload-config');
    expect(res.status).toBe(200);

    const json = (await res.json()) as Record<string, unknown>;
    expect(json).toHaveProperty('twoModeEnabled');
    expect(json).toHaveProperty('inlineEnabled');
    expect(json).toHaveProperty('fileReferenceEnabled');
    expect(json).toHaveProperty('modeChooserEnabled');
    expect(json).toHaveProperty('inlineAttachmentMaxMb');
    expect(json).toHaveProperty('inlineImageContextMaxBytes');
    expect(json.inlineImageContextMaxBytes).toBe(32768);
    expect(json).toHaveProperty('inlineImageAutoDowngradeToFileReference');
    expect(json).toHaveProperty('inlineImageShrinkMinDimension');
    expect(json).toHaveProperty('inlineImageMaxDimension');
    expect(json.inlineImageMaxDimension).toBe(2048);
    expect(json).toHaveProperty('inlineImageWebpQuality');
    expect(json.inlineImageWebpQuality).toBe(82);
    expect(json).toHaveProperty('exposeInlineBase64ToAgent');
    expect(json).toHaveProperty('imageOptimizationEnabled');
    expect(json).toHaveProperty('imageOptimizationTargetBytes');
    expect(json.imageOptimizationTargetBytes).toBe(1048576);
    expect(json).toHaveProperty('imageOptimizationMaxBytes');
    expect(json.imageOptimizationMaxBytes).toBe(1310720);
    expect(json).toHaveProperty('imageOptimizationMaxDimension');
    expect(json.imageOptimizationMaxDimension).toBe(4096);
    expect(json).toHaveProperty('imageOptimizationWebpQuality');
    expect(json.imageOptimizationWebpQuality).toBe(90);
  });
});
