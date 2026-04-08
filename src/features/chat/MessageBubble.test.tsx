import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

vi.mock('@/features/markdown/MarkdownRenderer', () => ({
  MarkdownRenderer: ({
    content,
    onOpenWorkspacePath,
    onOpenBeadId,
  }: {
    content: string;
    onOpenWorkspacePath?: ((path: string) => void) & { handlerId?: string };
    onOpenBeadId?: ((beadId: string) => void) & { handlerId?: string };
  }) => (
    <div
      data-workspace-handler-id={onOpenWorkspacePath?.handlerId ?? ''}
      data-bead-handler-id={onOpenBeadId?.handlerId ?? ''}
    >
      {content}
    </div>
  ),
}));

vi.mock('@/features/charts/InlineChart', () => ({
  default: () => null,
}));

import { MessageBubble } from './MessageBubble';
import type { ChatMsg } from './types';

function makeMessage(overrides: Partial<ChatMsg> = {}): ChatMsg {
  return {
    role: 'user',
    html: '',
    rawText: 'hello from operator',
    timestamp: new Date('2026-03-18T12:00:00Z'),
    ...overrides,
  };
}

describe('MessageBubble', () => {
  it('right-anchors user bubbles while keeping message text left-aligned', () => {
    const { container } = render(
      <MessageBubble
        msg={makeMessage()}
        index={0}
        isCollapsed={false}
        isMemoryCollapsed={false}
        onToggleCollapse={() => {}}
        onToggleMemory={() => {}}
      />,
    );

    const bubble = container.querySelector('.msg-user');
    const body = container.querySelector('.msg-body');

    expect(bubble).toBeTruthy();
    expect(bubble?.className).toContain('ml-auto');
    expect(bubble?.className).toContain('w-fit');
    expect(body).toBeTruthy();
    expect(body?.className).toContain('text-left');
  });

  it('re-renders when onOpenWorkspacePath changes', async () => {
    const handlerOne = Object.assign(() => {}, { handlerId: 'one' });
    const handlerTwo = Object.assign(() => {}, { handlerId: 'two' });

    const { container, rerender } = render(
      <MessageBubble
        msg={makeMessage({ role: 'assistant', rawText: '[notes](docs/todo.md)' })}
        index={0}
        isCollapsed={false}
        isMemoryCollapsed={false}
        onToggleCollapse={() => {}}
        onToggleMemory={() => {}}
        onOpenWorkspacePath={handlerOne}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('[data-workspace-handler-id="one"]')).toBeTruthy();
    });

    rerender(
      <MessageBubble
        msg={makeMessage({ role: 'assistant', rawText: '[notes](docs/todo.md)' })}
        index={0}
        isCollapsed={false}
        isMemoryCollapsed={false}
        onToggleCollapse={() => {}}
        onToggleMemory={() => {}}
        onOpenWorkspacePath={handlerTwo}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('[data-workspace-handler-id="two"]')).toBeTruthy();
    });
  });

  it('re-renders when onOpenBeadId changes', async () => {
    const handlerOne = Object.assign(() => {}, { handlerId: 'bead-one' });
    const handlerTwo = Object.assign(() => {}, { handlerId: 'bead-two' });

    const { container, rerender } = render(
      <MessageBubble
        msg={makeMessage({ role: 'assistant', rawText: '[viewer](bead:nerve-fms2)' })}
        index={0}
        isCollapsed={false}
        isMemoryCollapsed={false}
        onToggleCollapse={() => {}}
        onToggleMemory={() => {}}
        onOpenBeadId={handlerOne}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('[data-bead-handler-id="bead-one"]')).toBeTruthy();
    });

    rerender(
      <MessageBubble
        msg={makeMessage({ role: 'assistant', rawText: '[viewer](bead:nerve-fms2)' })}
        index={0}
        isCollapsed={false}
        isMemoryCollapsed={false}
        onToggleCollapse={() => {}}
        onToggleMemory={() => {}}
        onOpenBeadId={handlerTwo}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('[data-bead-handler-id="bead-two"]')).toBeTruthy();
    });
  });
});
