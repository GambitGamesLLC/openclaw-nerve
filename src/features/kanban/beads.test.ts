import { describe, expect, it } from 'vitest';
import {
  mapBeadsCardToKanbanTask,
  mapBeadsColumnToTaskStatus,
  mapBeadsPriorityToKanban,
  normalizeBeadsBoard,
  type BeadsBoardDto,
} from './beads';

describe('Beads board normalization', () => {
  it('maps Beads priorities into the existing Kanban priority scale', () => {
    expect(mapBeadsPriorityToKanban(0)).toBe('critical');
    expect(mapBeadsPriorityToKanban(1)).toBe('high');
    expect(mapBeadsPriorityToKanban(2)).toBe('normal');
    expect(mapBeadsPriorityToKanban(3)).toBe('low');
    expect(mapBeadsPriorityToKanban(null)).toBe('normal');
  });

  it('maps four Beads board columns onto supported card statuses', () => {
    expect(mapBeadsColumnToTaskStatus('todo')).toBe('todo');
    expect(mapBeadsColumnToTaskStatus('in_progress')).toBe('in-progress');
    expect(mapBeadsColumnToTaskStatus('done')).toBe('done');
    expect(mapBeadsColumnToTaskStatus('closed')).toBe('done');
  });

  it('normalizes board DTO cards into read-only Beads column cards', () => {
    const board: BeadsBoardDto = {
      source: { id: 'openclaw', label: '~/.openclaw', kind: 'openclaw', isDefault: true },
      generatedAt: '2026-03-11T22:00:00.000Z',
      totalCount: 3,
      columns: [
        {
          key: 'todo',
          title: 'To Do',
          itemCount: 1,
          items: [{
            id: 'nerve-19r',
            title: 'Frontend board mode',
            description: 'Add mode switch',
            rawStatus: 'open',
            columnKey: 'todo',
            priority: 1,
            issueType: 'task',
            owner: 'derrick',
            createdAt: '2026-03-11T21:00:00.000Z',
            updatedAt: '2026-03-11T21:30:00.000Z',
            closedAt: null,
            dependencyCount: 2,
            dependentCount: 0,
            commentCount: 1,
          }],
        },
        {
          key: 'in_progress',
          title: 'In Progress',
          itemCount: 1,
          items: [{
            id: 'nerve-working',
            title: 'Keep shipping',
            description: null,
            rawStatus: 'in_progress',
            columnKey: 'in_progress',
            priority: 2,
            issueType: 'task',
            owner: null,
            createdAt: null,
            updatedAt: null,
            closedAt: null,
            dependencyCount: 0,
            dependentCount: 0,
            commentCount: 0,
          }],
        },
        {
          key: 'done',
          title: 'Done',
          itemCount: 0,
          items: [],
        },
        {
          key: 'closed',
          title: 'Closed',
          itemCount: 1,
          items: [{
            id: 'nerve-ddk',
            title: 'Source registry',
            description: null,
            rawStatus: 'closed',
            columnKey: 'closed',
            priority: 2,
            issueType: 'task',
            owner: null,
            createdAt: '2026-03-11T20:00:00.000Z',
            updatedAt: '2026-03-11T20:30:00.000Z',
            closedAt: '2026-03-11T21:00:00.000Z',
            dependencyCount: 0,
            dependentCount: 3,
            commentCount: 0,
          }],
        },
      ],
    };

    const normalized = normalizeBeadsBoard(board);
    expect(normalized.todo).toHaveLength(1);
    expect(normalized.in_progress).toHaveLength(1);
    expect(normalized.done).toHaveLength(0);
    expect(normalized.closed).toHaveLength(1);

    const todo = normalized.todo[0];
    expect(todo).toMatchObject({
      id: 'nerve-19r',
      title: 'Frontend board mode',
      status: 'todo',
      priority: 'high',
      assignee: 'agent:derrick',
      labels: ['task', '2 dep', '1 comment'],
    });

    const closed = mapBeadsCardToKanbanTask(board.columns[3].items[0], 0);
    expect(closed.status).toBe('done');
    expect(closed.result).toBeUndefined();
    expect(closed.resultAt).toBe(Date.parse('2026-03-11T21:00:00.000Z'));
  });
});
