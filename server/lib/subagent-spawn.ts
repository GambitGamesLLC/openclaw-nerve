import path from 'node:path';

export interface ForwardableUploadAttachmentDescriptor {
  id?: string;
  origin?: 'upload' | 'server_path' | string;
  mode?: 'inline' | 'file_reference' | string;
  name?: string;
  mimeType?: string;
  sizeBytes?: number;
  inline?: {
    encoding?: 'base64' | string;
    base64?: string;
  };
  reference?: {
    kind?: 'local_path' | string;
    path?: string;
    uri?: string;
  };
  preparation?: Record<string, unknown>;
  optimization?: Record<string, unknown>;
  policy?: {
    forwardToSubagents?: boolean;
  };
}

export interface ForwardableUploadPayloadLike {
  descriptors?: ForwardableUploadAttachmentDescriptor[];
  manifest?: {
    allowSubagentForwarding?: boolean;
  };
}

export interface SessionsSpawnAttachment {
  name: string;
  content: string;
  encoding: 'base64';
  mimeType?: string;
}

export interface ForwardedServerPathDescriptor {
  id?: string;
  origin?: 'upload' | 'server_path' | string;
  mode: 'file_reference';
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  reference: {
    kind: 'local_path';
    path: string;
    uri?: string;
  };
  preparation?: Record<string, unknown>;
  optimization?: Record<string, unknown>;
  policy?: {
    forwardToSubagents?: boolean;
  };
}

const UPLOAD_MANIFEST_RE = /\n*<nerve-upload-manifest>([\s\S]*?)<\/nerve-upload-manifest>\n*/i;
const FORWARDED_SERVER_PATHS_OPEN = '<nerve-forwarded-server-paths>';
const FORWARDED_SERVER_PATHS_CLOSE = '</nerve-forwarded-server-paths>';

function getForwardedAttachmentName(descriptor: ForwardableUploadAttachmentDescriptor): string | undefined {
  const configuredName = descriptor.name?.trim();
  const localPath = descriptor.reference?.path?.trim();

  if (descriptor.mode === 'file_reference' && descriptor.optimization?.applied === true && localPath) {
    return path.basename(localPath);
  }

  return configuredName;
}

export function extractUploadManifestFromTask(task: string): {
  task: string;
  payload?: ForwardableUploadPayloadLike;
} {
  const match = task.match(UPLOAD_MANIFEST_RE);
  if (!match?.[1]) {
    return { task };
  }

  try {
    const parsed = JSON.parse(match[1]) as { attachments?: unknown };
    const descriptors = Array.isArray(parsed.attachments)
      ? parsed.attachments as ForwardableUploadAttachmentDescriptor[]
      : [];

    return {
      task: task.replace(UPLOAD_MANIFEST_RE, '\n').replace(/\n{3,}/g, '\n\n').trim(),
      payload: { descriptors },
    };
  } catch {
    return { task };
  }
}

export function collectForwardedServerPathDescriptors(
  uploadPayload?: ForwardableUploadPayloadLike,
): ForwardedServerPathDescriptor[] {
  if (!uploadPayload?.descriptors?.length) {
    return [];
  }
  if (uploadPayload.manifest?.allowSubagentForwarding === false) {
    return [];
  }

  const descriptors: ForwardedServerPathDescriptor[] = [];

  for (const descriptor of uploadPayload.descriptors) {
    if (descriptor.policy?.forwardToSubagents !== true) {
      continue;
    }
    if (descriptor.mode !== 'file_reference' || descriptor.reference?.kind !== 'local_path') {
      continue;
    }

    const name = getForwardedAttachmentName(descriptor);
    const localPath = descriptor.reference.path?.trim();
    if (!name || !localPath) {
      continue;
    }

    descriptors.push({
      id: descriptor.id,
      ...(descriptor.origin ? { origin: descriptor.origin } : {}),
      mode: 'file_reference',
      name,
      mimeType: descriptor.mimeType,
      ...(typeof descriptor.sizeBytes === 'number' ? { sizeBytes: descriptor.sizeBytes } : {}),
      reference: {
        kind: 'local_path',
        path: localPath,
        ...(descriptor.reference.uri ? { uri: descriptor.reference.uri } : {}),
      },
      ...(descriptor.preparation ? { preparation: descriptor.preparation } : {}),
      ...(descriptor.optimization ? { optimization: descriptor.optimization } : {}),
      ...(descriptor.policy ? { policy: descriptor.policy } : {}),
    });
  }

  return descriptors;
}

export function appendForwardedServerPathManifest(
  task: string,
  descriptors: ForwardedServerPathDescriptor[],
): string {
  if (descriptors.length === 0) {
    return task;
  }

  const manifest = `${FORWARDED_SERVER_PATHS_OPEN}${JSON.stringify({ version: 1, attachments: descriptors })}${FORWARDED_SERVER_PATHS_CLOSE}`;
  return `${task.trim()}\n\n${manifest}`;
}

export async function buildSessionsSpawnAttachments(
  uploadPayload?: ForwardableUploadPayloadLike,
): Promise<SessionsSpawnAttachment[]> {
  if (!uploadPayload?.descriptors?.length) {
    return [];
  }
  if (uploadPayload.manifest?.allowSubagentForwarding === false) {
    return [];
  }

  const attachments: SessionsSpawnAttachment[] = [];

  for (const descriptor of uploadPayload.descriptors) {
    if (descriptor.policy?.forwardToSubagents !== true) {
      continue;
    }

    const name = getForwardedAttachmentName(descriptor);
    if (!name) {
      continue;
    }

    if (descriptor.mode === 'inline') {
      const base64 = descriptor.inline?.base64?.trim();
      if (!base64 || descriptor.inline?.encoding !== 'base64') {
        continue;
      }
      attachments.push({
        name,
        content: base64,
        encoding: 'base64',
        mimeType: descriptor.mimeType,
      });
      continue;
    }

  }

  return attachments;
}

export async function buildSessionsSpawnArgs(params: {
  task: string;
  label?: string;
  model?: string;
  thinking?: string;
  uploadPayload?: ForwardableUploadPayloadLike;
}): Promise<Record<string, unknown>> {
  const extracted = extractUploadManifestFromTask(params.task);
  const uploadPayload = params.uploadPayload ?? extracted.payload;
  const attachments = await buildSessionsSpawnAttachments(uploadPayload);
  const forwardedServerPaths = collectForwardedServerPathDescriptors(uploadPayload);
  const task = appendForwardedServerPathManifest(extracted.task, forwardedServerPaths);

  return {
    task,
    runtime: 'subagent',
    ...(params.label ? { label: params.label } : {}),
    ...(params.model ? { model: params.model } : {}),
    ...(params.thinking ? { thinking: params.thinking } : {}),
    ...(attachments.length > 0 ? { attachments } : {}),
  };
}
