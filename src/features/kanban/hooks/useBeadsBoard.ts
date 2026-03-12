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

      const nextSourceId = data.defaultSourceId
        || data.sources.find((source) => source.isDefault)?.id
        || data.sources[0]?.id
        || '';

      setSelectedSourceId((current) => current || nextSourceId);
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
      setBoard(null);
      setLoadingBoard(false);
      return;
    }

    boardAbortRef.current?.abort();
    const controller = new AbortController();
    boardAbortRef.current = controller;

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
      if (!silent) setLoadingBoard(false);
    }
  }, [selectedSourceId]);

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
  };
}
