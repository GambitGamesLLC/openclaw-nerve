import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowUpRight, FileText, FolderArchive, RefreshCw, Search } from 'lucide-react';
import { MarkdownRenderer } from '@/features/markdown/MarkdownRenderer';
import { usePlans, type PlanSummary } from '../hooks/usePlans';

interface PlansTabProps {
  onOpenPath?: (path: string) => void;
  onOpenTask?: (taskId: string) => void;
  requestedPlanPath?: string | null;
}

function formatRelativeTime(value: number): string {
  const diffMs = Date.now() - value;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) return `${Math.max(1, Math.round(diffMs / minute))}m ago`;
  if (diffMs < day) return `${Math.round(diffMs / hour)}h ago`;
  return `${Math.round(diffMs / day)}d ago`;
}

function stripFrontmatter(content: string): string {
  if (!content.startsWith('---\n')) return content;
  const end = content.indexOf('\n---\n', 4);
  return end === -1 ? content : content.slice(end + 5);
}

function PlanBadge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'muted' | 'archived' }) {
  const className = tone === 'archived'
    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
    : tone === 'muted'
      ? 'bg-muted/40 text-muted-foreground border-border/50'
      : 'bg-purple/10 text-purple border-purple/20';

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${className}`}>
      {children}
    </span>
  );
}

function PlanRow({
  plan,
  selected,
  onSelect,
}: {
  plan: PlanSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-md border px-3 py-2 text-left transition-colors cursor-pointer ${
        selected
          ? 'border-purple/40 bg-purple/10'
          : 'border-border/40 bg-muted/10 hover:bg-muted/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-foreground">{plan.title}</div>
          <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{plan.path}</div>
        </div>
        <div className="shrink-0 text-[10px] text-muted-foreground">{formatRelativeTime(plan.updatedAt)}</div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {plan.status && <PlanBadge>{plan.status}</PlanBadge>}
        {plan.archived && <PlanBadge tone="archived">Archived</PlanBadge>}
        {plan.beadIds.length > 0 && <PlanBadge tone="muted">{plan.beadIds.length} bead{plan.beadIds.length === 1 ? '' : 's'}</PlanBadge>}
      </div>
      <p className="mt-2 max-h-[3.3rem] overflow-hidden text-[11px] leading-5 text-muted-foreground">{plan.preview}</p>
    </button>
  );
}

export function PlansTab({ onOpenPath, onOpenTask, requestedPlanPath }: PlansTabProps) {
  const { plans, counts, selectedPath, selectedPlan, isLoading, isPlanLoading, error, refresh, loadPlan } = usePlans();
  const [search, setSearch] = useState('');

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return plans;

    return plans.filter((plan) => {
      const haystack = [
        plan.title,
        plan.path,
        plan.status ?? '',
        plan.planId ?? '',
        plan.preview,
        ...plan.beadIds,
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [plans, search]);

  const activePlans = filteredPlans.filter(plan => !plan.archived);
  const archivedPlans = filteredPlans.filter(plan => plan.archived);
  const renderedContent = selectedPlan ? stripFrontmatter(selectedPlan.content) : '';

  useEffect(() => {
    if (!requestedPlanPath) return;
    if (!plans.some((plan) => plan.path === requestedPlanPath)) return;
    if (selectedPath === requestedPlanPath) return;
    void loadPlan(requestedPlanPath);
  }, [requestedPlanPath, plans, selectedPath, loadPlan]);


  function handleOpenPlanReference(path: string) {
    if (plans.some((plan) => plan.path === path)) {
      void loadPlan(path);
      return;
    }
    onOpenPath?.(path);
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/90">
            <FileText size={13} />
            Plans
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">
            {counts.active} active • {counts.archived} archived
          </div>
        </div>
        <button
          onClick={() => { void refresh(); }}
          className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
        >
          <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="px-3 py-2 border-b border-border/40">
        <label className="relative block">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search plans, paths, or bead IDs"
            className="w-full rounded-md border border-border/50 bg-background px-8 py-2 text-xs outline-none focus:border-purple/40"
          />
        </label>
      </div>

      <div className="grid flex-1 min-h-0 grid-rows-[minmax(220px,38%)_minmax(0,1fr)]">
        <div className="overflow-y-auto border-b border-border/40 px-2 py-2 space-y-3">
          {error && !plans.length && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {!isLoading && filteredPlans.length === 0 && (
            <div className="px-2 py-6 text-center text-xs text-muted-foreground">
              {plans.length === 0 ? 'No repo-local plans found under .plans/' : 'No plans match this search.'}
            </div>
          )}

          {activePlans.length > 0 && (
            <section>
              <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active</div>
              <div className="space-y-2">
                {activePlans.map((plan) => (
                  <PlanRow key={plan.path} plan={plan} selected={plan.path === selectedPath} onSelect={() => { void loadPlan(plan.path); }} />
                ))}
              </div>
            </section>
          )}

          {archivedPlans.length > 0 && (
            <section>
              <div className="flex items-center gap-1 px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <FolderArchive size={11} />
                Archived
              </div>
              <div className="space-y-2">
                {archivedPlans.map((plan) => (
                  <PlanRow key={plan.path} plan={plan} selected={plan.path === selectedPath} onSelect={() => { void loadPlan(plan.path); }} />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="min-h-0 overflow-y-auto">
          {!selectedPlan && !isPlanLoading && (
            <div className="px-4 py-6 text-xs text-muted-foreground">Select a plan to preview it.</div>
          )}

          {selectedPlan && (
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground leading-tight">{selectedPlan.title}</h3>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground break-all">{selectedPlan.path}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {selectedPlan.status && <PlanBadge>{selectedPlan.status}</PlanBadge>}
                    {selectedPlan.archived && <PlanBadge tone="archived">Archived</PlanBadge>}
                    {selectedPlan.planId && <PlanBadge tone="muted">{selectedPlan.planId}</PlanBadge>}
                    {selectedPlan.beadIds.map((beadId) => (
                      onOpenTask ? (
                        <button
                          key={beadId}
                          type="button"
                          className="inline-flex items-center rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground cursor-pointer"
                          onClick={() => onOpenTask(beadId)}
                          title={`Open ${beadId} in the board`}
                        >
                          {beadId}
                        </button>
                      ) : (
                        <PlanBadge key={beadId} tone="muted">{beadId}</PlanBadge>
                      )
                    ))}
                  </div>
                </div>
                {onOpenPath && (
                  <button
                    onClick={() => onOpenPath(selectedPlan.path)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-purple/30 bg-purple/10 px-2 py-1 text-[11px] text-purple hover:bg-purple/15 transition-colors cursor-pointer"
                    title="Open this path inside Nerve"
                  >
                    Open in Nerve
                    <ArrowUpRight size={11} />
                  </button>
                )}
              </div>

              {isPlanLoading ? (
                <div className="py-6 text-xs text-muted-foreground">Loading plan…</div>
              ) : (
                <MarkdownRenderer
                  content={renderedContent}
                  className="pt-3 text-sm"
                  plans={plans}
                  onOpenPlanReference={handleOpenPlanReference}
                  onOpenPath={onOpenPath}
                  onOpenTask={onOpenTask}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
