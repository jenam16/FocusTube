import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Play,
  Edit2,
  Trash2,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { TaskItem, TaskPriority } from '../../types';

interface StudyTaskCardProps {
  task: TaskItem;
  onToggleComplete: (task: TaskItem) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onReschedule: (task: TaskItem) => void;
  showDateBadge?: boolean;
}

export const StudyTaskCard: React.FC<StudyTaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onReschedule,
  showDateBadge = false,
}) => {
  const navigate = useNavigate();

  const courseObj = typeof task.course === 'object' && task.course !== null ? task.course : null;
  const videoObj = typeof task.video === 'object' && task.video !== null ? task.video : null;

  const handleStartLearning = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (courseObj && videoObj) {
      navigate(`/watch/${courseObj._id}/${videoObj._id}`);
    } else if (courseObj) {
      navigate(`/courses/${courseObj._id}`);
    }
  };

  const priorityStyles: Record<TaskPriority, { badge: string; text: string }> = {
    high: { badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400', text: 'High' },
    medium: { badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400', text: 'Medium' },
    low: { badge: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400', text: 'Low' },
  };

  const currentPriority = priorityStyles[task.priority || 'medium'];

  const formatDateLabel = (dateStr: string) => {
    try {
      const d = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-3 sm:px-4 sm:py-3 transition-all ${
        task.completed
          ? 'border-subtle bg-surface/40 opacity-70'
          : 'border-app bg-surface hover:border-indigo-500/30 hover:bg-surface-elevated/80 shadow-xs'
      }`}
    >
      {/* Left: Checkbox & Task Information */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
            task.completed
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500'
              : 'border-subtle hover:border-indigo-500 hover:bg-indigo-500/10 text-transparent'
          }`}
          title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
          aria-label={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
        >
          <Check className={`h-3.5 w-3.5 stroke-[2.5] ${task.completed ? 'opacity-100' : 'opacity-0'}`} />
        </button>

        {/* Task Details */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs sm:text-sm font-semibold truncate ${
                task.completed ? 'line-through text-muted font-normal' : 'text-primary'
              }`}
            >
              {task.title}
            </span>

            {/* Priority Badge */}
            {task.priority && !task.completed && (
              <span
                className={`rounded-md border px-1.5 py-0.2 text-[10px] font-semibold uppercase tracking-wider ${currentPriority.badge}`}
              >
                {currentPriority.text}
              </span>
            )}

            {/* Date Badge if enabled (e.g. in History or Upcoming) */}
            {showDateBadge && task.date && (
              <span className="text-[11px] text-muted font-medium">
                {formatDateLabel(task.date)}
              </span>
            )}

            {task.completed && (
              <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 text-[10px] font-medium text-emerald-500">
                Completed
              </span>
            )}
          </div>

          {/* Course / Video Context */}
          {courseObj && (
            <div className="flex items-center gap-1.5 text-xs text-secondary">
              <BookOpen className="h-3 w-3 text-indigo-400 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-[280px]">
                {courseObj.title}
              </span>
              {videoObj && (
                <span className="text-muted truncate">
                  · Video {videoObj.position}: {videoObj.title}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {task.description && (
            <p className="text-[11px] text-muted line-clamp-1">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-subtle w-full sm:w-auto justify-end">
        {/* Start Learning / Lesson Action */}
        {courseObj && !task.completed && (
          <button
            type="button"
            onClick={handleStartLearning}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-400 transition-colors cursor-pointer"
            title="Open video lesson in player"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Start Lesson</span>
          </button>
        )}

        {/* Reschedule */}
        {!task.completed && (
          <button
            type="button"
            onClick={() => onReschedule(task)}
            className="rounded-lg p-1.5 text-muted hover:text-primary hover:bg-surface-elevated border border-transparent hover:border-app transition-all cursor-pointer"
            title="Reschedule task"
            aria-label="Reschedule task"
          >
            <Calendar className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Edit */}
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-lg p-1.5 text-muted hover:text-primary hover:bg-surface-elevated border border-transparent hover:border-app transition-all cursor-pointer"
          title="Edit task"
          aria-label="Edit task"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="rounded-lg p-1.5 text-muted hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
          title="Delete task"
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
