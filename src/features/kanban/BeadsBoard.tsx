import { memo } from 'react';
import { Database, Inbox } from 'lucide-react';
import type { KanbanTask } from './types';
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

const COLUMN_CONFIG = [
  { key: 'todo', label: 'To Do', accent: 'text-blue-400' },
  { key: 'in-progress', label: 'In Progress', accent: 'text-cyan-400' },
  { key: 'done', label: 'Done', accent: 'text-green-400' },
  { key: 'closed', label: 'Closed', accent: 'text-slate-300' },
] as const;

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

function BeadsColumn({
  label,
  accent,
  tasks,
  onCardClick,
}: {
  label: string;
  accent: string;
  tasks: KanbanTask[];
  onCardClick: (task: KanbanTask) => void;
}) {
  return (
    <div className="flex flex-col min-w-[280px] w-[320px] max-w-[360px] h-full shrink-0 bg-background/50 rounded-lg border border-border/40">
      <div className="sticky top-0 z-10 flex items-center justify-between h-10 px-3 bg-background/80 backdrop-blur-sm border-b border-border/40 rounded-t-lg">
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
    return (
      <div className="h-full overflow-x-auto">
        <div className="flex gap-3 p-0 min-w-min h-full">
          {COLUMN_CONFIG.map((column) => <SkeletonColumn key={column.key} />)}
        </div>
      </div>
    );
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

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-3 p-0 min-w-min h-full">
        <BeadsColumn label="To Do" accent="text-blue-400" tasks={todoTasks} onCardClick={onCardClick} />
        <BeadsColumn label="In Progress" accent="text-cyan-400" tasks={inProgressTasks} onCardClick={onCardClick} />
        <BeadsColumn label="Done" accent="text-green-400" tasks={doneTasks} onCardClick={onCardClick} />
        <BeadsColumn label="Closed" accent="text-slate-300" tasks={closedTasks} onCardClick={onCardClick} />
      </div>
    </div>
  );
});
