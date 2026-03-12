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
    vi.doMock('../lib/beads-board.js', () => ({
      BeadsAdapterError: class BeadsAdapterError extends Error {},
      InvalidBeadsSourceError: class InvalidBeadsSourceError extends Error {},
      listBeadsSourceDtos: () => ([
        { id: 'openclaw', label: '~/.openclaw', kind: 'openclaw', isDefault: true },
        { id: 'alpha', label: 'Alpha Repo', kind: 'project', isDefault: false },
      ]),
      getBeadsBoard: vi.fn(),
    }));

    const app = await buildApp();
    const res = await app.request('/api/beads/sources');
    expect(res.status).toBe(200);

    const json = await res.json() as { defaultSourceId: string; sources: Array<Record<string, unknown>> };
    expect(json.defaultSourceId).toBe('openclaw');
    expect(json.sources).toEqual([
      { id: 'openclaw', label: '~/.openclaw', kind: 'openclaw', isDefault: true },
      { id: 'alpha', label: 'Alpha Repo', kind: 'project', isDefault: false },
    ]);
    expect(JSON.stringify(json)).not.toContain('rootPath');
  });

  it('returns a projected board for a selected source id', async () => {
    const getBeadsBoard = vi.fn().mockResolvedValue({
      source: { id: 'alpha', label: 'Alpha Repo', kind: 'project', isDefault: false },
      generatedAt: '2026-03-11T22:00:00.000Z',
      totalCount: 1,
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
      ],
    });

    vi.doMock('../middleware/rate-limit.js', () => ({
      rateLimitGeneral: async (_c: unknown, next: () => Promise<void>) => next(),
    }));
    vi.doMock('../lib/config.js', () => ({
      config: { beads: { defaultSourceId: 'openclaw' } },
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

    const json = await res.json() as { source: { id: string }; totalCount: number };
    expect(json.source.id).toBe('alpha');
    expect(json.totalCount).toBe(1);
  });

  it('returns 404 when the requested Beads source id is invalid', async () => {
    class InvalidBeadsSourceError extends Error {}

    vi.doMock('../middleware/rate-limit.js', () => ({
      rateLimitGeneral: async (_c: unknown, next: () => Promise<void>) => next(),
    }));
    vi.doMock('../lib/config.js', () => ({
      config: { beads: { defaultSourceId: 'openclaw' } },
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
});
