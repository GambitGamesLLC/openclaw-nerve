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

  it('projects Beads statuses and linked-plan resolver states', async () => {
    vi.doMock('./plans.js', async (importOriginal) => {
      const actual = await importOriginal<typeof import('./plans.js')>();
      return {
        ...actual,
        resolveRepoPlanLinkForBead: async (beadId: string) => {
          if (beadId === 'todo-1') {
            return {
              state: 'moved',
              resolvedBy: 'metadata',
              plan: {
                path: '.plans/archive/2026-03-12-linked.md',
                title: 'Linked Plan',
                archived: true,
                status: 'Complete',
                updatedAt: 1234,
                planId: 'plan-linked',
                beadIds: ['todo-1'],
                preview: 'Linked preview',
              },
              lastKnown: {
                path: '.plans/2026-03-12-linked.md',
                title: 'Linked Plan',
                planId: 'plan-linked',
              },
              metadataToWrite: {
                path: '.plans/archive/2026-03-12-linked.md',
                title: 'Linked Plan',
                planId: 'plan-linked',
              },
              metadataNeedsWrite: false,
            };
          }

          if (beadId === 'todo-2') {
            return {
              state: 'missing',
              resolvedBy: 'metadata',
              plan: null,
              lastKnown: {
                path: '.plans/2026-01-01-gone.md',
                title: 'Gone plan',
                planId: 'plan-gone',
              },
              metadataToWrite: null,
              metadataNeedsWrite: false,
            };
          }

          return null;
        },
      };
    });

    const mod = await import('./beads-board.js');

    const board = await mod.projectBeadsIssuesToBoard(defaultSource, [
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
      isCustom: false,
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
    expect(board.columns[0].items[0]?.linkedPlan).toMatchObject({
      path: '.plans/archive/2026-03-12-linked.md',
      title: 'Linked Plan',
      archived: true,
      resolution: 'moved',
      movedFromPath: '.plans/2026-03-12-linked.md',
    });
    expect(board.columns[0].items[1]?.linkedPlan).toMatchObject({
      path: '.plans/2026-01-01-gone.md',
      resolution: 'missing',
      lastKnownPath: '.plans/2026-01-01-gone.md',
    });
    expect(board.columns[1].items.map((item) => item.id)).toEqual(['prog-1']);
    expect(board.columns[2].items.map((item) => item.id)).toEqual(['done-1']);
    expect(board.columns[3].items.map((item) => item.id)).toEqual(['closed-1']);
  });

  it('lists safe DTOs for managed Beads sources', async () => {
    vi.doMock('./beads-sources.js', () => ({
      listManagedBeadsSourceDtos: () => ([
        { id: 'openclaw', label: '~/.openclaw', kind: 'openclaw', isDefault: true, isCustom: false },
        { id: 'alpha', label: 'Alpha Repo', kind: 'project', isDefault: false, isCustom: true },
      ]),
      resolveManagedBeadsSource: vi.fn(),
    }));

    const mod = await import('./beads-board.js');
    expect(mod.listBeadsSourceDtos()).toEqual([
      { id: 'openclaw', label: '~/.openclaw', kind: 'openclaw', isDefault: true, isCustom: false },
      { id: 'alpha', label: 'Alpha Repo', kind: 'project', isDefault: false, isCustom: true },
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
    vi.doMock('./beads-sources.js', () => ({
      listManagedBeadsSourceDtos: () => ([
        { id: 'alpha', label: 'Alpha Repo', kind: 'project', isDefault: false, isCustom: false },
      ]),
      resolveManagedBeadsSource: (sourceId?: string | null) => sourceId === 'alpha' ? defaultSource : null,
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
    vi.doMock('./beads-sources.js', () => ({
      listManagedBeadsSourceDtos: () => ([]),
      resolveManagedBeadsSource: () => null,
    }));

    const mod = await import('./beads-board.js');
    await expect(mod.getBeadsBoard('missing')).rejects.toThrow('Unknown Beads source: missing');
    expect(execFileMock).not.toHaveBeenCalled();
  });

  it('repairs canonical linked-plan metadata when moved or bead_ids fallback resolution is eligible', async () => {
    const execFileMock = vi.fn().mockImplementation((_cmd, args, _options, callback) => {
      if (Array.isArray(args) && args[0] === 'export') {
        callback(null, {
          stdout: [
            JSON.stringify({
              id: 'nerve-10f',
              title: 'Repair me',
              metadata: {
                plan: {
                  plan_id: 'plan-active',
                  path: '.plans/2026-03-10-old.md',
                  title: 'Old title',
                },
              },
            }),
          ].join('\n'),
          stderr: '',
        });
        return;
      }

      if (Array.isArray(args) && args[0] === 'update') {
        callback(null, { stdout: '{}', stderr: '' });
        return;
      }

      callback(new Error(`Unexpected args: ${JSON.stringify(args)}`), { stdout: '', stderr: '' });
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

    vi.doMock('./beads-sources.js', () => ({
      listManagedBeadsSourceDtos: () => ([]),
      resolveManagedBeadsSource: () => defaultSource,
    }));

    vi.doMock('./plans.js', async (importOriginal) => {
      const actual = await importOriginal<typeof import('./plans.js')>();
      return {
        ...actual,
        resolveRepoPlanLinkForBead: vi
          .fn()
          .mockResolvedValueOnce({
            state: 'moved',
            resolvedBy: 'metadata',
            plan: {
              path: '.plans/2026-03-14-active.md',
              title: 'Active Plan',
              archived: false,
              status: 'In Progress',
              updatedAt: 123,
              planId: 'plan-active',
              beadIds: ['nerve-10f'],
              preview: 'Preview',
            },
            lastKnown: {
              planId: 'plan-active',
              path: '.plans/2026-03-10-old.md',
              title: 'Old title',
            },
            metadataToWrite: {
              planId: 'plan-active',
              path: '.plans/2026-03-14-active.md',
              title: 'Active Plan',
            },
            metadataNeedsWrite: true,
          })
          .mockResolvedValueOnce({
            state: 'active',
            resolvedBy: 'metadata',
            plan: {
              path: '.plans/2026-03-14-active.md',
              title: 'Active Plan',
              archived: false,
              status: 'In Progress',
              updatedAt: 123,
              planId: 'plan-active',
              beadIds: ['nerve-10f'],
              preview: 'Preview',
            },
            lastKnown: {
              planId: 'plan-active',
              path: '.plans/2026-03-14-active.md',
              title: 'Active Plan',
            },
            metadataToWrite: {
              planId: 'plan-active',
              path: '.plans/2026-03-14-active.md',
              title: 'Active Plan',
            },
            metadataNeedsWrite: false,
          }),
      };
    });

    const mod = await import('./beads-board.js');
    const repaired = await mod.repairBeadPlanMetadata('nerve-10f', 'alpha');

    expect(repaired).toMatchObject({
      issueId: 'nerve-10f',
      repaired: true,
      linkedPlan: {
        path: '.plans/2026-03-14-active.md',
        metadataNeedsWrite: false,
        canRepairMetadata: false,
      },
    });
  });

  it('rejects manual repair when resolution is not moved and not bead_ids fallback', async () => {
    const execFileMock = vi.fn().mockImplementation((_cmd, args, _options, callback) => {
      if (Array.isArray(args) && args[0] === 'export') {
        callback(null, {
          stdout: [JSON.stringify({ id: 'nerve-10f', title: 'Repair me', metadata: {} })].join('\n'),
          stderr: '',
        });
        return;
      }

      callback(null, { stdout: '{}', stderr: '' });
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

    vi.doMock('./beads-sources.js', () => ({
      listManagedBeadsSourceDtos: () => ([]),
      resolveManagedBeadsSource: () => defaultSource,
    }));

    vi.doMock('./plans.js', async (importOriginal) => {
      const actual = await importOriginal<typeof import('./plans.js')>();
      return {
        ...actual,
        resolveRepoPlanLinkForBead: vi.fn().mockResolvedValue({
          state: 'active',
          resolvedBy: 'metadata',
          plan: {
            path: '.plans/2026-03-14-active.md',
            title: 'Active Plan',
            archived: false,
            status: 'In Progress',
            updatedAt: 123,
            planId: 'plan-active',
            beadIds: ['nerve-10f'],
            preview: 'Preview',
          },
          lastKnown: {
            planId: 'plan-active',
            path: '.plans/2026-03-14-active.md',
            title: 'Active Plan',
          },
          metadataToWrite: {
            planId: 'plan-active',
            path: '.plans/2026-03-14-active.md',
            title: 'Active Plan',
          },
          metadataNeedsWrite: true,
        }),
      };
    });

    const mod = await import('./beads-board.js');
    await expect(mod.repairBeadPlanMetadata('nerve-10f', 'alpha')).rejects.toMatchObject({
      name: 'ManualPlanMetadataRepairError',
      code: 'repair_not_allowed',
    });
    const calledArgv = execFileMock.mock.calls.map((call) => call[1]);
    expect(calledArgv.some((argv) => Array.isArray(argv) && argv[0] === 'update')).toBe(false);
  });
});
