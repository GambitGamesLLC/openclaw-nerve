import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlansTab } from './PlansTab';

const listResponse = {
  ok: true,
  plans: [
    {
      path: '.plans/2026-03-12-active.md',
      title: 'Active Plan',
      status: 'In Progress',
      planId: 'plan-active',
      beadIds: ['nerve-413'],
      archived: false,
      updatedAt: Date.now(),
      preview: 'Active preview',
    },
    {
      path: '.plans/2026-03-14-manual-pass.md',
      title: 'Manual Pass Plan',
      status: 'In Progress',
      planId: 'plan-manual-pass',
      beadIds: ['nerve-010', 'nerve-ip6'],
      archived: false,
      updatedAt: Date.now() - 30_000,
      preview: 'Execution is now authorized with beads nerve-010 and nerve-ip6.',
    },
    {
      path: '.plans/archive/2026-03-01-old.md',
      title: 'Archived Plan',
      status: 'Complete',
      planId: 'plan-archived',
      beadIds: [],
      archived: true,
      updatedAt: Date.now() - 86_400_000,
      preview: 'Archived preview',
    },
  ],
  counts: {
    total: 3,
    active: 2,
    archived: 1,
  },
};

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height });
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

const readResponses: Record<string, object> = {
  '.plans/2026-03-12-active.md': {
    ok: true,
    plan: {
      ...listResponse.plans[0],
      content: '# Active Plan\n\nSee nerve-413, .plans/archive/2026-03-01-old.md, and src/features/workspace/tabs/PlansTab.tsx.\n',
    },
  },
  '.plans/2026-03-14-manual-pass.md': {
    ok: true,
    plan: {
      ...listResponse.plans[1],
      content: '# Manual Pass Plan\n\nExecution is now authorized. Follow-up beads include nerve-010 and nerve-ip6.\n\n## Proposed Tasks\n\n### Task 1: Manual walkthrough\n\n**Bead ID:** `nerve-010`\n**Prompt:** Run the walkthrough and capture findings.\n\n### Task 3: Implement worthwhile fixes\n\n**Bead ID:** `nerve-ip6`\n**Prompt:** Implement only the highest-value fix discovered manually.\n',
    },
  },
  '.plans/archive/2026-03-01-old.md': {
    ok: true,
    plan: {
      ...listResponse.plans[2],
      content: '# Archived Plan\n\nArchive body\n',
    },
  },
};

describe('PlansTab', () => {
  beforeEach(() => {
    setViewport(1280, 800);
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/plans') {
        return Promise.resolve(new Response(JSON.stringify(listResponse), { status: 200 }));
      }
      if (url.startsWith('/api/plans/read?path=')) {
        const path = decodeURIComponent(url.split('path=')[1] || '');
        const payload = readResponses[path];
        if (!payload) {
          return Promise.resolve(new Response(JSON.stringify({ ok: false, error: 'Not found' }), { status: 404 }));
        }
        return Promise.resolve(new Response(JSON.stringify(payload), { status: 200 }));
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads plans, renders safe clickable references, and preserves workspace path handoff', async () => {
    const user = userEvent.setup();
    const onOpenPath = vi.fn();
    const onOpenTask = vi.fn();

    render(<PlansTab onOpenPath={onOpenPath} onOpenTask={onOpenTask} />);

    const activePlanButton = await screen.findByRole('button', { name: /active plan/i });
    expect(activePlanButton).toBeInTheDocument();
    expect(await screen.findByText('Linked tasks')).toBeInTheDocument();
    expect(screen.getByText(/See nerve-413, \.plans\/archive\/2026-03-01-old\.md/i)).toBeInTheDocument();
    expect((await screen.findAllByRole('button', { name: 'nerve-413' })).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: 'nerve-413' })[0]);
    expect(onOpenTask).toHaveBeenCalledWith('nerve-413');

    await user.click(screen.getByRole('button', { name: 'src/features/workspace/tabs/PlansTab.tsx' }));
    expect(onOpenPath).toHaveBeenCalledWith('src/features/workspace/tabs/PlansTab.tsx');

    await user.click(screen.getByRole('button', { name: '.plans/archive/2026-03-01-old.md' }));
    expect(await screen.findByText('Archive body')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open in nerve/i }));
    expect(onOpenPath).toHaveBeenCalledWith('.plans/archive/2026-03-01-old.md');
  });

  it('honors an externally requested plan path including archived plans', async () => {
    render(<PlansTab requestedPlanPath=".plans/archive/2026-03-01-old.md" />);

    expect(await screen.findByText('Archive body')).toBeInTheDocument();
    expect(screen.getAllByText('.plans/archive/2026-03-01-old.md').length).toBeGreaterThan(0);
  });

  it('filters plans by bead id search', async () => {
    const user = userEvent.setup();

    render(<PlansTab />);

    await screen.findByRole('button', { name: /active plan/i });
    await user.type(screen.getByPlaceholderText(/search plans, paths, or bead ids/i), 'nerve-413');

    await waitFor(() => {
      const activeSection = screen.getByText('Active').closest('section');
      expect(activeSection).not.toBeNull();
      expect(within(activeSection as HTMLElement).getByRole('button', { name: /active plan/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /archived plan/i })).not.toBeInTheDocument();
    });
  });

  it('prefers task-local context for linked bead snippets over early generic mentions', async () => {
    const user = userEvent.setup();

    render(<PlansTab onOpenTask={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /manual pass plan/i }));

    const linkedTasks = await screen.findByText('Linked tasks');
    const panel = linkedTasks.parentElement;
    expect(panel).not.toBeNull();

    const nerve010Button = within(panel as HTMLElement).getAllByRole('button', { name: 'nerve-010' })[0];
    const nerveIp6Button = within(panel as HTMLElement).getAllByRole('button', { name: 'nerve-ip6' })[0];

    const nerve010Row = nerve010Button.closest('div');
    const nerveIp6Row = nerveIp6Button.closest('div');

    expect(nerve010Row).not.toBeNull();
    expect(nerveIp6Row).not.toBeNull();

    expect(within(nerve010Row as HTMLElement).getByText(/Task 1: Manual walkthrough/i)).toBeInTheDocument();
    expect(within(nerveIp6Row as HTMLElement).getByText(/Task 3: Implement worthwhile fixes/i)).toBeInTheDocument();

    expect(panel).not.toHaveTextContent(/Execution is now authorized/i);
  });

  it('foregrounds the selected plan on portrait mobile and lets the user return to the list', async () => {
    setViewport(390, 844);
    const user = userEvent.setup();

    render(<PlansTab />);

    const manualPassPlan = await screen.findByRole('button', { name: /manual pass plan/i });
    expect(screen.queryByText('Linked tasks')).not.toBeInTheDocument();

    await user.click(manualPassPlan);

    const backButton = await screen.findByRole('button', { name: /back to plans list/i });
    expect(backButton).toBeInTheDocument();
    expect(backButton.parentElement).toHaveClass('sticky', 'top-0');
    expect(await screen.findByText('Linked tasks')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /active plan/i })).not.toBeInTheDocument();

    await user.click(backButton);

    expect(await screen.findByRole('button', { name: /active plan/i })).toBeInTheDocument();
    expect(screen.queryByText('Linked tasks')).not.toBeInTheDocument();
  });

  it('uses the same reader-first flow on landscape mobile viewports', async () => {
    setViewport(844, 390);
    const user = userEvent.setup();

    render(<PlansTab />);

    await user.click(await screen.findByRole('button', { name: /manual pass plan/i }));

    expect(await screen.findByRole('button', { name: /back to plans list/i })).toBeInTheDocument();
    expect(await screen.findByText('Linked tasks')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /active plan/i })).not.toBeInTheDocument();
  });
});
