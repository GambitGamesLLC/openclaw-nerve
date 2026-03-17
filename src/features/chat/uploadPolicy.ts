export type UploadMode = 'inline' | 'file_reference';

export interface UploadFeatureConfig {
  twoModeEnabled: boolean;
  inlineEnabled: boolean;
  fileReferenceEnabled: boolean;
  modeChooserEnabled: boolean;
  inlineAttachmentMaxMb: number;
  exposeInlineBase64ToAgent: boolean;
  allowSubagentForwarding: boolean;
}

export const DEFAULT_UPLOAD_FEATURE_CONFIG: UploadFeatureConfig = {
  twoModeEnabled: false,
  inlineEnabled: true,
  fileReferenceEnabled: false,
  modeChooserEnabled: false,
  inlineAttachmentMaxMb: 4,
  exposeInlineBase64ToAgent: false,
  allowSubagentForwarding: false,
};

export function getInlineAttachmentMaxBytes(config: UploadFeatureConfig): number {
  const mb = Number.isFinite(config.inlineAttachmentMaxMb) && config.inlineAttachmentMaxMb > 0
    ? config.inlineAttachmentMaxMb
    : DEFAULT_UPLOAD_FEATURE_CONFIG.inlineAttachmentMaxMb;
  return Math.round(mb * 1024 * 1024);
}

export function shouldShowUploadChooser(config: UploadFeatureConfig): boolean {
  return Boolean(
    config.twoModeEnabled
      && config.inlineEnabled
      && config.fileReferenceEnabled
      && config.modeChooserEnabled,
  );
}

export function isUploadsEnabled(config: UploadFeatureConfig): boolean {
  return config.inlineEnabled || config.fileReferenceEnabled;
}

export function getDefaultUploadMode(file: File, config: UploadFeatureConfig): UploadMode | null {
  if (!isUploadsEnabled(config)) return null;

  if (config.inlineEnabled && config.fileReferenceEnabled) {
    const inlineCap = getInlineAttachmentMaxBytes(config);
    const isSmallImage = file.type.startsWith('image/') && file.size <= inlineCap;
    return isSmallImage ? 'inline' : 'file_reference';
  }

  if (config.inlineEnabled) return 'inline';
  return 'file_reference';
}

export function getInlineModeGuardrailError(file: File, config: UploadFeatureConfig): string | null {
  const maxBytes = getInlineAttachmentMaxBytes(config);
  if (file.size <= maxBytes) return null;

  const maxMbLabel = Number.isInteger(config.inlineAttachmentMaxMb)
    ? String(config.inlineAttachmentMaxMb)
    : config.inlineAttachmentMaxMb.toFixed(1);

  return `"${file.name}" exceeds inline cap (${maxMbLabel}MB).`;
}
