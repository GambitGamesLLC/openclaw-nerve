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
        mode: 'inline',
        name: 'small.png',
        mimeType: 'image/png',
        sizeBytes: 120_000,
        inline: {
          encoding: 'base64',
          base64: '',
          base64Bytes: 0,
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

    expect(screen.getByText('Attachments: 2 (1 inline, 1 file_ref)')).toBeInTheDocument();
    expect(screen.getByText('INLINE')).toBeInTheDocument();
    expect(screen.getByText('FILE_REF')).toBeInTheDocument();
    expect(screen.getByText('path: capture.mov')).toBeInTheDocument();
    expect(screen.getByText('forwarded to subagents')).toBeInTheDocument();
  });
});
