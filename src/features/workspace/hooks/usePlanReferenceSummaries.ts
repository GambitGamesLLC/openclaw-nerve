import { useEffect, useState } from 'react';
import type { ReferencePlanSummary } from '@/features/markdown/inlineReferences';

interface PlansSource {
  id: string;
}

interface PlansResponse {
  ok: boolean;
  plans?: ReferencePlanSummary[];
  source?: PlansSource;
}

/**
 * Lightweight plan summary loader for inline chat references.
 * Fetches only plan metadata (no plan body) from the default plans source.
 */
export function usePlanReferenceSummaries() {
  const [plans, setPlans] = useState<ReferencePlanSummary[]>([]);
  const [sourceId, setSourceId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const res = await fetch('/api/plans', { signal: controller.signal });
        const data = await res.json() as PlansResponse;
        if (!res.ok || !data.ok || !Array.isArray(data.plans)) return;

        setPlans(data.plans);
        setSourceId(data.source?.id ?? null);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    })();

    return () => controller.abort();
  }, []);

  return { plans, sourceId };
}
