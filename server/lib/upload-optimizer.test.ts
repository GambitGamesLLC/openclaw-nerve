import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { describe, it, expect, beforeEach, vi } from 'vitest';

async function importFreshOptimizer() {
  vi.resetModules();
  return import('./upload-optimizer.js');
}

describe('upload optimizer', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nerve-upload-opt-'));
    process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_ENABLED = 'true';
    process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_TEMP_DIR = path.join(tmpDir, 'optimized');
    process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_MAX_DIMENSION = '2048';
    process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_WEBP_QUALITY = '75';
    process.env.NERVE_UPLOAD_IMAGE_OPTIMIZATION_STALE_MAX_AGE_HOURS = '1';
  });

  it('creates a temporary optimized derivative and reports original/optimized metadata', async () => {
    const sourcePath = path.join(tmpDir, 'source.png');
    await sharp({
      create: {
        width: 4096,
        height: 3072,
        channels: 3,
        background: { r: 120, g: 80, b: 200 },
      },
    }).png().toFile(sourcePath);

    const { optimizeUploadImage, deleteOptimizedUploads } = await importFreshOptimizer();
    const result = await optimizeUploadImage({ sourcePath, sourceMimeType: 'image/png' });

    expect(result.optimized).toBe(true);
    expect(result.original.path).toBe(sourcePath);
    expect(result.optimizedArtifact.path).toMatch(/\.webp$/);
    expect(result.optimizedArtifact.mimeType).toBe('image/webp');
    expect((result.optimizedArtifact.width ?? 0)).toBeLessThanOrEqual(2048);
    expect((result.optimizedArtifact.height ?? 0)).toBeLessThanOrEqual(2048);
    expect(result.cleanupPath).toBe(result.optimizedArtifact.path);

    const cleanup = await deleteOptimizedUploads([result.optimizedArtifact.path]);
    expect(cleanup.deleted).toBe(1);

    await expect(fs.stat(result.optimizedArtifact.path)).rejects.toThrow();
  });

  it('removes stale temp artifacts from the optimization cache directory', async () => {
    const { cleanupStaleOptimizedUploads } = await importFreshOptimizer();

    const cacheDir = path.join(tmpDir, 'optimized');
    await fs.mkdir(cacheDir, { recursive: true });

    const staleFile = path.join(cacheDir, 'stale.webp');
    const freshFile = path.join(cacheDir, 'fresh.webp');

    await fs.writeFile(staleFile, Buffer.from('stale'));
    await fs.writeFile(freshFile, Buffer.from('fresh'));

    const staleTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const freshTime = new Date(Date.now() - 5 * 60 * 1000);
    await fs.utimes(staleFile, staleTime, staleTime);
    await fs.utimes(freshFile, freshTime, freshTime);

    const cleanup = await cleanupStaleOptimizedUploads();
    expect(cleanup.removed).toBe(1);

    await expect(fs.stat(staleFile)).rejects.toThrow();
    await expect(fs.stat(freshFile)).resolves.toBeTruthy();
  });
});
