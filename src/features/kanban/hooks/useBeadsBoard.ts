import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BeadsBoardColumnKey, BeadsBoardDto, BeadsSourceDto, BeadsSourcesResponse } from '../beads';
import { normalizeBeadsBoard } from '../beads';

export function useBeadsBoard() {
  const [sources, setSources] = useState<BeadsSourceDto[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [board, setBoard] = useState<BeadsBoardDto | null>(null);
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sourcesAbortRef = useRef<AbortController | null>(null);
  const boardAbortRef = useRef<AbortController | null>(null);
  const boardRequestSourceRef = useRef<string | null>(null);

  const fetchSources = useCallback(async () => {
    sourcesAbortRef.current?.abort();
    const controller = new AbortController();
    sourcesAbortRef.current = controller;

    setLoadingSources(true);
    setError(null);
    try {
      const res = await fetch('/api/beads/sources', { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: BeadsSourcesResponse = await res.json();
      setSources(data.sources);

      const nextSourceId = data.lastSourceId
        || data.defaultSourceId
        || data.sources.find((source) => source.isDefault)?.id
        || data.sources[0]?.id
        || '';

      setSelectedSourceId((current) => {
        if (current && data.sources.some((source) => source.id === current)) return current;
        return nextSourceId;
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load Beads sources');
    } finally {
      setLoadingSources(false);
    }
  }, []);

  const fetchBoard = useCallback(async (sourceId?: string, { silent = false }: { silent?: boolean } = {}) => {
    const resolvedSourceId = sourceId ?? selectedSourceId;
    if (!resolvedSourceId) {
      boardAbortRef.current?.abort();
      boardAbortRef.current = null;
      boardRequestSourceRef.current = null;
      setBoard(null);
      setLoadingBoard(false);
      return;
    }

    const hasInFlightRequest = Boolean(boardAbortRef.current && !boardAbortRef.current.signal.aborted);
    const isSameSourceRequest = boardRequestSourceRef.current === resolvedSourceId;

    if (silent && hasInFlightRequest && isSameSourceRequest) {
      return;
    }

    boardAbortRef.current?.abort();
    const controller = new AbortController();
    boardAbortRef.current = controller;
    boardRequestSourceRef.current = resolvedSourceId;

    if (!silent) {
      setLoadingBoard(true);
      setError(null);
    }

    try {
      const qs = new URLSearchParams({ sourceId: resolvedSourceId });
      const res = await fetch(`/api/beads/board?${qs.toString()}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: BeadsBoardDto = await res.json();
      setBoard(data);
      if (!silent) setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!silent) setError(err instanceof Error ? err.message : 'Failed to load Beads board');
    } finally {
      if (boardAbortRef.current === controller) {
        boardAbortRef.current = null;
        boardRequestSourceRef.current = null;
      }
      if (!silent) setLoadingBoard(false);
    }
  }, [selectedSourceId]);

  const addSource = useCallback(async ({ label, rootPath }: { label?: string; rootPath: string }) => {
    const res = await fetch('/api/beads/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, rootPath }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null) as { details?: string } | null;
      throw new Error(body?.details || `HTTP ${res.status}`);
    }

    const source = await res.json() as BeadsSourceDto;
    await fetchSources();
    setSelectedSourceId(source.id);
    return source;
  }, [fetchSources]);

  const removeSource = useCallback(async (sourceId: string) => {
    const res = await fetch(`/api/beads/sources/${encodeURIComponent(sourceId)}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null) as { details?: string } | null;
      throw new Error(body?.details || `HTTP ${res.status}`);
    }

    await fetchSources();
  }, [fetchSources]);

  const repairLinkedPlanMetadata = useCallback(async (issueId: string) => {
    const res = await fetch(`/api/beads/issues/${encodeURIComponent(issueId)}/repair-plan-metadata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId: selectedSourceId || undefined }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null) as { details?: string } | null;
      throw new Error(body?.details || `HTTP ${res.status}`);
    }

    const result = await res.json();
    await fetchBoard(selectedSourceId);
    return result;
  }, [fetchBoard, selectedSourceId]);

  useEffect(() => {
    fetchSources();
    return () => {
      sourcesAbortRef.current?.abort();
      boardAbortRef.current?.abort();
    };
  }, [fetchSources]);

  useEffect(() => {
    if (!selectedSourceId) return;
    fetchBoard(selectedSourceId);
  }, [selectedSourceId, fetchBoard]);

  useEffect(() => {
    if (!selectedSourceId) return;
    const controller = new AbortController();
    void fetch('/api/beads/selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId: selectedSourceId }),
      signal: controller.signal,
    }).catch(() => {
      // Selection persistence is best-effort; keep the board usable even if it fails.
    });

    return () => controller.abort();
  }, [selectedSourceId]);

  useEffect(() => {
    if (!selectedSourceId) return;
    const id = setInterval(() => {
      void fetchBoard(selectedSourceId, { silent: true });
    }, 5_000);
    return () => clearInterval(id);
  }, [selectedSourceId, fetchBoard]);

  const normalized = useMemo(() => board ? normalizeBeadsBoard(board) : {
    todo: [],
    in_progress: [],
    done: [],
    closed: [],
  }, [board]);

  const tasksByColumn = useCallback((columnKey: BeadsBoardColumnKey) => {
    return normalized[columnKey] ?? [];
  }, [normalized]);

  const columnCounts = useMemo(() => ({
    todo: normalized.todo.length,
    in_progress: normalized.in_progress.length,
    done: normalized.done.length,
    closed: normalized.closed.length,
  }), [normalized]);

  return {
    sources,
    selectedSourceId,
    setSelectedSourceId,
    board,
    tasksByColumn,
    columnCounts,
    loading: loadingSources || loadingBoard,
    error,
    hasAnyTasks: (board?.totalCount ?? 0) > 0,
    fetchSources,
    fetchBoard,
    addSource,
    removeSource,
    repairLinkedPlanMetadata,
  };
}
