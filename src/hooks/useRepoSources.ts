import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BeadsSourceDto, BeadsSourcesResponse } from '@/features/kanban/beads';

export function useRepoSources() {
  const [sources, setSources] = useState<BeadsSourceDto[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [loadingSources, setLoadingSources] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sourcesAbortRef = useRef<AbortController | null>(null);

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
      setError(err instanceof Error ? err.message : 'Failed to load repo sources');
    } finally {
      setLoadingSources(false);
    }
  }, []);

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

  useEffect(() => {
    fetchSources();
    return () => {
      sourcesAbortRef.current?.abort();
    };
  }, [fetchSources]);

  useEffect(() => {
    if (!selectedSourceId) return;
    const controller = new AbortController();
    void fetch('/api/beads/selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId: selectedSourceId }),
      signal: controller.signal,
    }).catch(() => {
      // Selection persistence is best-effort; keep the UI usable even if it fails.
    });

    return () => controller.abort();
  }, [selectedSourceId]);

  const selectedSource = useMemo(() => {
    return sources.find((source) => source.id === selectedSourceId) ?? null;
  }, [selectedSourceId, sources]);

  return {
    sources,
    selectedSourceId,
    setSelectedSourceId,
    selectedSource,
    loadingSources,
    error,
    fetchSources,
    addSource,
    removeSource,
  };
}
