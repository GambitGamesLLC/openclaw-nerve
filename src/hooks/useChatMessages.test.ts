import { describe, expect, it } from 'vitest';
import { mergeLoadedHistoryPreservingLiveStreams } from './useChatMessages';
import type { ChatMsg } from '@/features/chat/types';

function makeMsg(role: ChatMsg['role'], text: string, ts: number, overrides: Partial<ChatMsg> = {}): ChatMsg {
  return {
    role,
    html: `<p>${text}</p>`,
    rawText: text,
    timestamp: new Date(ts),
    ...overrides,
  };
}

describe('mergeLoadedHistoryPreservingLiveStreams', () => {
  it('uses loaded history directly when there are no live assistant stream bubbles', () => {
    const ts = 1700000000000;
    const existing = [
      makeMsg('user', 'Question', ts),
      makeMsg('assistant', 'Old answer', ts + 1000),
    ];
    const loaded = [
      makeMsg('user', 'Question', ts),
      makeMsg('assistant', 'Corrected answer', ts + 1000),
    ];

    expect(mergeLoadedHistoryPreservingLiveStreams(existing, loaded)).toEqual(loaded);
  });

  it('preserves unrecovered live assistant stream bubbles during direct history refresh', () => {
    const ts = 1700000000000;
    const existing = [
      makeMsg('user', 'Run a tool/message/tool canary', ts),
      makeMsg('tool', 'pre-tool result', ts + 1000),
      makeMsg('assistant', 'Midpoint canary', ts + 2000, { liveAssistantStream: true }),
      makeMsg('tool', 'post-tool result', ts + 3000),
      makeMsg('assistant', 'Final response', ts + 4000),
    ];
    const loaded = [
      makeMsg('tool', 'pre-tool result', ts + 1000),
      makeMsg('tool', 'post-tool result', ts + 3000),
      makeMsg('assistant', 'Final response', ts + 4000),
    ];

    const result = mergeLoadedHistoryPreservingLiveStreams(existing, loaded);
    expect(result.map(msg => msg.rawText)).toEqual([
      'Run a tool/message/tool canary',
      'pre-tool result',
      'Midpoint canary',
      'post-tool result',
      'Final response',
    ]);
  });
});
