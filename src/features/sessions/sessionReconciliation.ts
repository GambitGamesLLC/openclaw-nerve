import type { Session } from '@/types';
import { getSessionKey } from '@/types';

const LIVE_SUPPLEMENTAL_STATES = new Set([
  'busy',
  'delta',
  'pending',
  'processing',
  'queued',
  'running',
  'started',
  'streaming',
  'thinking',
  'tool_use',
  'working',
]);

const TERMINAL_SUPPLEMENTAL_STATES = new Set([
  'aborted',
  'archived',
  'cancelled',
  'canceled',
  'completed',
  'deleted',
  'done',
  'ended',
  'error',
  'failed',
  'final',
  'finished',
  'idle',
  'stopped',
  'timeout',
]);

function normalizedState(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isLiveSupplementalSession(session: Session): boolean {
  if (session.busy || session.processing) return true;

  const states = [
    normalizedState(session.state),
    normalizedState(session.agentState),
    normalizedState(session.status),
  ].filter(Boolean);

  if (states.some((state) => LIVE_SUPPLEMENTAL_STATES.has(state))) return true;
  if (states.some((state) => TERMINAL_SUPPLEMENTAL_STATES.has(state))) return false;
  return false;
}

export function mergeAuthoritativeSessions(
  baseSessions: Session[],
  spawnedSessionLists: Session[][],
): Session[] {
  const merged = [...baseSessions];
  const seen = new Set(baseSessions.map(getSessionKey).filter(Boolean));

  for (const spawnedSessions of spawnedSessionLists) {
    for (const session of spawnedSessions) {
      const key = getSessionKey(session);
      if (!key || seen.has(key)) continue;
      if (!isLiveSupplementalSession(session)) continue;
      seen.add(key);
      merged.push(session);
    }
  }

  return merged;
}
