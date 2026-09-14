import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  CalendarDays,
  History as HistoryIcon,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
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
import { LoadingState, EmptyState, ErrorState } from '../components';

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

  // Today view: selected date (defaults to today, can navigate days)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayDateStr);

  // Drilldown date for Upcoming or History
  const [drilldownDateStr, setDrilldownDateStr] = useState<string | null>(null);

  // History pagination page
  const [historyPage, setHistoryPage] = useState(1);

  // Toggle for completed section in date view
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

  // 3. Determine active date for date-level tasks:
  // In 'today' tab -> selectedDateStr
  // In 'upcoming' or 'history' with drilldown -> drilldownDateStr
  const activeViewDate = drilldownDateStr || selectedDateStr;

  const {
    data: dateTasksData,
    isLoading: isLoadingDateTasks,
    error: dateTasksError,
    refetch: refetchDateTasks,
    isRefetching: isRefetchingDateTasks,
  } = useQuery({
    queryKey: ['tasks-by-date', activeViewDate],
    queryFn: () => taskService.getTasks({ date: activeViewDate }),
    enabled: Boolean(activeTab === 'today' || drilldownDateStr),
  });

  const dateTasks = useMemo(() => dateTasksData?.tasks || [], [dateTasksData?.tasks]);
  const activeTasks = useMemo(() => dateTasks.filter((t) => !t.completed), [dateTasks]);
  const completedTasks = useMemo(() => dateTasks.filter((t) => t.completed), [dateTasks]);
  const totalDateTasks = dateTasks.length;
  const completedCount = completedTasks.length;
  const completionPercent =
    totalDateTasks > 0 ? Math.round((completedCount / totalDateTasks) * 100) : 0;

  // 4. Upcoming summary query
  const {
    data: upcomingData,
    isLoading: isLoadingUpcoming,
  } = useQuery({
    queryKey: ['tasks-upcoming-summary'],
    queryFn: () => taskService.getUpcomingSummary(),
    enabled: activeTab === 'upcoming' && !drilldownDateStr,
  });
  const upcomingSummaries = upcomingData?.summaries || [];

  // 5. History summary query
  const {
    data: historyData,
    isLoading: isLoadingHistory,
  } = useQuery({
    queryKey: ['tasks-history-summary', historyPage],
    queryFn: () => taskService.getHistorySummary(historyPage),
    enabled: activeTab === 'history' && !drilldownDateStr,
  });
  const historySummaries = historyData?.summaries || [];
  const historyTotalPages = historyData?.totalPages || 1;

  // Mutations
  const invalidateAllTaskQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['tasks-by-date'] });
    queryClient.invalidateQueries({ queryKey: ['tasks-overdue'] });
    queryClient.invalidateQueries({ queryKey: ['tasks-upcoming-summary'] });
    queryClient.invalidateQueries({ queryKey: ['tasks-history-summary'] });
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
    setDrilldownDateStr(null);
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

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(`${dateStr}T00:00:00Z`);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <StudyPlanHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNewTask={handleOpenCreateModal}
        overdueCount={overdueTasks.length}
      />

      {/* ─────────────────────────────────────────────────────────────
          1. TODAY VIEW (Or Drilldown view for Upcoming / History)
      ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'today' || drilldownDateStr) && (
        <div className="space-y-5">
          {/* If drilldown into upcoming or history date: Back Button */}
          {drilldownDateStr && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDrilldownDateStr(null)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#111827] px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-[#1E293B] hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to {activeTab === 'upcoming' ? 'Upcoming' : 'History'}</span>
              </button>
            </div>
          )}

          {/* Overdue Banner (Shown on Today view) */}
          {activeTab === 'today' && !drilldownDateStr && (
            <OverdueBanner
              tasks={overdueTasks}
              onCompleteTask={handleToggleComplete}
              onReschedule={handlePromptReschedule}
            />
          )}

          {/* Date Navigator */}
          <DateNavigator
            currentDateStr={activeViewDate}
            onDateChange={(newDate) => {
              if (drilldownDateStr) {
                setDrilldownDateStr(newDate);
              } else {
                setSelectedDateStr(newDate);
              }
            }}
          />

          {/* Date Progress Bar Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200">
                Daily Goal Progress
              </span>
              <span className="text-slate-400">
                {completedCount} of {totalDateTasks} completed ({completionPercent}%)
              </span>
            </div>
            <ProgressBar progress={completionPercent} size="md" />
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
            <div className="rounded-2xl border border-white/[0.08] bg-[#111827]/50 p-8">
              <EmptyState
                title="No tasks scheduled for this day"
                description="Plan your learning goals or add video lessons to stay on track."
                actionLabel="Add Study Task"
                onAction={handleOpenCreateModal}
              />
            </div>
          )}

          {/* Active Tasks List */}
          {!isLoadingDateTasks && !dateTasksError && totalDateTasks > 0 && (
            <div className="space-y-4">
              {/* Incomplete Tasks */}
              {activeTasks.length > 0 ? (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
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
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center text-xs font-semibold text-emerald-400">
                  🎉 All tasks for this date are completed! Excellent focus.
                </div>
              )}

              {/* Completed Tasks (Collapsible Section) */}
              {completedTasks.length > 0 && (
                <div className="pt-3 border-t border-white/[0.06] space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowCompleted((prev) => !prev)}
                    className="flex items-center justify-between w-full rounded-2xl bg-[#111827] border border-white/[0.08] px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-[#1E293B] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Completed ({completedTasks.length})</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <span>{showCompleted ? 'Hide' : 'Show'}</span>
                      {showCompleted ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </button>

                  {showCompleted && (
                    <div className="space-y-2.5 pl-2">
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
          2. UPCOMING VIEW (Compact Date Summaries)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'upcoming' && !drilldownDateStr && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white font-heading">Upcoming Learning Schedule</h2>
              <p className="text-xs text-slate-400">
                Tasks planned for tomorrow and the next 30 days.
              </p>
            </div>
          </div>

          {isLoadingUpcoming && <LoadingState count={3} />}

          {!isLoadingUpcoming && upcomingSummaries.length === 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#111827]/50 p-8">
              <EmptyState
                title="Nothing planned ahead yet"
                description="Schedule learning tasks for tomorrow or upcoming days to build a consistent streak."
                actionLabel="Schedule Upcoming Task"
                onAction={handleOpenCreateModal}
              />
            </div>
          )}

          {!isLoadingUpcoming && upcomingSummaries.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingSummaries.map((summary) => (
                <div
                  key={summary.date}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDrilldownDateStr(summary.date)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDrilldownDateStr(summary.date);
                    }
                  }}
                  className="group rounded-2xl border border-white/[0.08] bg-[#111827] p-4 hover:border-white/[0.15] hover:bg-[#111827]/90 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-indigo-400" />
                      <span className="text-sm font-bold text-slate-100 group-hover:text-white font-heading">
                        {formatDateDisplay(summary.date)}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {summary.completedTasks} / {summary.totalTasks} completed
                      </span>
                      <span className="font-semibold text-slate-300">
                        {summary.completionPercentage}%
                      </span>
                    </div>
                    <ProgressBar progress={summary.completionPercentage} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. HISTORY VIEW (Compact Historical Summaries)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && !drilldownDateStr && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white font-heading">Study History</h2>
            <p className="text-xs text-slate-400">
              Review your completed learning goals and tasks from past days.
            </p>
          </div>

          {isLoadingHistory && <LoadingState count={3} />}

          {!isLoadingHistory && historySummaries.length === 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#111827]/50 p-8">
              <EmptyState
                title="No history recorded yet"
                description="Past days will appear here as you schedule and accomplish daily study goals."
              />
            </div>
          )}

          {!isLoadingHistory && historySummaries.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {historySummaries.map((summary) => (
                  <div
                    key={summary.date}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDrilldownDateStr(summary.date)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDrilldownDateStr(summary.date);
                      }
                    }}
                    className="group rounded-2xl border border-white/[0.08] bg-[#111827] p-4 hover:border-white/[0.15] hover:bg-[#111827]/90 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HistoryIcon className="h-4 w-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-sm font-bold text-slate-200 group-hover:text-white font-heading">
                          {formatDateDisplay(summary.date)}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>
                          {summary.completedTasks} / {summary.totalTasks} completed
                        </span>
                        <span className="font-semibold text-slate-300">
                          {summary.completionPercentage}%
                        </span>
                      </div>
                      <ProgressBar progress={summary.completionPercentage} size="sm" />
                    </div>
                  </div>
                ))}
              </div>

              {/* History Pagination */}
              {historyTotalPages > 1 && (
                <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#111827] p-3 text-xs text-slate-400">
                  <span>
                    Page {historyPage} of {historyTotalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={historyPage <= 1}
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      className="rounded-xl border border-white/[0.08] bg-[#0B1120] px-3.5 py-1.5 hover:border-white/[0.15] hover:text-white disabled:opacity-40 transition-colors"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={historyPage >= historyTotalPages}
                      onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                      className="rounded-xl border border-white/[0.08] bg-[#0B1120] px-3.5 py-1.5 hover:border-white/[0.15] hover:text-white disabled:opacity-40 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
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
        defaultDateStr={activeViewDate}
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
            className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#111827] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 id="delete-task-title" className="text-base font-bold text-white font-heading">
                  Delete Task?
                </h4>
                <p className="text-xs text-slate-400">
                  This task will be permanently removed.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 line-clamp-3 bg-[#0B1120] p-3.5 rounded-2xl border border-white/[0.06]">
              "{taskToDelete.title}"
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => setTaskToDelete(null)}
                className="rounded-xl border border-white/[0.08] bg-[#0B1120] px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-white/[0.15] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(taskToDelete._id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/20 hover:bg-rose-500 disabled:opacity-50 transition-colors"
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
