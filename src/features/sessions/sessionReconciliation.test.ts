import { describe, expect, it } from 'vitest';
import type { Session } from '@/types';
import { isLiveSupplementalSession, mergeAuthoritativeSessions } from './sessionReconciliation';

function session(sessionKey: string, extra: Partial<Session> = {}): Session {
  return { sessionKey, ...extra };
}

describe('session reconciliation', () => {
  it('keeps live spawnedBy supplements missing from the full list', () => {
    const merged = mergeAuthoritativeSessions(
      [session('agent:main:main')],
      [[session('agent:main:subagent:active-child', { status: 'running' })]],
    );

    expect(merged.map((item) => item.sessionKey)).toEqual([
      'agent:main:main',
      'agent:main:subagent:active-child',
    ]);
  });

  it('prunes terminal spawnedBy supplements missing from the full list', () => {
    const merged = mergeAuthoritativeSessions(
      [session('agent:main:main')],
      [[
        session('agent:main:subagent:done-child', { status: 'done' }),
        session('agent:main:subagent:failed-child', { status: 'failed' }),
        session('agent:main:subagent:archived-child', { status: 'archived' }),
      ]],
    );

    expect(merged.map((item) => item.sessionKey)).toEqual(['agent:main:main']);
  });

  it('preserves terminal sessions when the full list still reports them', () => {
    const merged = mergeAuthoritativeSessions(
      [
        session('agent:main:main'),
        session('agent:main:subagent:done-child', { status: 'done' }),
      ],
      [[session('agent:main:subagent:done-child', { status: 'done', label: 'stale duplicate' })]],
    );

    expect(merged).toHaveLength(2);
    expect(merged[1]).toMatchObject({ sessionKey: 'agent:main:subagent:done-child', status: 'done' });
    expect(merged[1].label).toBeUndefined();
  });

  it('requires a positive live signal for supplemental sessions with unknown state', () => {
    expect(isLiveSupplementalSession(session('agent:main:subagent:unknown-child'))).toBe(false);
    expect(isLiveSupplementalSession(session('agent:main:subagent:busy-child', { processing: true }))).toBe(true);
  });
});
