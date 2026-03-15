import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBeadsBoard } from './useBeadsBoard';

describe('useBeadsBoard', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not abort an in-flight board load when the silent poll fires for the same source', async () => {
    let resolveBoard: ((value: { ok: boolean; json: () => Promise<unknown> }) => void) | null = null;
    const boardSignals: AbortSignal[] = [];
    const boardFetches: string[] = [];

    globalThis.fetch = vi.fn().mockImplementation((input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);

      if (url === '/api/beads/sources') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            defaultSourceId: 'openclaw',
            lastSourceId: 'openclaw',
            sources: [
              { id: 'openclaw', label: '~/.openclaw', kind: 'openclaw', isDefault: true, isCustom: false },
            ],
          }),
        });
      }

      if (url.startsWith('/api/beads/board?')) {
        boardFetches.push(url);
        if (init?.signal instanceof AbortSignal) {
          boardSignals.push(init.signal);
        }

        return new Promise((resolve) => {
          resolveBoard = resolve;
        });
      }

      if (url === '/api/beads/selection') {
        return Promise.resolve({ ok: true, json: async () => ({ sourceId: 'openclaw' }) });
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof globalThis.fetch;

    const { result } = renderHook(() => useBeadsBoard());

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.selectedSourceId).toBe('openclaw');
    expect(boardFetches).toHaveLength(1);

    expect(boardSignals[0]?.aborted).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(5_100);
      await Promise.resolve();
    });

    expect(boardFetches).toHaveLength(1);
    expect(boardSignals[0]?.aborted).toBe(false);

    resolveBoard?.({
      ok: true,
      json: async () => ({
        source: { id: 'openclaw', label: '~/.openclaw', kind: 'openclaw', isDefault: true, isCustom: false },
        generatedAt: '2026-03-15T16:00:00.000Z',
        totalCount: 2,
        columns: [
          {
            key: 'todo',
            title: 'To Do',
            itemCount: 1,
            items: [{
              id: 'oc-1',
              title: 'Investigate board polling',
              description: null,
              rawStatus: 'open',
              columnKey: 'todo',
              priority: 1,
              issueType: 'task',
              owner: 'derrick',
              labels: ['ui'],
              createdAt: '2026-03-15T15:00:00.000Z',
              updatedAt: '2026-03-15T15:30:00.000Z',
              closedAt: null,
              dependencyCount: 0,
              dependentCount: 0,
              commentCount: 0,
              linkedPlan: null,
            }],
          },
          {
            key: 'in_progress',
            title: 'In Progress',
            itemCount: 1,
            items: [{
              id: 'oc-2',
              title: 'Ship fix',
              description: null,
              rawStatus: 'in_progress',
              columnKey: 'in_progress',
              priority: 2,
              issueType: 'task',
              owner: null,
              labels: [],
              createdAt: '2026-03-15T15:10:00.000Z',
              updatedAt: '2026-03-15T15:40:00.000Z',
              closedAt: null,
              dependencyCount: 0,
              dependentCount: 0,
              commentCount: 0,
              linkedPlan: null,
            }],
          },
          { key: 'done', title: 'Done', itemCount: 0, items: [] },
          { key: 'closed', title: 'Closed', itemCount: 0, items: [] },
        ],
      }),
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.hasAnyTasks).toBe(true);
    expect(result.current.columnCounts.todo).toBe(1);
    expect(result.current.columnCounts.in_progress).toBe(1);
  });
});
