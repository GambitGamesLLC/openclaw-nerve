import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

async function importHelpers() {
  vi.resetModules();
  return import('../lib/upload-staging.js');
}

describe('upload staging helpers', () => {
  const originalHome = process.env.HOME;
  let homeDir: string;

  beforeAll(async () => {
    homeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nerve-upload-stage-home-'));
    process.env.HOME = homeDir;
  });

  afterAll(async () => {
    if (originalHome == null) {
      delete process.env.HOME;
    } else {
      process.env.HOME = originalHome;
    }
    await fs.rm(homeDir, { recursive: true, force: true });
  });

  it('stages uploads into workspace temp storage', async () => {
    const { getResolvedUploadStagingDir, stageUploadFile } = await importHelpers();
    const result = await stageUploadFile({
      originalName: 'notes.txt',
      mimeType: 'text/plain',
      bytes: new TextEncoder().encode('hello staged upload'),
    });

    expect(getResolvedUploadStagingDir()).toBe(path.join(homeDir, '.openclaw', 'workspace', '.temp', 'nerve-uploads'));
    expect(result.originalName).toBe('notes.txt');
    expect(result.mimeType).toBe('text/plain');
    expect(result.path).toContain(path.join('.temp', 'nerve-uploads'));
    expect(result.uri).toBe(`file://${result.path}`);
    await expect(fs.readFile(result.path, 'utf8')).resolves.toBe('hello staged upload');
  });

  it('cleans up staged uploads only inside the staging root', async () => {
    const { deleteStagedUploads } = await importHelpers();
    const stagingRoot = path.join(homeDir, '.openclaw', 'workspace', '.temp', 'nerve-uploads');
    const targetPath = path.join(stagingRoot, '2026', '03', '21', 'dead.txt');
    const outsidePath = path.join(homeDir, 'outside.txt');
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, 'delete me', 'utf8');
    await fs.writeFile(outsidePath, 'keep me', 'utf8');

    const result = await deleteStagedUploads([targetPath, outsidePath]);

    expect(result).toEqual({ deleted: 1 });
    await expect(fs.stat(targetPath)).rejects.toThrow();
    await expect(fs.readFile(outsidePath, 'utf8')).resolves.toBe('keep me');
  });
});
