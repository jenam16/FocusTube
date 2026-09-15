import React from 'react';
import { PlusCircle, EyeOff, TrendingUp, Camera } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: PlusCircle,
    title: 'Import a Playlist',
    description: 'Bring your YouTube learning playlist into FocusTube.',
  },
  {
    number: '02',
    icon: EyeOff,
    title: 'Learn Without Distractions',
    description: 'Open your course inside a focused learning environment.',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Track Your Progress',
    description: "Continue videos from where you left off and see how much you've completed.",
  },
  {
    number: '04',
    icon: Camera,
    title: 'Save What Matters',
    description: 'Bookmark videos, take notes, and capture important learning moments.',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="relative py-16 md:py-24 bg-[#0B1120] border-y border-white/[0.08]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
            How It Works
          </span>
          <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl font-heading">
            Four simple steps to focused learning.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Turn passive YouTube viewing into an organized, goal-oriented study system.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative rounded-2xl border border-white/[0.08] bg-[#111827] p-6 hover:border-white/[0.16] hover:bg-[#151E32] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-indigo-400 font-mono">
                      {step.number}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white font-heading">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
