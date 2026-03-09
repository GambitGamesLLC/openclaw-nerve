import type { Session } from '@/types';
import { getSessionKey } from '@/types';

function scoreSession(s: Session): number {
  // Heuristic: prefer entries with timestamps and more populated metadata.
  let score = 0;
  if (typeof s.updatedAt === 'number') score += 5;
  if (s.lastActivity !== undefined && s.lastActivity !== null) score += 3;
  if (typeof s.totalTokens === 'number') score += 2;
  if (typeof s.contextTokens === 'number') score += 1;
  if (typeof s.model === 'string' && s.model) score += 1;
  if (typeof s.thinkingLevel === 'string' && s.thinkingLevel) score += 1;
  if (typeof s.label === 'string' && s.label) score += 1;
  if (typeof s.kind === 'string' && s.kind) score += 1;
  if (typeof s.displayName === 'string' && s.displayName) score += 1;
  if (typeof s.parentId === 'string' && s.parentId) score += 1;
  return score;
}

export function mergeSessionsByKey(a: Session[], b: Session[]): Session[] {
  const map = new Map<string, Session>();

  const upsert = (incoming: Session) => {
    const key = getSessionKey(incoming);
    if (!key) return;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, incoming);
      return;
    }

    // Merge fields, but bias toward the "better" session shape.
    const merged = scoreSession(incoming) >= scoreSession(prev)
      ? { ...prev, ...incoming }
      : { ...incoming, ...prev };

    // Preserve a canonical key field if present.
    if (!merged.sessionKey && (prev.sessionKey || incoming.sessionKey)) {
      merged.sessionKey = prev.sessionKey || incoming.sessionKey;
    }

    map.set(key, merged);
  };

  for (const s of a) upsert(s);
  for (const s of b) upsert(s);

  return Array.from(map.values());
}
