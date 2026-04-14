import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createChatPathLinksTemplate } from '@/features/chat/chatPathLinks';
import { ConfigTab } from './ConfigTab';

type FetchResponse = {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
};

function jsonResponse(data: unknown, init: { ok?: boolean; status?: number } = {}): FetchResponse {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => data,
  };
}

describe('ConfigTab', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('preserves an unsaved config draft per agent across top-level agent switches', async () => {
    const user = userEvent.setup();

    globalThis.fetch = vi.fn((input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);

      if (!init?.method && url === '/api/workspace/soul?agentId=alpha') {
        return Promise.resolve(jsonResponse({ ok: true, content: 'alpha soul' }));
      }
      if (!init?.method && url === '/api/workspace/soul?agentId=bravo') {
        return Promise.resolve(jsonResponse({ ok: true, content: 'bravo soul' }));
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof globalThis.fetch;

    const { rerender } = render(<ConfigTab agentId="alpha" />);

    await waitFor(() => {
      expect(screen.getByText('alpha soul')).toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Edit'));

    const editor = await screen.findByRole('textbox');
    expect(editor).toHaveValue('alpha soul');

    await user.type(editor, ' draft');
    expect(editor).toHaveValue('alpha soul draft');

    rerender(<ConfigTab agentId="bravo" />);

    await waitFor(() => {
      expect(screen.getByText('bravo soul')).toBeInTheDocument();
    });
    expect(screen.queryByDisplayValue('alpha soul draft')).not.toBeInTheDocument();

    rerender(<ConfigTab agentId="alpha" />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('alpha soul draft');
    });
  });

  it('creates CHAT_PATH_LINKS.json with the shared alias-aware template', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'scrollIntoView');
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });
    let putBody: string | undefined;

    globalThis.fetch = vi.fn((input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);

      if (!init?.method && url === '/api/workspace/soul?agentId=alpha') {
        return Promise.resolve(jsonResponse({ ok: true, content: 'alpha soul' }));
      }
      if (!init?.method && url === '/api/workspace/chatPathLinks?agentId=alpha') {
        return Promise.resolve(jsonResponse({ ok: false, error: 'File not found' }, { ok: false, status: 404 }));
      }
      if (init?.method === 'PUT' && url === '/api/workspace/chatPathLinks') {
        putBody = String(init.body);
        return Promise.resolve(jsonResponse({ ok: true }));
      }

      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof globalThis.fetch;

    try {
      render(<ConfigTab agentId="alpha" />);

      await waitFor(() => {
        expect(screen.getByText('alpha soul')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /select config file/i }));
      await user.click(await screen.findByRole('option', { name: 'CHAT_PATH_LINKS.json' }));
      expect(await screen.findByText('File does not exist yet')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /create chat_path_links\.json/i }));

      expect(await screen.findByText('File created')).toBeInTheDocument();
      expect(putBody).toBe(JSON.stringify({
        content: createChatPathLinksTemplate(),
        agentId: 'alpha',
      }));
    } finally {
      if (originalScrollIntoView) {
        Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView);
      } else {
        delete (window.HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
      }
    }
  });

  it('shows a cron capability warning when the gateway is missing cron access', async () => {
    globalThis.fetch = vi.fn((input: string | URL | Request) => {
      const url = String(input);
      if (url === '/api/workspace/soul?agentId=alpha') {
        return Promise.resolve(jsonResponse({ ok: true, content: 'alpha soul' }));
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }) as typeof globalThis.fetch;

    render(
      <ConfigTab
        agentId="alpha"
        cronWarning="This gateway does not expose cron management, so Nerve can’t load or edit crons right now."
      />,
    );

    expect(await screen.findByText(/this gateway does not expose cron management/i)).toBeInTheDocument();
    expect(screen.getByText(/nerve can’t load or edit crons right now/i)).toBeInTheDocument();
  });
});
