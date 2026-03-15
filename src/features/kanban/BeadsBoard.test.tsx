import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BeadsBoard } from './BeadsBoard';
import type { KanbanTask } from './types';

const COLUMN_VISIBILITY_STORAGE_KEY = 'nerve:beadsBoardColumnVisibility';

function makeTask(id: string, title: string, overrides: Partial<KanbanTask> = {}): KanbanTask {
  const { beads: beadsOverrides, ...restOverrides } = overrides;

  return {
    id,
    title,
    status: 'todo',
    priority: 'normal',
    createdBy: 'operator',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    labels: [],
    columnOrder: 0,
    feedback: [],
    ...restOverrides,
    beads: {
      issueId: id,
      rawStatus: 'open',
      labels: [],
      dependencyCount: 0,
      dependentCount: 0,
      commentCount: 0,
      ...beadsOverrides,
    },
  };
}

describe('BeadsBoard column visibility UX', () => {
  it('shows an explicit loading state instead of a blank board', () => {
    render(
      <BeadsBoard
        todoTasks={[]}
        inProgressTasks={[]}
        doneTasks={[]}
        closedTasks={[]}
        loading
        error={null}
        onRetry={vi.fn()}
        hasAnyTasks={false}
        sourceLabel="~/.openclaw"
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading Beads board…');
    expect(screen.getByText('Fetching the latest issues and column counts.')).toBeInTheDocument();
    expect(screen.getByText('Source: ~/.openclaw')).toBeInTheDocument();
  });

  beforeEach(() => {
    const store = new Map<string, string>();
    const localStorageMock = {
      getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
      setItem: vi.fn((key: string, value: string) => { store.set(key, String(value)); }),
      removeItem: vi.fn((key: string) => { store.delete(key); }),
      clear: vi.fn(() => { store.clear(); }),
    };

    vi.stubGlobal('localStorage', localStorageMock);
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hides Closed by default when closed items exist', () => {
    render(
      <BeadsBoard
        todoTasks={[makeTask('todo-1', 'Active task')]}
        inProgressTasks={[]}
        doneTasks={[]}
        closedTasks={[makeTask('closed-1', 'Closed task')]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        hasAnyTasks
      />,
    );

    expect(screen.getByRole('button', { name: /show closed column/i })).toBeInTheDocument();
    expect(screen.queryByText('Closed task')).not.toBeInTheDocument();
    expect(screen.getByText('Hidden: Closed')).toBeInTheDocument();
  });

  it('treats show and hide as first-class controls for every major column', async () => {
    const user = userEvent.setup();

    render(
      <BeadsBoard
        todoTasks={[makeTask('todo-1', 'To Do task')]}
        inProgressTasks={[makeTask('progress-1', 'In Progress task')]}
        doneTasks={[makeTask('done-1', 'Done task')]}
        closedTasks={[makeTask('closed-1', 'Closed task')]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        hasAnyTasks
      />,
    );

    await user.click(screen.getByRole('button', { name: /hide to do column/i }));
    await user.click(screen.getByRole('button', { name: /hide in progress column/i }));
    await user.click(screen.getByRole('button', { name: /hide done column/i }));

    expect(screen.queryByText('To Do task')).not.toBeInTheDocument();
    expect(screen.queryByText('In Progress task')).not.toBeInTheDocument();
    expect(screen.queryByText('Done task')).not.toBeInTheDocument();
    expect(screen.getByText('Hidden: To Do, In Progress, Done, Closed')).toBeInTheDocument();
    expect(screen.getByText('All Beads columns are hidden')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /show closed column/i }));

    const closedCard = screen.getByRole('button', { name: /closed task/i });
    expect(closedCard).toBeInTheDocument();
  });

  it('persists column visibility globally across remounts', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <BeadsBoard
        todoTasks={[makeTask('todo-1', 'To Do task')]}
        inProgressTasks={[]}
        doneTasks={[]}
        closedTasks={[makeTask('closed-1', 'Closed task')]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        hasAnyTasks
      />,
    );

    await user.click(screen.getByRole('button', { name: /hide to do column/i }));
    await user.click(screen.getByRole('button', { name: /show closed column/i }));

    expect(localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY)).toBe(
      JSON.stringify({
        todo: false,
        in_progress: true,
        done: true,
        closed: true,
      }),
    );

    unmount();

    render(
      <BeadsBoard
        todoTasks={[makeTask('todo-1', 'To Do task')]}
        inProgressTasks={[]}
        doneTasks={[]}
        closedTasks={[makeTask('closed-1', 'Closed task')]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        hasAnyTasks
      />,
    );

    expect(screen.queryByText('To Do task')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show to do column/i })).toBeInTheDocument();
    expect(screen.getByText('Closed task')).toBeInTheDocument();
  });

  it('filters loaded Beads items by issue id, title, description, labels, and owner', async () => {
    const user = userEvent.setup();

    render(
      <BeadsBoard
        todoTasks={[
          makeTask('nerve-fob', 'Add searchable board', {
            description: 'Incremental mobile friendly search',
            labels: ['frontend'],
            beads: {
              owner: 'derrick',
              labels: ['frontend'],
            },
          }),
        ]}
        inProgressTasks={[
          makeTask('nerve-live', 'Keep shipping', {
            labels: ['ops'],
            beads: {
              owner: 'chip',
              labels: ['ops'],
            },
          }),
        ]}
        doneTasks={[]}
        closedTasks={[]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        hasAnyTasks
        sourceLabel="Gambit Nerve"
      />,
    );

    const search = screen.getByRole('searchbox', { name: /search beads items in the current source/i });

    await user.type(search, 'nerve-fob frontend derrick');

    expect(screen.getByText('Add searchable board')).toBeInTheDocument();
    expect(screen.queryByText('Keep shipping')).not.toBeInTheDocument();
    expect(screen.getByText('1 match in Gambit Nerve')).toBeInTheDocument();
  });

  it('shows a no-results state and lets the user clear the search', async () => {
    const user = userEvent.setup();

    render(
      <BeadsBoard
        todoTasks={[makeTask('todo-1', 'Active task')]}
        inProgressTasks={[]}
        doneTasks={[]}
        closedTasks={[]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        hasAnyTasks
      />,
    );

    await user.type(screen.getByRole('searchbox', { name: /search beads items in the current source/i }), 'missing');

    expect(screen.getByText('No Beads items match “missing”')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear search/i }));

    expect(screen.getByText('Active task')).toBeInTheDocument();
  });

  it('clears the Beads search when switching sources', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <BeadsBoard
        todoTasks={[makeTask('todo-1', 'Active task')]}
        inProgressTasks={[]}
        doneTasks={[]}
        closedTasks={[]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        hasAnyTasks
        sourceId="source-a"
      />,
    );

    await user.type(screen.getByRole('searchbox', { name: /search beads items in the current source/i }), 'active');
    expect(screen.getByDisplayValue('active')).toBeInTheDocument();

    rerender(
      <BeadsBoard
        todoTasks={[makeTask('todo-2', 'Second source task')]}
        inProgressTasks={[]}
        doneTasks={[]}
        closedTasks={[]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        hasAnyTasks
        sourceId="source-b"
      />,
    );

    expect(screen.getByRole('searchbox', { name: /search beads items in the current source/i })).toHaveValue('');
    expect(screen.getByText('Second source task')).toBeInTheDocument();
  });

  it('still shows Closed by default when there are no closed items', () => {
    render(
      <BeadsBoard
        todoTasks={[makeTask('todo-1', 'Active task')]}
        inProgressTasks={[]}
        doneTasks={[]}
        closedTasks={[]}
        loading={false}
        error={null}
        onRetry={vi.fn()}
        hasAnyTasks
      />,
    );

    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hide closed column/i })).toBeInTheDocument();
  });
});
