import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { KanbanCard } from './KanbanCard';
import type { KanbanTask } from './types';

const baseTask: KanbanTask = {
  id: 'task-1',
  title: 'Regular task',
  description: 'Plain Nerve task',
  status: 'todo',
  priority: 'normal',
  createdBy: 'operator',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: 1,
  labels: ['ui', 'urgent', 'ship'],
  columnOrder: 0,
  feedback: [],
  assignee: 'agent:derrick',
};

describe('KanbanCard', () => {
  it('renders generic task labels for native kanban tasks', () => {
    render(<KanbanCard task={baseTask} onClick={vi.fn()} sortable={false} />);

    expect(screen.getByText('ui')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
    expect(screen.getByText('ship')).toBeInTheDocument();
    expect(screen.getByText('@derrick')).toBeInTheDocument();
  });

  it('renders compact Beads-native metadata without the generic assignee row', () => {
    render(
      <KanbanCard
        task={{
          ...baseTask,
          id: 'nerve-hf2',
          title: 'Add Beads-native metadata to board cards and drawer',
          priority: 'high',
          labels: ['should-not-render-as-generic'],
          beads: {
            issueId: 'nerve-hf2',
            rawStatus: 'in_progress',
            issueType: 'task',
            owner: 'gambitgamesllc@gmail.com',
            labels: ['frontend', 'ux', 'polish'],
            dependencyCount: 2,
            dependentCount: 1,
            commentCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        }}
        onClick={vi.fn()}
        sortable={false}
      />,
    );

    expect(screen.getByText('nerve-hf2')).toBeInTheDocument();
    expect(screen.getByText('P1')).toBeInTheDocument();
    expect(screen.getByText('task')).toBeInTheDocument();
    expect(screen.getByText('@gambitgamesllc@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.getByText('ux')).toBeInTheDocument();
    expect(screen.getByText('+1 label')).toBeInTheDocument();
    expect(screen.getByText('2 dep')).toBeInTheDocument();
    expect(screen.getByText('1 blocked')).toBeInTheDocument();
    expect(screen.queryByText('@derrick')).not.toBeInTheDocument();
  });
});
