import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SessionInfoPanel } from './SessionInfoPanel';
import type { Session } from '@/types';

const baseSession: Session = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test Session',
  model: 'gpt-test',
  totalTokens: 1200,
  contextTokens: 10000,
  updatedAt: Date.now(),
} as Session;

describe('SessionInfoPanel hover delay', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not open the popup immediately on hover', () => {
    vi.useFakeTimers();
    render(
      <SessionInfoPanel session={baseSession}>
        <span>Hover target</span>
      </SessionInfoPanel>
    );

    const wrapper = screen.getByText('Hover target').closest('.relative');
    fireEvent.mouseEnter(wrapper!);

    // Should not be visible yet
    expect(screen.queryByText('Model')).not.toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(499); });
    expect(screen.queryByText('Model')).not.toBeInTheDocument();
  });

  it('opens the popup after the delay', () => {
    vi.useFakeTimers();
    render(
      <SessionInfoPanel session={baseSession}>
        <span>Hover target</span>
      </SessionInfoPanel>
    );

    const wrapper = screen.getByText('Hover target').closest('.relative');
    fireEvent.mouseEnter(wrapper!);

    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('Model')).toBeInTheDocument();
  });

  it('cancels the popup if the cursor leaves before the delay', () => {
    vi.useFakeTimers();
    render(
      <SessionInfoPanel session={baseSession}>
        <span>Hover target</span>
      </SessionInfoPanel>
    );

    const wrapper = screen.getByText('Hover target').closest('.relative');
    fireEvent.mouseEnter(wrapper!);
    act(() => { vi.advanceTimersByTime(300); });
    fireEvent.mouseLeave(wrapper!);
    act(() => { vi.advanceTimersByTime(500); });

    expect(screen.queryByText('Model')).not.toBeInTheDocument();
  });

  it('uses transcript model for main sessions when session.id is available', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({ ok: true, model: 'anthropic/claude-sonnet-4', missing: false }),
    } as Response);

    render(
      <SessionInfoPanel
        session={{
          ...baseSession,
          key: 'agent:main:main',
          id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          model: 'global-fallback-model',
        }}
      >
        <span>Hover target</span>
      </SessionInfoPanel>
    );

    const wrapper = screen.getByText('Hover target').closest('.relative');
    fireEvent.mouseEnter(wrapper!);
    act(() => { vi.advanceTimersByTime(500); });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/sessions/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/model');
    expect(screen.getByText('anthropic/claude-sonnet-4')).toBeInTheDocument();
    expect(screen.queryByText('global-fallback-model')).not.toBeInTheDocument();
  });

  it('prefers thinkingLevel over thinking when both are present', () => {
    vi.useFakeTimers();
    render(
      <SessionInfoPanel
        session={{
          ...baseSession,
          thinking: 'high',
          thinkingLevel: 'low',
        }}
      >
        <span>Hover target</span>
      </SessionInfoPanel>
    );

    const wrapper = screen.getByText('Hover target').closest('.relative');
    fireEvent.mouseEnter(wrapper!);
    act(() => { vi.advanceTimersByTime(500); });

    expect(screen.getByText('Thinking')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.queryByText('high')).not.toBeInTheDocument();
  });
});
