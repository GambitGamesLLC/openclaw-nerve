import { render, screen, waitFor, within } from '@testing-library/react';
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
    total: 2,
    active: 1,
    archived: 1,
  },
};

const readResponses: Record<string, object> = {
  '.plans/2026-03-12-active.md': {
    ok: true,
    plan: {
      ...listResponse.plans[0],
      content: '# Active Plan\n\nBody text\n',
    },
  },
  '.plans/archive/2026-03-01-old.md': {
    ok: true,
    plan: {
      ...listResponse.plans[1],
      content: '# Archived Plan\n\nArchive body\n',
    },
  },
};

describe('PlansTab', () => {
  beforeEach(() => {
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

  it('loads plans, previews the selected plan, and opens editor handoff', async () => {
    const user = userEvent.setup();
    const onOpenPlan = vi.fn();

    render(<PlansTab onOpenPlan={onOpenPlan} />);

    const activePlanButton = await screen.findByRole('button', { name: /active plan/i });
    expect(activePlanButton).toBeInTheDocument();
    expect(await screen.findByText('Body text')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /open in editor/i }));
    expect(onOpenPlan).toHaveBeenCalledWith('.plans/2026-03-12-active.md');

    await user.click(screen.getByRole('button', { name: /archived plan/i }));
    expect(await screen.findByText('Archive body')).toBeInTheDocument();
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
});
