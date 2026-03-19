import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { config } from './config.js';

export interface UploadArtifactInfo {
  path: string;
  uri: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
}

export interface OptimizedUploadResult {
  optimized: boolean;
  original: UploadArtifactInfo;
  optimizedArtifact: UploadArtifactInfo;
  cleanupPath?: string;
}

function expandHomePath(input: string): string {
  if (input === '~') return config.home || os.homedir();
  if (input.startsWith('~/')) return path.join(config.home || os.homedir(), input.slice(2));
  return input;
}

function toFileUri(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  if (/^[A-Za-z]:\//.test(normalized)) return `file:///${encodeURI(normalized)}`;
  return `file://${encodeURI(normalized)}`;
}

function normalizeMimeType(mimeType: string | undefined, fallbackFormat?: string): string {
  if (mimeType && mimeType.startsWith('image/')) return mimeType;
  if (fallbackFormat) return `image/${fallbackFormat.toLowerCase()}`;
  return 'image/unknown';
}

function getOptimizedUploadsDir(): string {
  return path.resolve(expandHomePath(config.upload.optimization.tempDir));
}

function isWithinDir(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function buildArtifactInfo(filePath: string, preferredMimeType?: string): Promise<UploadArtifactInfo> {
  const [stats, metadata] = await Promise.all([
    fs.stat(filePath),
    sharp(filePath).metadata(),
  ]);

  return {
    path: filePath,
    uri: toFileUri(filePath),
    mimeType: normalizeMimeType(preferredMimeType, metadata.format),
    sizeBytes: stats.size,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  };
}

export async function cleanupStaleOptimizedUploads(): Promise<{ removed: number }> {
  const tempDir = getOptimizedUploadsDir();
  const maxAgeMs = config.upload.optimization.staleMaxAgeHours * 60 * 60 * 1000;
  const cutoffMs = Date.now() - maxAgeMs;

  await fs.mkdir(tempDir, { recursive: true });
  const entries = await fs.readdir(tempDir, { withFileTypes: true });

  let removed = 0;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const targetPath = path.join(tempDir, entry.name);
    try {
      const stat = await fs.stat(targetPath);
      if (stat.mtimeMs >= cutoffMs) continue;
      await fs.unlink(targetPath);
      removed += 1;
    } catch {
      // Best-effort cleanup only.
    }
  }

  return { removed };
}

export async function optimizeUploadImage(params: {
  sourcePath: string;
  sourceMimeType?: string;
}): Promise<OptimizedUploadResult> {
  const sourcePath = path.resolve(params.sourcePath);
  const original = await buildArtifactInfo(sourcePath, params.sourceMimeType);

  if (!config.upload.optimization.enabled) {
    return {
      optimized: false,
      original,
      optimizedArtifact: original,
    };
  }

  await cleanupStaleOptimizedUploads();

  const sourceMetadata = await sharp(sourcePath).metadata();
  const hasAlpha = Boolean(sourceMetadata.hasAlpha);
  const usePng = config.upload.optimization.preserveTransparency && hasAlpha;
  const targetExt = usePng ? 'png' : 'webp';
  const targetMime = usePng ? 'image/png' : 'image/webp';
  const basename = path.basename(sourcePath, path.extname(sourcePath));
  const fingerprint = crypto.randomUUID().slice(0, 8);

  const tempDir = getOptimizedUploadsDir();
  await fs.mkdir(tempDir, { recursive: true });
  const optimizedPath = path.join(tempDir, `${basename}-${fingerprint}.${targetExt}`);

  const pipeline = sharp(sourcePath)
    .rotate()
    .resize({
      width: config.upload.optimization.maxDimension,
      height: config.upload.optimization.maxDimension,
      fit: 'inside',
      withoutEnlargement: true,
    });

  if (usePng) {
    pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
  } else {
    pipeline.webp({ quality: config.upload.optimization.webpQuality });
  }

  await pipeline.toFile(optimizedPath);
  const optimizedArtifact = await buildArtifactInfo(optimizedPath, targetMime);

  return {
    optimized: true,
    original,
    optimizedArtifact,
    cleanupPath: optimizedPath,
  };
}

export async function deleteOptimizedUploads(paths: string[]): Promise<{ deleted: number }> {
  const tempDir = getOptimizedUploadsDir();
  const resolvedTempDir = path.resolve(tempDir);
  let deleted = 0;

  for (const candidate of paths) {
    const resolvedCandidate = path.resolve(candidate);
    if (!isWithinDir(resolvedCandidate, resolvedTempDir)) continue;
    try {
      await fs.unlink(resolvedCandidate);
      deleted += 1;
    } catch {
      // Best effort.
    }
  }

  return { deleted };
}
