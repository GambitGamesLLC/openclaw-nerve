import type { KanbanTask, LinkedPlanResolutionState } from './types';

export type BeadsBoardColumnKey = 'todo' | 'in_progress' | 'done' | 'closed';

export interface BeadsSourceDto {
  id: string;
  label: string;
  kind: 'openclaw' | 'project';
  isDefault: boolean;
  isCustom: boolean;
}

export interface LinkedPlanSummaryDto {
  path: string | null;
  title: string;
  planId: string | null;
  archived: boolean;
  status: string | null;
  updatedAt: number | null;
  resolution: LinkedPlanResolutionState;
  resolvedBy?: 'metadata' | 'bead_ids';
  lastKnownPath: string | null;
  movedFromPath: string | null;
  metadataNeedsWrite?: boolean;
  canRepairMetadata?: boolean;
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

export interface BeadsSourcesResponse {
  defaultSourceId: string | null;
  lastSourceId: string | null;
  sources: BeadsSourceDto[];
}

export type BoardMode = 'kanban' | 'beads';
export type WorkflowPrimarySurface = 'native' | 'beads';

export interface WorkflowShellConfigDto {
  primarySurface: WorkflowPrimarySurface;
  prefersBeads: boolean;
  hideNativeTasks: boolean;
  topLevelPlansEnabled: boolean;
  navigationLabel: 'Tasks' | 'Beads';
  defaultBoardMode: BoardMode;
}

export type BeadsBoardTasksByColumn = Record<BeadsBoardColumnKey, KanbanTask[]>;

export function mapBeadsPriorityToKanban(priority: number | null | undefined): KanbanTask['priority'] {
  if (typeof priority !== 'number' || !Number.isFinite(priority)) return 'normal';
  if (priority <= 0) return 'critical';
  if (priority === 1) return 'high';
  if (priority === 2) return 'normal';
  return 'low';
}

export function mapBeadsColumnToTaskStatus(columnKey: BeadsBoardColumnKey): KanbanTask['status'] {
  switch (columnKey) {
    case 'in_progress':
      return 'in-progress';
    case 'done':
    case 'closed':
      return 'done';
    case 'todo':
    default:
      return 'todo';
  }
}

function toOptionalEpoch(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

export function buildBeadsSearchText(task: KanbanTask): string {
  const metadata = task.beads;

  return normalizeSearchValue([
    metadata?.issueId,
    task.id,
    task.title,
    task.description,
    ...task.labels,
    ...(metadata?.labels ?? []),
    metadata?.owner,
  ].filter((value): value is string => Boolean(value && value.trim())).join(' '));
}

export function beadsTaskMatchesQuery(task: KanbanTask, query: string): boolean {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;

  const haystack = buildBeadsSearchText(task);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  return terms.every((term) => haystack.includes(term));
}

export function filterBeadsTasks(tasks: KanbanTask[], query: string): KanbanTask[] {
  if (!normalizeSearchValue(query)) return tasks;
  return tasks.filter((task) => beadsTaskMatchesQuery(task, query));
}

export function mapBeadsCardToKanbanTask(card: BeadsBoardCardDto, columnOrder: number): KanbanTask {
  const createdAt = toOptionalEpoch(card.createdAt) ?? Date.now();
  const updatedAt = toOptionalEpoch(card.updatedAt) ?? createdAt;
  const closedAt = toOptionalEpoch(card.closedAt);

  return {
    id: card.id,
    title: card.title,
    description: card.description ?? undefined,
    status: mapBeadsColumnToTaskStatus(card.columnKey),
    priority: mapBeadsPriorityToKanban(card.priority),
    createdBy: 'operator',
    createdAt,
    updatedAt,
    version: 1,
    assignee: card.owner ? `agent:${card.owner}` : undefined,
    labels: [...card.labels],
    columnOrder,
    feedback: [],
    result: card.rawStatus && card.rawStatus !== card.columnKey ? `Raw Beads status: ${card.rawStatus}` : undefined,
    resultAt: closedAt,
    beads: {
      issueId: card.id,
      rawStatus: card.rawStatus,
      issueType: card.issueType ?? undefined,
      owner: card.owner ?? undefined,
      labels: [...card.labels],
      dependencyCount: card.dependencyCount,
      dependentCount: card.dependentCount,
      commentCount: card.commentCount,
      createdAt: toOptionalEpoch(card.createdAt),
      updatedAt: toOptionalEpoch(card.updatedAt),
      closedAt,
      linkedPlan: card.linkedPlan ?? undefined,
    },
  };
}

export function normalizeBeadsBoard(board: BeadsBoardDto): BeadsBoardTasksByColumn {
  const normalized: BeadsBoardTasksByColumn = {
    todo: [],
    in_progress: [],
    done: [],
    closed: [],
  };

  for (const column of board.columns) {
    column.items.forEach((card, index) => {
      const task = mapBeadsCardToKanbanTask(card, index);
      normalized[column.key].push(task);
    });
  }

  return normalized;
}
