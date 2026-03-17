import type { AgentStatusKind } from '@/types';

const BUSY_STATES = new Set(['running', 'thinking', 'tool_use', 'delta', 'started']);
const IDLE_STATES = new Set(['idle', 'done', 'error', 'final', 'aborted', 'completed']);

// Reserved for truly dead/unreachable sessions, not transient run/request errors.
const DEAD_SESSION_STATES = new Set(['dead', 'crashed', 'unreachable', 'terminated']);

export function isStatusRunning(status: AgentStatusKind): boolean {
  return status === 'THINKING' || status === 'STREAMING';
}

export function mapAgentLifecyclePhaseToStatus(phase: string): AgentStatusKind | null {
  if (phase === 'start') return 'THINKING';
  if (phase === 'end') return 'DONE';
  if (phase === 'error') return 'FAILED';
  return null;
}

export function mapChatStateToStatus(state: string): AgentStatusKind | null {
  if (state === 'started') return 'THINKING';
  if (state === 'delta') return 'STREAMING';
  if (state === 'final') return 'DONE';
  if (state === 'error') return 'FAILED';
  if (state === 'aborted') return 'IDLE';
  return null;
}

export function mapLegacyAgentStateToStatus(state: string): AgentStatusKind | null {
  if (BUSY_STATES.has(state)) return 'THINKING';
  if (!IDLE_STATES.has(state) && !DEAD_SESSION_STATES.has(state)) return null;

  if (DEAD_SESSION_STATES.has(state)) return 'ERROR';
  if (state === 'error') return 'FAILED';
  if (state === 'aborted') return 'IDLE';
  return 'DONE';
}
