import { useCallback, useEffect, useState } from 'react';
import { FileText, FolderPlus, RefreshCw, Trash2 } from 'lucide-react';
import { useRepoSources } from '@/hooks/useRepoSources';
import { PlansTab } from '@/features/workspace/tabs/PlansTab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PlansPanelProps {
  onOpenPath?: (path: string) => void;
  onOpenTask?: (taskId: string) => void;
  onAddToChat?: (text: string) => void;
  requestedPlanPath?: string | null;
  requestedSourceId?: string | null;
}

export function PlansPanel({ onOpenPath, onOpenTask, onAddToChat, requestedPlanPath = null, requestedSourceId = null }: PlansPanelProps) {
  const [compactReaderActive, setCompactReaderActive] = useState(false);
  const {
    sources,
    selectedSourceId,
    setSelectedSourceId,
    selectedSource,
    loadingSources,
    error,
    fetchSources,
    addSource,
    removeSource,
  } = useRepoSources();

  const [showSourceManager, setShowSourceManager] = useState(false);
  const [sourceLabel, setSourceLabel] = useState('');
  const [sourceRootPath, setSourceRootPath] = useState('');
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [sourceBusy, setSourceBusy] = useState(false);

  useEffect(() => {
    if (!requestedSourceId || requestedSourceId === selectedSourceId) return;
    if (!sources.some((source) => source.id === requestedSourceId)) return;
    setSelectedSourceId(requestedSourceId);
  }, [requestedSourceId, selectedSourceId, setSelectedSourceId, sources]);

  const handleAddSource = useCallback(async () => {
    const rootPath = sourceRootPath.trim();
    const label = sourceLabel.trim();
    if (!rootPath) {
      setSourceError('Project root path is required.');
      return;
    }

    setSourceBusy(true);
    setSourceError(null);
    try {
      await addSource({ rootPath, label: label || undefined });
      setSourceLabel('');
      setSourceRootPath('');
    } catch (nextError) {
      setSourceError(nextError instanceof Error ? nextError.message : 'Failed to add source');
    } finally {
      setSourceBusy(false);
    }
  }, [addSource, sourceLabel, sourceRootPath]);

  const handleRemoveSource = useCallback(async (sourceId: string) => {
    setSourceBusy(true);
    setSourceError(null);
    try {
      await removeSource(sourceId);
    } catch (nextError) {
      setSourceError(nextError instanceof Error ? nextError.message : 'Failed to remove source');
    } finally {
      setSourceBusy(false);
    }
  }, [removeSource]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {!compactReaderActive && (
        <div className="shrink-0 px-4 pt-3 pb-2 space-y-2 border-b border-border/40">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-sm font-bold text-foreground tracking-wide uppercase inline-flex items-center gap-2">
            <FileText size={16} />
            Plans
          </h1>
          <div className="flex-1" />
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <select
              value={selectedSourceId}
              onChange={(event) => setSelectedSourceId(event.target.value)}
              className="h-8 min-w-[170px] max-w-[300px] rounded-md border border-input bg-transparent px-2.5 text-xs text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
              aria-label="Select Plans source"
              disabled={loadingSources && sources.length === 0}
            >
              {sources.length === 0 ? (
                <option value="">No sources</option>
              ) : (
                sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label}
                  </option>
                ))
              )}
            </select>

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setSourceError(null);
                setShowSourceManager(true);
              }}
            >
              <FolderPlus size={14} />
              <span className="hidden sm:inline">Manage sources</span>
            </Button>

            <Button variant="outline" size="sm" type="button" onClick={() => void fetchSources()}>
              <RefreshCw size={14} className={loadingSources ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh sources</span>
            </Button>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {error
            ? error
            : selectedSource
              ? `Showing repo-local markdown plans under .plans/ in ${selectedSource.label}.`
              : 'Select a tracked repo source to browse plans.'}
        </div>
      </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        <PlansTab
          onOpenPath={onOpenPath}
          onOpenTask={onOpenTask}
          onAddToChat={onAddToChat}
          requestedPlanPath={requestedPlanPath}
          sourceId={selectedSourceId || undefined}
          showHeader={false}
          onCompactReaderActiveChange={setCompactReaderActive}
        />
      </div>

      <Dialog open={showSourceManager} onOpenChange={setShowSourceManager}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tracked Plans sources</DialogTitle>
            <DialogDescription>
              Reuses the same tracked repo registry as Beads so repo add/remove behavior stays consistent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current sources</div>
              <div className="max-h-[280px] overflow-auto rounded-lg border border-border/50 divide-y divide-border/40">
                {sources.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground">No tracked sources are configured yet.</div>
                ) : (
                  sources.map((source) => {
                    const isSelected = source.id === selectedSourceId;
                    return (
                      <div key={source.id} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{source.label}</span>
                            {isSelected && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">Current</span>}
                            {source.isDefault && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Default</span>}
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{source.kind === 'openclaw' ? 'OpenClaw' : 'Project'}</span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{source.isCustom ? 'Added here' : 'From env'}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{source.id}</div>
                        </div>
                        {source.isCustom ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            type="button"
                            onClick={() => void handleRemoveSource(source.id)}
                            disabled={sourceBusy}
                            aria-label={`Remove ${source.label}`}
                            title={`Remove ${source.label}`}
                          >
                            <Trash2 size={14} />
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Locked</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border/50 bg-card/40 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add tracked project</div>
              <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="plans-source-root-path">Project root path</label>
                  <Input
                    id="plans-source-root-path"
                    value={sourceRootPath}
                    onChange={(event) => setSourceRootPath(event.target.value)}
                    placeholder="/home/derrick/.openclaw/workspace/projects/gambit-openclaw-nerve"
                    disabled={sourceBusy}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground" htmlFor="plans-source-label">Label (optional)</label>
                  <Input
                    id="plans-source-label"
                    value={sourceLabel}
                    onChange={(event) => setSourceLabel(event.target.value)}
                    placeholder="Gambit OpenClaw Nerve"
                    disabled={sourceBusy}
                  />
                </div>
              </div>
              {sourceError && <div className="text-xs text-destructive">{sourceError}</div>}
              <div className="text-xs text-muted-foreground">
                Paths must point to <code>~/.openclaw</code> or a repo inside the configured projects root.
              </div>
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button type="button" onClick={() => void handleAddSource()} disabled={sourceBusy}>
              <FolderPlus size={14} />
              Add source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
