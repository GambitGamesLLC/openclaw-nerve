import { useEffect, useState } from 'react';
import type { BeadDetail } from './types';

interface UseBeadDetailState {
  bead: BeadDetail | null;
  loading: boolean;
  error: string | null;
}

export function useBeadDetail(beadId: string): UseBeadDetailState {
  const [state, setState] = useState<UseBeadDetailState>({ bead: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ bead: null, loading: true, error: null });

    void fetch(`/api/beads/${encodeURIComponent(beadId)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null) as {
          ok?: boolean;
          bead?: BeadDetail;
          details?: string;
          error?: string;
        } | null;

        if (cancelled) return;

        if (!res.ok || !data?.ok || !data.bead) {
          setState({
            bead: null,
            loading: false,
            error: data?.details || data?.error || 'Failed to load bead',
          });
          return;
        }

        setState({ bead: data.bead, loading: false, error: null });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ bead: null, loading: false, error: 'Network error' });
      });

    return () => {
      cancelled = true;
    };
  }, [beadId]);

  return state;
}
