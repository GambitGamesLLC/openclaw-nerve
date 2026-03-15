import { useCallback, useEffect, useRef, useState } from 'react';

export interface PlanSummary {
  path: string;
  title: string;
  status: string | null;
  planId: string | null;
  beadIds: string[];
  archived: boolean;
  updatedAt: number;
  preview: string;
}

export interface PlanDocument extends PlanSummary {
  content: string;
}

interface PlansResponse {
  ok: boolean;
  plans?: PlanSummary[];
  source?: {
    id: string;
    label: string;
  };
  counts?: {
    total: number;
    active: number;
    archived: number;
  };
  error?: string;
}

interface PlanReadResponse {
  ok: boolean;
  plan?: PlanDocument;
  error?: string;
}

export function usePlans(sourceId?: string) {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [counts, setCounts] = useState({ total: 0, active: 0, archived: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanDocument | null>(null);
  const listAbortRef = useRef<AbortController | null>(null);
  const readAbortRef = useRef<AbortController | null>(null);
  const selectedPathRef = useRef<string | null>(null);

  const loadPlan = useCallback(async (planPath: string) => {
    readAbortRef.current?.abort();
    const controller = new AbortController();
    readAbortRef.current = controller;

    selectedPathRef.current = planPath;
    setSelectedPath(planPath);
    setIsPlanLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams({ path: planPath });
      if (sourceId?.trim()) qs.set('sourceId', sourceId);
      const res = await fetch(`/api/plans/read?${qs.toString()}`, { signal: controller.signal });
      const data = await res.json() as PlanReadResponse;
      if (!data.ok || !data.plan) throw new Error(data.error || 'Failed to load plan');
      setSelectedPlan(data.plan);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setSelectedPlan(null);
      setError((err as Error).message);
    } finally {
      setIsPlanLoading(false);
    }
  }, [sourceId]);

  const refresh = useCallback(async () => {
    listAbortRef.current?.abort();
    const controller = new AbortController();
    listAbortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams();
      if (sourceId?.trim()) qs.set('sourceId', sourceId);
      const res = await fetch(`/api/plans${qs.toString() ? `?${qs.toString()}` : ''}`, { signal: controller.signal });
      const data = await res.json() as PlansResponse;
      if (!data.ok || !data.plans) throw new Error(data.error || 'Failed to load plans');

      setPlans(data.plans);
      setCounts(data.counts ?? { total: data.plans.length, active: data.plans.filter(plan => !plan.archived).length, archived: data.plans.filter(plan => plan.archived).length });

      const currentSelectedPath = selectedPathRef.current;
      const nextSelectedPath = data.plans.some(plan => plan.path === currentSelectedPath)
        ? currentSelectedPath
        : data.plans[0]?.path ?? null;

      if (nextSelectedPath) {
        await loadPlan(nextSelectedPath);
      } else {
        selectedPathRef.current = null;
        setSelectedPath(null);
        setSelectedPlan(null);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [loadPlan]);

  useEffect(() => {
    void refresh();
    return () => {
      listAbortRef.current?.abort();
      readAbortRef.current?.abort();
    };
  }, [refresh]);

  return {
    plans,
    counts,
    selectedPath,
    selectedPlan,
    isLoading,
    isPlanLoading,
    error,
    refresh,
    loadPlan,
  };
}
