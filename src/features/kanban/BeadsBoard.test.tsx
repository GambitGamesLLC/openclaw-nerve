import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BeadsBoard } from './BeadsBoard';
import type { KanbanTask } from './types';

function makeTask(id: string, title: string): KanbanTask {
  return {
    id,
    title,
    status: 'todo',
    priority: 'normal',
    createdBy: 'operator',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    labels: [],
    columnOrder: 0,
    feedback: [],
    beads: {
      issueId: id,
      rawStatus: 'open',
      labels: [],
      dependencyCount: 0,
      dependentCount: 0,
      commentCount: 0,
    },
  };
}

describe('BeadsBoard closed-column UX', () => {
  it('collapses Closed by default when closed items exist', () => {
    render(
      <BeadsBoard
        todoTasks={[makeTask('todo-1', 'Active task')]}
        inProgressTasks={[]}
        doneTasks={[]}
        closedTasks={[makeTask('closed-1', 'Closed task')]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        hasAnyTasks
      />,
    );

    expect(screen.getByRole('button', { name: /show closed column/i })).toBeInTheDocument();
    expect(screen.getByText('Hidden by default')).toBeInTheDocument();
    expect(screen.queryByText('Closed task')).not.toBeInTheDocument();
  });

  it('reveals closed cards when expanded', async () => {
    const user = userEvent.setup();
    const onCardClick = vi.fn();

    render(
      <BeadsBoard
        todoTasks={[makeTask('todo-1', 'Active task')]}
        inProgressTasks={[]}
        doneTasks={[]}
        closedTasks={[makeTask('closed-1', 'Closed task')]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        hasAnyTasks
        onCardClick={onCardClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: /show closed column/i }));

    const closedCard = screen.getByRole('button', { name: /closed task/i });
    expect(closedCard).toBeInTheDocument();

    await user.click(closedCard);
    expect(onCardClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'closed-1' }));

    expect(screen.getByRole('button', { name: /hide closed column/i })).toBeInTheDocument();
  });

  it('keeps Closed visible when there are no closed items', () => {
    render(
      <BeadsBoard
        todoTasks={[makeTask('todo-1', 'Active task')]}
        inProgressTasks={[]}
        doneTasks={[]}
        closedTasks={[]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        hasAnyTasks
      />,
    );

    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show closed column/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden by default')).not.toBeInTheDocument();
  });
});
