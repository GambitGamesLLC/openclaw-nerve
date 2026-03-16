import { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputBar, type InputBarHandle } from './InputBar';

vi.mock('@/features/voice/useVoiceInput', () => ({
  useVoiceInput: () => ({
    voiceState: 'idle',
    interimTranscript: '',
    wakeWordEnabled: false,
    toggleWakeWord: vi.fn(),
    error: null,
    clearError: vi.fn(),
  }),
}));

vi.mock('@/hooks/useTabCompletion', () => ({
  useTabCompletion: () => ({
    handleKeyDown: vi.fn(() => false),
    reset: vi.fn(),
  }),
}));

vi.mock('@/hooks/useInputHistory', () => ({
  useInputHistory: () => ({
    addToHistory: vi.fn(),
    isNavigating: vi.fn(() => false),
    reset: vi.fn(),
    navigateUp: vi.fn(() => null),
    navigateDown: vi.fn(() => null),
  }),
}));

vi.mock('@/contexts/SessionContext', () => ({
  useSessionContext: () => ({
    sessions: [],
    agentName: 'Agent',
  }),
}));

vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({
    liveTranscriptionPreview: false,
    sttInputMode: 'browser',
    sttProvider: 'browser',
  }),
}));

describe('InputBar', () => {
  const originalFetch = global.fetch;
  const originalRequestAnimationFrame = global.requestAnimationFrame;
  const originalCancelAnimationFrame = global.cancelAnimationFrame;

  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ language: 'en' }),
    })) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
    vi.restoreAllMocks();
  });

  it('re-runs textarea resize after injected text when layout settles', async () => {
    const rafQueue: FrameRequestCallback[] = [];
    global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      rafQueue.push(callback);
      return rafQueue.length;
    }) as typeof requestAnimationFrame;
    global.cancelAnimationFrame = vi.fn((id: number) => {
      if (id > 0 && id <= rafQueue.length) {
        rafQueue[id - 1] = () => {};
      }
    }) as typeof cancelAnimationFrame;

    const ref = createRef<InputBarHandle>();
    render(<InputBar ref={ref} onSend={vi.fn()} isGenerating={false} />);

    const textarea = screen.getByLabelText('Message input') as HTMLTextAreaElement;
    let scrollHeightValue = 42;
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      get: () => scrollHeightValue,
    });

    ref.current?.injectText('Plan context:\n- Title: Mobile composer polish', 'append');

    expect(textarea.style.height).toBe('42px');

    scrollHeightValue = 96;

    const firstFrame = rafQueue.shift();
    expect(firstFrame).toBeDefined();
    firstFrame?.(16);

    const secondFrame = rafQueue.shift();
    expect(secondFrame).toBeDefined();
    secondFrame?.(32);

    await waitFor(() => {
      expect(textarea.style.height).toBe('96px');
    });
  });
});
