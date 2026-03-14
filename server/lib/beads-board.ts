/**
 * Server-side Beads board adapter.
 *
 * Resolves an env-configured Beads source, shells out to `bd` inside that repo,
 * and projects Beads issues into a four-column Beads-native board DTO.
 * @module
 */

import { execFile as execFileCallback } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { type BeadsSource } from './config.js';
import {
  resolveRepoPlanLinkForBead,
  type LinkedPlanResolution,
  type LinkedPlanResolutionState,
  type PlanLinkMetadata,
} from './plans.js';
import { listManagedBeadsSourceDtos, resolveManagedBeadsSource, type ManagedBeadsSourceDto } from './beads-sources.js';

const execFile = promisify(execFileCallback);

export type BeadsBoardColumnKey = 'todo' | 'in_progress' | 'done' | 'closed';

export type BeadsSourceDto = ManagedBeadsSourceDto;

export interface LinkedPlanSummaryDto {
  path: string | null;
  title: string;
  planId: string | null;
  archived: boolean;
  status: string | null;
  updatedAt: number | null;
  resolution: LinkedPlanResolutionState;
  lastKnownPath: string | null;
  movedFromPath: string | null;
}

export interface BeadsBoardCardDto {
  id: string;
  title: string;
  description: string | null;
  rawStatus: string;
  columnKey: BeadsBoardColumnKey;
  priority: number | null;
  issueType: string | null;
  owner: string | null;
  labels: string[];
  createdAt: string | null;
  updatedAt: string | null;
  closedAt: string | null;
  dependencyCount: number;
  dependentCount: number;
  commentCount: number;
  linkedPlan: LinkedPlanSummaryDto | null;
}

export interface BeadsBoardColumnDto {
  key: BeadsBoardColumnKey;
  title: string;
  itemCount: number;
  items: BeadsBoardCardDto[];
}

export interface BeadsBoardDto {
  source: BeadsSourceDto;
  generatedAt: string;
  totalCount: number;
  columns: BeadsBoardColumnDto[];
}

interface BdIssueExportItem {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  issue_type?: unknown;
  owner?: unknown;
  labels?: unknown;
  metadata?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  closed_at?: unknown;
  dependency_count?: unknown;
  dependent_count?: unknown;
  comment_count?: unknown;
}

interface BeadMetadataRoot {
  plan?: unknown;
  [key: string]: unknown;
}

const planMetadataSyncCache = new Map<string, string>();

export class InvalidBeadsSourceError extends Error {
  constructor(sourceId?: string | null) {
    super(sourceId ? `Unknown Beads source: ${sourceId}` : 'No Beads source could be resolved');
    this.name = 'InvalidBeadsSourceError';
  }
}

export class BeadsAdapterError extends Error {
  readonly sourceId: string;
  readonly stderr: string;

  constructor(sourceId: string, message: string, stderr = '') {
    super(message);
    this.name = 'BeadsAdapterError';
    this.sourceId = sourceId;
    this.stderr = stderr;
  }
}

function toSourceDto(source: BeadsSource): BeadsSourceDto {
  return listManagedBeadsSourceDtos().find((entry) => entry.id === source.id) ?? {
    id: source.id,
    label: source.label,
    kind: source.kind,
    isDefault: false,
    isCustom: false,
  };
}

function normalizeString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getPreferredLocalBinDirs(): string[] {
  const home = process.env.HOME || os.homedir();
  return [
    path.join(home, '.local', 'bin'),
    path.join(home, '.npm-global', 'bin'),
    path.join(home, '.volta', 'bin'),
    path.join(home, '.bun', 'bin'),
  ];
}

function buildRuntimePath(basePath?: string): string {
  const segments = [...getPreferredLocalBinDirs(), ...(basePath || '').split(':').filter(Boolean)];
  return [...new Set(segments)].join(':');
}

function resolveBdBin(): string {
  if (process.env.BD_BIN?.trim()) return process.env.BD_BIN.trim();

  for (const dir of getPreferredLocalBinDirs()) {
    const candidate = path.join(dir, 'bd');
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // continue
    }
  }

  return 'bd';
}

function parseBdJsonl<T>(stdout: string): T[] {
  const trimmed = stdout.trim();
  if (!trimmed) return [];

  return trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

export function projectBeadsStatusToColumn(status: string | null | undefined): BeadsBoardColumnKey {
  const normalized = (status || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'closed':
      return 'closed';
    case 'done':
    case 'complete':
    case 'completed':
    case 'resolved':
      return 'done';
    case 'in_progress':
    case 'active':
    case 'working':
      return 'in_progress';
    default:
      return 'todo';
  }
}

function extractPlanMetadataFromIssueMetadata(metadata: unknown): PlanLinkMetadata | null {
  if (!metadata || typeof metadata !== 'object') return null;

  const root = metadata as BeadMetadataRoot;

  if (root.plan && typeof root.plan === 'object') {
    const plan = root.plan as Record<string, unknown>;
    const planId = normalizeString(plan.plan_id ?? plan.planId);
    const planPath = normalizeString(plan.path);
    const planTitle = normalizeString(plan.title);
    if (planId || planPath || planTitle) {
      return {
        planId: planId ?? null,
        path: planPath ?? null,
        title: planTitle ?? null,
      };
    }
  }

  const flatPlanId = normalizeString(root['plan.plan_id']);
  const flatPlanPath = normalizeString(root['plan.path']);
  const flatPlanTitle = normalizeString(root['plan.title']);

  if (flatPlanId || flatPlanPath || flatPlanTitle) {
    return {
      planId: flatPlanId ?? null,
      path: flatPlanPath ?? null,
      title: flatPlanTitle ?? null,
    };
  }

  return null;
}

function toLinkedPlanSummaryDto(resolution: LinkedPlanResolution | null): LinkedPlanSummaryDto | null {
  if (!resolution) return null;

  if (resolution.plan) {
    return {
      path: resolution.plan.path,
      title: resolution.plan.title,
      planId: resolution.plan.planId,
      archived: resolution.plan.archived,
      status: resolution.plan.status,
      updatedAt: resolution.plan.updatedAt,
      resolution: resolution.state,
      lastKnownPath: resolution.lastKnown?.path ?? null,
      movedFromPath: resolution.state === 'moved' ? resolution.lastKnown?.path ?? null : null,
    };
  }

  return {
    path: resolution.lastKnown?.path ?? null,
    title: resolution.lastKnown?.title ?? 'Missing linked plan',
    planId: resolution.lastKnown?.planId ?? null,
    archived: false,
    status: null,
    updatedAt: null,
    resolution: 'missing',
    lastKnownPath: resolution.lastKnown?.path ?? null,
    movedFromPath: null,
  };
}

function metadataSyncCacheKey(source: BeadsSource, issueId: string): string {
  return `${source.id}:${issueId}`;
}

function metadataSignature(metadata: PlanLinkMetadata): string {
  return JSON.stringify(metadata);
}

async function execBd(source: BeadsSource, args: string[]): Promise<void> {
  const bdBin = resolveBdBin();

  await execFile(bdBin, args, {
    cwd: source.rootPath,
    maxBuffer: 10 * 1024 * 1024,
    env: {
      ...process.env,
      PATH: buildRuntimePath(process.env.PATH),
    },
  });
}

async function syncBeadPlanMetadata(
  source: BeadsSource,
  issueId: string,
  metadata: PlanLinkMetadata,
): Promise<void> {
  const signature = metadataSignature(metadata);
  const cacheKey = metadataSyncCacheKey(source, issueId);
  if (planMetadataSyncCache.get(cacheKey) === signature) return;

  const args = [
    'update',
    issueId,
    '--set-metadata',
    `plan.plan_id=${metadata.planId ?? ''}`,
    '--set-metadata',
    `plan.path=${metadata.path ?? ''}`,
    '--set-metadata',
    `plan.title=${metadata.title ?? ''}`,
    '--json',
  ];

  await execBd(source, args);
  planMetadataSyncCache.set(cacheKey, signature);
}

export async function projectBeadsIssuesToBoard(source: BeadsSource, rawIssues: BdIssueExportItem[]): Promise<BeadsBoardDto> {
  const buckets: Record<BeadsBoardColumnKey, BeadsBoardCardDto[]> = {
    todo: [],
    in_progress: [],
    done: [],
    closed: [],
  };

  for (const issue of rawIssues) {
    if (typeof issue.id !== 'string' || typeof issue.title !== 'string') continue;

    const rawStatus = normalizeString(issue.status) || 'open';
    const columnKey = projectBeadsStatusToColumn(rawStatus);
    const metadataLink = extractPlanMetadataFromIssueMetadata(issue.metadata);
    const linkedPlanResolution = await resolveRepoPlanLinkForBead(issue.id, metadataLink);

    if (linkedPlanResolution?.metadataNeedsWrite && linkedPlanResolution.metadataToWrite) {
      try {
        await syncBeadPlanMetadata(source, issue.id, linkedPlanResolution.metadataToWrite);
      } catch {
        // best-effort only; board rendering should still succeed
      }
    }

    const card: BeadsBoardCardDto = {
      id: issue.id,
      title: issue.title,
      description: normalizeString(issue.description),
      rawStatus,
      columnKey,
      priority: normalizeNumber(issue.priority),
      issueType: normalizeString(issue.issue_type),
      owner: normalizeString(issue.owner),
      labels: normalizeStringArray(issue.labels),
      createdAt: normalizeString(issue.created_at),
      updatedAt: normalizeString(issue.updated_at),
      closedAt: normalizeString(issue.closed_at),
      dependencyCount: normalizeCount(issue.dependency_count),
      dependentCount: normalizeCount(issue.dependent_count),
      commentCount: normalizeCount(issue.comment_count),
      linkedPlan: toLinkedPlanSummaryDto(linkedPlanResolution),
    };

    buckets[columnKey].push(card);
  }

  const columns: BeadsBoardColumnDto[] = [
    { key: 'todo', title: 'To Do', itemCount: buckets.todo.length, items: buckets.todo },
    { key: 'in_progress', title: 'In Progress', itemCount: buckets.in_progress.length, items: buckets.in_progress },
    { key: 'done', title: 'Done', itemCount: buckets.done.length, items: buckets.done },
    { key: 'closed', title: 'Closed', itemCount: buckets.closed.length, items: buckets.closed },
  ];

  return {
    source: toSourceDto(source),
    generatedAt: new Date().toISOString(),
    totalCount: columns.reduce((sum, column) => sum + column.itemCount, 0),
    columns,
  };
}

async function execBdJsonl<T>(source: BeadsSource, args: string[]): Promise<T[]> {
  const bdBin = resolveBdBin();
  try {
    const { stdout } = await execFile(bdBin, args, {
      cwd: source.rootPath,
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        PATH: buildRuntimePath(process.env.PATH),
      },
    });
    return parseBdJsonl<T>(stdout);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown bd execution failure';
    const stderr = typeof error === 'object' && error && 'stderr' in error && typeof error.stderr === 'string'
      ? error.stderr
      : '';
    throw new BeadsAdapterError(source.id, `Failed to read Beads board for source "${source.id}"`, `${message}${stderr ? `\n${stderr}` : ''}`);
  }
}

export function listBeadsSourceDtos(): BeadsSourceDto[] {
  return listManagedBeadsSourceDtos();
}

export async function getBeadsBoard(sourceId?: string | null): Promise<BeadsBoardDto> {
  const source = resolveManagedBeadsSource(sourceId);
  if (!source) throw new InvalidBeadsSourceError(sourceId);

  const issues = await execBdJsonl<BdIssueExportItem>(source, ['export']);
  if (!Array.isArray(issues)) {
    throw new BeadsAdapterError(source.id, `Unexpected bd output for source "${source.id}"`);
  }

  return await projectBeadsIssuesToBoard(source, issues);
}
