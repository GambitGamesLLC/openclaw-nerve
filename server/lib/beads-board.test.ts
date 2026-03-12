/** Tests for the server-side Beads board adapter and projection helpers. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('beads board adapter', () => {
  const defaultSource = {
    id: 'alpha',
    label: 'Alpha Repo',
    rootPath: '/repos/alpha',
    kind: 'project' as const,
  };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('projects Beads statuses into a four-column Beads-native board model', async () => {
    const mod = await import('./beads-board.js');

    const board = mod.projectBeadsIssuesToBoard(defaultSource, [
      { id: 'todo-1', title: 'Open task', status: 'open', priority: 1, labels: ['ui', 'board'] },
      { id: 'prog-1', title: 'Working task', status: 'in_progress', priority: 2 },
      { id: 'done-1', title: 'Resolved task', status: 'resolved', priority: 0 },
      { id: 'closed-1', title: 'Closed task', status: 'closed', priority: 3 },
      { id: 'todo-2', title: 'Unknown status task', status: 'blocked' },
      { title: 'missing id should be ignored' },
    ]);

    expect(board.source).toEqual({
      id: 'alpha',
      label: 'Alpha Repo',
      kind: 'project',
      isDefault: false,
    });
    expect(board.totalCount).toBe(5);
    expect(board.columns.map((column) => [column.key, column.itemCount])).toEqual([
      ['todo', 2],
      ['in_progress', 1],
      ['done', 1],
      ['closed', 1],
    ]);
    expect(board.columns[0].items.map((item) => item.id)).toEqual(['todo-1', 'todo-2']);
    expect(board.columns[0].items[0]?.labels).toEqual(['ui', 'board']);
    expect(board.columns[1].items.map((item) => item.id)).toEqual(['prog-1']);
    expect(board.columns[2].items.map((item) => item.id)).toEqual(['done-1']);
    expect(board.columns[3].items.map((item) => item.id)).toEqual(['closed-1']);
  });

  it('lists safe DTOs for configured Beads sources', async () => {
    vi.doMock('./config.js', () => ({
      config: {
        beads: { defaultSourceId: 'openclaw' },
      },
      listBeadsSources: () => ([
        { id: 'openclaw', label: '~/.openclaw', rootPath: '/home/test/.openclaw', kind: 'openclaw' },
        { id: 'alpha', label: 'Alpha Repo', rootPath: '/repos/alpha', kind: 'project' },
      ]),
      resolveBeadsSource: vi.fn(),
    }));

    const mod = await import('./beads-board.js');
    expect(mod.listBeadsSourceDtos()).toEqual([
      { id: 'openclaw', label: '~/.openclaw', kind: 'openclaw', isDefault: true },
      { id: 'alpha', label: 'Alpha Repo', kind: 'project', isDefault: false },
    ]);
  });

  it('uses resolveBeadsSource and shells out to bd within the resolved repo root', async () => {
    const execFileMock = vi.fn().mockImplementation((_cmd, _args, options, callback) => {
      callback(null, {
        stdout: [
          JSON.stringify({ id: 'nerve-z7s', title: 'Adapter', status: 'in_progress', dependency_count: 1, labels: ['backend'] }),
          JSON.stringify({ id: 'nerve-closed', title: 'Closed', status: 'closed', dependency_count: 0 }),
        ].join('\n'),
        stderr: '',
      });
    });

    vi.doMock('node:child_process', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:child_process')>();
      return {
        ...actual,
        default: {
          ...(actual as unknown as Record<string, unknown>),
          execFile: execFileMock,
        },
        execFile: execFileMock,
      };
    });
    vi.doMock('./config.js', () => ({
      config: {
        beads: { defaultSourceId: 'alpha' },
      },
      listBeadsSources: () => ([defaultSource]),
      resolveBeadsSource: (sourceId?: string | null) => sourceId === 'alpha' ? defaultSource : null,
    }));

    const mod = await import('./beads-board.js');
    const board = await mod.getBeadsBoard('alpha');

    expect(execFileMock).toHaveBeenCalledWith(
      expect.stringMatching(/(^bd$|\/bd$)/),
      ['export'],
      expect.objectContaining({
        cwd: '/repos/alpha',
        env: expect.objectContaining({ PATH: expect.stringContaining('/.local/bin') }),
      }),
      expect.any(Function),
    );
    expect(board.columns[1].items[0]?.id).toBe('nerve-z7s');
    expect(board.columns[1].items[0]?.labels).toEqual(['backend']);
    expect(board.columns[3].items[0]?.id).toBe('nerve-closed');
    expect(board.source.id).toBe('alpha');
  });

  it('rejects unknown source ids before running bd', async () => {
    const execFileMock = vi.fn();

    vi.doMock('node:child_process', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:child_process')>();
      return {
        ...actual,
        default: {
          ...(actual as unknown as Record<string, unknown>),
          execFile: execFileMock,
        },
        execFile: execFileMock,
      };
    });
    vi.doMock('./config.js', () => ({
      config: {
        beads: { defaultSourceId: 'openclaw' },
      },
      listBeadsSources: () => ([]),
      resolveBeadsSource: () => null,
    }));

    const mod = await import('./beads-board.js');
    await expect(mod.getBeadsBoard('missing')).rejects.toThrow('Unknown Beads source: missing');
    expect(execFileMock).not.toHaveBeenCalled();
  });
});
