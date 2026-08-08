/** Tests for chat message reconciliation helpers. */
import { describe, expect, it } from 'vitest';
import { mergeFinalMessages, mergeHistoryMessages } from './useChatMessages';
import type { ChatMsg } from '@/features/chat/types';

function msg(role: ChatMsg['role'], rawText: string, sourceId: string, pending = false): ChatMsg {
  return {
    msgId: `ui-${sourceId}`,
    sourceId,
    role,
    html: rawText,
    rawText,
    timestamp: new Date(1700000000000),
    pending,
    tempId: pending ? `temp-${sourceId}` : undefined,
  };
}

function openclawAssistant(rawText: string, sourceId: string, ts = 1700000000000): ChatMsg {
  return {
    ...msg('assistant', rawText, sourceId),
    timestamp: new Date(ts),
  };
}

describe('chat message reconciliation', () => {
  it('dedupes live final messages by stable identity', () => {
    const existing = [msg('assistant', 'Streaming text', 'assistant-1')];
    const incoming = [msg('assistant', 'Final text', 'assistant-1')];

    const result = mergeFinalMessages(existing, incoming);

    expect(result).toHaveLength(1);
    expect(result[0].rawText).toBe('Final text');
    expect(result[0].msgId).toBe('ui-assistant-1');
  });

  it('replaces a pending optimistic user message when history confirms the same idempotency key', () => {
    const existing = [msg('user', 'hello', 'message:idempotency:ik-1', true)];
    const history = [msg('user', 'hello', 'message:idempotency:ik-1')];

    const result = mergeHistoryMessages(existing, history);

    expect(result).toHaveLength(1);
    expect(result[0].pending).toBe(false);
    expect(result[0].tempId).toBe('temp-message:idempotency:ik-1');
  });

  it('matches optimistic user messages against history aliases when OpenClaw wrapper ids are primary', () => {
    const existing = [msg('user', 'hello', 'message:idempotency:ik-1', true)];
    const history = [{
      ...msg('user', 'hello', 'openclaw:id:wrapper-1'),
      alternateSourceIds: ['message:idempotency:ik-1'],
    }];

    const result = mergeHistoryMessages(existing, history);

    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('openclaw:id:wrapper-1');
    expect(result[0].pending).toBe(false);
  });

  it('preserves pending optimistic messages absent from an authoritative refresh', () => {
    const existing = [
      msg('assistant', 'old', 'assistant-1'),
      msg('user', 'still sending', 'message:idempotency:ik-2', true),
    ];
    const history = [msg('assistant', 'old', 'assistant-1')];

    const result = mergeHistoryMessages(existing, history);

    expect(result.map(m => m.rawText)).toEqual(['old', 'still sending']);
    expect(result[1].pending).toBe(true);
  });

  it('aliases a local streamed assistant final to the later durable OpenClaw history identity', () => {
    const existing = [
      openclawAssistant('Task 10 audit is verified complete.', 'derived:unknown-session:assistant:1786147218006:abc', 1786147218006),
    ];
    const history = [
      openclawAssistant('Task 10 audit is verified complete.', 'openclaw:mirror:019fdeaa-eb0d-7ed1-96dd-08243ee90d95:assistant', 1786147303367),
    ];

    const result = mergeHistoryMessages(existing, history);

    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('openclaw:mirror:019fdeaa-eb0d-7ed1-96dd-08243ee90d95:assistant');
    expect(result[0].msgId).toBe(existing[0].msgId);
  });

  it('preserves legitimate repeated assistant finals that both have durable OpenClaw identities', () => {
    const first = openclawAssistant('Done.', 'openclaw:mirror:run-1:assistant', 1700000000000);
    const second = openclawAssistant('Done.', 'openclaw:mirror:run-2:assistant', 1700000005000);

    const result = mergeFinalMessages([first], [second]);

    expect(result.map(m => m.sourceId)).toEqual([
      'openclaw:mirror:run-1:assistant',
      'openclaw:mirror:run-2:assistant',
    ]);
  });

  it('does not alias rich assistant messages with images by matching text alone', () => {
    const local = openclawAssistant('Here is the image.', 'derived:unknown-session:assistant:1700000000000:abc', 1700000000000);
    const durable = {
      ...openclawAssistant('Here is the image.', 'openclaw:mirror:run-1:assistant', 1700000005000),
      extractedImages: [{ url: '/api/files?path=image.png', alt: 'image.png' }],
    };

    const result = mergeHistoryMessages([local], [durable]);

    expect(result).toHaveLength(1);
    expect(result[0].sourceId).toBe('openclaw:mirror:run-1:assistant');
    expect(result[0].msgId).not.toBe(local.msgId);
  });
});
