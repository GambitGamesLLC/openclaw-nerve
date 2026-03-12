import type { KanbanTask } from './types';

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

export interface BeadsSourcesResponse {
  defaultSourceId: string | null;
  sources: BeadsSourceDto[];
}

export type BoardMode = 'kanban' | 'beads';

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
      return 'done';
    case 'todo':
    default:
      return 'todo';
  }
}

function toEpoch(value: string | null | undefined): number {
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function buildLabels(card: BeadsBoardCardDto): string[] {
  const labels: string[] = [];
  if (card.issueType) labels.push(card.issueType);
  if (card.dependencyCount > 0) labels.push(`${card.dependencyCount} dep`);
  if (card.dependentCount > 0) labels.push(`${card.dependentCount} blocked`);
  if (card.commentCount > 0) labels.push(`${card.commentCount} comment${card.commentCount === 1 ? '' : 's'}`);
  return labels;
}

export function mapBeadsCardToKanbanTask(card: BeadsBoardCardDto, columnOrder: number): KanbanTask {
  return {
    id: card.id,
    title: card.title,
    description: card.description ?? undefined,
    status: mapBeadsColumnToTaskStatus(card.columnKey),
    priority: mapBeadsPriorityToKanban(card.priority),
    createdBy: 'operator',
    createdAt: toEpoch(card.createdAt),
    updatedAt: toEpoch(card.updatedAt ?? card.createdAt),
    version: 1,
    assignee: card.owner ? `agent:${card.owner}` : undefined,
    labels: buildLabels(card),
    columnOrder,
    feedback: [],
    result: card.rawStatus && card.rawStatus !== card.columnKey ? `Raw Beads status: ${card.rawStatus}` : undefined,
    resultAt: card.closedAt ? toEpoch(card.closedAt) : undefined,
  };
}

export function normalizeBeadsBoard(board: BeadsBoardDto): Record<KanbanTask['status'], KanbanTask[]> {
  const normalized: Record<KanbanTask['status'], KanbanTask[]> = {
    backlog: [],
    todo: [],
    'in-progress': [],
    review: [],
    done: [],
    cancelled: [],
  };

  for (const column of board.columns) {
    column.items.forEach((card, index) => {
      const task = mapBeadsCardToKanbanTask(card, index);
      normalized[task.status].push(task);
    });
  }

  return normalized;
}
