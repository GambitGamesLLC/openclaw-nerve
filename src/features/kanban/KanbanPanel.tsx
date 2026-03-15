import { useState, useCallback, useEffect, useRef } from 'react';
import type { KanbanTask } from './types';
import type { BoardMode, BeadsBoardColumnKey } from './beads';
import { useKanban } from './hooks/useKanban';
import { useBeadsBoard } from './hooks/useBeadsBoard';
import { useProposals } from './hooks/useProposals';
import { KanbanHeader } from './KanbanHeader';
import { KanbanBoard } from './KanbanBoard';
import { BeadsBoard } from './BeadsBoard';
import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { BeadsDetailDrawer } from './BeadsDetailDrawer';

interface KanbanPanelProps {
  /** If set, auto-open the drawer for this task ID on mount. */
  initialTaskId?: string | null;
  /** Called after the initial task drawer has been opened (to clear the ID). */
  onInitialTaskConsumed?: () => void;
  /** Server-driven default board mode for workflow-shell behavior. */
  defaultBoardMode?: BoardMode;
  /** When true, fully hide native-task affordances and stay in Beads mode. */
  hideNativeTasks?: boolean;
  /** Open a linked repo-local plan in the shared Plans surface. */
  onOpenPlan?: (planPath: string) => void;
}

/**
 * Main Kanban panel — replaces the placeholder from Wave 1.
 * Full board with header, columns, create dialog, and detail drawer.
 */
export function KanbanPanel({
  initialTaskId,
  onInitialTaskConsumed,
  defaultBoardMode = 'kanban',
  hideNativeTasks = false,
  onOpenPlan,
}: KanbanPanelProps = {}) {
  const [boardMode, setBoardMode] = useState<BoardMode>(hideNativeTasks ? 'beads' : defaultBoardMode);

  const {
    tasks,
    loading,
    error,
    filters,
    setFilters,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    reorderTask,
    tasksByStatus,
    statusCounts,
    executeTask,
    approveTask,
    rejectTask,
    abortTask,
  } = useKanban();

  const {
    sources: beadsSources,
    selectedSourceId,
    setSelectedSourceId,
    board: beadsBoard,
    selectedSource: selectedBeadsSource,
    tasksByColumn: beadsTasksByColumn,
    columnCounts: beadsColumnCounts,
    loading: beadsLoading,
    error: beadsError,
    hasAnyTasks: beadsHasAnyTasks,
    fetchBoard: fetchBeadsBoard,
    addSource: addBeadsSource,
    removeSource: removeBeadsSource,
    repairLinkedPlanMetadata,
  } = useBeadsBoard();

  const {
    proposals,
    pendingCount: pendingProposalCount,
    approveProposal,
    rejectProposal,
  } = useProposals();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [selectedBeadsTask, setSelectedBeadsTask] = useState<KanbanTask | null>(null);
  const consumedRef = useRef<string | null>(null);

  useEffect(() => {
    setBoardMode(hideNativeTasks ? 'beads' : defaultBoardMode);
  }, [defaultBoardMode, hideNativeTasks]);

  // Auto-open drawer for initialTaskId
  useEffect(() => {
    if (!initialTaskId || initialTaskId === consumedRef.current) return;

    const nativeMatch = tasks.find((t) => t.id === initialTaskId);
    if (nativeMatch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time sync from prop
      setBoardMode('kanban');
      setSelectedTask(nativeMatch);
      consumedRef.current = initialTaskId;
      onInitialTaskConsumed?.();
      return;
    }

    const beadsColumns: BeadsBoardColumnKey[] = ['todo', 'in_progress', 'done', 'closed'];
    const beadsMatch = beadsColumns
      .flatMap((column) => beadsTasksByColumn(column))
      .find((t) => t.id === initialTaskId);
    if (beadsMatch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time sync from prop
      setBoardMode('beads');
      setSelectedBeadsTask(beadsMatch);
      consumedRef.current = initialTaskId;
      onInitialTaskConsumed?.();
    }
  }, [initialTaskId, tasks, beadsTasksByColumn, onInitialTaskConsumed]);

  useEffect(() => {
    if (hideNativeTasks && boardMode !== 'beads') {
      setBoardMode('beads');
      return;
    }

    if (boardMode === 'beads') {
      setSelectedTask(null);
      return;
    }

    setSelectedBeadsTask(null);
  }, [boardMode, hideNativeTasks]);

  /* ── Card click → open drawer ── */
  const handleCardClick = useCallback((task: KanbanTask) => {
    if (boardMode !== 'kanban') return;
    setSelectedTask(task);
  }, [boardMode]);

  const handleBeadsCardClick = useCallback((task: KanbanTask) => {
    if (boardMode !== 'beads') return;
    setSelectedBeadsTask(task);
  }, [boardMode]);

  /* ── Close drawer ── */
  const handleCloseDrawer = useCallback(() => {
    setSelectedTask(null);
  }, []);

  const handleCloseBeadsDrawer = useCallback(() => {
    setSelectedBeadsTask(null);
  }, []);

  /* ── Create handler ── */
  const handleCreate = useCallback(async (payload: Parameters<typeof createTask>[0]) => {
    await createTask(payload);
  }, [createTask]);

  /* ── Update handler (refreshes selected task) ── */
  const handleUpdate = useCallback(async (...args: Parameters<typeof updateTask>) => {
    const updated = await updateTask(...args);
    setSelectedTask(updated);
    return updated;
  }, [updateTask]);

  /* ── Delete handler ── */
  const handleDelete = useCallback(async (id: string) => {
    await deleteTask(id);
  }, [deleteTask]);

  /* ── Open create dialog ── */
  const openCreateDialog = useCallback(() => {
    setCreateOpen(true);
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Header with search, filters, stats, + New Task */}
      <KanbanHeader
        filters={filters}
        onFiltersChange={setFilters}
        statusCounts={statusCounts}
        beadsColumnCounts={beadsColumnCounts}
        onCreateTask={openCreateDialog}
        proposals={proposals}
        pendingProposalCount={pendingProposalCount}
        onApproveProposal={async (id) => { await approveProposal(id); await fetchTasks(); }}
        onRejectProposal={async (id) => { await rejectProposal(id); }}
        boardMode={boardMode}
        onBoardModeChange={setBoardMode}
        beadsSources={beadsSources}
        selectedBeadsSourceId={selectedSourceId}
        onBeadsSourceChange={setSelectedSourceId}
        onBeadsSourceAdd={async (input) => {
          await addBeadsSource(input);
        }}
        onBeadsSourceRemove={async (sourceId) => {
          await removeBeadsSource(sourceId);
        }}
        hideNativeTasks={hideNativeTasks}
      />

      {/* Board body */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 pb-4">
        {boardMode === 'beads' ? (
          <BeadsBoard
            todoTasks={beadsTasksByColumn('todo')}
            inProgressTasks={beadsTasksByColumn('in_progress')}
            doneTasks={beadsTasksByColumn('done')}
            closedTasks={beadsTasksByColumn('closed')}
            loading={beadsLoading}
            error={beadsError}
            onRetry={() => fetchBeadsBoard(selectedSourceId)}
            hasAnyTasks={beadsHasAnyTasks}
            sourceId={selectedSourceId}
            sourceLabel={selectedBeadsSource?.label ?? beadsBoard?.source.label}
            onCardClick={handleBeadsCardClick}
          />
        ) : (
          <KanbanBoard
            tasksByStatus={tasksByStatus}
            onCardClick={handleCardClick}
            loading={loading}
            error={error}
            onRetry={() => fetchTasks()}
            hasAnyTasks={tasks.length > 0}
            onCreateTask={openCreateDialog}
            reorderTask={reorderTask}
          />
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />

      {/* Task Detail Drawer */}
      {boardMode === 'kanban' && (
        <TaskDetailDrawer
          task={selectedTask}
          onClose={handleCloseDrawer}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onExecute={executeTask}
          onApprove={approveTask}
          onReject={rejectTask}
          onAbort={abortTask}
        />
      )}

      {boardMode === 'beads' && (
        <BeadsDetailDrawer
          task={selectedBeadsTask}
          sourceLabel={selectedBeadsSource?.label ?? beadsBoard?.source.label}
          onClose={handleCloseBeadsDrawer}
          onOpenPlan={onOpenPlan}
          onRepairLinkedPlanMetadata={repairLinkedPlanMetadata}
        />
      )}
    </div>
  );
}
