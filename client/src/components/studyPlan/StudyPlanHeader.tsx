import React from 'react';
import { Plus, Clock, Calendar, CalendarDays, History as HistoryIcon } from 'lucide-react';

export type StudyPlanTab = 'today' | 'upcoming' | 'history';

interface StudyPlanHeaderProps {
  activeTab: StudyPlanTab;
  onTabChange: (tab: StudyPlanTab) => void;
  onNewTask: () => void;
  overdueCount?: number;
}

export const StudyPlanHeader: React.FC<StudyPlanHeaderProps> = ({
  activeTab,
  onTabChange,
  onNewTask,
  overdueCount = 0,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary font-heading">
              Study Plan
            </h1>
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-500">
                <Clock className="h-3 w-3" />
                {overdueCount} overdue
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            Plan what you want to learn and stay consistent.
          </p>
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={onNewTask}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 active:scale-[0.98] transition-all shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Add Task</span>
        </button>
      </div>

      {/* View Switcher Segmented Control */}
      <div className="flex items-center justify-between border-b border-app pb-3">
        <div className="inline-flex rounded-xl bg-surface border border-app p-1 shadow-xs">
          <button
            type="button"
            onClick={() => onTabChange('today')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'today'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-secondary hover:text-primary hover:bg-surface-elevated'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Today</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('upcoming')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-secondary hover:text-primary hover:bg-surface-elevated'
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Upcoming</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('history')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-secondary hover:text-primary hover:bg-surface-elevated'
            }`}
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            <span>History</span>
          </button>
        </div>
      </div>
    </div>
  );
};
