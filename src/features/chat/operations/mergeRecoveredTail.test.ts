/** Tests for mergeRecoveredTail. */
import { describe, it, expect } from 'vitest';
import { mergeRecoveredTail } from './mergeRecoveredTail';
import type { ChatMsg } from '@/features/chat/types';

function makeMsg(role: string, text: string, ts?: number, overrides: Partial<ChatMsg> = {}): ChatMsg {
  return {
    role: role as ChatMsg['role'],
    html: `<p>${text}</p>`,
    rawText: text,
    timestamp: new Date(ts ?? Date.now()),
    ...overrides,
  };
}

describe('mergeRecoveredTail', () => {
  it('returns recovered when existing is empty', () => {
    const recovered = [makeMsg('user', 'Hello')];
    expect(mergeRecoveredTail([], recovered)).toEqual(recovered);
  });

  it('returns existing when recovered is empty', () => {
    const existing = [makeMsg('user', 'Hello')];
    expect(mergeRecoveredTail(existing, [])).toEqual(existing);
  });

  it('appends new messages when recovered starts where existing ends', () => {
    const ts = 1700000000000;
    const existing = [
      makeMsg('user', 'Hello', ts),
      makeMsg('assistant', 'Hi', ts + 1000),
    ];
    const recovered = [
      makeMsg('user', 'Hello', ts),
      makeMsg('assistant', 'Hi', ts + 1000),
      makeMsg('user', 'New question', ts + 2000),
    ];
    const result = mergeRecoveredTail(existing, recovered);
    expect(result).toHaveLength(3);
    expect(result[2].rawText).toBe('New question');
  });

  it('does not duplicate overlapping messages', () => {
    const ts = 1700000000000;
    const existing = [makeMsg('user', 'Hello', ts), makeMsg('assistant', 'Hi', ts + 1000)];
    const recovered = [makeMsg('user', 'Hello', ts), makeMsg('assistant', 'Hi', ts + 1000), makeMsg('user', 'Follow up', ts + 2000)];
    const result = mergeRecoveredTail(existing, recovered);
    // Should have 3 messages, not 4 or 5
    expect(result).toHaveLength(3);
  });

  it('uses anchor path when no suffix-prefix overlap', () => {
    const ts = 1700000000000;
    const existing = [
      makeMsg('user', 'Message A', ts),
      makeMsg('assistant', 'Reply A', ts + 1000),
      makeMsg('user', 'Message B unique content here', ts + 2000),
      makeMsg('assistant', 'Old reply B', ts + 3000),
    ];
    const recovered = [
      makeMsg('user', 'Message B unique content here', ts + 2000),
      makeMsg('assistant', 'New reply B (corrected)', ts + 3000),
      makeMsg('user', 'Message C', ts + 4000),
    ];
    const result = mergeRecoveredTail(existing, recovered);
    // Should preserve A messages, replace from B onwards
    expect(result.some(m => m.rawText === 'Message A')).toBe(true);
    expect(result.some(m => m.rawText === 'Reply A')).toBe(true);
    expect(result.some(m => m.rawText === 'New reply B (corrected)')).toBe(true);
    expect(result.some(m => m.rawText === 'Message C')).toBe(true);
    // Old reply should be replaced, not retained
    expect(result.some(m => m.rawText === 'Old reply B')).toBe(false);
  });

  it('preserves unrecovered live assistant stream messages after an anchor', () => {
    const ts = 1700000000000;
    const existing = [
      makeMsg('user', 'Run a tool/message/tool canary', ts),
      makeMsg('tool', 'pre-tool result', ts + 1000),
      makeMsg('assistant', 'Midpoint canary', ts + 2000, { liveAssistantStream: true }),
      makeMsg('tool', 'post-tool result', ts + 3000),
    ];
    const recovered = [
      makeMsg('tool', 'pre-tool result', ts + 1000),
      makeMsg('tool', 'post-tool result', ts + 3000),
    ];
    const result = mergeRecoveredTail(existing, recovered);
    expect(result.map(m => m.rawText)).toEqual([
      'Run a tool/message/tool canary',
      'pre-tool result',
      'Midpoint canary',
      'post-tool result',
    ]);
  });

  it('does not preserve arbitrary stale assistant messages after an anchor', () => {
    const ts = 1700000000000;
    const existing = [
      makeMsg('user', 'Run a tool/message/tool canary', ts),
      makeMsg('tool', 'pre-tool result', ts + 1000),
      makeMsg('assistant', 'Old stale answer', ts + 2000),
    ];
    const recovered = [
      makeMsg('tool', 'pre-tool result', ts + 1000),
      makeMsg('assistant', 'Corrected answer', ts + 2000),
    ];
    const result = mergeRecoveredTail(existing, recovered);
    expect(result.map(m => m.rawText)).toEqual([
      'Run a tool/message/tool canary',
      'pre-tool result',
      'Corrected answer',
    ]);
  });

  it('drops the live assistant stream marker once recovered history contains the same message', () => {
    const ts = 1700000000000;
    const existing = [
      makeMsg('user', 'Run a tool/message/tool canary', ts),
      makeMsg('tool', 'pre-tool result', ts + 1000),
      makeMsg('assistant', 'Midpoint canary', ts + 2000, { liveAssistantStream: true }),
    ];
    const recovered = [
      makeMsg('tool', 'pre-tool result', ts + 1000),
      makeMsg('assistant', 'Midpoint canary', ts + 2000),
      makeMsg('tool', 'post-tool result', ts + 3000),
    ];
    const result = mergeRecoveredTail(existing, recovered);
    expect(result.map(m => m.rawText)).toEqual([
      'Run a tool/message/tool canary',
      'pre-tool result',
      'Midpoint canary',
      'post-tool result',
    ]);
    expect(result[2].liveAssistantStream).toBeFalsy();
  });

  it('preserves existing scrollback when no overlap or anchor is found', () => {
    const existing = [
      makeMsg('user', 'Old message 1', 1000000),
      makeMsg('assistant', 'Old reply 1', 1000001),
    ];
    const recovered = [
      makeMsg('user', 'Completely different', 2000000),
      makeMsg('assistant', 'New reply', 2000001),
    ];
    const result = mergeRecoveredTail(existing, recovered);
    expect(result).toEqual([...existing, ...recovered]);
  });

  it('ignores intermediate presentation changes when anchoring recovered messages', () => {
    const ts = 1700000000000;
    const existing = [
      makeMsg('user', 'Original question', ts),
      makeMsg('assistant', 'Visible final reply', ts + 1000),
    ];
    const recovered = [
      makeMsg('assistant', 'Visible final reply', ts + 1000, { intermediate: true }),
      makeMsg('tool', 'post-reply tool result', ts + 2000),
    ];
    const result = mergeRecoveredTail(existing, recovered);
    expect(result).toHaveLength(3);
    expect(result[0].rawText).toBe('Original question');
    expect(result[1].rawText).toBe('Visible final reply');
    expect(result[1].intermediate).toBeFalsy();
    expect(result[2].rawText).toBe('post-reply tool result');
  });

  it('uses role and text as a loose anchor when timestamp buckets differ', () => {
    const existing = [
      makeMsg('user', 'Earlier prefix', 1000000),
      makeMsg('assistant', 'Synthetic visible reply', 1000001),
    ];
    const recovered = [
      makeMsg('assistant', 'Synthetic visible reply', 5000000),
      makeMsg('tool', 'later persisted tool', 5000001),
    ];
    const result = mergeRecoveredTail(existing, recovered);
    expect(result.map(m => m.rawText)).toEqual([
      'Earlier prefix',
      'Synthetic visible reply',
      'later persisted tool',
    ]);
  });

  it('handles single message overlap', () => {
    const ts = 1700000000000;
    const existing = [makeMsg('user', 'Only msg', ts)];
    const recovered = [makeMsg('user', 'Only msg', ts), makeMsg('assistant', 'Reply', ts + 1000)];
    const result = mergeRecoveredTail(existing, recovered);
    expect(result).toHaveLength(2);
  });
});
