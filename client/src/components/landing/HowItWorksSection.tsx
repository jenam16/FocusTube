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
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">
            How It Works
          </span>
          <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl font-heading tracking-tight">
            Four simple steps to focused learning.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Turn passive YouTube viewing into an organized, goal-oriented study system.
          </p>
        </div>

        {/* Desktop Connected Stepper Layout */}
        <div className="hidden lg:block relative">
          {/* Subtle Connecting Line */}
          <div className="absolute top-7 left-12 right-12 h-px bg-gradient-to-r from-indigo-500/20 via-indigo-500/40 to-indigo-500/20 -z-0" />

          <div className="grid grid-cols-4 gap-8 relative z-10">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex flex-col items-center text-center group">
                  {/* Step Node */}
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.12] bg-[#111827] shadow-lg shadow-black/40 group-hover:border-indigo-500/50 group-hover:bg-[#151E32] transition-all duration-200">
                    <Icon className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform duration-200" />
                  </div>

                  <span className="mt-4 text-xs font-mono font-bold text-indigo-400">
                    Step {step.number}
                  </span>
                  <h3 className="mt-1 text-base font-bold text-white font-heading">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-[220px]">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile / Tablet Vertical Connected Stepper */}
        <div className="lg:hidden relative pl-6 sm:pl-8 space-y-8">
          {/* Vertical Connecting Line */}
          <div className="absolute top-3 bottom-3 left-3 sm:left-4 w-px bg-indigo-500/30" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative flex items-start gap-4">
                {/* Node on line */}
                <div className="absolute -left-6 sm:-left-8 flex h-6 w-6 items-center justify-center rounded-full bg-[#111827] border border-indigo-500 text-[11px] font-bold text-indigo-300 font-mono">
                  {step.number}
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white font-heading">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
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
