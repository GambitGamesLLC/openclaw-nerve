/** Regression test: ChatContext should not resubscribe on local state updates. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import type { ImageAttachment } from '@/features/chat/types';
import type { GatewayEvent } from '@/types';

describe('ChatContext subscription stability', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  async function setup() {
    const handlers: Array<(msg: GatewayEvent) => void> = [];
    const subscribeMock = vi.fn((handler: (msg: GatewayEvent) => void) => {
      handlers.push(handler);
      return () => {
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
      };
    });
    const rpcMock = vi.fn(async (method: string) => {
      if (method === 'chat.send') return { runId: 'run-1', status: 'started' };
      return {};
    });

    vi.doMock('./GatewayContext', () => ({
      useGateway: () => ({
        connectionState: 'disconnected',
        rpc: rpcMock,
        subscribe: subscribeMock,
      }),
    }));

    vi.doMock('./SessionContext', () => ({
      useSessionContext: () => ({
        currentSession: 'main',
        sessions: [],
      }),
    }));

    vi.doMock('./SettingsContext', () => ({
      useSettings: () => ({
        soundEnabled: false,
        speak: vi.fn(),
      }),
    }));

    const mod = await import('./ChatContext');
    const emit = (event: GatewayEvent) => {
      for (const handler of [...handlers]) handler(event);
    };
    return { ...mod, subscribeMock, emit };
  }

  it('keeps a single subscribe registration after handleSend-triggered rerender', async () => {
    const { ChatProvider, useChat, subscribeMock } = await setup();

    let send: ((text: string, images?: ImageAttachment[]) => Promise<void>) | null = null;

    function Consumer() {
      const chat = useChat();
      useEffect(() => {
        send = chat.handleSend;
      }, [chat]);
      return null;
    }

    render(
      <ChatProvider>
        <Consumer />
      </ChatProvider>,
    );

    await waitFor(() => expect(subscribeMock).toHaveBeenCalledTimes(1));
    expect(send).not.toBeNull();

    await act(async () => {
      await send!('hello');
    });

    // Regression assertion: local state updates should not cause resubscription churn.
    expect(subscribeMock).toHaveBeenCalledTimes(1);
  });

  it('materializes buffered chat delta text when a tool starts afterward', async () => {
    const { ChatProvider, useChat, subscribeMock, emit } = await setup();

    let visibleTexts: string[] = [];

    function Consumer() {
      const chat = useChat();
      useEffect(() => {
        visibleTexts = chat.messages.map(msg => msg.rawText);
      }, [chat.messages]);
      return null;
    }

    render(
      <ChatProvider>
        <Consumer />
      </ChatProvider>,
    );

    await waitFor(() => expect(subscribeMock).toHaveBeenCalledTimes(1));

    act(() => {
      emit({
        type: 'event',
        event: 'chat',
        payload: { sessionKey: 'main', state: 'started', runId: 'run-1', seq: 1 },
      });
      emit({
        type: 'event',
        event: 'chat',
        payload: {
          sessionKey: 'main',
          state: 'delta',
          runId: 'run-1',
          seq: 2,
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Midpoint canary from chat delta.' }],
          },
        },
      });
      emit({
        type: 'event',
        event: 'agent',
        payload: {
          sessionKey: 'main',
          stream: 'tool',
          runId: 'run-1',
          data: { phase: 'start', name: 'bash', toolCallId: 'tool-1', args: {} },
        },
      });
    });

    await waitFor(() => {
      expect(visibleTexts).toContain('Midpoint canary from chat delta.');
    });
  });
});
