import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MessageBubble } from './MessageBubble';
import type { ChatMsg } from './types';

function createAssistantMessage(rawText: string): ChatMsg {
  return {
    msgId: 'm-ref-1',
    role: 'assistant',
    rawText,
    html: rawText,
    timestamp: new Date('2026-03-16T20:00:00Z'),
  };
}

describe('MessageBubble inline bead/plan references', () => {
  it('opens bead and plan references while preserving regular markdown links', async () => {
    const user = userEvent.setup();
    const onOpenTaskReference = vi.fn();
    const onOpenPlanReference = vi.fn();

    render(
      <MessageBubble
        msg={createAssistantMessage('Use nerve-0zg with .plans/2026-03-16-chat-links-for-beads-and-plans.md and [docs](https://example.com).')}
        index={0}
        isCollapsed={false}
        isMemoryCollapsed={true}
        onToggleCollapse={vi.fn()}
        onToggleMemory={vi.fn()}
        onOpenTaskReference={onOpenTaskReference}
        onOpenPlanReference={onOpenPlanReference}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'nerve-0zg' }));
    expect(onOpenTaskReference).toHaveBeenCalledWith('nerve-0zg');

    await user.click(screen.getByRole('button', { name: '.plans/2026-03-16-chat-links-for-beads-and-plans.md' }));
    expect(onOpenPlanReference).toHaveBeenCalledWith('.plans/2026-03-16-chat-links-for-beads-and-plans.md');

    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute('href', 'https://example.com');
  });
});
