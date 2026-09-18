import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Square,
  Play,
  Timer,
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
}

export const StudyTaskCard: React.FC<StudyTaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onReschedule,
}) => {
  const navigate = useNavigate();

  const courseObj = typeof task.course === 'object' && task.course !== null ? task.course : null;
  const videoObj = typeof task.video === 'object' && task.video !== null ? task.video : null;

  const handleStartLearning = () => {
    if (courseObj && videoObj) {
      navigate(`/watch/${courseObj._id}/${videoObj._id}`);
    } else if (courseObj) {
      navigate(`/courses/${courseObj._id}`);
    }
  };

  const handleStartFocus = () => {
    if (courseObj && videoObj) {
      navigate(`/watch/${courseObj._id}/${videoObj._id}?focus=1`);
    } else {
      navigate('/focus');
    }
  };

  const priorityStyles: Record<TaskPriority, { badge: string; text: string }> = {
    high: { badge: 'bg-rose-500/15 border-rose-500/30 text-rose-400', text: 'High' },
    medium: { badge: 'bg-amber-500/15 border-amber-500/30 text-amber-400', text: 'Medium' },
    low: { badge: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400', text: 'Low' },
  };

  const currentPriority = priorityStyles[task.priority || 'medium'];

  return (
    <div
      className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
        task.completed
          ? 'border-white/[0.04] bg-[#070B14]/60 opacity-60'
          : 'border-white/[0.07] bg-[#0B101E] hover:border-white/[0.15] hover:bg-[#0D1527] shadow-sm'
      }`}
    >
      {/* Checkbox & Task Details */}
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className="mt-0.5 sm:mt-0 text-slate-400 hover:text-indigo-400 transition-colors shrink-0"
          title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
        >
          {task.completed ? (
            <CheckSquare className="h-5 w-5 text-emerald-400" />
          ) : (
            <Square className="h-5 w-5 hover:text-white" />
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs sm:text-sm font-semibold truncate ${
                task.completed ? 'line-through text-slate-500' : 'text-slate-100'
              }`}
            >
              {task.title}
            </span>

            {/* Priority Badge */}
            {task.priority && (
              <span
                className={`rounded-full border px-2 py-0.2 text-[10px] font-semibold uppercase tracking-wider ${currentPriority.badge}`}
              >
                {currentPriority.text}
              </span>
            )}
          </div>

          {/* Course / Video info */}
          {courseObj && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <BookOpen className="h-3 w-3 text-indigo-400 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-[280px]">
                {courseObj.title}
              </span>
              {videoObj && (
                <span className="text-slate-500 truncate">
                  • L{videoObj.position}: {videoObj.title}
                </span>
              )}
            </div>
          )}

          {/* Description if present */}
          {task.description && (
            <p className="text-[11px] text-slate-400 line-clamp-1">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons: Learning / Focus & CRUD */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06] w-full sm:w-auto justify-end">
        {/* Start Learning / Focus if video linked */}
        {courseObj && (
          <>
            <button
              type="button"
              onClick={handleStartLearning}
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-3 py-1.5 text-xs font-semibold text-white transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98]"
              title="Open video lesson in player"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Start Learning</span>
            </button>

            <button
              type="button"
              onClick={handleStartFocus}
              className="inline-flex items-center gap-1 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all"
              title="Launch Focus Mode"
            >
              <Timer className="h-3 w-3" />
              <span className="hidden sm:inline">Focus</span>
            </button>
          </>
        )}

        {/* Reschedule */}
        <button
          type="button"
          onClick={() => onReschedule(task)}
          className="rounded-lg border border-white/[0.08] bg-[#0D1527] p-1.5 text-slate-400 hover:border-white/[0.18] hover:text-white transition-all"
          title="Reschedule task date"
        >
          <Calendar className="h-3.5 w-3.5" />
        </button>

        {/* Edit */}
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-lg border border-white/[0.08] bg-[#0D1527] p-1.5 text-slate-400 hover:border-white/[0.18] hover:text-white transition-all"
          title="Edit task"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="rounded-lg border border-white/[0.08] bg-[#0D1527] p-1.5 text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
          title="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
