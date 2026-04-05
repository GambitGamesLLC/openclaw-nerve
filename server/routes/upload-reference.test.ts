import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

async function importRoute() {
  vi.resetModules();
  return import('./upload-reference.js');
}

const originalHome = process.env.HOME;
const originalFileBrowserRoot = process.env.FILE_BROWSER_ROOT;
const originalUploadStagingTempDir = process.env.NERVE_UPLOAD_STAGING_TEMP_DIR;
const tempDirs = new Set<string>();

async function makeHomeWorkspace(): Promise<{ homeDir: string; workspaceRoot: string }> {
  const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nerve-upload-reference-home-'));
  tempDirs.add(homeDir);
  const workspaceRoot = path.join(homeDir, '.openclaw', 'workspace');
  await fs.mkdir(workspaceRoot, { recursive: true });
  process.env.HOME = homeDir;
  delete process.env.FILE_BROWSER_ROOT;
  delete process.env.NERVE_UPLOAD_STAGING_TEMP_DIR;
  return { homeDir, workspaceRoot };
}

afterEach(async () => {
  if (originalHome == null) {
    delete process.env.HOME;
  } else {
    process.env.HOME = originalHome;
  }

  if (originalFileBrowserRoot == null) {
    delete process.env.FILE_BROWSER_ROOT;
  } else {
    process.env.FILE_BROWSER_ROOT = originalFileBrowserRoot;
  }

  if (originalUploadStagingTempDir == null) {
    delete process.env.NERVE_UPLOAD_STAGING_TEMP_DIR;
  } else {
    process.env.NERVE_UPLOAD_STAGING_TEMP_DIR = originalUploadStagingTempDir;
  }

  for (const dir of tempDirs) {
    await fs.rm(dir, { recursive: true, force: true });
    tempDirs.delete(dir);
  }
});

describe('POST /api/upload-reference/resolve', () => {
  it('returns a canonical direct workspace reference for a validated workspace file', async () => {
    const { workspaceRoot } = await makeHomeWorkspace();
    const targetPath = path.join(workspaceRoot, 'docs', 'note.md');
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, '# hi\n', 'utf8');

    const { default: app } = await importRoute();
    const res = await app.request('/api/upload-reference/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'docs/note.md' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json() as {
      ok: boolean;
      items: Array<{
        kind: string;
        canonicalPath: string;
        absolutePath: string;
        mimeType: string;
        sizeBytes: number;
        originalName: string;
      }>;
    };

    expect(json.ok).toBe(true);
    expect(json.items).toHaveLength(1);
    expect(json.items[0]).toEqual(expect.objectContaining({
      kind: 'direct_workspace_reference',
      canonicalPath: 'docs/note.md',
      absolutePath: targetPath,
      mimeType: 'text/markdown',
      sizeBytes: 5,
      originalName: 'note.md',
    }));
  });

  it('returns canonical direct workspace references for the JSON paths array form', async () => {
    const { workspaceRoot } = await makeHomeWorkspace();
    const firstPath = path.join(workspaceRoot, 'docs', 'note.md');
    const secondPath = path.join(workspaceRoot, 'docs', 'todo.txt');
    await fs.mkdir(path.dirname(firstPath), { recursive: true });
    await fs.writeFile(firstPath, '# hi\n', 'utf8');
    await fs.writeFile(secondPath, 'later\n', 'utf8');

    const { default: app } = await importRoute();
    const res = await app.request('/api/upload-reference/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: ['docs/note.md', 'docs/todo.txt'] }),
    });

    expect(res.status).toBe(200);
    const json = await res.json() as {
      ok: boolean;
      items: Array<{
        kind: string;
        canonicalPath: string;
        absolutePath: string;
        mimeType: string;
        sizeBytes: number;
        originalName: string;
      }>;
    };

    expect(json.ok).toBe(true);
    expect(json.items).toHaveLength(2);
    expect(json.items).toEqual([
      expect.objectContaining({
        kind: 'direct_workspace_reference',
        canonicalPath: 'docs/note.md',
        absolutePath: firstPath,
        mimeType: 'text/markdown',
        sizeBytes: 5,
        originalName: 'note.md',
      }),
      expect.objectContaining({
        kind: 'direct_workspace_reference',
        canonicalPath: 'docs/todo.txt',
        absolutePath: secondPath,
        mimeType: 'text/plain',
        sizeBytes: 6,
        originalName: 'todo.txt',
      }),
    ]);
  });

  it('rejects unsupported content types before multipart parsing', async () => {
    await makeHomeWorkspace();

    const { default: app } = await importRoute();
    const res = await app.request('/api/upload-reference/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'nope',
    });

    expect(res.status).toBe(415);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: 'Request must be JSON or multipart/form-data.',
    });
  });

  it('rejects symlink escapes that resolve outside the workspace root', async () => {
    const { homeDir, workspaceRoot } = await makeHomeWorkspace();
    const outsidePath = path.join(homeDir, 'outside.txt');
    const linkedPath = path.join(workspaceRoot, 'docs', 'linked.txt');
    await fs.mkdir(path.dirname(linkedPath), { recursive: true });
    await fs.writeFile(outsidePath, 'secret', 'utf8');
    await fs.symlink(outsidePath, linkedPath);

    const { default: app } = await importRoute();
    const res = await app.request('/api/upload-reference/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'docs/linked.txt' }),
    });

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: 'Invalid or excluded workspace path.',
    });
  });
});
