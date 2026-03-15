import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    linkedPlan: {
      path: '.plans/archive/2026-03-12-nerve-usability.md',
      title: 'Nerve usability pass',
      archived: true,
      status: 'In Progress',
      updatedAt: Date.parse('2026-03-12T18:10:00Z'),
      resolution: 'archived',
      resolvedBy: 'metadata',
      lastKnownPath: '.plans/archive/2026-03-12-nerve-usability.md',
      movedFromPath: null,
      metadataNeedsWrite: false,
      canRepairMetadata: false,
    },
  },
};

describe('BeadsDetailDrawer', () => {
  it('renders richer Beads metadata in a read-only drawer', async () => {
    const user = userEvent.setup();
    const onOpenPlan = vi.fn();
    const onClose = vi.fn();

    render(<BeadsDetailDrawer task={task} sourceLabel="~/.openclaw" onClose={onClose} onOpenPlan={onOpenPlan} />);

    expect(screen.getByRole('dialog', { name: 'Beads issue details' })).toBeInTheDocument();
    expect(screen.getByText('nerve-rfd')).toBeInTheDocument();
    expect(screen.getByText('Raw status: in_progress')).toBeInTheDocument();
    expect(screen.getByText('@gambitgamesllc@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('beads, ux')).toBeInTheDocument();
    expect(screen.getByText('Use real data already present in ~/.openclaw.')).toBeInTheDocument();
    expect(screen.getByText('Nerve usability pass')).toBeInTheDocument();
    expect(screen.getByText('.plans/archive/2026-03-12-nerve-usability.md')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open in plans/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpenPlan).toHaveBeenCalledWith('.plans/archive/2026-03-12-nerve-usability.md');
  });

  it('surfaces missing linked-plan context without open action', () => {
    const missingTask: KanbanTask = {
      ...task,
      beads: {
        ...task.beads!,
        linkedPlan: {
          path: '.plans/2026-01-01-gone.md',
          title: 'Old plan title',
          archived: false,
          status: null,
          updatedAt: null,
          resolution: 'missing',
          resolvedBy: 'metadata',
          lastKnownPath: '.plans/2026-01-01-gone.md',
          movedFromPath: null,
          metadataNeedsWrite: false,
          canRepairMetadata: false,
        },
      },
    };

    render(<BeadsDetailDrawer task={missingTask} sourceLabel="~/.openclaw" onClose={vi.fn()} onOpenPlan={vi.fn()} />);

    expect(screen.getByText('Missing')).toBeInTheDocument();
    expect(screen.getByText(/Last known path:/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /open in plans/i })).not.toBeInTheDocument();
  });

  it('offers manual metadata repair when linked plan metadata is stale and eligible', async () => {
    const user = userEvent.setup();
    const onRepairLinkedPlanMetadata = vi.fn().mockResolvedValue({ repaired: true });

    const repairableTask: KanbanTask = {
      ...task,
      beads: {
        ...task.beads!,
        linkedPlan: {
          path: '.plans/2026-03-14-active.md',
          title: 'Moved plan',
          archived: false,
          status: 'In Progress',
          updatedAt: Date.parse('2026-03-14T20:00:00Z'),
          resolution: 'moved',
          resolvedBy: 'metadata',
          lastKnownPath: '.plans/2026-03-10-old.md',
          movedFromPath: '.plans/2026-03-10-old.md',
          metadataNeedsWrite: true,
          canRepairMetadata: true,
        },
      },
    };

    render(
      <BeadsDetailDrawer
        task={repairableTask}
        sourceLabel="~/.openclaw"
        onClose={vi.fn()}
        onOpenPlan={vi.fn()}
        onRepairLinkedPlanMetadata={onRepairLinkedPlanMetadata}
      />,
    );

    expect(screen.getByText(/Canonical metadata is stale/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /repair metadata/i }));

    expect(onRepairLinkedPlanMetadata).toHaveBeenCalledWith('nerve-rfd');
    expect(await screen.findByText(/Canonical metadata refreshed/i)).toBeInTheDocument();
  });
});
