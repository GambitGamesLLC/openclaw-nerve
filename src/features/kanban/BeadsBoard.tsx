import { memo, useEffect, useRef, useState } from 'react';
import { Database, Eye, EyeOff, Inbox, LoaderCircle } from 'lucide-react';
import type { KanbanTask } from './types';
import type { BeadsBoardColumnKey } from './beads';
import { KanbanCard } from './KanbanCard';

interface BeadsBoardProps {
  todoTasks: KanbanTask[];
  inProgressTasks: KanbanTask[];
  doneTasks: KanbanTask[];
  closedTasks: KanbanTask[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  hasAnyTasks: boolean;
  sourceLabel?: string;
  onCardClick?: (task: KanbanTask) => void;
}

type ColumnVisibility = Record<BeadsBoardColumnKey, boolean>;

const COLUMN_VISIBILITY_STORAGE_KEY = 'nerve:beadsBoardColumnVisibility';

const COLUMN_CONFIG: Array<{ key: BeadsBoardColumnKey; label: string; accent: string; tone?: 'default' | 'muted' }> = [
  { key: 'todo', label: 'To Do', accent: 'text-blue-400' },
  { key: 'in_progress', label: 'In Progress', accent: 'text-cyan-400' },
  { key: 'done', label: 'Done', accent: 'text-green-400' },
  { key: 'closed', label: 'Closed', accent: 'text-slate-300', tone: 'muted' },
];

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  todo: true,
  in_progress: true,
  done: true,
  closed: true,
};

function readPersistedColumnVisibility(): Partial<ColumnVisibility> | null {
  try {
    const raw = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      todo: typeof parsed.todo === 'boolean' ? parsed.todo : undefined,
      in_progress: typeof parsed.in_progress === 'boolean' ? parsed.in_progress : undefined,
      done: typeof parsed.done === 'boolean' ? parsed.done : undefined,
      closed: typeof parsed.closed === 'boolean' ? parsed.closed : undefined,
    };
  } catch {
    return null;
  }
}

function mergeColumnVisibility(defaults: ColumnVisibility, saved: Partial<ColumnVisibility> | null): ColumnVisibility {
  return {
    todo: saved?.todo ?? defaults.todo,
    in_progress: saved?.in_progress ?? defaults.in_progress,
    done: saved?.done ?? defaults.done,
    closed: saved?.closed ?? defaults.closed,
  };
}

function buildDefaultColumnVisibility(closedCount: number): ColumnVisibility {
  return {
    ...DEFAULT_COLUMN_VISIBILITY,
    closed: closedCount === 0,
  };
}

function SkeletonColumn() {
  return (
    <div className="flex flex-col min-w-[280px] w-[320px] max-w-[360px] h-full shrink-0 bg-background/50 rounded-lg border border-border/40">
      <div className="h-10 px-3 flex items-center border-b border-border/40">
        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
      </div>
      <div className="p-2 flex flex-col gap-2">
        {[86, 62, 110].map((h, i) => (
          <div
            key={i}
            className="rounded-[10px] bg-muted/50 animate-pulse"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
    </div>
  );
}

function BeadsLoadingState({ sourceLabel }: { sourceLabel?: string }) {
  return (
    <div className="relative h-full overflow-hidden rounded-lg border border-border/40 bg-background/30">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 to-background/60" />
      <div className="absolute inset-x-0 top-0 z-10 flex justify-center p-4">
        <div
          className="inline-flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-background/90 px-4 py-3 text-center shadow-sm backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle size={20} className="animate-spin text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">Loading Beads board…</p>
            <p className="text-[11px] text-muted-foreground">Fetching the latest issues and column counts.</p>
            {sourceLabel && (
              <p className="mt-1 text-[11px] text-muted-foreground/80">Source: {sourceLabel}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-3 p-3 min-w-min h-full opacity-90">
        {COLUMN_CONFIG.map((column) => <SkeletonColumn key={column.key} />)}
      </div>
    </div>
  );
}

function BeadsColumn({
  label,
  accent,
  tasks,
  onCardClick,
  tone = 'default',
}: {
  label: string;
  accent: string;
  tasks: KanbanTask[];
  onCardClick: (task: KanbanTask) => void;
  tone?: 'default' | 'muted';
}) {
  const isMuted = tone === 'muted';

  return (
    <div className={`flex flex-col min-w-[280px] w-[320px] max-w-[360px] h-full shrink-0 rounded-lg border ${
      isMuted ? 'bg-muted/20 border-border/30 opacity-90' : 'bg-background/50 border-border/40'
    }`}>
      <div className={`sticky top-0 z-10 flex items-center justify-between h-10 px-3 backdrop-blur-sm border-b rounded-t-lg ${
        isMuted ? 'bg-muted/25 border-border/30' : 'bg-background/80 border-border/40'
      }`}>
        <span className={`text-xs font-bold uppercase tracking-wider ${accent}`}>
          {label}
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm tabular-nums">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 min-h-[120px]">
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-muted-foreground/60 select-none">
            <Inbox size={20} className="mb-1.5" />
            <span className="text-[11px]">No items</span>
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onClick={onCardClick} sortable={false} />
          ))
        )}
      </div>
    </div>
  );
}

export const BeadsBoard = memo(function BeadsBoard({
  todoTasks,
  inProgressTasks,
  doneTasks,
  closedTasks,
  loading,
  error,
  onRetry,
  hasAnyTasks,
  sourceLabel,
  onCardClick = () => {},
}: BeadsBoardProps) {
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(DEFAULT_COLUMN_VISIBILITY);
  const initializedColumnVisibilityRef = useRef(false);

  useEffect(() => {
    if (initializedColumnVisibilityRef.current) return;
    if (loading || error || !hasAnyTasks) return;

    const defaults = buildDefaultColumnVisibility(closedTasks.length);
    const saved = readPersistedColumnVisibility();
    setColumnVisibility(mergeColumnVisibility(defaults, saved));
    initializedColumnVisibilityRef.current = true;
  }, [closedTasks.length, error, hasAnyTasks, loading]);

  useEffect(() => {
    if (!initializedColumnVisibilityRef.current) return;

    try {
      localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(columnVisibility));
    } catch {
      // Ignore localStorage write failures.
    }
  }, [columnVisibility]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-[420px] text-center">
          <p className="text-sm text-destructive font-semibold mb-2">Couldn't load Beads board</p>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <button
            onClick={onRetry}
            className="h-[30px] px-4 text-xs font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <BeadsLoadingState sourceLabel={sourceLabel} />;
  }

  if (!hasAnyTasks) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-[440px] text-center select-none">
          <Database size={28} className="mx-auto mb-3 text-primary opacity-60" />
          <h3 className="text-[16px] font-bold text-foreground mb-1.5">No Beads issues in this source</h3>
          <p className="text-[13px] text-muted-foreground mb-2">
            Switch sources or add Beads tasks in the selected repo to populate the board.
          </p>
          {sourceLabel && (
            <p className="text-[11px] text-muted-foreground/80">Current source: {sourceLabel}</p>
          )}
        </div>
      </div>
    );
  }

  const tasksByColumn: Record<BeadsBoardColumnKey, KanbanTask[]> = {
    todo: todoTasks,
    in_progress: inProgressTasks,
    done: doneTasks,
    closed: closedTasks,
  };

  const visibleColumns = COLUMN_CONFIG.filter((column) => columnVisibility[column.key]);
  const hiddenColumns = COLUMN_CONFIG.filter((column) => !columnVisibility[column.key]);

  return (
    <div className="h-full overflow-x-auto">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {COLUMN_CONFIG.map((column) => {
            const visible = columnVisibility[column.key];
            const count = tasksByColumn[column.key].length;

            return (
              <button
                key={column.key}
                type="button"
                onClick={() => setColumnVisibility((current) => ({
                  ...current,
                  [column.key]: !current[column.key],
                }))}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer ${
                  visible
                    ? 'border-border/60 bg-background/70 text-foreground hover:bg-background'
                    : 'border-border/40 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                aria-pressed={visible}
                aria-label={`${visible ? 'Hide' : 'Show'} ${column.label} column (${count} items)`}
              >
                {visible ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>{visible ? 'Hide' : 'Show'} {column.label}</span>
                <span className="rounded-sm bg-muted px-1.5 py-0.5 tabular-nums text-[10px] text-foreground/80">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {hiddenColumns.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Hidden: {hiddenColumns.map((column) => column.label).join(', ')}
          </p>
        )}
      </div>

      {visibleColumns.length === 0 ? (
        <div className="flex h-[calc(100%-2.5rem)] items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/10 px-6 text-center">
          <div>
            <p className="text-sm font-semibold text-foreground">All Beads columns are hidden</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use the column controls above to bring any lane back into view.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 p-0 min-w-min h-[calc(100%-2.5rem)]">
          {visibleColumns.map((column) => (
            <BeadsColumn
              key={column.key}
              label={column.label}
              accent={column.accent}
              tone={column.tone}
              tasks={tasksByColumn[column.key]}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
});
