import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BeadsBoardColumnKey, BeadsBoardDto } from '../beads';
import { normalizeBeadsBoard } from '../beads';
import { useRepoSources } from '@/hooks/useRepoSources';

export function useBeadsBoard() {
  const {
    sources,
    selectedSourceId,
    setSelectedSourceId,
    loadingSources,
    error: sourcesError,
    fetchSources,
    addSource,
    removeSource,
  } = useRepoSources();
  const [board, setBoard] = useState<BeadsBoardDto | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const boardAbortRef = useRef<AbortController | null>(null);
  const boardRequestSourceRef = useRef<string | null>(null);

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
    return () => {
      boardAbortRef.current?.abort();
    };
  }, []);

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

  const selectedSource = useMemo(() => {
    return sources.find((source) => source.id === selectedSourceId) ?? null;
  }, [selectedSourceId, sources]);

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
    selectedSource,
    tasksByColumn,
    columnCounts,
    loading: loadingSources || loadingBoard,
    error: error || sourcesError,
    hasAnyTasks: (board?.totalCount ?? 0) > 0,
    fetchSources,
    fetchBoard,
    addSource,
    removeSource,
    repairLinkedPlanMetadata,
  };
}
