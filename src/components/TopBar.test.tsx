import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('shows the optional plans view toggle only when enabled', () => {
    const onViewModeChange = vi.fn();
    const { rerender } = render(
      <TopBar
        onSettings={vi.fn()}
        agentLogEntries={[]}
        tokenData={null}
        logGlow={false}
        eventEntries={[]}
        eventsVisible={false}
        logVisible={false}
        viewMode="chat"
        onViewModeChange={onViewModeChange}
        plansVisible={false}
      />,
    );

    expect(screen.queryByRole('button', { name: /switch to plans view/i })).not.toBeInTheDocument();

    rerender(
      <TopBar
        onSettings={vi.fn()}
        agentLogEntries={[]}
        tokenData={null}
        logGlow={false}
        eventEntries={[]}
        eventsVisible={false}
        logVisible={false}
        viewMode="chat"
        onViewModeChange={onViewModeChange}
        plansVisible
      />,
    );

    expect(screen.getByRole('button', { name: /switch to plans view/i })).toBeInTheDocument();
  });

  it('auto-opens the workspace panel in compact layout when requested', async () => {
    const { rerender } = render(
      <TopBar
        onSettings={vi.fn()}
        agentLogEntries={[]}
        tokenData={null}
        logGlow={false}
        eventEntries={[]}
        eventsVisible={false}
        logVisible={false}
        mobilePanelButtonsVisible
        workspacePanel={<div>Workspace body</div>}
        workspaceOpenRequest={0}
      />,
    );

    expect(screen.queryByText('Workspace body')).not.toBeInTheDocument();

    rerender(
      <TopBar
        onSettings={vi.fn()}
        agentLogEntries={[]}
        tokenData={null}
        logGlow={false}
        eventEntries={[]}
        eventsVisible={false}
        logVisible={false}
        mobilePanelButtonsVisible
        workspacePanel={<div>Workspace body</div>}
        workspaceOpenRequest={1}
      />,
    );

    expect(await screen.findByText('Workspace body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /toggle workspace panel/i })).toHaveAttribute('aria-expanded', 'true');
  });
});
