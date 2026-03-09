import { describe, it, expect } from 'vitest';
import { mergeSessionsByKey } from './mergeSessions';
import type { Session } from '@/types';

describe('mergeSessionsByKey', () => {
  it('dedupes by canonical session key and merges fields', () => {
    const base: Session[] = [
      { sessionKey: 'agent:main:main', updatedAt: 1000, model: 'x' },
      { sessionKey: 'agent:main:subagent:abc', updatedAt: 900, label: 'old' },
    ];

    // Simulate the spawnedBy query returning a subagent row that lacks updatedAt,
    // but includes other metadata we want to preserve.
    const spawned: Session[] = [
      { sessionKey: 'agent:main:subagent:abc', totalTokens: 42 },
    ];

    const merged = mergeSessionsByKey(base, spawned);
    const sub = merged.find(s => (s.sessionKey || s.key || s.id) === 'agent:main:subagent:abc');
    expect(sub).toBeTruthy();
    expect(sub?.label).toBe('old');
    expect(sub?.totalTokens).toBe(42);
  });

  it('includes spawned sessions even if missing from base list', () => {
    const base: Session[] = [
      { sessionKey: 'agent:main:main', updatedAt: 1000 },
    ];
    const spawned: Session[] = [
      { sessionKey: 'agent:main:subagent:new', state: 'running' },
    ];

    const merged = mergeSessionsByKey(base, spawned);
    expect(merged.some(s => (s.sessionKey || s.key || s.id) === 'agent:main:subagent:new')).toBe(true);
  });
});
