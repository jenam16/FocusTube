import React from 'react';
import { Calendar, Plus, Clock, History as HistoryIcon, CalendarDays } from 'lucide-react';

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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
      {/* Title & Description */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading">
              Study Plan
            </h1>
            {overdueCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                <Clock className="h-3 w-3" />
                {overdueCount} overdue
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Organize daily tasks, schedule upcoming lessons, and review completed study goals.
          </p>
        </div>
      </div>

      {/* Tabs & New Task Action */}
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-[#0B101E] border border-white/[0.07] p-1 shadow-xs">
          <button
            type="button"
            onClick={() => onTabChange('today')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'today'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Today</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('upcoming')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Upcoming</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('history')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <HistoryIcon className="h-3.5 w-3.5" />
            <span>History</span>
          </button>
        </div>

        {/* Add Task Button */}
        <button
          type="button"
          onClick={onNewTask}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] transition-all shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  );
};
