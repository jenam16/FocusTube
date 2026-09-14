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

  const displayDateText = currentDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: currentDate.getUTCFullYear() !== new Date().getUTCFullYear() ? 'numeric' : undefined,
    timeZone: 'UTC',
  });

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-800 bg-gray-900/50 p-3 backdrop-blur-sm">
      {/* Prev Day Button */}
      <button
        type="button"
        onClick={handlePrevDay}
        className="inline-flex items-center gap-1 rounded-xl border border-gray-800 bg-gray-950/60 p-2 text-xs font-semibold text-gray-400 hover:border-gray-700 hover:text-white transition-all"
        title="Previous Day"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Center: Formatted Date + Today Badge + Date picker */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <CalendarIcon className="h-4 w-4 text-red-400" />
            <span className="text-sm sm:text-base font-bold text-white hover:text-red-300 transition-colors">
              {displayDateText}
            </span>
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

        {isToday ? (
          <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
            Today
          </span>
        ) : (
          <button
            type="button"
            onClick={handleTodayClick}
            className="rounded-full bg-gray-800 hover:bg-gray-700 px-2.5 py-0.5 text-[11px] font-semibold text-gray-300 transition-colors"
          >
            Jump to Today
          </button>
        )}
      </div>

      {/* Next Day Button */}
      <button
        type="button"
        onClick={handleNextDay}
        className="inline-flex items-center gap-1 rounded-xl border border-gray-800 bg-gray-950/60 p-2 text-xs font-semibold text-gray-400 hover:border-gray-700 hover:text-white transition-all"
        title="Next Day"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};
