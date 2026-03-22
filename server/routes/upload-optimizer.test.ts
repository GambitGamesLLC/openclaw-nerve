import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

vi.mock('../lib/upload-optimizer.js', () => ({
  optimizeUploadImage: vi.fn(async () => ({
    optimized: true,
    original: {
      path: '/tmp/original.png',
      uri: 'file:///tmp/original.png',
      mimeType: 'image/png',
      sizeBytes: 100,
      width: 100,
      height: 100,
    },
    optimizedArtifact: {
      path: '/tmp/optimized.webp',
      uri: 'file:///tmp/optimized.webp',
      mimeType: 'image/webp',
      sizeBytes: 50,
      width: 80,
      height: 80,
    },
    artifacts: [
      {
        role: 'canonical_staged_source',
        path: '/tmp/original.png',
        uri: 'file:///tmp/original.png',
        mimeType: 'image/png',
        sizeBytes: 100,
        width: 100,
        height: 100,
      },
      {
        role: 'optimized_derivative',
        path: '/tmp/optimized.webp',
        uri: 'file:///tmp/optimized.webp',
        mimeType: 'image/webp',
        sizeBytes: 50,
        width: 80,
        height: 80,
      },
    ],
    cleanupPath: '/tmp/optimized.webp',
  })),
  deleteOptimizedUploads: vi.fn(async () => ({ deleted: 1 })),
}));

describe('upload optimizer routes', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('optimizes a local image reference path', async () => {
    const app = new Hono();
    const route = await import('./upload-optimizer.js');
    app.route('/', route.default);

    const res = await app.request('/api/upload-optimizer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: '/tmp/original.png', mimeType: 'image/png' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json() as Record<string, unknown>;
    expect(json.ok).toBe(true);
    expect(json.optimized).toBe(true);
    expect(json).toHaveProperty('original');
    expect(json).toHaveProperty('optimizedArtifact');
    expect(json).toHaveProperty('artifacts');
  });

  it('cleans up optimized derivative paths', async () => {
    const app = new Hono();
    const route = await import('./upload-optimizer.js');
    app.route('/', route.default);

    const res = await app.request('/api/upload-optimizer/cleanup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ paths: ['/tmp/optimized.webp'] }),
    });

    expect(res.status).toBe(200);
    const json = await res.json() as Record<string, unknown>;
    expect(json.ok).toBe(true);
    expect(json.deleted).toBe(1);
  });
});
