import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MarkdownRenderer } from './MarkdownRenderer';

describe('MarkdownRenderer inline references', () => {
  it('links known plan paths, safe repo paths, and conservative bead ids', async () => {
    const user = userEvent.setup();
    const onOpenPlanReference = vi.fn();
    const onOpenPath = vi.fn();
    const onOpenTask = vi.fn();

    render(
      <MarkdownRenderer
        content={'See nerve-413, .plans/2026-03-12-active.md, and src/features/workspace/tabs/PlansTab.tsx.'}
        plans={[
          {
            path: '.plans/2026-03-12-active.md',
            title: 'Active Plan',
            status: 'In Progress',
            planId: 'plan-active',
            beadIds: ['nerve-413'],
            archived: false,
          },
        ]}
        onOpenPlanReference={onOpenPlanReference}
        onOpenPath={onOpenPath}
        onOpenTask={onOpenTask}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'nerve-413' }));
    expect(onOpenTask).toHaveBeenCalledWith('nerve-413');

    await user.click(screen.getByRole('button', { name: '.plans/2026-03-12-active.md' }));
    expect(onOpenPlanReference).toHaveBeenCalledWith('.plans/2026-03-12-active.md');

    await user.click(screen.getByRole('button', { name: 'src/features/workspace/tabs/PlansTab.tsx' }));
    expect(onOpenPath).toHaveBeenCalledWith('src/features/workspace/tabs/PlansTab.tsx');
  });

  it('does not aggressively autolink arbitrary hyphenated text', () => {
    render(
      <MarkdownRenderer
        content={'Keep server-side rendering literal and do not autolink random-word tokens.'}
        onOpenTask={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'server-side' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'random-word' })).not.toBeInTheDocument();
  });
});
