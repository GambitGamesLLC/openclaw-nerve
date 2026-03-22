import { describe, expect, it } from 'vitest';
import {
  appendForwardedServerPathManifest,
  buildSessionsSpawnArgs,
  buildSessionsSpawnAttachments,
  collectForwardedServerPathDescriptors,
  extractUploadManifestFromTask,
} from './subagent-spawn.js';

describe('extractUploadManifestFromTask', () => {
  it('strips the upload manifest from the task and returns its descriptors', () => {
    const result = extractUploadManifestFromTask(
      'Review this image\n\n<nerve-upload-manifest>{"attachments":[{"id":"a1","origin":"upload","mode":"inline","name":"proof.png","mimeType":"image/png","inline":{"encoding":"base64","base64":"cHJvb2Y="},"policy":{"forwardToSubagents":true}}]}</nerve-upload-manifest>',
    );

    expect(result.task).toBe('Review this image');
    expect(result.payload?.descriptors).toHaveLength(1);
    expect(result.payload?.descriptors?.[0].name).toBe('proof.png');
    expect(result.payload?.descriptors?.[0].origin).toBe('upload');
  });

  it('leaves the task untouched when the manifest is invalid', () => {
    const task = 'hello\n<nerve-upload-manifest>{not-json}</nerve-upload-manifest>';
    const result = extractUploadManifestFromTask(task);

    expect(result.task).toBe(task);
    expect(result.payload).toBeUndefined();
  });
});

describe('collectForwardedServerPathDescriptors', () => {
  it('keeps forwardable local-path file references regardless of upload origin', () => {
    const filePath = '/workspace/.temp/nerve-uploads/2026/03/21/notes.webp';

    const descriptors = collectForwardedServerPathDescriptors({
      manifest: { allowSubagentForwarding: true },
      descriptors: [
        {
          id: 'path-1',
          origin: 'server_path',
          mode: 'file_reference',
          name: 'notes.png',
          mimeType: 'image/webp',
          sizeBytes: 14,
          reference: { kind: 'local_path', path: filePath, uri: `file://${filePath}` },
          preparation: {
            sourceMode: 'file_reference',
            finalMode: 'file_reference',
            outcome: 'file_reference_ready',
          },
          optimization: {
            applied: true,
            tempDerivative: true,
          },
          policy: { forwardToSubagents: true },
        },
        {
          id: 'upload-1',
          origin: 'upload',
          mode: 'file_reference',
          name: 'uploaded.txt',
          mimeType: 'text/plain',
          reference: { kind: 'local_path', path: '/workspace/.temp/nerve-uploads/2026/03/21/uploaded.txt', uri: 'file:///workspace/.temp/nerve-uploads/2026/03/21/uploaded.txt' },
          policy: { forwardToSubagents: true },
        },
        {
          id: 'path-2',
          origin: 'server_path',
          mode: 'inline',
          name: 'skip-inline.txt',
          mimeType: 'text/plain',
          inline: { encoding: 'base64', base64: 'c2tpcA==' },
          policy: { forwardToSubagents: true },
        },
      ],
    });

    expect(descriptors).toEqual([
      {
        id: 'path-1',
        origin: 'server_path',
        mode: 'file_reference',
        name: 'notes.webp',
        mimeType: 'image/webp',
        sizeBytes: 14,
        reference: { kind: 'local_path', path: filePath, uri: `file://${filePath}` },
        preparation: {
          sourceMode: 'file_reference',
          finalMode: 'file_reference',
          outcome: 'file_reference_ready',
        },
        optimization: {
          applied: true,
          tempDerivative: true,
        },
        policy: { forwardToSubagents: true },
      },
      {
        id: 'upload-1',
        origin: 'upload',
        mode: 'file_reference',
        name: 'uploaded.txt',
        mimeType: 'text/plain',
        reference: { kind: 'local_path', path: '/workspace/.temp/nerve-uploads/2026/03/21/uploaded.txt', uri: 'file:///workspace/.temp/nerve-uploads/2026/03/21/uploaded.txt' },
        policy: { forwardToSubagents: true },
      },
    ]);
  });
});

describe('appendForwardedServerPathManifest', () => {
  it('appends an explicit forwarded local-path manifest to the subagent task', () => {
    const task = appendForwardedServerPathManifest('Inspect this file', [
      {
        id: 'path-1',
        origin: 'upload',
        mode: 'file_reference',
        name: 'notes.txt',
        mimeType: 'text/plain',
        reference: {
          kind: 'local_path',
          path: '/workspace/.temp/nerve-uploads/notes.txt',
          uri: 'file:///workspace/.temp/nerve-uploads/notes.txt',
        },
        policy: { forwardToSubagents: true },
      },
    ]);

    expect(task).toBe(
      'Inspect this file\n\n<nerve-forwarded-server-paths>{"version":1,"attachments":[{"id":"path-1","origin":"upload","mode":"file_reference","name":"notes.txt","mimeType":"text/plain","reference":{"kind":"local_path","path":"/workspace/.temp/nerve-uploads/notes.txt","uri":"file:///workspace/.temp/nerve-uploads/notes.txt"},"policy":{"forwardToSubagents":true}}]}</nerve-forwarded-server-paths>',
    );
  });
});

describe('buildSessionsSpawnAttachments', () => {
  it('keeps only forwardable inline attachments and skips file references', async () => {
    const attachments = await buildSessionsSpawnAttachments({
      manifest: { allowSubagentForwarding: true },
      descriptors: [
        {
          id: 'inline-1',
          mode: 'inline',
          name: 'proof.png',
          mimeType: 'image/png',
          inline: { encoding: 'base64', base64: 'cHJvb2Y=' },
          policy: { forwardToSubagents: true },
        },
        {
          id: 'ref-1',
          origin: 'upload',
          mode: 'file_reference',
          name: 'notes.txt',
          mimeType: 'text/plain',
          reference: { kind: 'local_path', path: '/workspace/.temp/nerve-uploads/notes.txt' },
          policy: { forwardToSubagents: true },
        },
        {
          id: 'skip-1',
          mode: 'inline',
          name: 'skip.png',
          mimeType: 'image/png',
          inline: { encoding: 'base64', base64: 'c2tpcA==' },
          policy: { forwardToSubagents: false },
        },
      ],
    });

    expect(attachments).toEqual([
      {
        name: 'proof.png',
        mimeType: 'image/png',
        encoding: 'base64',
        content: 'cHJvb2Y=',
      },
    ]);
  });

  it('returns no attachments when manifest-level forwarding is disabled', async () => {
    const attachments = await buildSessionsSpawnAttachments({
      manifest: { allowSubagentForwarding: false },
      descriptors: [
        {
          mode: 'inline',
          name: 'proof.png',
          mimeType: 'image/png',
          inline: { encoding: 'base64', base64: 'cHJvb2Y=' },
          policy: { forwardToSubagents: true },
        },
      ],
    });

    expect(attachments).toEqual([]);
  });
});

describe('buildSessionsSpawnArgs', () => {
  it('prefers explicit upload payloads and emits sessions_spawn args', async () => {
    const args = await buildSessionsSpawnArgs({
      task: 'Investigate this failure',
      label: 'triage-test',
      model: 'anthropic/claude-sonnet-4-5',
      thinking: 'high',
      uploadPayload: {
        manifest: { allowSubagentForwarding: true },
        descriptors: [
          {
            mode: 'inline',
            name: 'proof.png',
            mimeType: 'image/png',
            inline: { encoding: 'base64', base64: 'cHJvb2Y=' },
            policy: { forwardToSubagents: true },
          },
        ],
      },
    });

    expect(args).toEqual({
      task: 'Investigate this failure',
      runtime: 'subagent',
      label: 'triage-test',
      model: 'anthropic/claude-sonnet-4-5',
      thinking: 'high',
      attachments: [
        {
          name: 'proof.png',
          mimeType: 'image/png',
          encoding: 'base64',
          content: 'cHJvb2Y=',
        },
      ],
    });
  });

  it('appends forwarded file-reference metadata to the child task without byte attachments', async () => {
    const filePath = '/workspace/.temp/nerve-uploads/2026/03/21/notes.webp';

    const args = await buildSessionsSpawnArgs({
      task: 'Inspect this path attachment',
      uploadPayload: {
        manifest: { allowSubagentForwarding: true },
        descriptors: [
          {
            id: 'path-1',
            origin: 'upload',
            mode: 'file_reference',
            name: 'notes.png',
            mimeType: 'image/webp',
            sizeBytes: 14,
            reference: { kind: 'local_path', path: filePath, uri: `file://${filePath}` },
            preparation: {
              sourceMode: 'file_reference',
              finalMode: 'file_reference',
              outcome: 'file_reference_ready',
            },
            optimization: {
              applied: true,
              tempDerivative: true,
            },
            policy: { forwardToSubagents: true },
          },
        ],
      },
    });

    expect(args).toEqual({
      task: `Inspect this path attachment\n\n<nerve-forwarded-server-paths>{"version":1,"attachments":[{"id":"path-1","origin":"upload","mode":"file_reference","name":"notes.webp","mimeType":"image/webp","sizeBytes":14,"reference":{"kind":"local_path","path":"${filePath}","uri":"file://${filePath}"},"preparation":{"sourceMode":"file_reference","finalMode":"file_reference","outcome":"file_reference_ready"},"optimization":{"applied":true,"tempDerivative":true},"policy":{"forwardToSubagents":true}}]}</nerve-forwarded-server-paths>`,
      runtime: 'subagent',
    });
  });

  it('falls back to manifest descriptors embedded in the task', async () => {
    const args = await buildSessionsSpawnArgs({
      task: 'Inspect this\n\n<nerve-upload-manifest>{"attachments":[{"mode":"inline","name":"proof.png","mimeType":"image/png","inline":{"encoding":"base64","base64":"cHJvb2Y="},"policy":{"forwardToSubagents":true}}]}</nerve-upload-manifest>',
    });

    expect(args).toEqual({
      task: 'Inspect this',
      runtime: 'subagent',
      attachments: [
        {
          name: 'proof.png',
          mimeType: 'image/png',
          encoding: 'base64',
          content: 'cHJvb2Y=',
        },
      ],
    });
  });

  it('forwards mixed inline + file-reference descriptors into child attachments and path metadata together', async () => {
    const filePath = '/workspace/.temp/nerve-uploads/2026/03/21/mixed-path.webp';

    const args = await buildSessionsSpawnArgs({
      task: 'Inspect this mixed payload',
      uploadPayload: {
        manifest: { allowSubagentForwarding: true },
        descriptors: [
          {
            id: 'upload-1',
            origin: 'upload',
            mode: 'inline',
            name: 'proof.png',
            mimeType: 'image/png',
            sizeBytes: 120000,
            inline: { encoding: 'base64', base64: 'cHJvb2Y=' },
            preparation: {
              sourceMode: 'inline',
              finalMode: 'inline',
              outcome: 'optimized_inline',
            },
            policy: { forwardToSubagents: true },
          },
          {
            id: 'path-1',
            origin: 'upload',
            mode: 'file_reference',
            name: 'capture.png',
            mimeType: 'image/webp',
            sizeBytes: 16,
            reference: { kind: 'local_path', path: filePath, uri: `file://${filePath}` },
            preparation: {
              sourceMode: 'file_reference',
              finalMode: 'file_reference',
              outcome: 'file_reference_ready',
            },
            optimization: {
              applied: true,
              tempDerivative: true,
            },
            policy: { forwardToSubagents: true },
          },
        ],
      },
    });

    expect(args).toEqual({
      task: `Inspect this mixed payload\n\n<nerve-forwarded-server-paths>{"version":1,"attachments":[{"id":"path-1","origin":"upload","mode":"file_reference","name":"mixed-path.webp","mimeType":"image/webp","sizeBytes":16,"reference":{"kind":"local_path","path":"${filePath}","uri":"file://${filePath}"},"preparation":{"sourceMode":"file_reference","finalMode":"file_reference","outcome":"file_reference_ready"},"optimization":{"applied":true,"tempDerivative":true},"policy":{"forwardToSubagents":true}}]}</nerve-forwarded-server-paths>`,
      runtime: 'subagent',
      attachments: [
        {
          name: 'proof.png',
          mimeType: 'image/png',
          encoding: 'base64',
          content: 'cHJvb2Y=',
        },
      ],
    });
  });

  it('appends a forwarded path manifest for staged upload file references', async () => {
    const args = await buildSessionsSpawnArgs({
      task: 'Inspect this upload',
      uploadPayload: {
        manifest: { allowSubagentForwarding: true },
        descriptors: [
          {
            id: 'upload-1',
            origin: 'upload',
            mode: 'file_reference',
            name: 'proof.png',
            mimeType: 'image/png',
            reference: {
              kind: 'local_path',
              path: '/workspace/.temp/nerve-uploads/2026/03/21/proof.png',
              uri: 'file:///workspace/.temp/nerve-uploads/2026/03/21/proof.png',
            },
            policy: { forwardToSubagents: true },
          },
        ],
      },
    });

    expect(args).toEqual({
      task: 'Inspect this upload\n\n<nerve-forwarded-server-paths>{"version":1,"attachments":[{"id":"upload-1","origin":"upload","mode":"file_reference","name":"proof.png","mimeType":"image/png","reference":{"kind":"local_path","path":"/workspace/.temp/nerve-uploads/2026/03/21/proof.png","uri":"file:///workspace/.temp/nerve-uploads/2026/03/21/proof.png"},"policy":{"forwardToSubagents":true}}]}</nerve-forwarded-server-paths>',
      runtime: 'subagent',
    });
  });
});
