import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Mic, Paperclip, X, Loader2, ArrowUp, FileText } from 'lucide-react';
import { useVoiceInput } from '@/features/voice/useVoiceInput';
import { useTabCompletion } from '@/hooks/useTabCompletion';
import { useInputHistory } from '@/hooks/useInputHistory';
import { useSessionContext } from '@/contexts/SessionContext';
import { useSettings } from '@/contexts/SettingsContext';
import { MAX_ATTACHMENTS } from '@/lib/constants';
import { compressImage } from './image-compress';
import { mergeAddToChatText } from './addToChat';
import type { FileUploadReference, ImageAttachment, OutgoingUploadPayload, UploadAttachmentDescriptor } from './types';
import {
  DEFAULT_UPLOAD_FEATURE_CONFIG,
  getDefaultUploadMode,
  getInlineAttachmentMaxBytes,
  getInlineModeGuardrailError,
  isUploadsEnabled,
  shouldShowUploadChooser,
  type UploadFeatureConfig,
  type UploadMode,
} from './uploadPolicy';

interface InputBarProps {
  onSend: (text: string, attachments?: ImageAttachment[], uploadPayload?: OutgoingUploadPayload) => void;
  isGenerating: boolean;
  onWakeWordState?: (enabled: boolean, toggle: () => void) => void;
  /** Agent name for dynamic wake phrase (e.g., "Hey Helena") */
  agentName?: string;
}

export interface InputBarHandle {
  focus: () => void;
  injectText: (text: string, mode?: 'replace' | 'append') => void;
}

interface StagedAttachment {
  id: string;
  file: File;
  mode: UploadMode;
  forwardToSubagents: boolean;
  previewUrl?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error(`Failed to read "${file.name}" as base64.`));
    };
    reader.onerror = () => reject(new Error(`Failed to read "${file.name}" as base64.`));
    reader.readAsDataURL(file);
  });
}

function getBase64ByteLength(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function buildFileUriFromPath(path: string): string {
  if (path.startsWith('file://')) return path;

  const normalized = path.replace(/\\/g, '/');
  if (/^[A-Za-z]:\//.test(normalized)) {
    return `file:///${encodeURI(normalized)}`;
  }
  if (normalized.startsWith('/')) {
    return `file://${encodeURI(normalized)}`;
  }
  return `file:///${encodeURI(normalized)}`;
}

function resolveFileReference(file: File): FileUploadReference {
  const fileWithPath = file as File & { path?: string; webkitRelativePath?: string };
  const maybePath = fileWithPath.path || fileWithPath.webkitRelativePath;
  if (!maybePath) {
    throw new Error(`"${file.name}" does not expose a local path for file-reference mode.`);
  }

  const path = maybePath.startsWith('file://')
    ? decodeURI(maybePath.replace(/^file:\/\//, ''))
    : maybePath;

  return {
    kind: 'local_path',
    path,
    uri: buildFileUriFromPath(path),
  };
}

function hasResolvableLocalPath(file: File): boolean {
  const fileWithPath = file as File & { path?: string; webkitRelativePath?: string };
  return Boolean(fileWithPath.path || fileWithPath.webkitRelativePath);
}

/** Chat input bar with file attachments, voice input, and model effort selector. */
export const InputBar = forwardRef<InputBarHandle, InputBarProps>(function InputBar({ onSend, isGenerating, onWakeWordState, agentName = 'Agent' }, ref) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deferredResizeFrameRef = useRef<number | null>(null);
  const deferredResizeSettledFrameRef = useRef<number | null>(null);
  const [stagedAttachments, setStagedAttachments] = useState<StagedAttachment[]>([]);
  const [uploadConfig, setUploadConfig] = useState<UploadFeatureConfig>(DEFAULT_UPLOAD_FEATURE_CONFIG);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreparingInline, setIsPreparingInline] = useState(false);
  const [sendPulse, setSendPulse] = useState(false);
  const [sendError, setSendError] = useState(false);

  const uploadsEnabled = isUploadsEnabled(uploadConfig);
  const showModeChooser = shouldShowUploadChooser(uploadConfig);

  // Persistent command history (terminal-style up/down navigation)
  const inputHistory = useInputHistory();

  // Tab completion for session names
  const { sessions, agentName: ctxAgentName } = useSessionContext();
  const { liveTranscriptionPreview, sttInputMode, sttProvider } = useSettings();
  const getSessionLabels = useMemo(() => {
    // Build a closure that returns current session labels
    const labels = sessions.map((s) => {
      const sessionKey = s.sessionKey || s.key || s.id || '';
      return (
        s.label ||
        (sessionKey === 'agent:main:main'
          ? `${ctxAgentName} (main)`
          : sessionKey.split(':').pop()?.slice(0, 10) || sessionKey)
      );
    });
    return () => labels;
  }, [sessions, ctxAgentName]);

  const { handleKeyDown: handleTabKey, reset: resetTabCompletion } = useTabCompletion(getSessionLabels, inputRef);

  const resizeInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 160) + 'px';
  }, []);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
    // Add brief highlight animation
    inputRef.current?.classList.add('ring-2', 'ring-primary', 'ring-offset-1');
    setTimeout(() => {
      inputRef.current?.classList.remove('ring-2', 'ring-primary', 'ring-offset-1');
    }, 500);
  }, []);

  const scheduleDeferredResize = useCallback(() => {
    if (deferredResizeFrameRef.current !== null) {
      cancelAnimationFrame(deferredResizeFrameRef.current);
    }
    if (deferredResizeSettledFrameRef.current !== null) {
      cancelAnimationFrame(deferredResizeSettledFrameRef.current);
    }

    deferredResizeFrameRef.current = requestAnimationFrame(() => {
      resizeInput();
      deferredResizeSettledFrameRef.current = requestAnimationFrame(() => {
        resizeInput();
        const input = inputRef.current;
        if (!input) return;
        input.setSelectionRange(input.value.length, input.value.length);
      });
    });
  }, [resizeInput]);

  useEffect(() => () => {
    if (deferredResizeFrameRef.current !== null) {
      cancelAnimationFrame(deferredResizeFrameRef.current);
    }
    if (deferredResizeSettledFrameRef.current !== null) {
      cancelAnimationFrame(deferredResizeSettledFrameRef.current);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/upload-config', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (controller.signal.aborted || !data) return;
        const nextConfig: UploadFeatureConfig = {
          twoModeEnabled: Boolean(data.twoModeEnabled),
          inlineEnabled: Boolean(data.inlineEnabled),
          fileReferenceEnabled: Boolean(data.fileReferenceEnabled),
          modeChooserEnabled: Boolean(data.modeChooserEnabled),
          inlineAttachmentMaxMb:
            typeof data.inlineAttachmentMaxMb === 'number' && data.inlineAttachmentMaxMb > 0
              ? data.inlineAttachmentMaxMb
              : DEFAULT_UPLOAD_FEATURE_CONFIG.inlineAttachmentMaxMb,
          exposeInlineBase64ToAgent: Boolean(data.exposeInlineBase64ToAgent),
          allowSubagentForwarding: Boolean(data.allowSubagentForwarding),
        };
        setUploadConfig(nextConfig);
      })
      .catch((err) => {
        if ((err as DOMException)?.name === 'AbortError') return;
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (uploadsEnabled) return;
    if (stagedAttachments.length > 0) {
      stagedAttachments.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setStagedAttachments([]);
    }
  }, [uploadsEnabled, stagedAttachments]);

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: focusInput,
    injectText: (text: string, mode: 'replace' | 'append' = 'append') => {
      const input = inputRef.current;
      if (!input) return;

      input.value = mode === 'append'
        ? mergeAddToChatText(input.value, text)
        : text;
      resizeInput();
      focusInput();
      scheduleDeferredResize();
      input.setSelectionRange(input.value.length, input.value.length);
      resetTabCompletion();
    },
  }), [focusInput, resetTabCompletion, resizeInput, scheduleDeferredResize]);

  // Fetch current language for voice phrase matching
  const [voiceLang, setVoiceLang] = useState('en');
  const [voicePhrasesVersion, setVoicePhrasesVersion] = useState(0);

  useEffect(() => {
    let currentController: AbortController | null = null;

    const fetchLang = () => {
      currentController?.abort();
      const controller = new AbortController();
      currentController = controller;

      fetch('/api/language', { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!controller.signal.aborted && data?.language) {
            setVoiceLang(data.language);
          }
        })
        .catch((err) => {
          if ((err as DOMException)?.name === 'AbortError') return;
        });
    };

    const handlePhrasesChanged = () => {
      setVoicePhrasesVersion((v) => v + 1);
    };

    fetchLang();
    // Listen for language changes from settings
    window.addEventListener('nerve:language-changed', fetchLang);
    window.addEventListener('nerve:voice-phrases-changed', handlePhrasesChanged);
    return () => {
      window.removeEventListener('nerve:language-changed', fetchLang);
      window.removeEventListener('nerve:voice-phrases-changed', handlePhrasesChanged);
      currentController?.abort();
    };
  }, []);

  const effectiveSttInputMode = sttProvider === 'openai' ? 'local' : sttInputMode;

  const { voiceState, interimTranscript, wakeWordEnabled, toggleWakeWord, error: voiceError, clearError: clearVoiceError } = useVoiceInput((text) => {
    const input = inputRef.current;
    if (input) {
      input.value = '';
      input.style.height = 'auto';
      input.style.fontStyle = '';
      input.style.opacity = '';
    }
    onSend('[voice] ' + text);
  }, agentName, voiceLang, voicePhrasesVersion, effectiveSttInputMode);

  // Live transcription preview: write interim transcript to textarea during recording
  useEffect(() => {
    if (!inputRef.current) return;

    if (!liveTranscriptionPreview) {
      // Ensure temporary preview styling is removed when feature is disabled.
      inputRef.current.style.fontStyle = '';
      inputRef.current.style.opacity = '';
      return;
    }

    if (voiceState === 'recording') {
      if (interimTranscript) {
        inputRef.current.value = interimTranscript;
        inputRef.current.style.fontStyle = 'italic';
        inputRef.current.style.opacity = '0.5';
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + 'px';
      } else {
        inputRef.current.value = '';
        inputRef.current.style.height = 'auto';
      }
    } else {
      // Clear provisional styling when not recording
      const hadVoicePreviewStyling =
        inputRef.current.style.fontStyle === 'italic' || inputRef.current.style.opacity === '0.5';
      inputRef.current.style.fontStyle = '';
      inputRef.current.style.opacity = '';
      if (voiceState === 'transcribing' || hadVoicePreviewStyling) {
        inputRef.current.value = '';
        inputRef.current.style.height = 'auto';
      }
    }
  }, [interimTranscript, liveTranscriptionPreview, voiceState]);

  const processFiles = useCallback((files: FileList | File[]) => {
    const selected = Array.from(files);
    if (selected.length === 0) return;
    setAttachmentError(null);

    if (!uploadsEnabled) {
      setAttachmentError('Uploads are disabled by configuration.');
      return;
    }

    const availableSlots = MAX_ATTACHMENTS - stagedAttachments.length;
    if (availableSlots <= 0) {
      setAttachmentError(`You can attach up to ${MAX_ATTACHMENTS} files per message.`);
      return;
    }

    const filesToStage = selected.slice(0, availableSlots);
    if (selected.length > availableSlots) {
      setAttachmentError(`Only ${MAX_ATTACHMENTS} files are allowed per message.`);
    }

    const inlineCapBytes = getInlineAttachmentMaxBytes(uploadConfig);
    const next: StagedAttachment[] = [];
    let firstError: string | null = null;

    for (const file of filesToStage) {
      const defaultMode = getDefaultUploadMode(file, uploadConfig);
      if (!defaultMode) {
        firstError ||= 'Uploads are disabled by configuration.';
        continue;
      }

      if (defaultMode === 'inline' && file.size > inlineCapBytes && !uploadConfig.fileReferenceEnabled) {
        const maxMb = uploadConfig.inlineAttachmentMaxMb;
        firstError ||= `File exceeds inline cap; enable file-reference mode or choose a smaller file (${maxMb}MB max).`;
        continue;
      }

      if (defaultMode === 'file_reference' && !hasResolvableLocalPath(file) && !uploadConfig.inlineEnabled) {
        firstError ||= `"${file.name}" does not expose a local path for file-reference mode. Enable inline mode or choose a local file.`;
        continue;
      }

      if (!uploadConfig.inlineEnabled && uploadConfig.fileReferenceEnabled && file.type.startsWith('image/')) {
        firstError ||= 'Inline vision disabled; image sent as file reference only.';
      }

      next.push({
        id: crypto.randomUUID ? crypto.randomUUID() : `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        mode: defaultMode,
        forwardToSubagents: false,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      });
    }

    if (next.length > 0) {
      setStagedAttachments((prev) => [...prev, ...next]);
    }
    if (firstError) {
      setAttachmentError(firstError);
    }
  }, [stagedAttachments.length, uploadConfig, uploadsEnabled]);

  // Drag & drop handlers (exposed via className on parent)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  // Paste images — use ref to avoid re-registering on every stagedAttachments change
  const processFilesRef = useRef(processFiles);
  useEffect(() => {
    processFilesRef.current = processFiles;
  }, [processFiles]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageItems: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) imageItems.push(file);
        }
      }
      if (imageItems.length > 0) {
        e.preventDefault();
        processFilesRef.current(imageItems);
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const updateAttachmentMode = useCallback((id: string, nextMode: UploadMode) => {
    setAttachmentError(null);

    setStagedAttachments((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      if (nextMode === 'inline') {
        const guardrail = getInlineModeGuardrailError(item.file, uploadConfig);
        if (guardrail) {
          if (uploadConfig.fileReferenceEnabled) {
            setAttachmentError(`${guardrail} Keep this file as File Reference.`);
            return { ...item, mode: 'file_reference' };
          }
          setAttachmentError('File exceeds inline cap; enable file-reference mode or choose smaller file.');
          return item;
        }
      }
      return { ...item, mode: nextMode };
    }));
  }, [uploadConfig]);

  const toggleForwarding = useCallback((id: string, enabled: boolean) => {
    setStagedAttachments((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      return { ...item, forwardToSubagents: enabled };
    }));
  }, []);

  const removeStagedAttachment = useCallback((id: string) => {
    setStagedAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
    setAttachmentError(null);
  }, []);

  const clearStagedAttachments = useCallback(() => {
    setStagedAttachments((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return [];
    });
  }, []);

  // Report wake word state to parent
  useEffect(() => {
    onWakeWordState?.(wakeWordEnabled, toggleWakeWord);
  }, [wakeWordEnabled, toggleWakeWord, onWakeWordState]);

  const buildInlineAttachment = useCallback(async (item: StagedAttachment): Promise<ImageAttachment> => {
    if (item.file.type.startsWith('image/')) {
      const { base64, mimeType, preview } = await compressImage(item.file);
      return {
        id: item.id,
        mimeType,
        content: base64,
        preview,
        name: item.file.name,
      };
    }

    const dataUrl = await readAsDataUrl(item.file);
    const [, base64 = ''] = dataUrl.split(',', 2);
    return {
      id: item.id,
      mimeType: item.file.type || 'application/octet-stream',
      content: base64,
      preview: dataUrl,
      name: item.file.name,
    };
  }, []);

  const buildInlineDescriptor = useCallback((item: StagedAttachment, attachment: ImageAttachment): UploadAttachmentDescriptor => ({
    id: item.id,
    mode: 'inline',
    name: item.file.name,
    mimeType: attachment.mimeType,
    sizeBytes: item.file.size,
    inline: {
      encoding: 'base64',
      base64: attachment.content,
      base64Bytes: getBase64ByteLength(attachment.content),
      previewUrl: attachment.preview,
      compressed: item.file.type.startsWith('image/'),
    },
    policy: {
      forwardToSubagents: false,
    },
  }), []);

  const buildFileReferenceDescriptor = useCallback((item: StagedAttachment): UploadAttachmentDescriptor => ({
    id: item.id,
    mode: 'file_reference',
    name: item.file.name,
    mimeType: item.file.type || 'application/octet-stream',
    sizeBytes: item.file.size,
    reference: resolveFileReference(item.file),
    policy: {
      forwardToSubagents: item.forwardToSubagents,
    },
  }), []);

  const handleSend = useCallback(async () => {
    const text = inputRef.current?.value.trim();
    if (!text && stagedAttachments.length === 0) {
      // Shake on empty send attempt
      setSendError(true);
      setTimeout(() => setSendError(false), 400);
      return;
    }

    const inlineGuardrailViolation = stagedAttachments
      .filter((item) => item.mode === 'inline')
      .map((item) => getInlineModeGuardrailError(item.file, uploadConfig))
      .find(Boolean);
    if (inlineGuardrailViolation) {
      setAttachmentError(inlineGuardrailViolation);
      return;
    }

    // Add to persistent command history (deduplication handled by hook)
    if (text) inputHistory.addToHistory(text);

    setIsPreparingInline(true);
    try {
      const inlineAttachments: ImageAttachment[] = [];
      const descriptors: UploadAttachmentDescriptor[] = [];

      for (const item of stagedAttachments) {
        if (item.mode === 'inline') {
          const inlineAttachment = await buildInlineAttachment(item);
          inlineAttachments.push(inlineAttachment);
          descriptors.push(buildInlineDescriptor(item, inlineAttachment));
          continue;
        }

        descriptors.push(buildFileReferenceDescriptor(item));
      }

      const uploadPayload: OutgoingUploadPayload | undefined = descriptors.length > 0
        ? {
          descriptors,
          manifest: {
            enabled: uploadConfig.twoModeEnabled,
            exposeInlineBase64ToAgent: uploadConfig.exposeInlineBase64ToAgent,
            allowSubagentForwarding: uploadConfig.allowSubagentForwarding,
          },
        }
        : undefined;

      // Trigger pulse animation on successful send
      setSendPulse(true);
      setTimeout(() => setSendPulse(false), 400);

      const input = inputRef.current;
      if (input) {
        input.value = '';
        input.style.height = 'auto';
      }

      onSend(text || '', inlineAttachments.length > 0 ? inlineAttachments : undefined, uploadPayload);
      clearStagedAttachments();
      setAttachmentError(null);
      clearVoiceError();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to prepare attachment payload.';
      if (message.includes('does not expose a local path')) {
        setAttachmentError(`${message} Choose inline mode when available or attach from a local workspace path.`);
      } else {
        setAttachmentError(message);
      }
    } finally {
      setIsPreparingInline(false);
    }
  }, [
    stagedAttachments,
    uploadConfig,
    inputHistory,
    buildInlineAttachment,
    buildInlineDescriptor,
    buildFileReferenceDescriptor,
    onSend,
    clearStagedAttachments,
    clearVoiceError,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME composition guard: during active CJK composition the browser may
    // fire keydown for Enter/Escape/etc.  Let the IME handle them – acting
    // on these events causes ghost messages (issue #65).
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;

    // Tab completion for session names (Tab cycles, Escape cancels)
    if (e.key === 'Tab' || e.key === 'Escape') {
      const consumed = handleTabKey(e as React.KeyboardEvent<HTMLTextAreaElement>);
      if (consumed) return;
    }

    // Escape clears history navigation and returns to empty input
    if (e.key === 'Escape' && inputHistory.isNavigating()) {
      e.preventDefault();
      inputHistory.reset();
      const input = inputRef.current;
      if (input) {
        input.value = '';
        input.style.height = 'auto';
      }
      return;
    }

    // Cmd+Enter or Ctrl+Enter to send (works even with Shift held)
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSend();
      return;
    }
    // Plain Enter sends (Shift+Enter for newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
      return;
    }

    // Up arrow — navigate to older history (only when cursor at start or input is empty)
    if (e.key === 'ArrowUp' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      const input = inputRef.current;
      if (!input) return;

      // Only trigger if cursor is at the beginning or input is single line
      const isAtStart = input.selectionStart === 0 && input.selectionEnd === 0;
      const isSingleLine = !input.value.includes('\n');

      if (isAtStart || isSingleLine) {
        const entry = inputHistory.navigateUp(input.value);
        if (entry !== null) {
          e.preventDefault();
          input.value = entry;
          input.style.height = 'auto';
          input.style.height = Math.min(input.scrollHeight, 160) + 'px';
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
      return;
    }

    // Down arrow — navigate to newer history or back to draft
    if (e.key === 'ArrowDown' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      if (inputHistory.isNavigating()) {
        const input = inputRef.current;
        if (!input) return;
        e.preventDefault();

        const entry = inputHistory.navigateDown();
        if (entry !== null) {
          input.value = entry;
        } else {
          input.value = '';
        }
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 160) + 'px';
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  };

  const handleInput = () => {
    if (!inputRef.current) return;
    resetTabCompletion();
    clearVoiceError();
    resizeInput();
  };

  const fileAccept = uploadConfig.fileReferenceEnabled || uploadConfig.twoModeEnabled ? '*/*' : 'image/*';

  return (
    <>
      {/* Drag overlay — rendered by parent via dragHandlers */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center pointer-events-none">
          <span className="text-primary font-bold text-lg">Drop files here</span>
        </div>
      )}

      {/* Staged attachments preview */}
      {stagedAttachments.length > 0 && (
        <div className="flex flex-col gap-2 px-4 py-2 bg-card border-t border-border">
          {showModeChooser && (
            <div className="text-[10px] text-muted-foreground">Upload mode chooser: INLINE for small images, FILE_REF for larger files.</div>
          )}
          <div className="flex gap-2 flex-wrap">
            {stagedAttachments.map((item) => (
              <div key={item.id} className="relative group border border-border rounded px-2 py-1.5 bg-background min-w-[190px] max-w-[260px]">
                <button
                  onClick={() => removeStagedAttachment(item.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] opacity-80 hover:opacity-100 cursor-pointer"
                >
                  <X size={10} />
                </button>

                <div className="flex items-center gap-2 pr-3">
                  {item.previewUrl ? (
                    <img src={item.previewUrl} alt={item.file.name} className="w-10 h-10 object-cover rounded border border-border" />
                  ) : (
                    <div className="w-10 h-10 rounded border border-border flex items-center justify-center bg-muted">
                      <FileText size={14} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] truncate">{item.file.name}</div>
                    <div className="text-[10px] text-muted-foreground">{formatFileSize(item.file.size)}</div>
                    {!showModeChooser && (
                      <div className="text-[9px] mt-0.5 text-primary/90 uppercase">{item.mode === 'inline' ? 'Inline' : 'File Ref'}</div>
                    )}
                  </div>
                </div>

                {showModeChooser && (
                  <div className="mt-1">
                    <label className="text-[9px] text-muted-foreground uppercase tracking-wide">Mode</label>
                    <select
                      aria-label={`Upload mode for ${item.file.name}`}
                      value={item.mode}
                      onChange={(e) => updateAttachmentMode(item.id, e.target.value as UploadMode)}
                      className="w-full mt-0.5 text-[10px] bg-card border border-border rounded px-1.5 py-1"
                    >
                      <option value="inline">Inline</option>
                      <option value="file_reference">File Reference</option>
                    </select>
                  </div>
                )}

                {uploadConfig.allowSubagentForwarding && item.mode === 'file_reference' && (
                  <label className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      aria-label={`Allow forwarding ${item.file.name} to subagents`}
                      checked={item.forwardToSubagents}
                      onChange={(e) => toggleForwarding(item.id, e.target.checked)}
                      className="h-3 w-3 rounded border-border"
                    />
                    Forward to subagents
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {attachmentError && (
        <div className="px-4 pb-1.5 text-[10px] text-destructive bg-card">{attachmentError}</div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={fileAccept}
        multiple
        className="hidden"
        onChange={e => { if (e.target.files) { processFiles(e.target.files); e.target.value = ''; } }}
      />
      {/* Input row */}
      <div
        className={`flex items-center gap-0 border-t shrink-0 bg-card focus-within:border-t-primary/40 focus-within:shadow-[0_-1px_8px_rgba(232,168,56,0.1)] ${voiceState === 'recording' ? 'border-t-red-500 shadow-[0_-1px_12px_rgba(239,68,68,0.3)]' : 'border-border'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {voiceState === 'recording' ? (
          <span className="pl-3.5 shrink-0 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <Mic size={14} className="text-red-500" />
          </span>
        ) : voiceState === 'transcribing' ? (
          <span className="pl-3.5 shrink-0 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <Mic size={14} className="text-primary" />
          </span>
        ) : (
          <span className="text-primary text-base font-bold pl-3.5 shrink-0 animate-prompt-pulse">›</span>
        )}
        {/* Uncontrolled textarea — value is read/written via inputRef.
            This is intentional: useTabCompletion and history navigation
            set input.value directly, which is safe without a `value` prop.
            Do NOT add a `value={state}` prop without also passing a
            setValue callback to useTabCompletion. */}
        <textarea
          ref={inputRef}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Message..."
          aria-label="Message input"
          rows={1}
          className="flex-1 font-mono text-[13px] bg-transparent text-foreground border-none px-2.5 py-3 resize-none outline-none min-h-[42px] max-h-[160px]"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!uploadsEnabled}
          className="bg-transparent border-none text-muted-foreground hover:text-primary cursor-pointer px-2 self-stretch flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          title={uploadsEnabled ? 'Attach file' : 'Uploads disabled by configuration'}
          aria-label={uploadsEnabled ? 'Attach file' : 'Uploads disabled by configuration'}
        >
          <Paperclip size={16} />
        </button>
        <button
          onClick={() => { void handleSend(); }}
          disabled={isGenerating || isPreparingInline}
          aria-label={isGenerating ? 'Generating response...' : (isPreparingInline ? 'Preparing attachments...' : 'Send message')}
          aria-busy={isGenerating || isPreparingInline}
          className={`send-btn font-mono bg-primary text-primary-foreground border-none px-4.5 text-sm cursor-pointer font-bold self-stretch flex items-center justify-center transition-transform ${isGenerating || isPreparingInline ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 active:scale-95'} ${sendPulse ? 'animate-send-pulse' : ''} ${sendError ? 'animate-shake' : ''}`}
        >
          {isGenerating || isPreparingInline ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <ArrowUp size={16} aria-hidden="true" />}
        </button>
      </div>
      <div className="text-[10px] text-muted-foreground px-4 pb-1.5 pl-10 bg-card">
        {voiceState === 'recording'
          ? 'Recording… Left Shift to send · Double Left Shift to discard'
          : voiceState === 'transcribing'
          ? 'Transcribing…'
          : 'Enter or ⌘Enter to send · Shift+Enter for newline · Double Left Shift for voice · Ctrl+F search'}
      </div>
      {voiceError && (
        <div className="text-[10px] text-destructive px-4 pb-1.5 pl-10 bg-card" role="alert">
          {voiceError}
        </div>
      )}
    </>
  );
});
