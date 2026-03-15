import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TopBar } from './TopBar';

describe('TopBar', () => {
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
