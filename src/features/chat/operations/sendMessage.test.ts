/** Tests for sendMessage — message building and RPC sending. */
import { describe, it, expect, vi } from 'vitest';
import { appendUploadManifest, applyVoiceTTSHint, buildUserMessage, sendChatMessage } from './sendMessage';
import type { OutgoingUploadPayload } from '../types';

function makeUploadPayload(overrides: Partial<OutgoingUploadPayload> = {}): OutgoingUploadPayload {
  return {
    descriptors: [
      {
        id: 'att-inline',
        mode: 'inline',
        name: 'small.png',
        mimeType: 'image/png',
        sizeBytes: 120_000,
        inline: {
          encoding: 'base64',
          base64: 'YmFzZTY0LWJ5dGVz',
          base64Bytes: 12,
          previewUrl: 'data:image/png;base64,abc',
          compressed: true,
        },
        policy: {
          forwardToSubagents: false,
        },
      },
      {
        id: 'att-ref',
        mode: 'file_reference',
        name: 'capture.mov',
        mimeType: 'video/quicktime',
        sizeBytes: 8_000_000,
        reference: {
          kind: 'local_path',
          path: '/workspace/capture.mov',
          uri: 'file:///workspace/capture.mov',
        },
        policy: {
          forwardToSubagents: false,
        },
      },
    ],
    manifest: {
      enabled: true,
      exposeInlineBase64ToAgent: false,
      allowSubagentForwarding: false,
    },
    ...overrides,
  };
}

describe('applyVoiceTTSHint', () => {
  it('appends TTS hint to voice messages', () => {
    const result = applyVoiceTTSHint('[voice] Hello there');
    expect(result).toContain('[voice] Hello there');
    expect(result).toContain('[system: User sent a voice message');
    expect(result).toContain('[tts:');
  });

  it('does not modify non-voice messages', () => {
    const text = 'Hello there';
    expect(applyVoiceTTSHint(text)).toBe(text);
  });

  it('only triggers on exact [voice] prefix', () => {
    expect(applyVoiceTTSHint('voice hello')).toBe('voice hello');
    expect(applyVoiceTTSHint('[VOICE] hello')).toBe('[VOICE] hello');
    expect(applyVoiceTTSHint(' [voice] hello')).toBe(' [voice] hello');
  });
});

describe('appendUploadManifest', () => {
  it('injects the manifest wrapper when enabled', () => {
    const message = appendUploadManifest('hello', makeUploadPayload());
    expect(message).toContain('<nerve-upload-manifest>');
    expect(message).toContain('</nerve-upload-manifest>');
    expect(message).toContain('capture.mov');
  });

  it('hides inline base64 in manifest by default', () => {
    const message = appendUploadManifest('hello', makeUploadPayload());
    expect(message).toContain('"base64":""');
  });

  it('includes inline base64 when policy flag is enabled', () => {
    const message = appendUploadManifest('hello', makeUploadPayload({
      manifest: {
        enabled: true,
        exposeInlineBase64ToAgent: true,
        allowSubagentForwarding: false,
      },
    }));

    expect(message).toContain('"base64":"YmFzZTY0LWJ5dGVz"');
  });

  it('keeps message unchanged when manifest is disabled', () => {
    const message = appendUploadManifest('hello', makeUploadPayload({
      manifest: {
        enabled: false,
        exposeInlineBase64ToAgent: false,
        allowSubagentForwarding: false,
      },
    }));

    expect(message).toBe('hello');
  });
});

describe('buildUserMessage', () => {
  it('creates a message with the correct role and text', () => {
    const { msg, tempId } = buildUserMessage({ text: 'Hello world' });
    expect(msg.role).toBe('user');
    expect(msg.rawText).toBe('Hello world');
    expect(msg.pending).toBe(true);
    expect(msg.tempId).toBe(tempId);
    expect(tempId).toBeTruthy();
  });

  it('generates unique tempIds', () => {
    const a = buildUserMessage({ text: 'a' });
    const b = buildUserMessage({ text: 'b' });
    expect(a.tempId).not.toBe(b.tempId);
  });

  it('sets a timestamp', () => {
    const { msg } = buildUserMessage({ text: 'test' });
    expect(msg.timestamp).toBeInstanceOf(Date);
    expect(msg.timestamp.getTime()).toBeGreaterThan(0);
  });

  it('renders HTML from markdown text', () => {
    const { msg } = buildUserMessage({ text: '**bold**' });
    expect(msg.html).toContain('bold');
  });

  it('includes images when provided', () => {
    const images = [
      { id: '1', mimeType: 'image/png', content: 'base64data', preview: 'data:image/png;base64,x', name: 'test.png' },
    ];
    const { msg } = buildUserMessage({ text: 'look at this', images });
    expect(msg.images).toHaveLength(1);
    expect(msg.images![0].mimeType).toBe('image/png');
    expect(msg.images![0].name).toBe('test.png');
  });

  it('stores upload descriptors for local rendering', () => {
    const uploadPayload = makeUploadPayload();
    const { msg } = buildUserMessage({ text: 'with upload', uploadPayload });
    expect(msg.uploadAttachments).toHaveLength(2);
    expect(msg.uploadAttachments?.[1].mode).toBe('file_reference');
  });

  it('omits images field when none provided', () => {
    const { msg } = buildUserMessage({ text: 'no images' });
    expect(msg.images).toBeUndefined();
  });

  it('assigns a msgId', () => {
    const { msg } = buildUserMessage({ text: 'test' });
    expect(msg.msgId).toBeTruthy();
  });
});

describe('sendChatMessage', () => {
  it('calls rpc with correct method and params', async () => {
    const rpc = vi.fn().mockResolvedValue({ runId: 'run-1', status: 'started' });

    const result = await sendChatMessage({
      rpc,
      sessionKey: 'session-1',
      text: 'Hello',
      idempotencyKey: 'key-1',
    });

    expect(rpc).toHaveBeenCalledWith('chat.send', expect.objectContaining({
      sessionKey: 'session-1',
      message: 'Hello',
      deliver: false,
      idempotencyKey: 'key-1',
    }));
    expect(result.runId).toBe('run-1');
    expect(result.status).toBe('started');
  });

  it('includes attachments when images are provided', async () => {
    const rpc = vi.fn().mockResolvedValue({});
    const images = [
      { id: '1', mimeType: 'image/jpeg', content: 'b64', preview: '', name: 'pic.jpg' },
    ];

    await sendChatMessage({
      rpc,
      sessionKey: 's1',
      text: 'with image',
      images,
      idempotencyKey: 'k1',
    });

    const callParams = rpc.mock.calls[0][1];
    expect(callParams.attachments).toHaveLength(1);
    expect(callParams.attachments[0].mimeType).toBe('image/jpeg');
    expect(callParams.attachments[0].content).toBe('b64');
  });

  it('injects upload manifest data into outgoing message body', async () => {
    const rpc = vi.fn().mockResolvedValue({});

    await sendChatMessage({
      rpc,
      sessionKey: 's1',
      text: 'with attachment metadata',
      uploadPayload: makeUploadPayload(),
      idempotencyKey: 'k1',
    });

    const sentMessage = rpc.mock.calls[0][1].message as string;
    expect(sentMessage).toContain('<nerve-upload-manifest>');
    expect(sentMessage).toContain('capture.mov');
    expect(sentMessage).toContain('"base64":""');
  });

  it('applies voice TTS hint to voice messages', async () => {
    const rpc = vi.fn().mockResolvedValue({});
    await sendChatMessage({
      rpc,
      sessionKey: 's1',
      text: '[voice] hello',
      idempotencyKey: 'k1',
    });

    const sentMessage = rpc.mock.calls[0][1].message;
    expect(sentMessage).toContain('[system: User sent a voice message');
  });

  it('handles null/empty rpc response gracefully', async () => {
    const rpc = vi.fn().mockResolvedValue(null);
    const result = await sendChatMessage({
      rpc, sessionKey: 's', text: 'hi', idempotencyKey: 'k',
    });
    expect(result.runId).toBeUndefined();
    expect(result.status).toBeUndefined();
  });

  it('validates status field values', async () => {
    const rpc = vi.fn().mockResolvedValue({ status: 'invalid_status' });
    const result = await sendChatMessage({
      rpc, sessionKey: 's', text: 'hi', idempotencyKey: 'k',
    });
    expect(result.status).toBeUndefined();
  });

  it('propagates rpc errors', async () => {
    const rpc = vi.fn().mockRejectedValue(new Error('connection failed'));
    await expect(sendChatMessage({
      rpc, sessionKey: 's', text: 'hi', idempotencyKey: 'k',
    })).rejects.toThrow('connection failed');
  });
});
