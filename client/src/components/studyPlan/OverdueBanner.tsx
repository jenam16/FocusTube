import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Calendar, Check, Play } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);

  if (!tasks || tasks.length === 0) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 sm:p-4 space-y-2.5">
      {/* Banner Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500 shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-amber-500">
              {tasks.length} Overdue Task{tasks.length > 1 ? 's' : ''}
            </h3>
            <p className="text-[11px] text-muted">
              Scheduled for past dates. Mark complete or reschedule to stay on track.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="rounded-lg p-1.5 text-muted hover:text-amber-500 hover:bg-amber-500/15 transition-colors cursor-pointer"
          aria-label={isExpanded ? 'Collapse overdue tasks' : 'Expand overdue tasks'}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Overdue Task List */}
      {isExpanded && (
        <div className="divide-y divide-app pt-1">
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
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-subtle hover:border-emerald-500 hover:bg-emerald-500/10 text-transparent transition-colors cursor-pointer"
                    title="Mark as complete"
                  >
                    <Check className="h-3 w-3 text-emerald-500 stroke-[2.5]" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-primary block truncate">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-muted mt-0.5">
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

                {/* Actions: Start Learning & Reschedule */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {courseObj && videoObj && (
                    <button
                      type="button"
                      onClick={() => navigate(`/watch/${courseObj._id}/${videoObj._id}`)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/15 border border-indigo-500/25 px-2.5 py-1 text-[11px] font-semibold text-indigo-400 hover:bg-indigo-500/25 transition-all cursor-pointer"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Learn</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onReschedule(task)}
                    className="inline-flex items-center gap-1 rounded-lg border border-app bg-surface px-2.5 py-1 text-[11px] font-semibold text-secondary hover:text-primary hover:border-indigo-500/30 transition-colors cursor-pointer"
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
