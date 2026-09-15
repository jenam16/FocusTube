import React from 'react';
import { Flame, CheckCircle2, CalendarCheck, BookOpen } from 'lucide-react';

export const ProgressHabitSection: React.FC = () => {
  return (
    <section className="relative py-16 md:py-24 bg-[#0B1120] border-t border-white/[0.08]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold text-teal-300 mb-4">
            <Flame className="h-3.5 w-3.5 text-teal-400" />
            <span>Consistency & Habit Formation</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white sm:text-5xl font-heading tracking-tight">
            See your learning move forward.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-400">
            Real momentum comes from finishing lessons and checking off daily goals, not counting endless passive hours.
          </p>
        </div>

        {/* 4 Motivation Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Course Progress */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 flex flex-col justify-between hover:border-white/[0.16] transition-all">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono mb-2">
                <span>Course Progress</span>
                <span className="text-indigo-400">80%</span>
              </div>
              <div className="text-2xl font-black text-white font-heading">
                18 <span className="text-base text-slate-500 font-normal">/ 24</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Lessons completed</p>

              {/* Progress Bar */}
              <div className="mt-4 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full w-[80%] rounded-full bg-indigo-500" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Next up: Lesson 19 (Database Indexing)</span>
            </div>
          </div>

          {/* Card 2: Videos Completed */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 flex flex-col justify-between hover:border-white/[0.16] transition-all">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono mb-2">
                <span>Completed Lessons</span>
                <BookOpen className="h-4 w-4 text-teal-400" />
              </div>
              <div className="text-2xl font-black text-white font-heading">
                18 Videos
              </div>
              <p className="text-xs text-slate-400 mt-1">Marked complete automatically at 90%</p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-teal-300 font-medium">
              <span>Verified lesson completions</span>
            </div>
          </div>

          {/* Card 3: Daily Learning Tasks */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 flex flex-col justify-between hover:border-white/[0.16] transition-all">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono mb-2">
                <span>Daily Tasks</span>
                <CalendarCheck className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-white font-heading">
                4 <span className="text-base text-slate-500 font-normal">/ 5</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Organized in Study Plan</p>

              {/* Progress Bar */}
              <div className="mt-4 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full w-[80%] rounded-full bg-teal-400" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>1 task remaining for today</span>
            </div>
          </div>

          {/* Card 4: Learning Streak */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-[#111827] to-[#111827] p-6 flex flex-col justify-between shadow-lg shadow-indigo-950/30 hover:border-indigo-500/50 transition-all">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-300 uppercase tracking-wider font-mono mb-2">
                <span>Learning Streak</span>
                <Flame className="h-4 w-4 text-amber-400 fill-current" />
              </div>
              <div className="text-2xl font-black text-white font-heading flex items-center gap-2">
                <span>7 Days</span>
                <span className="text-xs font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Fueled by completed lessons & daily tasks
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.08] text-[11px] text-indigo-200 font-medium">
              <span>Keep your streak going tomorrow</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
