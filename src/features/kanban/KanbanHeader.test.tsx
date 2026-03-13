import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { KanbanHeader } from './KanbanHeader';

const baseProps = {
  filters: { q: '', priority: [], assignee: '', labels: [] },
  onFiltersChange: vi.fn(),
  statusCounts: { todo: 1, 'in-progress': 0, review: 0, done: 0 },
  beadsColumnCounts: { todo: 2, in_progress: 1, done: 0, closed: 0 },
  onCreateTask: vi.fn(),
  pendingProposalCount: 0,
  onApproveProposal: vi.fn(),
  onRejectProposal: vi.fn(),
  onBoardModeChange: vi.fn(),
  beadsSources: [{ id: 'openclaw', label: '~/.openclaw', kind: 'openclaw' as const, isDefault: true, isCustom: false }],
  selectedBeadsSourceId: 'openclaw',
  onBeadsSourceChange: vi.fn(),
};

describe('KanbanHeader workflow shell controls', () => {
  it('shows the native/beads toggle by default', () => {
    render(<KanbanHeader {...baseProps} boardMode="beads" />);

    expect(screen.getByRole('button', { name: 'Native' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Beads' })).toBeInTheDocument();
  });

  it('hides native-task controls when native tasks are disabled', () => {
    render(<KanbanHeader {...baseProps} boardMode="beads" hideNativeTasks />);

    expect(screen.queryByRole('button', { name: 'Native' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Beads' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /select beads source/i })).toBeInTheDocument();
  });

  it('still allows switching into beads mode when native tasks are available', async () => {
    const user = userEvent.setup();
    const onBoardModeChange = vi.fn();

    render(<KanbanHeader {...baseProps} boardMode="kanban" onBoardModeChange={onBoardModeChange} />);

    await user.click(screen.getByRole('button', { name: 'Beads' }));
    expect(onBoardModeChange).toHaveBeenCalledWith('beads');
  });

  it('lets beads users open source management and add a tracked project', async () => {
    const user = userEvent.setup();
    const onBeadsSourceAdd = vi.fn().mockResolvedValue(undefined);

    render(<KanbanHeader {...baseProps} boardMode="beads" onBeadsSourceAdd={onBeadsSourceAdd} />);

    await user.click(screen.getByRole('button', { name: /manage sources/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/project root path/i), '/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve');
    await user.type(screen.getByLabelText(/label \(optional\)/i), 'Gambit OpenClaw Nerve');
    await user.click(screen.getByRole('button', { name: /^add source$/i }));

    expect(onBeadsSourceAdd).toHaveBeenCalledWith({
      rootPath: '/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve',
      label: 'Gambit OpenClaw Nerve',
    });
  });
});
