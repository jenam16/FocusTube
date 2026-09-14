import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Calendar, CheckSquare, Square, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TaskItem } from '../../types';

interface OverdueBannerProps {
  tasks: TaskItem[];
  onCompleteTask: (task: TaskItem) => void;
  onReschedule: (task: TaskItem) => void;
}

export const OverdueBanner: React.FC<OverdueBannerProps> = ({
  tasks,
  onCompleteTask,
  onReschedule,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!tasks || tasks.length === 0) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-sm backdrop-blur-sm space-y-3">
      {/* Banner Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-amber-200">
              Overdue Tasks ({tasks.length})
            </h3>
            <p className="text-[11px] text-amber-400/80">
              These tasks passed their scheduled date without being completed.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="rounded-lg p-1 text-amber-400 hover:bg-amber-500/20 transition-colors"
          aria-label={isExpanded ? 'Collapse overdue tasks' : 'Expand overdue tasks'}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Overdue Task List */}
      {isExpanded && (
        <div className="divide-y divide-amber-500/20 pt-1">
          {tasks.map((task) => {
            const courseObj = typeof task.course === 'object' && task.course !== null ? task.course : null;
            const videoObj = typeof task.video === 'object' && task.video !== null ? task.video : null;

            return (
              <div
                key={task._id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 py-2.5"
              >
                {/* Checkbox and Task Title */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onCompleteTask(task)}
                    className="text-amber-400 hover:text-emerald-400 transition-colors shrink-0"
                    title="Mark as complete"
                  >
                    {task.completed ? (
                      <CheckSquare className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-gray-100 block truncate">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-amber-300/80 mt-0.5">
                      <span>Due: {formatDate(task.date)}</span>
                      {courseObj && (
                        <span>
                          • {courseObj.title}
                          {videoObj?.position ? ` (L${videoObj.position})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Start Learning (if video linked) & Reschedule */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {courseObj && videoObj && (
                    <button
                      type="button"
                      onClick={() => navigate(`/watch/${courseObj._id}/${videoObj._id}`)}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-600/90 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-500 transition-colors shadow-sm"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Learn</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onReschedule(task)}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/30 transition-colors"
                  >
                    <Calendar className="h-3 w-3" />
                    <span>Reschedule</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
