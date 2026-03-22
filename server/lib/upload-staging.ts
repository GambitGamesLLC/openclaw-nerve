import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { config } from './config.js';

export interface StagedUploadArtifact {
  path: string;
  uri: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
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

function getUploadStagingDir(): string {
  return path.resolve(expandHomePath(config.upload.staging.tempDir));
}

function isWithinDir(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function sanitizeFileName(name: string): string {
  const trimmed = name.trim();
  const base = path.basename(trimmed || 'upload.bin');
  const safe = base.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return safe || 'upload.bin';
}

function buildStagedFileName(originalName: string): string {
  const safeName = sanitizeFileName(originalName);
  const ext = path.extname(safeName);
  const stem = ext ? safeName.slice(0, -ext.length) : safeName;
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${stem || 'upload'}-${suffix}${ext}`;
}

function buildStagedSubdir(now = new Date()): string {
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return path.join(year, month, day);
}

export async function cleanupStaleStagedUploads(): Promise<{ removed: number }> {
  const rootDir = getUploadStagingDir();
  const maxAgeMs = config.upload.staging.staleMaxAgeHours * 60 * 60 * 1000;
  const cutoffMs = Date.now() - maxAgeMs;

  await fs.mkdir(rootDir, { recursive: true });

  let removed = 0;

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
        try {
          await fs.rmdir(entryPath);
        } catch {
          // Ignore non-empty directories.
        }
        continue;
      }
      if (!entry.isFile()) continue;

      try {
        const stat = await fs.stat(entryPath);
        if (stat.mtimeMs >= cutoffMs) continue;
        await fs.unlink(entryPath);
        removed += 1;
      } catch {
        // Best effort only.
      }
    }
  }

  await walk(rootDir);
  return { removed };
}

export async function stageUploadFile(params: {
  originalName: string;
  mimeType?: string;
  bytes: Uint8Array;
}): Promise<StagedUploadArtifact> {
  await cleanupStaleStagedUploads();

  const rootDir = getUploadStagingDir();
  const subdir = buildStagedSubdir();
  const targetDir = path.join(rootDir, subdir);
  await fs.mkdir(targetDir, { recursive: true });

  const stagedPath = path.join(targetDir, buildStagedFileName(params.originalName));
  await fs.writeFile(stagedPath, params.bytes);
  const stat = await fs.stat(stagedPath);

  return {
    path: stagedPath,
    uri: toFileUri(stagedPath),
    mimeType: params.mimeType?.trim() || 'application/octet-stream',
    sizeBytes: stat.size,
    originalName: params.originalName,
  };
}

export async function deleteStagedUploads(paths: string[]): Promise<{ deleted: number }> {
  const rootDir = path.resolve(getUploadStagingDir());
  let deleted = 0;

  for (const candidate of paths) {
    const resolvedCandidate = path.resolve(candidate);
    if (!isWithinDir(resolvedCandidate, rootDir)) continue;
    try {
      await fs.unlink(resolvedCandidate);
      deleted += 1;
    } catch {
      // Best effort.
    }
  }

  return { deleted };
}

export function getResolvedUploadStagingDir(): string {
  return getUploadStagingDir();
}
