import React from 'react';
import {
  Focus,
  Camera,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle2,
} from 'lucide-react';

export const FocusModeSection: React.FC = () => {
  return (
    <section id="focus-mode" className="relative py-16 md:py-24 bg-[#0B1120] border-t border-white/[0.08] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[36rem] h-[22rem] bg-indigo-500/[0.06] rounded-full blur-[130px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Split Layout: Left Content (5 cols), Right Visual (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Heading + Explanation + Bullets */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 mb-4">
                <Focus className="h-3.5 w-3.5 text-indigo-400" />
                <span>Dedicated Learning Environment</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl font-heading tracking-tight leading-tight">
                Your learning deserves a distraction-free space.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                FocusTube keeps the learning experience centered around the lesson, helping you spend less time navigating and more time learning.
              </p>
            </div>

            {/* Key Value Bullets */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">No recommended videos or clickbait</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No autoplaying rabbit holes or algorithmic sidebars to derail your attention.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Always resumes to the exact second</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Never search for where you stopped in a complex multi-hour lecture.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Curriculum syllabus drawer at hand</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Check off lessons and jump ahead without losing your playback context.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Focus Mode Player Mockup */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/[0.10] bg-[#111827] p-4 sm:p-6 shadow-2xl shadow-black/70">
              {/* Header inside Focus Mode Player */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
                <div>
                  <div className="text-[11px] font-mono text-indigo-400 font-semibold uppercase">
                    Lesson 8 of 24 • 85% Watched
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-heading truncate max-w-sm sm:max-w-md">
                    008 — Deep Dive: Concurrency & Asynchronous Event Loops
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-white">
                    <Camera className="h-3 w-3 text-indigo-400" />
                    <span className="hidden sm:inline">Capture</span>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                    <Bookmark className="h-3 w-3 fill-current" />
                  </div>
                </div>
              </div>

              {/* Clean Video Viewport */}
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-800 bg-black flex items-center justify-center">
                <div className="absolute inset-0 bg-radial from-indigo-900/30 via-slate-950 to-black opacity-90" />

                <div className="relative z-10 flex flex-col items-center text-center px-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/50 mb-2.5">
                    <Play className="h-6 w-6 fill-current ml-0.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-200">
                    Node.js Architecture: Event Loop & Libuv Threads
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                    24:02 / 28:15 (Focus Mode Active)
                  </span>
                </div>

                {/* Scrub Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-5">
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full w-[85%] bg-indigo-500 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Lesson Nav Bar */}
              <div className="mt-3.5 flex items-center justify-between pt-1">
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-800/60 px-3.5 py-1.5 text-xs font-semibold text-slate-300">
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </div>
                <span className="text-xs text-slate-500 hidden sm:inline-block font-mono">
                  Syllabus auto-advances
                </span>
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm">
                  <span>Next Lesson</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
