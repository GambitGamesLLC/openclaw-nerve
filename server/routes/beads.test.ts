/** Tests for the Beads API routes. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';

describe('Beads API routes', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function buildApp() {
    const mod = await import('./beads.js');
    const app = new Hono();
    app.route('/', mod.default);
    return app;
  }

  it('returns configured Beads sources without exposing filesystem paths', async () => {
    vi.doMock('../middleware/rate-limit.js', () => ({
      rateLimitGeneral: async (_c: unknown, next: () => Promise<void>) => next(),
    }));
    vi.doMock('../lib/config.js', () => ({
      config: { beads: { defaultSourceId: 'openclaw' } },
    }));
    vi.doMock('../lib/beads-sources.js', () => ({
      getManagedLastSourceId: () => 'alpha',
      addManagedBeadsSource: vi.fn(),
      removeManagedBeadsSource: vi.fn(),
      setManagedLastSourceId: vi.fn(),
    }));
    vi.doMock('../lib/beads-board.js', () => ({
      BeadsAdapterError: class BeadsAdapterError extends Error {},
      InvalidBeadsSourceError: class InvalidBeadsSourceError extends Error {},
      listBeadsSourceDtos: () => ([
        { id: 'openclaw', label: '~/.openclaw', kind: 'openclaw', isDefault: true, isCustom: false },
        { id: 'alpha', label: 'Alpha Repo', kind: 'project', isDefault: false, isCustom: true },
      ]),
      getBeadsBoard: vi.fn(),
    }));

    const app = await buildApp();
    const res = await app.request('/api/beads/sources');
    expect(res.status).toBe(200);

    const json = await res.json() as { defaultSourceId: string; lastSourceId: string; sources: Array<Record<string, unknown>> };
    expect(json.defaultSourceId).toBe('openclaw');
    expect(json.lastSourceId).toBe('alpha');
    expect(json.sources).toEqual([
      { id: 'openclaw', label: '~/.openclaw', kind: 'openclaw', isDefault: true, isCustom: false },
      { id: 'alpha', label: 'Alpha Repo', kind: 'project', isDefault: false, isCustom: true },
    ]);
    expect(JSON.stringify(json)).not.toContain('rootPath');
  });

  it('returns a projected board for a selected source id', async () => {
    const getBeadsBoard = vi.fn().mockResolvedValue({
      source: { id: 'alpha', label: 'Alpha Repo', kind: 'project', isDefault: false, isCustom: true },
      generatedAt: '2026-03-11T22:00:00.000Z',
      totalCount: 2,
      columns: [
        { key: 'todo', title: 'To Do', itemCount: 0, items: [] },
        {
          key: 'in_progress',
          title: 'In Progress',
          itemCount: 1,
          items: [
            {
              id: 'nerve-z7s',
              title: 'Adapter',
              description: null,
              rawStatus: 'in_progress',
              columnKey: 'in_progress',
              priority: 1,
              issueType: 'task',
              owner: 'derrick',
              createdAt: null,
              updatedAt: null,
              closedAt: null,
              dependencyCount: 1,
              dependentCount: 2,
              commentCount: 0,
            },
          ],
        },
        { key: 'done', title: 'Done', itemCount: 0, items: [] },
        {
          key: 'closed',
          title: 'Closed',
          itemCount: 1,
          items: [
            {
              id: 'nerve-closed',
              title: 'Closed issue',
              description: null,
              rawStatus: 'closed',
              columnKey: 'closed',
              priority: 2,
              issueType: 'task',
              owner: null,
              createdAt: null,
              updatedAt: null,
              closedAt: '2026-03-11T23:00:00.000Z',
              dependencyCount: 0,
              dependentCount: 0,
              commentCount: 0,
            },
          ],
        },
      ],
    });

    vi.doMock('../middleware/rate-limit.js', () => ({
      rateLimitGeneral: async (_c: unknown, next: () => Promise<void>) => next(),
    }));
    vi.doMock('../lib/config.js', () => ({
      config: { beads: { defaultSourceId: 'openclaw' } },
    }));
    vi.doMock('../lib/beads-sources.js', () => ({
      getManagedLastSourceId: () => null,
      addManagedBeadsSource: vi.fn(),
      removeManagedBeadsSource: vi.fn(),
      setManagedLastSourceId: vi.fn(),
    }));
    vi.doMock('../lib/beads-board.js', () => ({
      BeadsAdapterError: class BeadsAdapterError extends Error {},
      InvalidBeadsSourceError: class InvalidBeadsSourceError extends Error {},
      listBeadsSourceDtos: vi.fn(),
      getBeadsBoard,
    }));

    const app = await buildApp();
    const res = await app.request('/api/beads/board?sourceId=alpha');
    expect(res.status).toBe(200);
    expect(getBeadsBoard).toHaveBeenCalledWith('alpha');

    const json = await res.json() as { source: { id: string }; totalCount: number; columns: Array<{ key: string; itemCount: number }> };
    expect(json.source.id).toBe('alpha');
    expect(json.totalCount).toBe(2);
    expect(json.columns.map((column) => [column.key, column.itemCount])).toEqual([
      ['todo', 0],
      ['in_progress', 1],
      ['done', 0],
      ['closed', 1],
    ]);
  });

  it('returns 404 when the requested Beads source id is invalid', async () => {
    class InvalidBeadsSourceError extends Error {}

    vi.doMock('../middleware/rate-limit.js', () => ({
      rateLimitGeneral: async (_c: unknown, next: () => Promise<void>) => next(),
    }));
    vi.doMock('../lib/config.js', () => ({
      config: { beads: { defaultSourceId: 'openclaw' } },
    }));
    vi.doMock('../lib/beads-sources.js', () => ({
      getManagedLastSourceId: () => null,
      addManagedBeadsSource: vi.fn(),
      removeManagedBeadsSource: vi.fn(),
      setManagedLastSourceId: vi.fn(),
    }));
    vi.doMock('../lib/beads-board.js', () => ({
      BeadsAdapterError: class BeadsAdapterError extends Error {},
      InvalidBeadsSourceError,
      listBeadsSourceDtos: vi.fn(),
      getBeadsBoard: vi.fn().mockRejectedValue(new InvalidBeadsSourceError('Unknown Beads source: nope')),
    }));

    const app = await buildApp();
    const res = await app.request('/api/beads/board?sourceId=nope');
    expect(res.status).toBe(404);
  });

  it('adds a managed Beads source via POST /api/beads/sources', async () => {
    const addManagedBeadsSource = vi.fn().mockResolvedValue({
      id: 'gambit-openclaw-nerve',
      label: 'Gambit OpenClaw Nerve',
      kind: 'project',
      isDefault: false,
      isCustom: true,
    });

    vi.doMock('../middleware/rate-limit.js', () => ({
      rateLimitGeneral: async (_c: unknown, next: () => Promise<void>) => next(),
    }));
    vi.doMock('../lib/config.js', () => ({
      config: { beads: { defaultSourceId: 'openclaw' } },
    }));
    vi.doMock('../lib/beads-sources.js', () => ({
      getManagedLastSourceId: () => null,
      addManagedBeadsSource,
      removeManagedBeadsSource: vi.fn(),
      setManagedLastSourceId: vi.fn(),
    }));
    vi.doMock('../lib/beads-board.js', () => ({
      BeadsAdapterError: class BeadsAdapterError extends Error {},
      InvalidBeadsSourceError: class InvalidBeadsSourceError extends Error {},
      listBeadsSourceDtos: vi.fn(),
      getBeadsBoard: vi.fn(),
    }));

    const app = await buildApp();
    const res = await app.request('/api/beads/sources', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        label: 'Gambit OpenClaw Nerve',
        rootPath: '/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve',
      }),
    });

    expect(res.status).toBe(201);
    expect(addManagedBeadsSource).toHaveBeenCalledWith({
      label: 'Gambit OpenClaw Nerve',
      rootPath: '/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve',
    });
  });

  it('persists the last-viewed Beads source selection', async () => {
    const setManagedLastSourceId = vi.fn().mockResolvedValue('alpha');

    vi.doMock('../middleware/rate-limit.js', () => ({
      rateLimitGeneral: async (_c: unknown, next: () => Promise<void>) => next(),
    }));
    vi.doMock('../lib/config.js', () => ({
      config: { beads: { defaultSourceId: 'openclaw' } },
    }));
    vi.doMock('../lib/beads-sources.js', () => ({
      getManagedLastSourceId: () => null,
      addManagedBeadsSource: vi.fn(),
      removeManagedBeadsSource: vi.fn(),
      setManagedLastSourceId,
    }));
    vi.doMock('../lib/beads-board.js', () => ({
      BeadsAdapterError: class BeadsAdapterError extends Error {},
      InvalidBeadsSourceError: class InvalidBeadsSourceError extends Error {},
      listBeadsSourceDtos: vi.fn(),
      getBeadsBoard: vi.fn(),
    }));

    const app = await buildApp();
    const res = await app.request('/api/beads/selection', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sourceId: 'alpha' }),
    });

    expect(res.status).toBe(200);
    expect(setManagedLastSourceId).toHaveBeenCalledWith('alpha');
    await expect(res.json()).resolves.toEqual({ sourceId: 'alpha' });
  });
});
