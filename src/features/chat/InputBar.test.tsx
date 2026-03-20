import { createRef } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputBar, type InputBarHandle } from './InputBar';
import { compressImage } from './image-compress';

vi.mock('./image-compress', () => ({
  compressImage: vi.fn(async (file: File) => ({
    base64: `mock-${file.name}`,
    mimeType: file.type || 'application/octet-stream',
    preview: `data:${file.type};base64,mock-${file.name}`,
    width: 1024,
    height: 768,
    bytes: `mock-${file.name}`.length,
    iterations: 1,
    attempts: [],
    targetBytes: 29_491,
    maxBytes: 32_768,
    minDimension: 512,
  })),
}));

vi.mock('@/features/voice/useVoiceInput', () => ({
  useVoiceInput: () => ({
    voiceState: 'idle',
    interimTranscript: '',
    wakeWordEnabled: false,
    toggleWakeWord: vi.fn(),
    error: null,
    clearError: vi.fn(),
  }),
}));

vi.mock('@/hooks/useTabCompletion', () => ({
  useTabCompletion: () => ({
    handleKeyDown: vi.fn(() => false),
    reset: vi.fn(),
  }),
}));

vi.mock('@/hooks/useInputHistory', () => ({
  useInputHistory: () => ({
    addToHistory: vi.fn(),
    isNavigating: vi.fn(() => false),
    reset: vi.fn(),
    navigateUp: vi.fn(() => null),
    navigateDown: vi.fn(() => null),
  }),
}));

vi.mock('@/contexts/SessionContext', () => ({
  useSessionContext: () => ({
    sessions: [],
    agentName: 'Agent',
  }),
}));

vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({
    liveTranscriptionPreview: false,
    sttInputMode: 'browser',
    sttProvider: 'browser',
  }),
}));

describe('InputBar', () => {
  const originalFetch = global.fetch;
  const originalRequestAnimationFrame = global.requestAnimationFrame;
  const originalCancelAnimationFrame = global.cancelAnimationFrame;
  const originalCreateObjectUrl = global.URL.createObjectURL;
  const originalRevokeObjectUrl = global.URL.revokeObjectURL;

  let uploadConfigResponse: {
    twoModeEnabled: boolean;
    inlineEnabled: boolean;
    fileReferenceEnabled: boolean;
    modeChooserEnabled: boolean;
    inlineAttachmentMaxMb: number;
    inlineImageContextMaxBytes: number;
    inlineImageAutoDowngradeToFileReference: boolean;
    inlineImageShrinkMinDimension: number;
    exposeInlineBase64ToAgent: boolean;
    imageOptimizationEnabled: boolean;
    imageOptimizationMaxDimension: number;
    imageOptimizationWebpQuality: number;
  };

  beforeEach(() => {
    uploadConfigResponse = {
      twoModeEnabled: true,
      inlineEnabled: true,
      fileReferenceEnabled: true,
      modeChooserEnabled: true,
      inlineAttachmentMaxMb: 1,
      inlineImageContextMaxBytes: 32_768,
      inlineImageAutoDowngradeToFileReference: true,
      inlineImageShrinkMinDimension: 512,
      exposeInlineBase64ToAgent: false,
      imageOptimizationEnabled: true,
      imageOptimizationMaxDimension: 2048,
      imageOptimizationWebpQuality: 82,
    };

    vi.mocked(compressImage).mockImplementation(async (file: File) => ({
      base64: `mock-${file.name}`,
      mimeType: file.type || 'application/octet-stream',
      preview: `data:${file.type};base64,mock-${file.name}`,
      width: 1024,
      height: 768,
      bytes: `mock-${file.name}`.length,
      iterations: 1,
      attempts: [],
      targetBytes: 29_491,
      maxBytes: 32_768,
      minDimension: 512,
    }));

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/upload-config')) {
        return {
          ok: true,
          json: async () => uploadConfigResponse,
        } as Response;
      }
      if (url.includes('/api/upload-optimizer')) {
        const payload = typeof init?.body === 'string' ? JSON.parse(init.body) as { path?: string; mimeType?: string } : {};
        const sourcePath = payload.path || '/workspace/optimized-source.png';
        const optimizedPath = sourcePath.replace(/\.[^/.]+$/, '.webp');
        return {
          ok: true,
          json: async () => ({
            ok: true,
            optimized: true,
            original: {
              path: sourcePath,
              uri: `file://${sourcePath}`,
              mimeType: payload.mimeType || 'image/png',
              sizeBytes: 2 * 1024 * 1024,
              width: 4096,
              height: 4096,
            },
            optimizedArtifact: {
              path: optimizedPath,
              uri: `file://${optimizedPath}`,
              mimeType: 'image/webp',
              sizeBytes: 350_000,
              width: 2048,
              height: 2048,
            },
          }),
        } as Response;
      }
      if (url.includes('/api/files/tree')) {
        const parsed = new URL(url, 'http://localhost');
        const dirPath = parsed.searchParams.get('path') || '';
        const entries = dirPath === 'docs'
          ? [{ name: 'nested.txt', path: 'docs/nested.txt', type: 'file', size: 1234, binary: false }]
          : [
            { name: 'docs', path: 'docs', type: 'directory', children: null },
            { name: 'attach-me.png', path: 'attach-me.png', type: 'file', size: 2048, binary: false },
          ];
        return {
          ok: true,
          json: async () => ({
            ok: true,
            root: dirPath || '.',
            entries,
            workspaceInfo: {
              isCustomWorkspace: false,
              rootPath: '/workspace',
            },
          }),
        } as Response;
      }
      if (url.includes('/api/files/resolve')) {
        const parsed = new URL(url, 'http://localhost');
        const targetPath = parsed.searchParams.get('path') || '';
        return {
          ok: true,
          json: async () => ({
            ok: true,
            path: targetPath,
            type: targetPath.endsWith('.png') || targetPath.endsWith('.txt') ? 'file' : 'directory',
            binary: false,
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({ language: 'en' }),
      } as Response;
    }) as typeof fetch;

    global.URL.createObjectURL = vi.fn(() => 'blob:preview');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
    global.URL.createObjectURL = originalCreateObjectUrl;
    global.URL.revokeObjectURL = originalRevokeObjectUrl;
    vi.restoreAllMocks();
  });

  it('re-runs textarea resize after injected text when layout settles', async () => {
    const rafQueue: FrameRequestCallback[] = [];
    global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      rafQueue.push(callback);
      return rafQueue.length;
    }) as typeof requestAnimationFrame;
    global.cancelAnimationFrame = vi.fn((id: number) => {
      if (id > 0 && id <= rafQueue.length) {
        rafQueue[id - 1] = () => {};
      }
    }) as typeof cancelAnimationFrame;

    const ref = createRef<InputBarHandle>();
    render(<InputBar ref={ref} onSend={vi.fn()} isGenerating={false} />);

    const textarea = screen.getByLabelText('Message input') as HTMLTextAreaElement;
    let scrollHeightValue = 42;
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      get: () => scrollHeightValue,
    });

    ref.current?.injectText('Plan context:\n- Title: Mobile composer polish', 'append');

    expect(textarea.style.height).toBe('42px');

    scrollHeightValue = 96;

    const firstFrame = rafQueue.shift();
    expect(firstFrame).toBeDefined();
    firstFrame?.(16);

    const secondFrame = rafQueue.shift();
    expect(secondFrame).toBeDefined();
    secondFrame?.(32);

    await waitFor(() => {
      expect(textarea.style.height).toBe('96px');
    });
  });

  it('shows explicit Upload files and Attach by Path entrypoints in the attachment menu', async () => {
    render(<InputBar onSend={vi.fn()} isGenerating={false} />);

    const menuButton = await screen.findByLabelText('Open attachment menu');
    fireEvent.click(menuButton);

    expect(screen.getByRole('menu', { name: 'Attachment actions' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Upload files/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Attach by Path/i })).toBeInTheDocument();
  });

  it('opens the browser picker from the Upload files menu action', async () => {
    render(<InputBar onSend={vi.fn()} isGenerating={false} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    fireEvent.click(await screen.findByLabelText('Open attachment menu'));
    fireEvent.click(screen.getByRole('menuitem', { name: /Upload files/i }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu', { name: 'Attachment actions' })).not.toBeInTheDocument();
  });

  it('opens the validated workspace path picker from Attach by Path', async () => {
    render(<InputBar onSend={vi.fn()} isGenerating={false} />);

    fireEvent.click(await screen.findByLabelText('Open attachment menu'));
    fireEvent.click(screen.getByRole('menuitem', { name: /Attach by Path/i }));

    expect(await screen.findByRole('dialog', { name: 'Attach by Path' })).toBeInTheDocument();
    expect(await screen.findByText(/Pick a validated workspace \/ server-known file/i)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /attach-me\.png/i })).toBeInTheDocument();
  });

  it('stages Attach by Path selections as server_path file references', async () => {
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} isGenerating={false} />);

    fireEvent.click(await screen.findByLabelText('Open attachment menu'));
    fireEvent.click(screen.getByRole('menuitem', { name: /Attach by Path/i }));

    fireEvent.click(await screen.findByRole('button', { name: /attach-me\.png/i }));
    fireEvent.click(screen.getByRole('button', { name: /Attach selected path/i }));

    await waitFor(() => {
      expect(screen.getAllByText('attach-me.png').length).toBeGreaterThan(0);
      expect(screen.getByText('Path Ref')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledTimes(1);
    });

    const [, attachments, uploadPayload] = onSend.mock.calls[0] as [
      string,
      Array<{ mimeType: string; content: string; name: string }>?,
      {
        descriptors: Array<{
          origin: string;
          mode: string;
          reference?: { kind: string; path: string; uri: string };
        }>;
      }?,
    ];

    expect(attachments).toBeUndefined();
    expect(uploadPayload?.descriptors[0]).toMatchObject({
      origin: 'server_path',
      mode: 'file_reference',
      name: 'attach-me.webp',
      mimeType: 'image/webp',
      reference: {
        kind: 'local_path',
        path: '/workspace/attach-me.webp',
        uri: 'file:///workspace/attach-me.webp',
      },
    });
  });

  it('stages browser uploads as uploads without exposing a file-reference chooser', async () => {
    render(<InputBar onSend={vi.fn()} isGenerating={false} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    await waitFor(() => {
      expect(fileInput.accept).toBe('*/*');
    });

    const smallImage = new File([new Uint8Array(100_000)], 'small.png', { type: 'image/png' });
    const pdf = new File([new Uint8Array(400_000)], 'notes.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, {
      target: { files: [smallImage, pdf] },
    });

    await waitFor(() => {
      expect(screen.getAllByText('Upload').length).toBeGreaterThan(0);
      expect(screen.getByText('small.png')).toBeInTheDocument();
      expect(screen.getByText('notes.pdf')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText('Upload mode for small.png')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Upload mode for notes.pdf')).not.toBeInTheDocument();
    expect(screen.queryByText('File Reference')).not.toBeInTheDocument();
  });

  it('rejects oversized non-image browser uploads with Attach by Path guidance', async () => {
    render(<InputBar onSend={vi.fn()} isGenerating={false} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await waitFor(() => {
      expect(fileInput.accept).toBe('*/*');
    });

    const archive = new File([new Uint8Array(2 * 1024 * 1024)], 'too-big.zip', { type: 'application/zip' });

    fireEvent.change(fileInput, {
      target: { files: [archive] },
    });

    await waitFor(() => {
      expect(screen.getByText(/too large to send as a browser upload/i)).toBeInTheDocument();
      expect(screen.getByText(/use Attach by Path/i)).toBeInTheDocument();
    });
    expect(screen.queryByText('too-big.zip')).not.toBeInTheDocument();
  });

  it('sends inline attachments through existing transport path', async () => {
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} isGenerating={false} />);

    const textarea = screen.getByLabelText('Message input') as HTMLTextAreaElement;
    fireEvent.input(textarea, { target: { value: 'hello' } });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const smallImage = new File([new Uint8Array(80_000)], 'shot.png', { type: 'image/png' });
    fireEvent.change(fileInput, {
      target: { files: [smallImage] },
    });

    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledTimes(1);
    });

    expect(compressImage).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({
        contextMaxBytes: 32_768,
        contextTargetBytes: 29_491,
      }),
    );

    const [text, attachments, uploadPayload] = onSend.mock.calls[0] as [
      string,
      Array<{ mimeType: string; content: string; name: string }>?,
      {
        descriptors: Array<{
          origin: string;
          mode: string;
          preparation?: {
            outcome: string;
            contextSafetyMaxBytes?: number;
            inlineChosenWidth?: number;
            inlineChosenHeight?: number;
            inlineIterations?: number;
            inlineTargetBytes?: number;
          };
        }>;
      }?,
    ];
    expect(text).toBe('hello');
    expect(attachments).toHaveLength(1);
    expect(attachments?.[0]).toMatchObject({
      mimeType: 'image/png',
      content: 'mock-shot.png',
      name: 'shot.png',
    });
    expect(uploadPayload?.descriptors).toHaveLength(1);
    expect(uploadPayload?.descriptors[0].origin).toBe('upload');
    expect(uploadPayload?.descriptors[0].mode).toBe('inline');
    expect(uploadPayload?.descriptors[0].preparation).toMatchObject({
      outcome: 'optimized_inline',
      contextSafetyMaxBytes: 32_768,
      inlineChosenWidth: 1024,
      inlineChosenHeight: 768,
      inlineIterations: 1,
      inlineTargetBytes: 29_491,
    });
  });

  it('blocks oversized browser-uploaded images with honest upload fallback copy', async () => {
    const onSend = vi.fn();
    vi.mocked(compressImage).mockImplementation(async (file: File) => ({
      base64: 'x'.repeat(200_000),
      mimeType: file.type || 'application/octet-stream',
      preview: `data:${file.type};base64,oversized-${file.name}`,
      width: 512,
      height: 512,
      bytes: 150_000,
      iterations: 8,
      attempts: [],
      targetBytes: 29_491,
      maxBytes: 32_768,
      minDimension: 512,
    }));

    render(<InputBar onSend={onSend} isGenerating={false} />);

    const textarea = screen.getByLabelText('Message input') as HTMLTextAreaElement;
    fireEvent.input(textarea, { target: { value: 'handle safely' } });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await waitFor(() => {
      expect(fileInput.accept).toBe('*/*');
    });

    const image = new File([new Uint8Array(2 * 1024 * 1024)], 'oversized-inline.png', { type: 'image/png' });
    Object.defineProperty(image, 'path', {
      configurable: true,
      value: '/workspace/oversized-inline.png',
    });

    fireEvent.change(fileInput, {
      target: { files: [image] },
    });

    await waitFor(() => {
      expect(screen.getByText('oversized-inline.png')).toBeInTheDocument();
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText(/browser uploads cannot preserve a true file-reference fallback/i)).toBeInTheDocument();
      expect(screen.getByText(/use Attach by Path/i)).toBeInTheDocument();
    });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('blocks oversized inline images when no safe file-reference fallback is available', async () => {
    const onSend = vi.fn();
    vi.mocked(compressImage).mockImplementation(async (file: File) => ({
      base64: 'x'.repeat(200_000),
      mimeType: file.type || 'application/octet-stream',
      preview: `data:${file.type};base64,oversized-${file.name}`,
      width: 512,
      height: 512,
      bytes: 150_000,
      iterations: 8,
      attempts: [],
      targetBytes: 29_491,
      maxBytes: 32_768,
      minDimension: 512,
    }));

    render(<InputBar onSend={onSend} isGenerating={false} />);

    const textarea = screen.getByLabelText('Message input') as HTMLTextAreaElement;
    fireEvent.input(textarea, { target: { value: 'this should block' } });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await waitFor(() => {
      expect(fileInput.accept).toBe('*/*');
    });

    const image = new File([new Uint8Array(80_000)], 'oversized-inline.png', { type: 'image/png' });

    fireEvent.change(fileInput, {
      target: { files: [image] },
    });

    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText(/blocked after adaptive inline shrinking reached the minimum dimension/i)).toBeInTheDocument();
    });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('keeps browser uploads on the inline transport path', async () => {
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} isGenerating={false} />);

    const textarea = screen.getByLabelText('Message input') as HTMLTextAreaElement;
    fireEvent.input(textarea, { target: { value: 'ship this file' } });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await waitFor(() => {
      expect(fileInput.accept).toBe('*/*');
    });

    const doc = new File([new Uint8Array(40_000)], 'notes.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, {
      target: { files: [doc] },
    });

    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledTimes(1);
    });

    const [text, attachments, uploadPayload] = onSend.mock.calls[0] as [
      string,
      Array<{ mimeType: string; content: string; name: string }>?,
      {
        descriptors: Array<{
          origin: string;
          mode: string;
          inline?: { base64: string };
          reference?: { kind: string; path: string; uri: string };
        }>;
      }?,
    ];

    expect(text).toBe('ship this file');
    expect(attachments).toHaveLength(1);
    expect(uploadPayload?.descriptors).toHaveLength(1);
    expect(uploadPayload?.descriptors[0]).toMatchObject({
      origin: 'upload',
      mode: 'inline',
      inline: {
        base64: expect.any(String),
      },
    });
    expect(uploadPayload?.descriptors[0].reference).toBeUndefined();
  });

  it('hides manual forwarding controls and forwards path attachments by default', async () => {
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} isGenerating={false} />);

    fireEvent.click(await screen.findByLabelText('Open attachment menu'));
    fireEvent.click(screen.getByRole('menuitem', { name: /Attach by Path/i }));

    fireEvent.click(await screen.findByRole('button', { name: /attach-me\.png/i }));
    fireEvent.click(screen.getByRole('button', { name: /Attach selected path/i }));

    await waitFor(() => {
      expect(screen.getAllByText('attach-me.png').length).toBeGreaterThan(0);
    });

    expect(screen.queryByLabelText(/Allow forwarding .* to subagents/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
    expect(onSend.mock.calls[0][2].descriptors[0].policy.forwardToSubagents).toBe(true);
    expect(onSend.mock.calls[0][2].manifest.allowSubagentForwarding).toBe(true);
  });

  it('forwards inline uploads by default without a forwarding toggle', async () => {
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} isGenerating={false} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await waitFor(() => {
      expect(fileInput.accept).toBe('*/*');
    });

    const smallImage = new File([new Uint8Array(120_000)], 'inline-forwardable.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [smallImage] } });

    expect(screen.queryByLabelText(/Allow forwarding .* to subagents/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
    expect(onSend.mock.calls[0][2].descriptors[0].origin).toBe('upload');
    expect(onSend.mock.calls[0][2].descriptors[0].mode).toBe('inline');
    expect(onSend.mock.calls[0][2].descriptors[0].policy.forwardToSubagents).toBe(true);
    expect(onSend.mock.calls[0][2].manifest.allowSubagentForwarding).toBe(true);
  });

  it('disables the attachment menu when both upload modes are disabled', async () => {
    uploadConfigResponse.inlineEnabled = false;
    uploadConfigResponse.fileReferenceEnabled = false;

    render(<InputBar onSend={vi.fn()} isGenerating={false} />);

    const attachButton = await screen.findByLabelText('Uploads disabled by configuration');
    expect(attachButton).toBeDisabled();
  });

  it('rejects browser uploads when inline uploads are disabled and directs the user to Attach by Path', async () => {
    uploadConfigResponse.inlineEnabled = false;
    uploadConfigResponse.fileReferenceEnabled = true;
    uploadConfigResponse.modeChooserEnabled = false;

    render(<InputBar onSend={vi.fn()} isGenerating={false} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await waitFor(() => {
      expect(fileInput.accept).toBe('*/*');
    });

    const image = new File([new Uint8Array(100_000)], 'vision-off.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [image] } });

    await waitFor(() => {
      expect(screen.getByText(/browser uploads send uploaded bytes, not durable path references/i)).toBeInTheDocument();
      expect(screen.getByText(/use Attach by Path/i)).toBeInTheDocument();
    });
    expect(screen.queryByText('vision-off.png')).not.toBeInTheDocument();
  });

  it('allows large images onto the upload path when only inline mode is enabled', async () => {
    uploadConfigResponse.inlineEnabled = true;
    uploadConfigResponse.fileReferenceEnabled = false;
    uploadConfigResponse.modeChooserEnabled = false;
    uploadConfigResponse.inlineAttachmentMaxMb = 1;

    render(<InputBar onSend={vi.fn()} isGenerating={false} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await waitFor(() => {
      expect(fileInput.accept).toBe('*/*');
    });

    const largeImage = new File([new Uint8Array(2 * 1024 * 1024)], 'too-large-inline.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [largeImage] } });

    await waitFor(() => {
      expect(screen.getByText('too-large-inline.png')).toBeInTheDocument();
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });
    expect(screen.queryByText(/too large to send as a browser upload/i)).not.toBeInTheDocument();
  });
});
