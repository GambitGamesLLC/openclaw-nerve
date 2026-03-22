import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MessageBubble } from './MessageBubble';
import type { ChatMsg } from './types';

function createUserMessage(): ChatMsg {
  return {
    msgId: 'm-upload-1',
    role: 'user',
    rawText: 'Please use these files.',
    html: 'Please use these files.',
    timestamp: new Date('2026-03-16T20:00:00Z'),
    uploadAttachments: [
      {
        id: 'att-inline',
        origin: 'upload',
        mode: 'inline',
        name: 'small.png',
        mimeType: 'image/png',
        sizeBytes: 120_000,
        inline: {
          encoding: 'base64',
          base64: '',
          base64Bytes: 98_000,
          compressed: true,
        },
        preparation: {
          sourceMode: 'inline',
          finalMode: 'inline',
          outcome: 'optimized_inline',
          reason: 'Inline image stayed within context-safe budget (32 KB max).',
          originalMimeType: 'image/png',
          originalSizeBytes: 120_000,
          inlineBase64Bytes: 98_000,
          contextSafetyMaxBytes: 32_768,
          inlineTargetBytes: 29_491,
          inlineChosenWidth: 1024,
          inlineChosenHeight: 768,
          inlineIterations: 2,
          inlineMinDimension: 512,
          localPathAvailable: false,
          optimizerAttempted: false,
        },
        optimization: {
          applied: true,
          tempDerivative: true,
          cleanupAfterSend: true,
          original: {
            path: '/workspace/.temp/nerve-uploads/2026/03/21/small.png',
            uri: 'file:///workspace/.temp/nerve-uploads/2026/03/21/small.png',
            mimeType: 'image/png',
            sizeBytes: 120_000,
            width: 1024,
            height: 768,
          },
          optimized: {
            path: '/home/derrick/.cache/openclaw/nerve/optimized-uploads/small.webp',
            uri: 'file:///home/derrick/.cache/openclaw/nerve/optimized-uploads/small.webp',
            mimeType: 'image/webp',
            sizeBytes: 64_000,
            width: 1024,
            height: 768,
          },
          artifacts: [
            {
              role: 'canonical_staged_source',
              path: '/workspace/.temp/nerve-uploads/2026/03/21/small.png',
              uri: 'file:///workspace/.temp/nerve-uploads/2026/03/21/small.png',
              mimeType: 'image/png',
              sizeBytes: 120_000,
              width: 1024,
              height: 768,
            },
            {
              role: 'optimized_derivative',
              path: '/home/derrick/.cache/openclaw/nerve/optimized-uploads/small.webp',
              uri: 'file:///home/derrick/.cache/openclaw/nerve/optimized-uploads/small.webp',
              mimeType: 'image/webp',
              sizeBytes: 64_000,
              width: 1024,
              height: 768,
            },
          ],
        },
        policy: {
          forwardToSubagents: false,
        },
      },
      {
        id: 'att-ref',
        origin: 'server_path',
        mode: 'file_reference',
        name: 'capture.mov',
        mimeType: 'video/quicktime',
        sizeBytes: 8_000_000,
        reference: {
          kind: 'local_path',
          path: '/workspace/capture.mov',
          uri: 'file:///workspace/capture.mov',
        },
        preparation: {
          sourceMode: 'inline',
          finalMode: 'file_reference',
          outcome: 'downgraded_to_file_reference',
          reason: 'Downgraded after inline preparation exceeded the context-safe budget (195 KB > 32 KB).',
          originalMimeType: 'video/quicktime',
          originalSizeBytes: 8_000_000,
          inlineBase64Bytes: 200_000,
          contextSafetyMaxBytes: 32_768,
          inlineTargetBytes: 29_491,
          inlineChosenWidth: 512,
          inlineChosenHeight: 384,
          inlineIterations: 8,
          inlineMinDimension: 512,
          inlineFallbackReason: 'minimum inline dimension reached; used file reference fallback',
          localPathAvailable: true,
          optimizerAttempted: false,
        },
        policy: {
          forwardToSubagents: true,
        },
      },
    ],
  };
}

describe('MessageBubble upload summaries', () => {
  it('renders attachment summary and per-file metadata chips from uploadAttachments', () => {
    render(
      <MessageBubble
        msg={createUserMessage()}
        index={0}
        isCollapsed={false}
        isMemoryCollapsed={true}
        onToggleCollapse={vi.fn()}
        onToggleMemory={vi.fn()}
      />,
    );

    expect(screen.getByText('Attachments: 2 (1 via Upload, 1 via Attach by Path; 1 inline, 1 file_ref; 1 inline optimized, 1 downgraded)')).toBeInTheDocument();
    expect(screen.getAllByText('UPLOAD').length).toBeGreaterThan(0);
    expect(screen.getByText('ATTACH BY PATH')).toBeInTheDocument();
    expect(screen.getAllByText('INLINE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('FILE_REF').length).toBeGreaterThan(0);
    expect(screen.getByText('INLINE OPT')).toBeInTheDocument();
    expect(screen.getByText('AUTO FILE_REF')).toBeInTheDocument();
    expect(screen.getByText('inline payload: 95.7 KB / cap 32.0 KB / target 28.8 KB')).toBeInTheDocument();
    expect(screen.getByText('1024×768 • 2 steps • min 512px')).toBeInTheDocument();
    expect(screen.getByText(/512×384 • 8 steps • min 512px • reason: minimum inline dimension reached; used file reference fallback/i)).toBeInTheDocument();
    expect(screen.getByText('canonical staged source: 117 KB • image/png • 1024×768')).toBeInTheDocument();
    expect(screen.getByText('optimized derivative: 62.5 KB • image/webp • 1024×768')).toBeInTheDocument();
    expect(screen.getByText('path: capture.mov')).toBeInTheDocument();
  });
});
