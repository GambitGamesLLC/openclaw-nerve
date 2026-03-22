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

export type UploadArtifactRole = 'canonical_staged_source' | 'optimized_derivative';

export interface UploadArtifactComparisonInfo extends UploadArtifactInfo {
  role: UploadArtifactRole;
}

export interface OptimizedUploadResult {
  optimized: boolean;
  original: UploadArtifactInfo;
  optimizedArtifact: UploadArtifactInfo;
  artifacts: UploadArtifactComparisonInfo[];
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

function buildArtifactComparison(
  original: UploadArtifactInfo,
  optimizedArtifact: UploadArtifactInfo,
  optimized: boolean,
): UploadArtifactComparisonInfo[] {
  const artifacts: UploadArtifactComparisonInfo[] = [
    {
      role: 'canonical_staged_source',
      ...original,
    },
  ];

  if (optimized) {
    artifacts.push({
      role: 'optimized_derivative',
      ...optimizedArtifact,
    });
  }

  return artifacts;
}

function buildQualityLadder(baseQuality: number): number[] {
  const values = [
    baseQuality,
    baseQuality - 4,
    baseQuality - 8,
    baseQuality - 12,
    baseQuality - 18,
    72,
    64,
    56,
    48,
  ].map((value) => Math.max(1, Math.min(100, Math.round(value))));

  return [...new Set(values)].sort((a, b) => b - a);
}

function computeDimensionRungs(startDimension: number, minDimension: number): number[] {
  const rungs = new Set<number>([
    Math.max(minDimension, Math.round(startDimension)),
    Math.max(minDimension, Math.round(startDimension * 0.92)),
    Math.max(minDimension, Math.round(startDimension * 0.84)),
    Math.max(minDimension, Math.round(startDimension * 0.76)),
    Math.max(minDimension, Math.round(startDimension * 0.68)),
    Math.max(minDimension, Math.round(startDimension * 0.6)),
    minDimension,
  ]);

  return [...rungs].filter(Boolean).sort((a, b) => b - a);
}

function getArtifactMaxDimension(artifact: UploadArtifactInfo): number {
  return Math.max(artifact.width ?? 0, artifact.height ?? 0, 1);
}

function isOriginalAlreadyPreferred(original: UploadArtifactInfo): boolean {
  return original.sizeBytes <= config.upload.optimization.targetBytes
    && getArtifactMaxDimension(original) <= config.upload.optimization.maxDimension;
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
      artifacts: buildArtifactComparison(original, original, false),
    };
  }

  if (isOriginalAlreadyPreferred(original)) {
    return {
      optimized: false,
      original,
      optimizedArtifact: original,
      artifacts: buildArtifactComparison(original, original, false),
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

  const startDimension = Math.min(
    config.upload.optimization.maxDimension,
    Math.max(sourceMetadata.width ?? 1, sourceMetadata.height ?? 1),
  );
  const minDimension = Math.min(startDimension, Math.max(1024, Math.round(config.upload.optimization.maxDimension * 0.5)));
  const dimensionRungs = computeDimensionRungs(startDimension, minDimension);
  const qualityLadder = usePng ? [100] : buildQualityLadder(config.upload.optimization.webpQuality);

  let selectedArtifact: UploadArtifactInfo | null = null;

  for (const maxDimension of dimensionRungs) {
    for (const quality of qualityLadder) {
      const pipeline = sharp(sourcePath)
        .rotate()
        .resize({
          width: maxDimension,
          height: maxDimension,
          fit: 'inside',
          withoutEnlargement: true,
        });

      if (usePng) {
        pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
      } else {
        pipeline.webp({ quality, effort: 5 });
      }

      await pipeline.toFile(optimizedPath);
      const candidate = await buildArtifactInfo(optimizedPath, targetMime);
      selectedArtifact = candidate;

      if (candidate.sizeBytes <= config.upload.optimization.targetBytes) {
        break;
      }

      if (candidate.sizeBytes <= config.upload.optimization.maxBytes) {
        break;
      }
    }

    if (selectedArtifact && selectedArtifact.sizeBytes <= config.upload.optimization.maxBytes) {
      break;
    }
  }

  const optimizedArtifact = selectedArtifact ?? await buildArtifactInfo(optimizedPath, targetMime);

  if (
    optimizedArtifact.sizeBytes >= original.sizeBytes
    && getArtifactMaxDimension(optimizedArtifact) <= getArtifactMaxDimension(original)
  ) {
    await fs.unlink(optimizedPath).catch(() => {});
    return {
      optimized: false,
      original,
      optimizedArtifact: original,
      artifacts: buildArtifactComparison(original, original, false),
    };
  }

  return {
    optimized: true,
    original,
    optimizedArtifact,
    artifacts: buildArtifactComparison(original, optimizedArtifact, true),
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
