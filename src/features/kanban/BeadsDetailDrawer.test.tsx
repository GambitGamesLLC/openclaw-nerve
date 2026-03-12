import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BeadsDetailDrawer } from './BeadsDetailDrawer';
import type { KanbanTask } from './types';

const task: KanbanTask = {
  id: 'nerve-rfd',
  title: 'Add richer Beads detail surface and verify live UX',
  description: 'Use real data already present in ~/.openclaw.',
  status: 'done',
  priority: 'high',
  createdBy: 'operator',
  createdAt: Date.parse('2026-03-12T17:59:35Z'),
  updatedAt: Date.parse('2026-03-12T18:08:12Z'),
  version: 1,
  labels: [],
  columnOrder: 0,
  feedback: [],
  beads: {
    issueId: 'nerve-rfd',
    rawStatus: 'in_progress',
    issueType: 'task',
    owner: 'gambitgamesllc@gmail.com',
    labels: ['beads', 'ux'],
    dependencyCount: 2,
    dependentCount: 1,
    commentCount: 3,
    createdAt: Date.parse('2026-03-12T17:59:35Z'),
    updatedAt: Date.parse('2026-03-12T18:08:12Z'),
  },
};

describe('BeadsDetailDrawer', () => {
  it('renders richer Beads metadata in a read-only drawer', () => {
    render(<BeadsDetailDrawer task={task} sourceLabel="~/.openclaw" onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'Beads issue details' })).toBeInTheDocument();
    expect(screen.getByText('nerve-rfd')).toBeInTheDocument();
    expect(screen.getByText('Raw status: in_progress')).toBeInTheDocument();
    expect(screen.getByText('@gambitgamesllc@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('beads, ux')).toBeInTheDocument();
    expect(screen.getByText('Use real data already present in ~/.openclaw.')).toBeInTheDocument();
  });
});
