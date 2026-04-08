import { forwardRef, useImperativeHandle } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import type { ChatMsg } from './types';

const mockMessageBubble = vi.fn(({ onOpenBeadId }: { onOpenBeadId?: ((beadId: string) => void) & { handlerId?: string } }) => (
  <div data-testid="message-bubble" data-bead-handler-id={onOpenBeadId?.handlerId ?? ''} />
));

vi.mock('./MessageBubble', () => ({
  MessageBubble: (props: unknown) => mockMessageBubble(props),
}));

vi.mock('./ToolCallBlock', () => ({
  ToolCallBlock: () => null,
}));

vi.mock('./SearchBar', () => ({
  SearchBar: () => null,
}));

vi.mock('./components', () => ({
  ActivityLog: () => null,
  ChatHeader: () => null,
  ProcessingIndicator: () => null,
  ScrollToBottomButton: () => null,
  StreamingMessage: () => null,
  ToolGroupBlock: () => null,
}));

vi.mock('./InputBar', () => ({
  InputBar: forwardRef(function MockInputBar(_props, ref) {
    useImperativeHandle(ref, () => ({
      focus: () => {},
      addWorkspacePath: async () => {},
    }));
    return <div data-testid="input-bar" />;
  }),
}));

vi.mock('./useMessageSearch', () => ({
  useMessageSearch: () => ({
    query: '',
    isActive: false,
    currentMatch: null,
    currentMatchIndex: -1,
    totalMatches: 0,
    open: vi.fn(),
    close: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    setQuery: vi.fn(),
    clear: vi.fn(),
    getMatchForMessage: () => null,
  }),
}));

import { ChatPanel } from './ChatPanel';

beforeAll(() => {
  class MockIntersectionObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

function makeMessage(overrides: Partial<ChatMsg> = {}): ChatMsg {
  return {
    role: 'assistant',
    html: '',
    rawText: '[viewer](bead:nerve-fms2)',
    timestamp: new Date('2026-04-08T13:00:00Z'),
    ...overrides,
  };
}

describe('ChatPanel', () => {
  it('forwards onOpenBeadId to rendered message bubbles', () => {
    const onOpenBeadId = Object.assign(vi.fn(), { handlerId: 'chat-panel-bead-handler' });

    render(
      <ChatPanel
        messages={[makeMessage()]}
        onSend={vi.fn()}
        onAbort={vi.fn()}
        isGenerating={false}
        stream={{ html: '', isRecovering: false, recoveryReason: null }}
        onOpenBeadId={onOpenBeadId}
      />,
    );

    expect(screen.getByTestId('message-bubble')).toHaveAttribute('data-bead-handler-id', 'chat-panel-bead-handler');
    expect(mockMessageBubble).toHaveBeenCalled();
  });
});
