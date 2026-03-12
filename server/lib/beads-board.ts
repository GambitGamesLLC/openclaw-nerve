/**
 * Server-side Beads board adapter.
 *
 * Resolves an env-configured Beads source, shells out to `bd` inside that repo,
 * and projects Beads issues into a simple three-column board DTO for the v1 UI.
 * @module
 */

import { execFile as execFileCallback } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { listBeadsSources, resolveBeadsSource, type BeadsSource, config } from './config.js';

const execFile = promisify(execFileCallback);

export type BeadsBoardColumnKey = 'todo' | 'in_progress' | 'done';

export interface BeadsSourceDto {
  id: string;
  label: string;
  kind: 'openclaw' | 'project';
  isDefault: boolean;
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
  createdAt: string | null;
  updatedAt: string | null;
  closedAt: string | null;
  dependencyCount: number;
  dependentCount: number;
  commentCount: number;
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

interface BdIssueListItem {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  issue_type?: unknown;
  owner?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  closed_at?: unknown;
  dependency_count?: unknown;
  dependent_count?: unknown;
  comment_count?: unknown;
}

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
  return {
    id: source.id,
    label: source.label,
    kind: source.kind,
    isDefault: source.id === config.beads.defaultSourceId,
  };
}

function normalizeString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
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

export function projectBeadsStatusToColumn(status: string | null | undefined): BeadsBoardColumnKey {
  const normalized = (status || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'closed':
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

export function projectBeadsIssuesToBoard(source: BeadsSource, rawIssues: BdIssueListItem[]): BeadsBoardDto {
  const buckets: Record<BeadsBoardColumnKey, BeadsBoardCardDto[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };

  for (const issue of rawIssues) {
    if (typeof issue.id !== 'string' || typeof issue.title !== 'string') continue;

    const rawStatus = normalizeString(issue.status) || 'open';
    const columnKey = projectBeadsStatusToColumn(rawStatus);
    const card: BeadsBoardCardDto = {
      id: issue.id,
      title: issue.title,
      description: normalizeString(issue.description),
      rawStatus,
      columnKey,
      priority: normalizeNumber(issue.priority),
      issueType: normalizeString(issue.issue_type),
      owner: normalizeString(issue.owner),
      createdAt: normalizeString(issue.created_at),
      updatedAt: normalizeString(issue.updated_at),
      closedAt: normalizeString(issue.closed_at),
      dependencyCount: normalizeCount(issue.dependency_count),
      dependentCount: normalizeCount(issue.dependent_count),
      commentCount: normalizeCount(issue.comment_count),
    };

    buckets[columnKey].push(card);
  }

  const columns: BeadsBoardColumnDto[] = [
    { key: 'todo', title: 'To Do', itemCount: buckets.todo.length, items: buckets.todo },
    { key: 'in_progress', title: 'In Progress', itemCount: buckets.in_progress.length, items: buckets.in_progress },
    { key: 'done', title: 'Done', itemCount: buckets.done.length, items: buckets.done },
  ];

  return {
    source: toSourceDto(source),
    generatedAt: new Date().toISOString(),
    totalCount: columns.reduce((sum, column) => sum + column.itemCount, 0),
    columns,
  };
}

async function execBdJson<T>(source: BeadsSource, args: string[]): Promise<T> {
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
    return JSON.parse(stdout) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown bd execution failure';
    const stderr = typeof error === 'object' && error && 'stderr' in error && typeof error.stderr === 'string'
      ? error.stderr
      : '';
    throw new BeadsAdapterError(source.id, `Failed to read Beads board for source "${source.id}"`, `${message}${stderr ? `\n${stderr}` : ''}`);
  }
}

export function listBeadsSourceDtos(): BeadsSourceDto[] {
  return listBeadsSources().map(toSourceDto);
}

export async function getBeadsBoard(sourceId?: string | null): Promise<BeadsBoardDto> {
  const source = resolveBeadsSource(sourceId);
  if (!source) throw new InvalidBeadsSourceError(sourceId);

  const issues = await execBdJson<BdIssueListItem[]>(source, ['list', '--json']);
  if (!Array.isArray(issues)) {
    throw new BeadsAdapterError(source.id, `Unexpected bd output for source "${source.id}"`);
  }

  return projectBeadsIssuesToBoard(source, issues);
}
