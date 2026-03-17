import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, FileText, FolderArchive, RefreshCw, Search, X } from 'lucide-react';
import { MarkdownRenderer } from '@/features/markdown/MarkdownRenderer';
import { formatPlanAddToChat } from '@/features/chat/addToChat';
import { usePlans, type PlanSummary } from '../hooks/usePlans';

interface PlansTabProps {
  onOpenPath?: (path: string) => void;
  onOpenTask?: (taskId: string) => void;
  onAddToChat?: (text: string) => void;
  requestedPlanPath?: string | null;
  sourceId?: string;
  showHeader?: boolean;
  onCompactReaderActiveChange?: (active: boolean) => void;
  desktopReaderMode?: 'focused' | 'drawer';
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

interface LinkedBeadContext {
  beadId: string;
  lineNumber: number | null;
  snippet: string | null;
}

function normalizeContextLine(rawLine: string): string {
  return rawLine
    .replace(/^\s*[-*+]\s+/, '')
    .replace(/^\s*\d+\.\s+/, '')
    .replace(/^\s*#{1,6}\s+/, '')
    .replace(/^\*\*[^*]+:\*\*\s*/, '')
    .trim();
}

function buildLinkedBeadContext(content: string, beadIds: string[]): LinkedBeadContext[] {
  const lines = stripFrontmatter(content).split('\n');

  return beadIds.map((beadId) => {
    const beadIdBlockIndex = lines.findIndex((line) => {
      if (!line.includes('**Bead ID:**')) return false;
      return line.includes(beadId);
    });

    const fallbackIndex = lines.findIndex((line) => line.includes(beadId));
    const anchorIndex = beadIdBlockIndex >= 0 ? beadIdBlockIndex : fallbackIndex;

    if (anchorIndex === -1) {
      return {
        beadId,
        lineNumber: null,
        snippet: null,
      };
    }

    const sectionStartIndex = (() => {
      for (let index = anchorIndex; index >= 0; index -= 1) {
        if (/^###\s+/.test(lines[index] ?? '')) return index;
      }
      return -1;
    })();

    const sectionEndIndex = (() => {
      for (let index = anchorIndex + 1; index < lines.length; index += 1) {
        if (/^###\s+/.test(lines[index] ?? '')) return index;
      }
      return lines.length;
    })();

    const snippetLineIndex = (() => {
      if (sectionStartIndex >= 0) return sectionStartIndex;

      for (let index = anchorIndex + 1; index < sectionEndIndex; index += 1) {
        if (/^\*\*Prompt:\*\*/.test(lines[index] ?? '')) return index;
      }

      return anchorIndex;
    })();

    const normalized = normalizeContextLine(lines[snippetLineIndex] ?? '');
    const snippet = normalized.length > 120 ? `${normalized.slice(0, 117)}…` : normalized;

    return {
      beadId,
      lineNumber: snippetLineIndex + 1,
      snippet: snippet || null,
    };
  });
}

function isCompactPlansViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768 || window.innerHeight <= 520;
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

interface PlanReaderContentProps {
  compactViewport: boolean;
  selectedPlan: NonNullable<ReturnType<typeof usePlans>['selectedPlan']>;
  sourceLabel?: string | null;
  plans: PlanSummary[];
  renderedContent: string;
  linkedBeadContext: LinkedBeadContext[];
  isPlanLoading: boolean;
  onOpenTask?: (taskId: string) => void;
  onAddToChat?: (text: string) => void;
  onOpenPath?: (path: string) => void;
  onOpenPlanReference: (path: string) => void;
  onExitReader: () => void;
  desktopReaderMode: 'focused' | 'drawer';
}

function PlanReaderContent({
  compactViewport,
  selectedPlan,
  sourceLabel,
  plans,
  renderedContent,
  linkedBeadContext,
  isPlanLoading,
  onOpenTask,
  onAddToChat,
  onOpenPath,
  onOpenPlanReference,
  onExitReader,
  desktopReaderMode,
}: PlanReaderContentProps) {
  const isDrawerDesktop = !compactViewport && desktopReaderMode === 'drawer';
  const exitLabel = isDrawerDesktop ? 'Close plan drawer' : 'Back to plans list';
  const exitButtonLabel = isDrawerDesktop ? 'Close' : 'Back to plans';

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 mb-3 border-b border-border/30 bg-background px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onExitReader}
            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/90 px-2.5 py-1 text-[11px] text-muted-foreground shadow-sm hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
            aria-label={exitLabel}
          >
            {isDrawerDesktop ? <X size={11} /> : <ArrowLeft size={11} />}
            {exitButtonLabel}
          </button>

          {onAddToChat && (
            <button
              type="button"
              onClick={() => onAddToChat(formatPlanAddToChat({
                source: sourceLabel ?? null,
                title: selectedPlan.title,
                path: selectedPlan.path,
              }))}
              className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-purple/30 bg-purple/10 px-2 py-1 text-[11px] text-purple hover:bg-purple/15 transition-colors cursor-pointer"
              title="Add this plan to the main chat composer"
            >
              Add to Chat
              <ArrowUpRight size={11} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground leading-tight">{selectedPlan.title}</h3>
          <div className="mt-1 font-mono text-[10px] text-muted-foreground break-all">{selectedPlan.path}</div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {selectedPlan.status && <PlanBadge>{selectedPlan.status}</PlanBadge>}
            {selectedPlan.archived && <PlanBadge tone="archived">Archived</PlanBadge>}
            {selectedPlan.planId && <PlanBadge tone="muted">{selectedPlan.planId}</PlanBadge>}
            {selectedPlan.beadIds.length > 0 && (
              <PlanBadge tone="muted">{selectedPlan.beadIds.length} linked bead{selectedPlan.beadIds.length === 1 ? '' : 's'}</PlanBadge>
            )}
          </div>

          {linkedBeadContext.length > 0 && (
            <div className="mt-2 space-y-1.5 rounded-md border border-border/40 bg-muted/10 px-2 py-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Linked tasks</div>
              <div className="space-y-1.5">
                {linkedBeadContext.map((entry) => (
                  <div key={entry.beadId} className="flex items-start gap-2">
                    {onOpenTask ? (
                      <button
                        type="button"
                        className="inline-flex shrink-0 items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-primary hover:bg-primary/15 cursor-pointer"
                        onClick={() => onOpenTask(entry.beadId)}
                        title={`Open ${entry.beadId} in the board`}
                      >
                        {entry.beadId}
                      </button>
                    ) : (
                      <PlanBadge tone="muted">{entry.beadId}</PlanBadge>
                    )}
                    <div className="min-w-0 pt-0.5 text-[11px] leading-4 text-muted-foreground">
                      {entry.snippet ? (
                        <span className="block truncate" title={entry.snippet}>
                          {entry.snippet}
                          {entry.lineNumber ? ` (line ${entry.lineNumber})` : ''}
                        </span>
                      ) : (
                        <span className="block italic">Open task from linked bead ID</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isPlanLoading ? (
        <div className="py-6 text-xs text-muted-foreground">Loading plan…</div>
      ) : (
        <MarkdownRenderer
          content={renderedContent}
          className="pt-3 text-sm"
          plans={plans}
          onOpenPlanReference={onOpenPlanReference}
          onOpenPath={onOpenPath}
          onOpenTask={onOpenTask}
        />
      )}
    </>
  );
}

export function PlansTab({
  onOpenPath,
  onOpenTask,
  onAddToChat,
  requestedPlanPath,
  sourceId,
  showHeader = true,
  onCompactReaderActiveChange,
  desktopReaderMode = 'focused',
}: PlansTabProps) {
  const { plans, counts, source, selectedPath, selectedPlan, isLoading, isPlanLoading, error, refresh, loadPlan } = usePlans(sourceId);
  const [search, setSearch] = useState('');
  const [compactViewport, setCompactViewport] = useState(isCompactPlansViewport);
  const [readerVisible, setReaderVisible] = useState(false);
  const handledRequestedSelectionRef = useRef<string | null>(null);

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
  const linkedBeadContext = useMemo(() => {
    if (!selectedPlan || selectedPlan.beadIds.length === 0) return [];
    return buildLinkedBeadContext(selectedPlan.content, selectedPlan.beadIds);
  }, [selectedPlan]);

  useEffect(() => {
    setSearch('');
    setReaderVisible(false);
  }, [sourceId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewport = () => setCompactViewport(isCompactPlansViewport());
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    if (!requestedPlanPath) {
      handledRequestedSelectionRef.current = null;
      return;
    }

    const requestedSelectionKey = `${sourceId ?? ''}::${requestedPlanPath}`;
    if (handledRequestedSelectionRef.current === requestedSelectionKey) return;
    if (!plans.some((plan) => plan.path === requestedPlanPath)) return;

    handledRequestedSelectionRef.current = requestedSelectionKey;
    setReaderVisible(true);
    if (selectedPath !== requestedPlanPath) {
      void loadPlan(requestedPlanPath);
    }
  }, [requestedPlanPath, plans, selectedPath, loadPlan, sourceId]);

  const focusedReaderActive = readerVisible && (compactViewport || desktopReaderMode === 'focused');
  const drawerReaderActive = readerVisible && !compactViewport && desktopReaderMode === 'drawer';
  const showPlansChrome = !focusedReaderActive;
  const showPlanList = !focusedReaderActive;
  const showPlanReader = focusedReaderActive;

  useEffect(() => {
    onCompactReaderActiveChange?.(focusedReaderActive);
    return () => {
      onCompactReaderActiveChange?.(false);
    };
  }, [focusedReaderActive, onCompactReaderActiveChange]);

  function handleSelectPlan(path: string) {
    setReaderVisible(true);
    void loadPlan(path);
  }

  function handleCloseReader() {
    setReaderVisible(false);
  }

  function handleOpenPlanReference(path: string) {
    if (plans.some((plan) => plan.path === path)) {
      setReaderVisible(true);
      void loadPlan(path);
      return;
    }
    onOpenPath?.(path);
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {showPlansChrome && showHeader && (
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
      )}

      {showPlansChrome && (
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
      )}

      <div className="flex-1 min-h-0 relative flex flex-col">
        {showPlanList && (
          <div className={`overflow-y-auto px-2 py-2 space-y-3 min-h-0 ${compactViewport ? '' : 'border-b border-border/40'}`}>
            {error && !plans.length && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            {!isLoading && filteredPlans.length === 0 && (
              <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                {plans.length === 0 ? 'No repo-local plans found under .plans/ for this source.' : 'No plans match this search.'}
              </div>
            )}

            {activePlans.length > 0 && (
              <section>
                <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active</div>
                <div className="space-y-2">
                  {activePlans.map((plan) => (
                    <PlanRow
                      key={plan.path}
                      plan={plan}
                      selected={plan.path === selectedPath && readerVisible}
                      onSelect={() => handleSelectPlan(plan.path)}
                    />
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
                    <PlanRow
                      key={plan.path}
                      plan={plan}
                      selected={plan.path === selectedPath && readerVisible}
                      onSelect={() => handleSelectPlan(plan.path)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {showPlanReader && (
          <div className="min-h-0 overflow-y-auto">
            {!selectedPlan && !isPlanLoading && (
              <div className="px-4 py-6 text-xs text-muted-foreground">Select a plan to preview it.</div>
            )}

            {(selectedPlan || isPlanLoading) && (
              <div className="px-4 pb-3 pt-0">
                {selectedPlan && (
                  <PlanReaderContent
                    compactViewport={compactViewport}
                    selectedPlan={selectedPlan}
                    sourceLabel={source?.label ?? sourceId ?? null}
                    plans={plans}
                    renderedContent={renderedContent}
                    linkedBeadContext={linkedBeadContext}
                    isPlanLoading={isPlanLoading}
                    onOpenTask={onOpenTask}
                    onAddToChat={onAddToChat}
                    onOpenPath={onOpenPath}
                    onOpenPlanReference={handleOpenPlanReference}
                    onExitReader={handleCloseReader}
                    desktopReaderMode={desktopReaderMode}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {drawerReaderActive && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-200"
              onClick={handleCloseReader}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Plan details"
              className="fixed top-0 right-0 z-50 h-full w-[min(760px,100%)] max-w-full border-l border-border bg-background shadow-2xl"
            >
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3 pt-0">
                  {!selectedPlan && !isPlanLoading && (
                    <div className="py-6 text-xs text-muted-foreground">Select a plan to preview it.</div>
                  )}

                  {selectedPlan && (
                    <PlanReaderContent
                      compactViewport={compactViewport}
                      selectedPlan={selectedPlan}
                      sourceLabel={source?.label ?? sourceId ?? null}
                      plans={plans}
                      renderedContent={renderedContent}
                      linkedBeadContext={linkedBeadContext}
                      isPlanLoading={isPlanLoading}
                      onOpenTask={onOpenTask}
                      onAddToChat={onAddToChat}
                      onOpenPath={onOpenPath}
                      onOpenPlanReference={handleOpenPlanReference}
                      onExitReader={handleCloseReader}
                      desktopReaderMode={desktopReaderMode}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
