import fs from 'node:fs/promises';
import path from 'node:path';
import { getWorkspaceRoot, resolveWorkspacePath } from './file-utils.js';
import { getResolvedUploadStagingDir, stageUploadFile } from './upload-staging.js';

export type CanonicalUploadReferenceKind = 'direct_workspace_reference' | 'imported_workspace_reference';
export type WorkspacePathErrorCode = 'INVALID_PATH' | 'OUTSIDE_WORKSPACE' | 'NOT_A_FILE';

export class WorkspacePathError extends Error {
  readonly code: WorkspacePathErrorCode;

  constructor(message: string, code: WorkspacePathErrorCode) {
    super(message);
    this.name = 'WorkspacePathError';
    this.code = code;
  }
}

export interface CanonicalUploadReference {
  kind: CanonicalUploadReferenceKind;
  canonicalPath: string;
  absolutePath: string;
  uri: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
}

function toFileUri(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  if (/^[A-Za-z]:\//.test(normalized)) return `file:///${encodeURI(normalized)}`;
  return `file://${encodeURI(normalized)}`;
}

function isWithinDir(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function toCanonicalWorkspacePath(absolutePath: string, workspaceRoot: string): string {
  const relative = path.relative(workspaceRoot, absolutePath);
  return relative.split(path.sep).join('/');
}

function inferMimeTypeFromName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.webp': return 'image/webp';
    case '.avif': return 'image/avif';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    case '.txt': return 'text/plain';
    case '.md': return 'text/markdown';
    case '.json': return 'application/json';
    case '.pdf': return 'application/pdf';
    case '.mov': return 'video/quicktime';
    case '.mp4': return 'video/mp4';
    default: return 'application/octet-stream';
  }
}

async function buildCanonicalReference(params: {
  kind: CanonicalUploadReferenceKind;
  absolutePath: string;
  originalName: string;
  mimeType?: string;
}): Promise<CanonicalUploadReference> {
  const workspaceRoot = path.resolve(getWorkspaceRoot());
  const realAbsolutePath = await fs.realpath(params.absolutePath);

  if (!isWithinDir(realAbsolutePath, workspaceRoot)) {
    throw new WorkspacePathError('Resolved attachment path is outside the workspace root.', 'OUTSIDE_WORKSPACE');
  }

  const stat = await fs.stat(realAbsolutePath);
  if (!stat.isFile()) {
    throw new WorkspacePathError('Resolved attachment path is not a file.', 'NOT_A_FILE');
  }

  return {
    kind: params.kind,
    canonicalPath: toCanonicalWorkspacePath(realAbsolutePath, workspaceRoot),
    absolutePath: realAbsolutePath,
    uri: toFileUri(realAbsolutePath),
    mimeType: params.mimeType?.trim() || inferMimeTypeFromName(params.originalName),
    sizeBytes: stat.size,
    originalName: params.originalName,
  };
}

export async function resolveDirectWorkspaceReference(relativePath: string): Promise<CanonicalUploadReference> {
  const resolved = await resolveWorkspacePath(relativePath);
  if (!resolved) {
    throw new WorkspacePathError('Invalid or excluded workspace path.', 'INVALID_PATH');
  }

  return buildCanonicalReference({
    kind: 'direct_workspace_reference',
    absolutePath: resolved,
    originalName: path.basename(resolved),
  });
}

export async function importExternalUploadToCanonicalReference(params: {
  originalName: string;
  mimeType?: string;
  bytes: Uint8Array;
}): Promise<CanonicalUploadReference> {
  const workspaceRoot = path.resolve(getWorkspaceRoot());
  const stagingRoot = path.resolve(getResolvedUploadStagingDir());
  const realStagingRoot = await fs.realpath(stagingRoot).catch(() => stagingRoot);

  if (!isWithinDir(realStagingRoot, workspaceRoot)) {
    throw new WorkspacePathError('Resolved attachment path is outside the workspace root.', 'OUTSIDE_WORKSPACE');
  }

  const staged = await stageUploadFile(params);

  return buildCanonicalReference({
    kind: 'imported_workspace_reference',
    absolutePath: staged.path,
    originalName: staged.originalName,
    mimeType: staged.mimeType,
  });
}
