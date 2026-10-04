import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DateNavigatorProps {
  currentDateStr: string; // YYYY-MM-DD
  onDateChange: (dateStr: string) => void;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  currentDateStr,
  onDateChange,
}) => {
  const currentDate = new Date(`${currentDateStr}T00:00:00Z`);

  const todayStr = (() => {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  const isToday = currentDateStr === todayStr;

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setUTCDate(prev.getUTCDate() - 1);
    const y = prev.getUTCFullYear();
    const m = String(prev.getUTCMonth() + 1).padStart(2, '0');
    const d = String(prev.getUTCDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${d}`);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setUTCDate(next.getUTCDate() + 1);
    const y = next.getUTCFullYear();
    const m = String(next.getUTCMonth() + 1).padStart(2, '0');
    const d = String(next.getUTCDate()).padStart(2, '0');
    onDateChange(`${y}-${m}-${d}`);
  };

  const handleTodayClick = () => {
    onDateChange(todayStr);
  };

  // e.g. "Sunday, October 4"
  const formattedDay = currentDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      {/* Date display & Today badge */}
      <div className="flex items-center gap-2.5">
        <h2 className="text-sm sm:text-base font-bold text-primary font-heading tracking-tight">
          {formattedDay}
        </h2>
        {isToday ? (
          <span className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            Today
          </span>
        ) : (
          <button
            type="button"
            onClick={handleTodayClick}
            className="rounded-md bg-surface border border-app hover:border-indigo-500/30 px-2 py-0.5 text-[11px] font-semibold text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            Back to Today
          </button>
        )}
      </div>

      {/* Subtle compact day navigation */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handlePrevDay}
          title="Previous day"
          className="rounded-lg p-1.5 text-muted hover:text-primary hover:bg-surface border border-transparent hover:border-app transition-all cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="relative inline-flex items-center">
          <label className="rounded-lg p-1.5 text-muted hover:text-primary hover:bg-surface border border-transparent hover:border-app transition-all cursor-pointer">
            <CalendarIcon className="h-4 w-4" />
            <input
              type="date"
              value={currentDateStr}
              onChange={(e) => {
                if (e.target.value) onDateChange(e.target.value);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              aria-label="Pick date"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleNextDay}
          title="Next day"
          className="rounded-lg p-1.5 text-muted hover:text-primary hover:bg-surface border border-transparent hover:border-app transition-all cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
