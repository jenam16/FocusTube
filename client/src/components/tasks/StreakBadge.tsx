import React from 'react';
import { Flame } from 'lucide-react';

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  currentStreak,
  longestStreak,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const hasStreak = currentStreak > 0;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-xl border transition-all ${
        hasStreak
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-sm shadow-amber-500/10'
          : 'border-gray-800 bg-gray-900/60 text-gray-500'
      } ${
        isSm
          ? 'px-2.5 py-1 text-xs'
          : isLg
            ? 'px-4 py-2 text-sm font-semibold'
            : 'px-3 py-1.5 text-xs font-medium'
      }`}
      title={
        longestStreak
          ? `Current streak: ${currentStreak} day${currentStreak === 1 ? '' : 's'} • Best: ${longestStreak} day${longestStreak === 1 ? '' : 's'}`
          : `Current streak: ${currentStreak} day${currentStreak === 1 ? '' : 's'}`
      }
    >
      <Flame
        className={`${
          isSm ? 'h-3.5 w-3.5' : isLg ? 'h-5 w-5' : 'h-4 w-4'
        } ${hasStreak ? 'fill-amber-500 text-amber-500 animate-pulse' : 'text-gray-500'}`}
      />
      <span>
        {currentStreak} {currentStreak === 1 ? 'day streak' : 'days streak'}
      </span>
    </div>
  );
};
