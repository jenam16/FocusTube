import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  BookOpen,
  CalendarDays,
  History as HistoryIcon,
  Plus,
} from 'lucide-react';
import { taskService, courseService } from '../services';
import {
  TaskItem,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '../types';
import {
  StudyPlanHeader,
  StudyPlanTab,
  OverdueBanner,
  DateNavigator,
  StudyTaskCard,
  TaskModal,
  RescheduleModal,
} from '../components/studyPlan';
import { ProgressBar } from '../components/ProgressBar';
import { LoadingState, ErrorState } from '../components';

interface CompactEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

const CompactEmptyState: React.FC<CompactEmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = BookOpen,
}) => (
  <div className="rounded-xl border border-app bg-surface p-6 sm:p-8 text-center space-y-3 max-w-md mx-auto my-3">
    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
      <Icon className="h-5 w-5" />
    </div>
    <div className="space-y-1">
      <h4 className="text-sm font-bold text-primary font-heading">
        {title}
      </h4>
      <p className="text-xs text-muted">
        {description}
      </p>
    </div>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>{actionLabel}</span>
      </button>
    )}
  </div>
);

export const StudyPlanPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Primary navigation: [ Today ] [ Upcoming ] [ History ]
  const [activeTab, setActiveTab] = useState<StudyPlanTab>('today');

  // Compute today's date in YYYY-MM-DD
  const todayDateStr = useMemo(() => {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Compute tomorrow's date in YYYY-MM-DD
  const tomorrowDateStr = useMemo(() => {
    const now = new Date();
    now.setUTCDate(now.getUTCDate() + 1);
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Today view: selected date (defaults to today, can navigate days)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayDateStr);

  // Toggle for completed section in today view
  const [showCompleted, setShowCompleted] = useState(false);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [rescheduleTargetTask, setRescheduleTargetTask] = useState<TaskItem | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  // 1. Fetch courses for task modal linking
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => courseService.getCourses(),
  });
  const courses = coursesData?.courses || [];

  // 2. Fetch overdue tasks
  const { data: overdueData } = useQuery({
    queryKey: ['tasks-overdue'],
    queryFn: () => taskService.getOverdueTasks(),
  });
  const overdueTasks = overdueData?.tasks || [];

  // 3. Query tasks for selected date (Today view)
  const {
    data: dateTasksData,
    isLoading: isLoadingDateTasks,
    error: dateTasksError,
    refetch: refetchDateTasks,
    isRefetching: isRefetchingDateTasks,
  } = useQuery({
    queryKey: ['tasks-by-date', selectedDateStr],
    queryFn: () => taskService.getTasks({ date: selectedDateStr }),
    enabled: activeTab === 'today',
  });

  const dateTasks = useMemo(() => dateTasksData?.tasks || [], [dateTasksData?.tasks]);
  const activeTasks = useMemo(() => dateTasks.filter((t) => !t.completed), [dateTasks]);
  const completedTasks = useMemo(() => dateTasks.filter((t) => t.completed), [dateTasks]);
  const totalDateTasks = dateTasks.length;
  const completedCount = completedTasks.length;
  const completionPercent =
    totalDateTasks > 0 ? Math.round((completedCount / totalDateTasks) * 100) : 0;

  // 4. Query upcoming tasks (from tomorrow onward)
  const {
    data: upcomingTasksData,
    isLoading: isLoadingUpcoming,
    error: upcomingError,
    refetch: refetchUpcoming,
    isRefetching: isRefetchingUpcoming,
  } = useQuery({
    queryKey: ['tasks-upcoming', tomorrowDateStr],
    queryFn: () => taskService.getTasks({ from: tomorrowDateStr }),
    enabled: activeTab === 'upcoming',
  });

  const upcomingTasks = useMemo(() => upcomingTasksData?.tasks || [], [upcomingTasksData?.tasks]);

  // Group upcoming tasks chronologically by date
  const upcomingGrouped = useMemo(() => {
    const groups: { date: string; tasks: TaskItem[] }[] = [];
    const dateMap = new Map<string, TaskItem[]>();

    for (const t of upcomingTasks) {
      const d = t.date ? t.date.slice(0, 10) : '';
      if (!d) continue;
      if (!dateMap.has(d)) {
        dateMap.set(d, []);
      }
      dateMap.get(d)!.push(t);
    }

    const sortedDates = Array.from(dateMap.keys()).sort();
    for (const d of sortedDates) {
      groups.push({ date: d, tasks: dateMap.get(d)! });
    }
    return groups;
  }, [upcomingTasks]);

  // 5. Query history tasks (completed tasks)
  const {
    data: historyTasksData,
    isLoading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory,
    isRefetching: isRefetchingHistory,
  } = useQuery({
    queryKey: ['tasks-history-completed'],
    queryFn: () => taskService.getTasks({ status: 'completed' }),
    enabled: activeTab === 'history',
  });

  const historyTasks = useMemo(() => {
    const list = historyTasksData?.tasks || [];
    // Sort reverse chronological
    return [...list].sort((a, b) => {
      const dateA = a.completedAt || a.date || a.updatedAt;
      const dateB = b.completedAt || b.date || b.updatedAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [historyTasksData?.tasks]);

  // Group history tasks by date
  const historyGrouped = useMemo(() => {
    const groups: { date: string; tasks: TaskItem[] }[] = [];
    const dateMap = new Map<string, TaskItem[]>();

    for (const t of historyTasks) {
      const d = t.date ? t.date.slice(0, 10) : '';
      if (!d) continue;
      if (!dateMap.has(d)) {
        dateMap.set(d, []);
      }
      dateMap.get(d)!.push(t);
    }

    // Sort dates descending
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => (a < b ? 1 : -1));
    for (const d of sortedDates) {
      groups.push({ date: d, tasks: dateMap.get(d)! });
    }
    return groups;
  }, [historyTasks]);

  // Invalidate queries helper
  const invalidateAllTaskQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['tasks-by-date'] });
    queryClient.invalidateQueries({ queryKey: ['tasks-upcoming'] });
    queryClient.invalidateQueries({ queryKey: ['tasks-history-completed'] });
    queryClient.invalidateQueries({ queryKey: ['tasks-overdue'] });
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateTaskPayload) => taskService.createTask(payload),
    onSuccess: () => {
      invalidateAllTaskQueries();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateTaskPayload }) =>
      taskService.updateTask(taskId, payload),
    onSuccess: () => {
      invalidateAllTaskQueries();
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ taskId, date }: { taskId: string; date: string }) =>
      taskService.rescheduleTask(taskId, date),
    onSuccess: () => {
      setRescheduleTargetTask(null);
      invalidateAllTaskQueries();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: () => {
      setTaskToDelete(null);
      invalidateAllTaskQueries();
    },
  });

  // Handlers
  const handleTabChange = (tab: StudyPlanTab) => {
    setActiveTab(tab);
  };

  const handleOpenCreateModal = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task: TaskItem) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleToggleComplete = (task: TaskItem) => {
    updateMutation.mutate({
      taskId: task._id,
      payload: { completed: !task.completed },
    });
  };

  const handlePromptDelete = (task: TaskItem) => {
    setTaskToDelete(task);
  };

  const handlePromptReschedule = (task: TaskItem) => {
    setRescheduleTargetTask(task);
  };

  const formatUpcomingDateHeader = (dateStr: string) => {
    if (dateStr === tomorrowDateStr) {
      return {
        title: 'Tomorrow',
        subtitle: new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC',
        }),
      };
    }
    const d = new Date(`${dateStr}T00:00:00Z`);
    return {
      title: d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }),
      subtitle: '',
    };
  };

  const formatHistoryDateHeader = (dateStr: string) => {
    if (dateStr === todayDateStr) {
      return 'Today';
    }
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yStr = `${yesterday.getUTCFullYear()}-${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}-${String(yesterday.getUTCDate()).padStart(2, '0')}`;
    if (dateStr === yStr) {
      return 'Yesterday';
    }
    const d = new Date(`${dateStr}T00:00:00Z`);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: d.getUTCFullYear() !== new Date().getUTCFullYear() ? 'numeric' : undefined,
      timeZone: 'UTC',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Page Header with Segmented View Switcher & Primary CTA */}
      <StudyPlanHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNewTask={handleOpenCreateModal}
        overdueCount={overdueTasks.length}
      />

      {/* ─────────────────────────────────────────────────────────────
          1. TODAY VIEW
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          {/* Overdue Banner (shown only on today view if overdue tasks exist) */}
          {selectedDateStr === todayDateStr && (
            <OverdueBanner
              tasks={overdueTasks}
              onCompleteTask={handleToggleComplete}
              onReschedule={handlePromptReschedule}
            />
          )}

          {/* Compact Date Navigator: "Sunday, October 4  [TODAY]" */}
          <DateNavigator
            currentDateStr={selectedDateStr}
            onDateChange={setSelectedDateStr}
          />

          {/* Compact Daily Progress */}
          <div className="rounded-xl border border-app bg-surface px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-secondary">Today's progress</span>
              <span className="font-semibold text-primary">
                {completedCount} / {totalDateTasks} completed
                {totalDateTasks > 0 && (
                  <span className="ml-2 font-normal text-muted">({completionPercent}%)</span>
                )}
              </span>
            </div>
            <ProgressBar progress={completionPercent} size="sm" />
          </div>

          {/* Loading Date Tasks */}
          {isLoadingDateTasks && <LoadingState count={3} />}

          {/* Error Loading Date Tasks */}
          {!isLoadingDateTasks && dateTasksError && (
            <ErrorState
              title="Unable to load tasks"
              message="Could not retrieve study tasks for this date. Please check your connection."
              onRetry={() => refetchDateTasks()}
              isRetrying={isRefetchingDateTasks}
            />
          )}

          {/* Empty Date Tasks */}
          {!isLoadingDateTasks && !dateTasksError && totalDateTasks === 0 && (
            <CompactEmptyState
              title="No learning tasks for today"
              description="Plan a small learning goal and keep your progress moving."
              actionLabel="Add Task"
              onAction={handleOpenCreateModal}
              icon={BookOpen}
            />
          )}

          {/* Task List (Main Visual Focus) */}
          {!isLoadingDateTasks && !dateTasksError && totalDateTasks > 0 && (
            <div className="space-y-4">
              {/* Incomplete / To-Do Tasks */}
              {activeTasks.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider px-1">
                    To-Do ({activeTasks.length})
                  </h3>
                  {activeTasks.map((task) => (
                    <StudyTaskCard
                      key={task._id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onEdit={handleOpenEditModal}
                      onDelete={handlePromptDelete}
                      onReschedule={handlePromptReschedule}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-center text-xs font-medium text-emerald-500">
                  🎉 All learning goals for today are completed! Great consistency.
                </div>
              )}

              {/* Completed Tasks (Collapsible Section) */}
              {completedTasks.length > 0 && (
                <div className="pt-2 border-t border-subtle space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowCompleted((prev) => !prev)}
                    className="flex items-center justify-between w-full rounded-xl bg-surface border border-app px-3.5 py-2 text-xs font-medium text-secondary hover:text-primary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Completed ({completedTasks.length})</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted">
                      <span>{showCompleted ? 'Hide' : 'Show'}</span>
                      {showCompleted ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </button>

                  {showCompleted && (
                    <div className="space-y-2 pl-1 sm:pl-2">
                      {completedTasks.map((task) => (
                        <StudyTaskCard
                          key={task._id}
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onEdit={handleOpenEditModal}
                          onDelete={handlePromptDelete}
                          onReschedule={handlePromptReschedule}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. UPCOMING VIEW (Chronological Learning Schedule)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Upcoming Schedule
            </h2>
          </div>

          {isLoadingUpcoming && <LoadingState count={3} />}

          {!isLoadingUpcoming && upcomingError && (
            <ErrorState
              title="Unable to load upcoming tasks"
              message="Could not retrieve upcoming learning tasks. Please check your connection."
              onRetry={() => refetchUpcoming()}
              isRetrying={isRefetchingUpcoming}
            />
          )}

          {!isLoadingUpcoming && !upcomingError && upcomingGrouped.length === 0 && (
            <CompactEmptyState
              title="Nothing planned ahead yet"
              description="Schedule learning tasks for tomorrow or upcoming days to build a consistent streak."
              actionLabel="Schedule Task"
              onAction={handleOpenCreateModal}
              icon={CalendarDays}
            />
          )}

          {!isLoadingUpcoming && !upcomingError && upcomingGrouped.length > 0 && (
            <div className="space-y-5">
              {upcomingGrouped.map((group) => {
                const header = formatUpcomingDateHeader(group.date);
                return (
                  <div key={group.date} className="space-y-2">
                    <div className="flex items-baseline gap-2 px-1">
                      <h3 className="text-sm font-bold text-primary font-heading">
                        {header.title}
                      </h3>
                      {header.subtitle && (
                        <span className="text-xs text-muted">
                          {header.subtitle}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {group.tasks.map((task) => (
                        <StudyTaskCard
                          key={task._id}
                          task={task}
                          onToggleComplete={handleToggleComplete}
                          onEdit={handleOpenEditModal}
                          onDelete={handlePromptDelete}
                          onReschedule={handlePromptReschedule}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. HISTORY VIEW (Clean Completed Learning List)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Completed Learning History
            </h2>
            {historyTasks.length > 0 && (
              <span className="text-xs text-muted">
                {historyTasks.length} task{historyTasks.length > 1 ? 's' : ''} completed
              </span>
            )}
          </div>

          {isLoadingHistory && <LoadingState count={3} />}

          {!isLoadingHistory && historyError && (
            <ErrorState
              title="Unable to load history"
              message="Could not retrieve completed tasks history. Please check your connection."
              onRetry={() => refetchHistory()}
              isRetrying={isRefetchingHistory}
            />
          )}

          {!isLoadingHistory && !historyError && historyGrouped.length === 0 && (
            <CompactEmptyState
              title="No completed tasks yet"
              description="Complete planned learning tasks and your accomplishments will appear here."
              icon={HistoryIcon}
            />
          )}

          {!isLoadingHistory && !historyError && historyGrouped.length > 0 && (
            <div className="space-y-5">
              {historyGrouped.map((group) => (
                <div key={group.date} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary px-1">
                    {formatHistoryDateHeader(group.date)}
                  </h3>
                  <div className="space-y-2">
                    {group.tasks.map((task) => (
                      <StudyTaskCard
                        key={task._id}
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onEdit={handleOpenEditModal}
                        onDelete={handlePromptDelete}
                        onReschedule={handlePromptReschedule}
                        showDateBadge={false}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODALS & DIALOGS
      ───────────────────────────────────────────────────────────── */}
      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        courses={courses}
        defaultDateStr={selectedDateStr}
        onSubmitCreate={async (payload) => {
          await createMutation.mutateAsync(payload);
        }}
        onSubmitUpdate={async (taskId, payload) => {
          await updateMutation.mutateAsync({ taskId, payload });
        }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={Boolean(rescheduleTargetTask)}
        onClose={() => setRescheduleTargetTask(null)}
        task={rescheduleTargetTask}
        onReschedule={async (taskId, newDate) => {
          await rescheduleMutation.mutateAsync({ taskId, date: newDate });
        }}
        isSubmitting={rescheduleMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
            className="w-full max-w-sm rounded-2xl border border-app bg-surface p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 id="delete-task-title" className="text-base font-bold text-primary font-heading">
                  Delete Task?
                </h4>
                <p className="text-xs text-secondary">
                  This task will be permanently removed.
                </p>
              </div>
            </div>

            <p className="text-xs text-primary line-clamp-3 bg-secondary p-3 rounded-xl border border-app">
              "{taskToDelete.title}"
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setTaskToDelete(null)}
                className="rounded-xl border border-app bg-surface-elevated px-3.5 py-2 text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(taskToDelete._id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-500 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
