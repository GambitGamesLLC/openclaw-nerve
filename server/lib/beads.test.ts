import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const WORKSPACE_ROOT = path.resolve(path.sep, 'workspace');
const RESEARCH_WORKSPACE_ROOT = path.resolve(path.sep, 'workspace-research');
const REPO_ROOT = path.join(WORKSPACE_ROOT, 'repo', 'nerve');
const OUTSIDE_REPO_ROOT = path.resolve(path.sep, 'repos', 'demo');
const PROMISIFY_CUSTOM = Symbol.for('nodejs.util.promisify.custom');

const { execFileMock, findRepoPlanByBeadIdMock, resolveAgentWorkspaceMock } = vi.hoisted(() => {
  const execFileMock = vi.fn();
  execFileMock[Symbol.for('nodejs.util.promisify.custom')] = vi.fn();

  return {
    execFileMock,
    findRepoPlanByBeadIdMock: vi.fn(),
    resolveAgentWorkspaceMock: vi.fn((agentId?: string) => ({
      agentId: agentId?.trim() || 'main',
      workspaceRoot: agentId?.trim() === 'research' ? RESEARCH_WORKSPACE_ROOT : WORKSPACE_ROOT,
      memoryPath: path.join(WORKSPACE_ROOT, 'MEMORY.md'),
      memoryDir: path.join(WORKSPACE_ROOT, 'memory'),
    })),
  };
});

vi.mock('node:child_process', () => ({
  execFile: execFileMock,
  default: {
    execFile: execFileMock,
  },
}));

vi.mock('./plans.js', () => ({
  findRepoPlanByBeadId: findRepoPlanByBeadIdMock,
}));

vi.mock('./agent-workspace.js', () => ({
  resolveAgentWorkspace: resolveAgentWorkspaceMock,
}));

import { BeadValidationError, getBeadDetail, resolveBeadLookupRepoRoot } from './beads.js';

function resetMocks(): void {
  vi.restoreAllMocks();
  execFileMock.mockReset();
  execFileMock[PROMISIFY_CUSTOM].mockReset();
  findRepoPlanByBeadIdMock.mockReset();
  resolveAgentWorkspaceMock.mockClear();
}

describe('resolveBeadLookupRepoRoot', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('defaults legacy lookup to process cwd for the main workspace', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(REPO_ROOT);
    expect(resolveBeadLookupRepoRoot()).toBe(REPO_ROOT);
    cwdSpy.mockRestore();
  });

  it('maps the default repo root into the requested workspace when workspaceAgentId is provided', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(REPO_ROOT);
    expect(resolveBeadLookupRepoRoot({ workspaceAgentId: 'research' })).toBe(
      path.join(RESEARCH_WORKSPACE_ROOT, 'repo', 'nerve'),
    );
    cwdSpy.mockRestore();
  });

  it('falls back to process cwd when the default repo root is outside the default workspace', () => {
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(OUTSIDE_REPO_ROOT);
    expect(resolveBeadLookupRepoRoot({ workspaceAgentId: 'research' })).toBe(OUTSIDE_REPO_ROOT);
    cwdSpy.mockRestore();
  });

  it('uses explicit absolute repo roots directly when they stay within the workspace', () => {
    expect(resolveBeadLookupRepoRoot({ targetPath: path.join(WORKSPACE_ROOT, 'repos', 'demo') })).toBe(
      path.join(WORKSPACE_ROOT, 'repos', 'demo'),
    );
  });

  it('normalizes explicit .beads targets to the owning repo root', () => {
    expect(resolveBeadLookupRepoRoot({ targetPath: path.join(WORKSPACE_ROOT, 'repos', 'demo', '.beads') })).toBe(
      path.join(WORKSPACE_ROOT, 'repos', 'demo'),
    );
  });

  it('rejects explicit absolute targets outside the workspace root', () => {
    expect(() => resolveBeadLookupRepoRoot({ targetPath: OUTSIDE_REPO_ROOT })).toThrow(BeadValidationError);
  });

  it('resolves relative explicit targets against the current markdown document directory', () => {
    expect(resolveBeadLookupRepoRoot({
      targetPath: '../projects/demo/.beads',
      currentDocumentPath: path.join('docs', 'specs', 'links.md'),
    })).toBe(path.resolve(WORKSPACE_ROOT, 'docs', 'projects', 'demo'));
  });

  it('uses the scoped workspace root when resolving relative explicit targets', () => {
    expect(resolveBeadLookupRepoRoot({
      targetPath: './repos/demo',
      currentDocumentPath: path.join('notes', 'beads.md'),
      workspaceAgentId: 'research',
    })).toBe(path.resolve(RESEARCH_WORKSPACE_ROOT, 'notes', 'repos', 'demo'));
  });

  it('rejects absolute current document paths outside the workspace root', () => {
    expect(() => resolveBeadLookupRepoRoot({
      targetPath: './repos/demo',
      currentDocumentPath: path.resolve(path.sep, 'tmp', 'beads.md'),
    })).toThrow(BeadValidationError);
  });

  it('rejects resolved repo roots that escape the workspace root', () => {
    expect(() => resolveBeadLookupRepoRoot({
      targetPath: '../../../outside-repo',
      currentDocumentPath: path.join('docs', 'specs', 'links.md'),
    })).toThrow(BeadValidationError);
  });

  it('rejects relative explicit targets when no current document path is available', () => {
    expect(() => resolveBeadLookupRepoRoot({ targetPath: '../projects/demo' })).toThrow(BeadValidationError);
  });
});

describe('getBeadDetail', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('rejects blank bead ids as validation errors', async () => {
    await expect(getBeadDetail('   ')).rejects.toBeInstanceOf(BeadValidationError);
  });

  it('degrades linked plan enrichment failures to a null linkedPlan result', async () => {
    execFileMock[PROMISIFY_CUSTOM].mockResolvedValue({
      stdout: JSON.stringify({
        id: 'nerve-fms2',
        title: 'Demo bead',
        status: 'open',
      }),
      stderr: '',
    });
    findRepoPlanByBeadIdMock.mockRejectedValue(new Error('plan lookup failed'));

    await expect(getBeadDetail('nerve-fms2', { targetPath: REPO_ROOT })).resolves.toMatchObject({
      id: 'nerve-fms2',
      title: 'Demo bead',
      linkedPlan: null,
    });
  });
});
