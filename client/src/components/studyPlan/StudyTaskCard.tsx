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
    high: { badge: 'bg-red-500/15 border-red-500/30 text-red-400', text: 'High' },
    medium: { badge: 'bg-amber-500/15 border-amber-500/30 text-amber-400', text: 'Medium' },
    low: { badge: 'bg-blue-500/15 border-blue-500/30 text-blue-400', text: 'Low' },
  };

  const currentPriority = priorityStyles[task.priority || 'medium'];

  return (
    <div
      className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
        task.completed
          ? 'border-gray-800/50 bg-gray-950/40 opacity-75'
          : 'border-gray-800 bg-gray-900/50 hover:border-gray-700/80 hover:bg-gray-900/80'
      }`}
    >
      {/* Checkbox & Task Details */}
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className="mt-0.5 sm:mt-0 text-gray-400 hover:text-red-400 transition-colors shrink-0"
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
                task.completed ? 'line-through text-gray-400' : 'text-gray-100'
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
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <BookOpen className="h-3 w-3 text-red-400 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-[280px]">
                {courseObj.title}
              </span>
              {videoObj && (
                <span className="text-gray-500 truncate">
                  • L{videoObj.position}: {videoObj.title}
                </span>
              )}
            </div>
          )}

          {/* Description if present */}
          {task.description && (
            <p className="text-[11px] text-gray-400 line-clamp-1">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons: Learning / Focus & CRUD */}
      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800/40 w-full sm:w-auto justify-end">
        {/* Start Learning / Focus if video linked */}
        {courseObj && (
          <>
            <button
              type="button"
              onClick={handleStartLearning}
              className="inline-flex items-center gap-1 rounded-xl bg-red-600/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition-all shadow-sm"
              title="Open video lesson in player"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Start Learning</span>
            </button>

            <button
              type="button"
              onClick={handleStartFocus}
              className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
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
          className="rounded-lg border border-gray-800 bg-gray-950/60 p-1.5 text-gray-400 hover:border-gray-700 hover:text-white transition-colors"
          title="Reschedule task date"
        >
          <Calendar className="h-3.5 w-3.5" />
        </button>

        {/* Edit */}
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-lg border border-gray-800 bg-gray-950/60 p-1.5 text-gray-400 hover:border-gray-700 hover:text-white transition-colors"
          title="Edit task"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(task)}
          className="rounded-lg border border-gray-800 bg-gray-950/60 p-1.5 text-gray-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          title="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
