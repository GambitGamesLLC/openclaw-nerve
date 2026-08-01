import type { ChatMsg } from '@/features/chat/types';

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return hash;
}

function messageSignature(msg: ChatMsg, options: { includeTimestamp?: boolean } = {}): string {
  const { includeTimestamp = true } = options;
  const normalizedText = (msg.rawText || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 4000);
  const textHash = hashString(normalizedText).toString(16);
  const tsBucket = includeTimestamp ? Math.floor(msg.timestamp.getTime() / 30_000) : 'any';
  const flags = [
    msg.isThinking ? 'thinking' : '',
    msg.toolGroup ? `toolGroup:${msg.toolGroup.length}` : '',
    msg.images?.length ? `images:${msg.images.length}` : '',
  ].filter(Boolean).join(',');

  return `${msg.role}|${textHash}|${tsBucket}|${flags}`;
}

function findSuffixPrefixOverlap(existingSigs: string[], recoveredSigs: string[]): number {
  const max = Math.min(existingSigs.length, recoveredSigs.length, 120);
  for (let len = max; len >= 1; len--) {
    let match = true;
    for (let i = 0; i < len; i++) {
      if (existingSigs[existingSigs.length - len + i] !== recoveredSigs[i]) {
        match = false;
        break;
      }
    }
    if (match) return len;
  }
  return 0;
}

/**
 * Find a single-message anchor between existing tail and recovered messages.
 * Searches from the END of the existing array to find the latest match,
 * reducing the risk of hash collisions on short/common messages anchoring
 * at the wrong position.
 */
function findTailAnchor(existingSigs: string[], recoveredSigs: string[]) {
  const tailStart = Math.max(0, existingSigs.length - 160);

  for (let existingIdx = existingSigs.length - 1; existingIdx >= tailStart; existingIdx--) {
    const sig = existingSigs[existingIdx];
    for (let recoveredIdx = 0; recoveredIdx < recoveredSigs.length; recoveredIdx++) {
      if (recoveredSigs[recoveredIdx] === sig) {
        return { existingIdx, recoveredIdx };
      }
    }
  }

  return null;
}

function appendUnanchoredRecoveredMessages(existing: ChatMsg[], recovered: ChatMsg[]): ChatMsg[] {
  const seen = new Set(existing.map(msg => messageSignature(msg, { includeTimestamp: false })));
  const additions = recovered.filter((msg) => {
    const sig = messageSignature(msg, { includeTimestamp: false });
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });

  return additions.length > 0 ? [...existing, ...additions] : existing;
}

function mergeOverlappingRecoveredMessages(existing: ChatMsg[], recovered: ChatMsg[], overlap: number): ChatMsg[] {
  const prefix = existing.slice(0, existing.length - overlap);
  const existingOverlap = existing.slice(existing.length - overlap);
  const recoveredOverlap = recovered.slice(0, overlap);
  const reconciledOverlap = recoveredOverlap.map((msg, idx) => (
    existingOverlap[idx]?.liveAssistantStream ? msg : existingOverlap[idx]
  ));

  return [...prefix, ...reconciledOverlap, ...recovered.slice(overlap)];
}

function mergeLiveAssistantStreamMessages(existingSuffix: ChatMsg[], patchedTail: ChatMsg[]): ChatMsg[] {
  const merged = [...patchedTail];
  const seen = new Set(merged.map(msg => messageSignature(msg, { includeTimestamp: false })));

  for (const msg of existingSuffix) {
    if (!msg.liveAssistantStream) continue;

    const sig = messageSignature(msg, { includeTimestamp: false });
    if (seen.has(sig)) continue;
    seen.add(sig);

    const insertIdx = merged.findIndex(candidate => candidate.timestamp.getTime() > msg.timestamp.getTime());
    if (insertIdx === -1) {
      merged.push(msg);
    } else {
      merged.splice(insertIdx, 0, msg);
    }
  }

  return merged;
}

/**
 * Merge a recovered history tail into the current transcript without replacing
 * unaffected prefix messages.
 */
export function mergeRecoveredTail(existing: ChatMsg[], recovered: ChatMsg[]): ChatMsg[] {
  if (recovered.length === 0) return existing;
  if (existing.length === 0) return recovered;

  const existingSigs = existing.map(msg => messageSignature(msg));
  const recoveredSigs = recovered.map(msg => messageSignature(msg));

  // Fast path: recovered starts where existing tail ends.
  const overlap = findSuffixPrefixOverlap(existingSigs, recoveredSigs);
  if (overlap > 0) {
    return mergeOverlappingRecoveredMessages(existing, recovered, overlap);
  }

  // Anchor path: find a matching point in the existing tail and replace only suffix.
  const anchor = findTailAnchor(existingSigs, recoveredSigs);
  if (anchor) {
    const preservedPrefix = existing.slice(0, anchor.existingIdx);
    const existingSuffix = existing.slice(anchor.existingIdx);
    const patchedTail = mergeLiveAssistantStreamMessages(existingSuffix, recovered.slice(anchor.recoveredIdx));
    return [...preservedPrefix, ...patchedTail];
  }

  const looseExistingSigs = existing.map(msg => messageSignature(msg, { includeTimestamp: false }));
  const looseRecoveredSigs = recovered.map(msg => messageSignature(msg, { includeTimestamp: false }));

  const looseAnchor = findTailAnchor(looseExistingSigs, looseRecoveredSigs);
  if (looseAnchor) {
    const preservedPrefix = existing.slice(0, looseAnchor.existingIdx);
    const existingSuffix = existing.slice(looseAnchor.existingIdx);
    const patchedTail = mergeLiveAssistantStreamMessages(existingSuffix, recovered.slice(looseAnchor.recoveredIdx));
    return [...preservedPrefix, ...patchedTail];
  }

  // Bounded recovery may only return a tail. If we cannot prove an anchor, keep
  // current scrollback and append any recovered messages that are clearly new.
  return appendUnanchoredRecoveredMessages(existing, recovered);
}
