import { memo, useState, useEffect } from 'react';
import { Clock, Play, CheckCircle2, AlertCircle, XCircle, Link2, GitBranch, Tag } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanTask, TaskPriority } from './types';

/* ── Priority colors (from spec §19.4) ── */
const PRIORITY_DOT: Record<TaskPriority, string> = {
  critical: 'bg-[#ef4444]',
  high: 'bg-[#f59e0b]',
  normal: 'bg-[#3b82f6]',
  low: 'bg-[#6b7280]',
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  critical: 'Critical',
  high: 'High',
  normal: 'Normal',
  low: 'Low',
};

/* ── Run status indicators ── */
function RunBadge({ status }: { status: string }) {
  switch (status) {
    case 'running':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Live
        </span>
      );
    case 'done':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-400">
          <CheckCircle2 size={10} /> Done
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400">
          <AlertCircle size={10} /> Error
        </span>
      );
    case 'aborted':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400">
          <XCircle size={10} /> Aborted
        </span>
      );
    default:
      return null;
  }
}

interface KanbanCardProps {
  task: KanbanTask;
  onClick: (task: KanbanTask) => void;
  /** True when rendered inside DragOverlay — skips sortable hook */
  isOverlay?: boolean;
  /** Alias for isOverlay (compat with KanbanBoard) */
  isDragOverlay?: boolean;
  /** Disable sortable drag behavior while keeping the same card UI. */
  sortable?: boolean;
}

export const KanbanCard = memo(function KanbanCard({ task, onClick, isOverlay, isDragOverlay, sortable = true }: KanbanCardProps) {
  const overlay = isOverlay || isDragOverlay;
  if (overlay) {
    return <CardContent task={task} onClick={onClick} isDragging isOverlay />;
  }

  if (!sortable) {
    return <CardContent task={task} onClick={onClick} />;
  }

  return <SortableCard task={task} onClick={onClick} />;
});

/* ── Sortable wrapper (only used for in-place cards, not overlay) ── */
function SortableCard({ task, onClick }: { task: KanbanTask; onClick: (task: KanbanTask) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardContent task={task} onClick={onClick} isDragging={isDragging} />
    </div>
  );
}

function BeadsPriorityChip({ priority }: { priority: TaskPriority }) {
  const tone = priority === 'critical'
    ? 'text-red-300 border-red-500/30 bg-red-500/10'
    : priority === 'high'
      ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
      : priority === 'low'
        ? 'text-slate-300 border-slate-500/30 bg-slate-500/10'
        : 'text-blue-300 border-blue-500/30 bg-blue-500/10';

  const code = priority === 'critical' ? 'P0' : priority === 'high' ? 'P1' : priority === 'low' ? 'P3+' : 'P2';

  return (
    <span className={`inline-flex items-center rounded-sm border px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${tone}`}>
      {code}
    </span>
  );
}

function BeadsMetadataStrip({ task }: { task: KanbanTask }) {
  const metadata = task.beads;
  if (!metadata) return null;

  const visibleLabels = metadata.labels.slice(0, 2);
  const extraLabels = metadata.labels.length - visibleLabels.length;

  return (
    <>
      <div className="mt-1.5 ml-4 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="font-mono font-semibold text-[10px] text-primary/90">{metadata.issueId}</span>
        <BeadsPriorityChip priority={task.priority} />
        {metadata.issueType && (
          <span className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 font-medium uppercase tracking-wide">
            {metadata.issueType}
          </span>
        )}
        {metadata.owner && (
          <span className="truncate max-w-[120px]">@{metadata.owner}</span>
        )}
      </div>

      {(visibleLabels.length > 0 || metadata.dependencyCount > 0 || metadata.dependentCount > 0) && (
        <div className="mt-1.5 ml-4 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          {visibleLabels.map((label, idx) => (
            <span
              key={`${label}-${idx}`}
              className="inline-flex items-center gap-1 rounded-sm bg-muted/70 px-1.5 py-0.5 font-medium"
            >
              <Tag size={9} />
              {label}
            </span>
          ))}
          {extraLabels > 0 && (
            <span className="text-[10px] text-muted-foreground">+{extraLabels} label{extraLabels === 1 ? '' : 's'}</span>
          )}
          {metadata.dependencyCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px]">
              <Link2 size={9} />
              {metadata.dependencyCount} dep
            </span>
          )}
          {metadata.dependentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px]">
              <GitBranch size={9} />
              {metadata.dependentCount} blocked
            </span>
          )}
        </div>
      )}
    </>
  );
}

/* ── Visual card content (shared between sortable + overlay) ── */
function CardContent({
  task,
  onClick,
  isDragging,
  isOverlay,
}: {
  task: KanbanTask;
  onClick: (task: KanbanTask) => void;
  isDragging?: boolean;
  isOverlay?: boolean;
}) {
  const isBeadsTask = Boolean(task.beads);

  return (
    <button
      type="button"
      onClick={() => { if (!isDragging) onClick(task); }}
      className={`w-full text-left bg-card border border-border rounded-[10px] px-2.5 py-2.5 transition-all duration-[120ms] cursor-pointer group focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
        isOverlay
          ? 'shadow-[0_8px_24px_rgba(0,0,0,.35)] scale-[1.02] rotate-[1deg] border-primary/40'
          : isDragging
            ? 'opacity-30'
            : 'hover:shadow-[0_4px_14px_rgba(0,0,0,.25)]'
      }`}
    >
      {/* Row 1: priority dot + title */}
      <div className="flex items-start gap-2">
        <span
          className={`mt-1 shrink-0 w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority]}`}
          title={PRIORITY_LABEL[task.priority]}
          aria-label={`Priority: ${PRIORITY_LABEL[task.priority]}`}
          role="img"
        />
        <span className="text-[13px] font-semibold leading-[18px] text-foreground line-clamp-2 min-w-0">
          {task.title}
        </span>
      </div>

      {/* Row 2: description preview */}
      {task.description && (
        <p className="mt-1 ml-4 text-[11px] leading-[15px] text-muted-foreground line-clamp-1">
          {task.description}
        </p>
      )}

      {isBeadsTask ? (
        <BeadsMetadataStrip task={task} />
      ) : (
        <>
          {/* Row 3: labels */}
          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5 ml-4">
              {task.labels.slice(0, 3).map((label, idx) => (
                <span
                  key={`${label}-${idx}`}
                  className="text-[10px] font-medium leading-none bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm"
                >
                  {label}
                </span>
              ))}
              {task.labels.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{task.labels.length - 3}
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* Meta line (assignee, run status, time) */}
      <div className="flex items-center gap-2 mt-1.5 ml-4 text-[11px] text-muted-foreground">
        {!isBeadsTask && task.assignee && (
          <span className="truncate max-w-[100px]">
            {task.assignee === 'operator' ? 'Operator' : task.assignee.replace('agent:', '@')}
          </span>
        )}

        {task.run && <RunBadge status={task.run.status} />}

        {task.run?.status === 'running' && task.run.startedAt && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-cyan-400/80">
            <Clock size={9} />
            <ElapsedTime since={task.run.startedAt} />
          </span>
        )}

        {task.dueAt && (
          <span className="inline-flex items-center gap-0.5 ml-auto">
            <Play size={9} className="rotate-90" />
            {new Date(task.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </button>
  );
}

/* ── Tiny elapsed-time component (ticks every second) ── */
function ElapsedTime({ since }: { since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return <span>{m}:{s.toString().padStart(2, '0')}</span>;
}
