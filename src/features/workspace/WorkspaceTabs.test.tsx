import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceTabs } from './WorkspaceTabs';

describe('WorkspaceTabs workflow shell labelling', () => {
  it('defaults the workflow tab label to Tasks', () => {
    render(<WorkspaceTabs activeTab="memory" onTabChange={vi.fn()} />);

    expect(screen.getByRole('tab', { name: /tasks/i })).toBeInTheDocument();
  });

  it('renames the workflow tab to Beads in beads-first mode', () => {
    render(<WorkspaceTabs activeTab="memory" onTabChange={vi.fn()} boardLabel="Beads" />);

    expect(screen.getByRole('tab', { name: /beads/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /tasks/i })).not.toBeInTheDocument();
  });
});
