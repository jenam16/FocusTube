import React from 'react';
import { Flame } from 'lucide-react';

const stats = [
  {
    value: '85%',
    label: 'Course Progress',
    description: 'Measured across completed lessons in your playlist',
    highlight: 'text-indigo-500',
  },
  {
    value: '18',
    label: 'Videos Completed',
    description: 'Marked complete automatically as you reach 90%',
    highlight: 'text-primary',
  },
  {
    value: '4 / 5',
    label: 'Daily Tasks',
    description: 'Organized and scheduled in your Study Plan',
    highlight: 'text-primary',
  },
  {
    value: '7 Days',
    label: 'Learning Streak',
    description: 'Maintained by finishing real lessons and tasks',
    highlight: 'text-amber-500',
  },
];

export const ProgressHabitSection: React.FC = () => {
  return (
    <section className="relative py-16 md:py-24 bg-secondary border-t border-app">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-app bg-surface px-3.5 py-1 text-xs font-semibold text-secondary mb-4 shadow-xs">
            <Flame className="h-3.5 w-3.5 text-amber-500 fill-current" />
            <span>Consistency & Habit Formation</span>
          </div>
          <h2 className="text-3xl font-extrabold text-primary sm:text-5xl font-heading tracking-tight">
            See your learning move forward.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-secondary">
            Real momentum comes from completing lessons and checking off daily goals, not counting endless passive hours.
          </p>
        </div>

        {/* Minimal High-Impact Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-app bg-surface hover:border-indigo-500/30 p-7 transition-all duration-200 flex flex-col justify-between shadow-xs"
            >
              <div>
                <span className="text-xs uppercase font-mono font-semibold tracking-wider text-muted block mb-3">
                  {stat.label}
                </span>
                <div className={`text-4xl sm:text-5xl font-black font-heading tracking-tight ${stat.highlight}`}>
                  {stat.value}
                </div>
              </div>
              <p className="mt-5 text-xs text-secondary leading-relaxed border-t border-subtle pt-4">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
