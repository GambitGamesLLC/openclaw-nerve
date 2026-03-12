import type { ReactNode } from 'react';
import { X, Clock, Link2, GitBranch, MessageSquare, Tag, User, CircleDot } from 'lucide-react';
import type { KanbanTask } from './types';

interface BeadsDetailDrawerProps {
  task: KanbanTask | null;
  sourceLabel?: string;
  onClose: () => void;
}

function formatDateTime(value?: number): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function MetadataRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border/40 bg-muted/20 px-3 py-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-xs text-foreground break-words">{value}</div>
      </div>
    </div>
  );
}

export function BeadsDetailDrawer({ task, sourceLabel, onClose }: BeadsDetailDrawerProps) {
  const metadata = task?.beads;
  const isOpen = task !== null && metadata !== undefined;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Beads issue details"
        className={`fixed top-0 right-0 z-50 h-full w-[460px] max-w-full bg-background border-l border-border shadow-2xl flex flex-col transition-transform duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {task && metadata && (
          <>
            <div className="flex items-center justify-between h-[52px] px-3.5 border-b border-border shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center rounded-sm border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-primary">
                  {metadata.issueId}
                </span>
                {metadata.issueType && (
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {metadata.issueType}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close drawer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2 text-[11px] text-muted-foreground">
                  {sourceLabel && <span>Source: {sourceLabel}</span>}
                  <span>•</span>
                  <span>Raw status: {metadata.rawStatus}</span>
                </div>
                <h2 className="text-[18px] font-bold text-foreground leading-tight">{task.title}</h2>
                {task.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <MetadataRow icon={<CircleDot size={12} />} label="Priority" value={task.priority} />
                <MetadataRow icon={<User size={12} />} label="Owner" value={metadata.owner ? `@${metadata.owner}` : '—'} />
                <MetadataRow icon={<Link2 size={12} />} label="Dependencies" value={metadata.dependencyCount} />
                <MetadataRow icon={<GitBranch size={12} />} label="Dependents" value={metadata.dependentCount} />
                <MetadataRow icon={<MessageSquare size={12} />} label="Comments" value={metadata.commentCount} />
                <MetadataRow icon={<Tag size={12} />} label="Labels" value={metadata.labels.length > 0 ? metadata.labels.join(', ') : '—'} />
              </div>

              <div className="border-t border-border/50 pt-3 space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h4>
                <MetadataRow icon={<Clock size={12} />} label="Created" value={formatDateTime(metadata.createdAt)} />
                <MetadataRow icon={<Clock size={12} />} label="Updated" value={formatDateTime(metadata.updatedAt)} />
                <MetadataRow icon={<Clock size={12} />} label="Closed" value={formatDateTime(metadata.closedAt)} />
              </div>

              {task.result && (
                <div className="border-t border-border/50 pt-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Result</h4>
                  <div className="text-xs text-foreground whitespace-pre-wrap bg-muted/30 rounded-md p-2">
                    {task.result}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
