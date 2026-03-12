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

  it('maps three Beads board columns onto supported Kanban statuses', () => {
    expect(mapBeadsColumnToTaskStatus('todo')).toBe('todo');
    expect(mapBeadsColumnToTaskStatus('in_progress')).toBe('in-progress');
    expect(mapBeadsColumnToTaskStatus('done')).toBe('done');
  });

  it('normalizes board DTO cards into read-only Kanban task cards', () => {
    const board: BeadsBoardDto = {
      source: { id: 'openclaw', label: '~/.openclaw', kind: 'openclaw', isDefault: true },
      generatedAt: '2026-03-11T22:00:00.000Z',
      totalCount: 2,
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
          itemCount: 0,
          items: [],
        },
        {
          key: 'done',
          title: 'Done',
          itemCount: 1,
          items: [{
            id: 'nerve-ddk',
            title: 'Source registry',
            description: null,
            rawStatus: 'closed',
            columnKey: 'done',
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
    expect(normalized['in-progress']).toHaveLength(0);
    expect(normalized.done).toHaveLength(1);

    const todo = normalized.todo[0];
    expect(todo).toMatchObject({
      id: 'nerve-19r',
      title: 'Frontend board mode',
      status: 'todo',
      priority: 'high',
      assignee: 'agent:derrick',
      labels: ['task', '2 dep', '1 comment'],
    });

    const done = mapBeadsCardToKanbanTask(board.columns[2].items[0], 0);
    expect(done.status).toBe('done');
    expect(done.result).toBe('Raw Beads status: closed');
    expect(done.resultAt).toBe(Date.parse('2026-03-11T21:00:00.000Z'));
  });
});
