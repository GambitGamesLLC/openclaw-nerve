import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function makeHarness() {
  const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nerve-beads-sources-home-'));
  const openclawRoot = path.join(homeDir, '.openclaw');
  const projectsRoot = path.join(openclawRoot, 'workspace', 'projects');
  const alphaRoot = path.join(projectsRoot, 'alpha');
  const betaRoot = path.join(projectsRoot, 'beta');
  const outsideRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'nerve-beads-sources-outside-'));

  await fs.mkdir(alphaRoot, { recursive: true });
  await fs.mkdir(betaRoot, { recursive: true });

  vi.doMock('./config.js', () => ({
    config: {
      home: homeDir,
      beads: {
        projectsRoot,
        defaultSourceId: 'openclaw',
        sources: [
          {
            id: 'openclaw',
            label: '~/.openclaw',
            rootPath: openclawRoot,
            kind: 'openclaw' as const,
          },
          {
            id: 'alpha',
            label: 'Alpha Repo',
            rootPath: alphaRoot,
            kind: 'project' as const,
          },
        ],
      },
    },
  }));

  const mod = await import('./beads-sources.js');
  return {
    mod,
    homeDir,
    openclawRoot,
    projectsRoot,
    alphaRoot,
    betaRoot,
    outsideRoot,
    stateFilePath: path.join(homeDir, '.nerve', 'beads-sources.json'),
  };
}

describe('beads source registry', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists env-configured sources and app-added sources together without exposing root paths', async () => {
    const { mod, betaRoot, stateFilePath } = await makeHarness();

    await fs.mkdir(path.dirname(stateFilePath), { recursive: true });
    await fs.writeFile(stateFilePath, JSON.stringify({
      sources: [
        { id: 'beta', label: 'Beta Repo', rootPath: betaRoot },
      ],
      lastSourceId: 'beta',
    }, null, 2));

    expect(mod.listManagedBeadsSourceDtos()).toEqual([
      { id: 'openclaw', label: '~/.openclaw', kind: 'openclaw', isDefault: true, isCustom: false },
      { id: 'alpha', label: 'Alpha Repo', kind: 'project', isDefault: false, isCustom: false },
      { id: 'beta', label: 'Beta Repo', kind: 'project', isDefault: false, isCustom: true },
    ]);
    expect(mod.getManagedLastSourceId()).toBe('beta');
    expect(mod.resolveManagedBeadsSource()?.id).toBe('beta');
  });

  it('adds a tracked project, persists it globally, and restores it as the default selection', async () => {
    const { mod, betaRoot, stateFilePath } = await makeHarness();

    const added = await mod.addManagedBeadsSource({
      label: 'Beta Repo',
      rootPath: betaRoot,
    });

    expect(added).toEqual({
      id: 'beta-repo',
      label: 'Beta Repo',
      kind: 'project',
      isDefault: false,
      isCustom: true,
    });
    expect(mod.getManagedLastSourceId()).toBe('beta-repo');
    expect(mod.resolveManagedBeadsSource()?.id).toBe('beta-repo');

    const persisted = JSON.parse(await fs.readFile(stateFilePath, 'utf8')) as {
      sources: Array<{ id: string; label: string; rootPath: string }>;
      lastSourceId: string;
    };
    expect(persisted.lastSourceId).toBe('beta-repo');
    expect(persisted.sources).toEqual([
      {
        id: 'beta-repo',
        label: 'Beta Repo',
        rootPath: betaRoot,
      },
    ]);
  });

  it('preserves env-configured sources as read-only while allowing managed sources to be removed', async () => {
    const { mod, betaRoot } = await makeHarness();

    await expect(mod.removeManagedBeadsSource('alpha')).rejects.toThrow('Env-configured Beads sources cannot be removed in-app');

    const added = await mod.addManagedBeadsSource({ label: 'Beta Repo', rootPath: betaRoot });
    expect(mod.getManagedLastSourceId()).toBe(added.id);

    await mod.removeManagedBeadsSource(added.id);

    expect(mod.getManagedLastSourceId()).toBeNull();
    expect(mod.resolveManagedBeadsSource()?.id).toBe('openclaw');
    expect(mod.listManagedBeadsSourceDtos()).toEqual([
      { id: 'openclaw', label: '~/.openclaw', kind: 'openclaw', isDefault: true, isCustom: false },
      { id: 'alpha', label: 'Alpha Repo', kind: 'project', isDefault: false, isCustom: false },
    ]);
  });

  it('rejects tracked project paths outside the allowed OpenClaw roots', async () => {
    const { mod, outsideRoot } = await makeHarness();

    await expect(mod.addManagedBeadsSource({
      label: 'Outside Repo',
      rootPath: outsideRoot,
    })).rejects.toThrow(/must be ~\/\.openclaw or inside/i);
  });
});
