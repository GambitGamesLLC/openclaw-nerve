import { createRef } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputBar, type InputBarHandle } from './InputBar';

vi.mock('./image-compress', () => ({
  compressImage: vi.fn(async (file: File) => ({
    base64: `mock-${file.name}`,
    mimeType: file.type || 'application/octet-stream',
    preview: `data:${file.type};base64,mock-${file.name}`,
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
    exposeInlineBase64ToAgent: boolean;
    allowSubagentForwarding: boolean;
  };

  beforeEach(() => {
    uploadConfigResponse = {
      twoModeEnabled: true,
      inlineEnabled: true,
      fileReferenceEnabled: true,
      modeChooserEnabled: true,
      inlineAttachmentMaxMb: 1,
      exposeInlineBase64ToAgent: false,
      allowSubagentForwarding: false,
    };

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/upload-config')) {
        return {
          ok: true,
          json: async () => uploadConfigResponse,
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

  it('defaults small images inline and large images to file reference when chooser is enabled', async () => {
    render(<InputBar onSend={vi.fn()} isGenerating={false} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    await waitFor(() => {
      expect(fileInput.accept).toBe('*/*');
    });

    const smallImage = new File([new Uint8Array(100_000)], 'small.png', { type: 'image/png' });
    const largeImage = new File([new Uint8Array(2 * 1024 * 1024)], 'large.png', { type: 'image/png' });

    fireEvent.change(fileInput, {
      target: { files: [smallImage, largeImage] },
    });

    await waitFor(() => {
      expect(screen.getByText('Upload mode chooser: INLINE for small images, FILE_REF for larger files.')).toBeInTheDocument();
      expect(screen.getByLabelText('Upload mode for small.png')).toHaveValue('inline');
      expect(screen.getByLabelText('Upload mode for large.png')).toHaveValue('file_reference');
    });
  });

  it('blocks switching oversized files to inline mode with a guardrail warning', async () => {
    render(<InputBar onSend={vi.fn()} isGenerating={false} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await waitFor(() => {
      expect(fileInput.accept).toBe('*/*');
    });

    const largeImage = new File([new Uint8Array(2 * 1024 * 1024)], 'too-big.png', { type: 'image/png' });

    fireEvent.change(fileInput, {
      target: { files: [largeImage] },
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Upload mode for too-big.png')).toHaveValue('file_reference');
    });

    fireEvent.change(screen.getByLabelText('Upload mode for too-big.png'), {
      target: { value: 'inline' },
    });

    await waitFor(() => {
      expect(screen.getByText(/exceeds inline cap/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Upload mode for too-big.png')).toHaveValue('file_reference');
    });
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

    const [text, attachments, uploadPayload] = onSend.mock.calls[0] as [
      string,
      Array<{ mimeType: string; content: string; name: string }>?,
      { descriptors: Array<{ mode: string }> }?,
    ];
    expect(text).toBe('hello');
    expect(attachments).toHaveLength(1);
    expect(attachments?.[0]).toMatchObject({
      mimeType: 'image/png',
      content: 'mock-shot.png',
      name: 'shot.png',
    });
    expect(uploadPayload?.descriptors).toHaveLength(1);
    expect(uploadPayload?.descriptors[0].mode).toBe('inline');
  });

  it('sends file-reference selections as descriptor metadata without inline bytes', async () => {
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} isGenerating={false} />);

    const textarea = screen.getByLabelText('Message input') as HTMLTextAreaElement;
    fireEvent.input(textarea, { target: { value: 'ship this file' } });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await waitFor(() => {
      expect(fileInput.accept).toBe('*/*');
    });

    const largeImage = new File([new Uint8Array(2 * 1024 * 1024)], 'capture.png', { type: 'image/png' });
    Object.defineProperty(largeImage, 'path', {
      configurable: true,
      value: '/workspace/capture.png',
    });

    fireEvent.change(fileInput, {
      target: { files: [largeImage] },
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Upload mode for capture.png')).toHaveValue('file_reference');
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
          mode: string;
          reference?: { kind: string; path: string; uri: string };
          policy: { forwardToSubagents: boolean };
        }>;
      }?,
    ];

    expect(text).toBe('ship this file');
    expect(attachments).toBeUndefined();
    expect(uploadPayload?.descriptors).toHaveLength(1);
    expect(uploadPayload?.descriptors[0].mode).toBe('file_reference');
    expect(uploadPayload?.descriptors[0].reference).toMatchObject({
      kind: 'local_path',
      path: '/workspace/capture.png',
      uri: 'file:///workspace/capture.png',
    });
    expect(uploadPayload?.descriptors[0].policy.forwardToSubagents).toBe(false);
  });

  it('keeps forwarding explicit and opt-in via per-file toggle when allowed', async () => {
    uploadConfigResponse.allowSubagentForwarding = true;

    const onSend = vi.fn();
    render(<InputBar onSend={onSend} isGenerating={false} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await waitFor(() => {
      expect(fileInput.accept).toBe('*/*');
    });

    const largeImage = new File([new Uint8Array(2 * 1024 * 1024)], 'forwardable.png', { type: 'image/png' });
    Object.defineProperty(largeImage, 'path', {
      configurable: true,
      value: '/workspace/forwardable.png',
    });

    fireEvent.change(fileInput, { target: { files: [largeImage] } });

    const toggle = await screen.findByLabelText('Allow forwarding forwardable.png to subagents');
    expect(toggle).not.toBeChecked();

    fireEvent.click(screen.getByLabelText('Send message'));
    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
    expect(onSend.mock.calls[0][2].descriptors[0].policy.forwardToSubagents).toBe(false);

    onSend.mockClear();
    fireEvent.change(fileInput, { target: { files: [largeImage] } });
    const toggleSecondPass = await screen.findByLabelText('Allow forwarding forwardable.png to subagents');
    fireEvent.click(toggleSecondPass);
    fireEvent.click(screen.getByLabelText('Send message'));
    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1));
    expect(onSend.mock.calls[0][2].descriptors[0].policy.forwardToSubagents).toBe(true);
  });

  it('disables attach when both upload modes are disabled', async () => {
    uploadConfigResponse.inlineEnabled = false;
    uploadConfigResponse.fileReferenceEnabled = false;

    render(<InputBar onSend={vi.fn()} isGenerating={false} />);

    const attachButton = await screen.findByLabelText('Uploads disabled by configuration');
    expect(attachButton).toBeDisabled();
  });

  it('shows file-reference-only image warning when inline uploads are disabled', async () => {
    uploadConfigResponse.inlineEnabled = false;
    uploadConfigResponse.fileReferenceEnabled = true;
    uploadConfigResponse.modeChooserEnabled = false;

    render(<InputBar onSend={vi.fn()} isGenerating={false} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await waitFor(() => {
      expect(fileInput.accept).toBe('*/*');
    });

    const image = new File([new Uint8Array(100_000)], 'vision-off.png', { type: 'image/png' });
    Object.defineProperty(image, 'path', {
      configurable: true,
      value: '/workspace/vision-off.png',
    });

    fireEvent.change(fileInput, { target: { files: [image] } });

    await waitFor(() => {
      expect(screen.getByText('Inline vision disabled; image sent as file reference only.')).toBeInTheDocument();
      expect(screen.getByText('File Ref')).toBeInTheDocument();
    });
  });

  it('shows large-file guidance when only inline mode is enabled', async () => {
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
      expect(screen.getByText(/File exceeds inline cap; enable file-reference mode or choose a smaller file/i)).toBeInTheDocument();
    });
  });

  it('rejects file-reference-only uploads that do not expose a local path', async () => {
    uploadConfigResponse.inlineEnabled = false;
    uploadConfigResponse.fileReferenceEnabled = true;
    uploadConfigResponse.modeChooserEnabled = false;

    render(<InputBar onSend={vi.fn()} isGenerating={false} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await waitFor(() => {
      expect(fileInput.accept).toBe('*/*');
    });

    const file = new File([new Uint8Array(100_000)], 'browser-file.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/does not expose a local path for file-reference mode/i)).toBeInTheDocument();
    });
  });
});
