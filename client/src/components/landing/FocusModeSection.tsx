import React from 'react';
import {
  Focus,
  Camera,
  Bookmark,
  FileText,
  ListVideo,
  ChevronLeft,
  ChevronRight,
  Play,
  CheckCircle2,
} from 'lucide-react';

export const FocusModeSection: React.FC = () => {
  return (
    <section id="focus-mode" className="relative py-16 md:py-24 bg-[#0B1120] border-t border-white/[0.08] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[25rem] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 mb-4">
            <Focus className="h-3.5 w-3.5 text-indigo-400" />
            <span>Dedicated Learning Environment</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white sm:text-5xl font-heading tracking-tight leading-tight">
            Your learning deserves a distraction-free space.
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-slate-300 leading-relaxed">
            FocusTube keeps the learning experience centered around the lesson, helping you spend less time navigating and more time learning.
          </p>
        </div>

        {/* Focus Mode Player Visual Mockup */}
        <div className="rounded-2xl border border-white/[0.12] bg-[#111827] p-4 sm:p-7 shadow-2xl shadow-black/60 max-w-4xl mx-auto">
          {/* Top Title & Quick Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">
                <span>Lesson 8 of 24</span>
                <span>•</span>
                <span className="text-slate-400 font-normal">28:15 duration</span>
                <span>•</span>
                <span className="text-indigo-400">85% watched</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white font-heading mt-0.5">
                008 — Deep Dive: Concurrency & Asynchronous Event Loops
              </h3>
            </div>

            {/* In-Player Focus Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#1E293B] px-3 py-1.5 text-xs font-semibold text-white shadow-xs">
                <Camera className="h-3.5 w-3.5 text-indigo-400" />
                <span>Capture Moment</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                <Bookmark className="h-3.5 w-3.5 fill-current" />
                <span>Bookmarked</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#1E293B] px-3 py-1.5 text-xs font-medium text-slate-300">
                <FileText className="h-3.5 w-3.5 text-indigo-400" />
                <span>Notes</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#1E293B] px-3 py-1.5 text-xs font-medium text-slate-300">
                <ListVideo className="h-3.5 w-3.5 text-indigo-400" />
                <span>Syllabus</span>
              </div>
            </div>
          </div>

          {/* Clean Player Screen */}
          <div className="mt-4 relative aspect-video w-full overflow-hidden rounded-xl border border-gray-800 bg-black flex items-center justify-center">
            {/* Player Ambient Backdrop */}
            <div className="absolute inset-0 bg-radial from-indigo-900/30 via-slate-950 to-black opacity-90" />

            <div className="relative z-10 flex flex-col items-center text-center px-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-600/50 mb-3 hover:scale-105 transition-transform">
                <Play className="h-7 w-7 fill-current ml-1" />
              </div>
              <span className="text-sm font-semibold text-slate-200">
                Node.js Architecture: Event Loop & Libuv Threads
              </span>
              <span className="text-xs text-slate-400 font-mono mt-1">
                24:02 / 28:15 (Playing in Focus Mode)
              </span>
            </div>

            {/* Bottom Timeline Indicator */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-6">
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full w-[85%] bg-indigo-500 rounded-full" />
              </div>
            </div>
          </div>

          {/* Navigation Between Lessons */}
          <div className="mt-4 flex items-center justify-between gap-3 pt-1">
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#1E293B] px-4 py-2 text-xs font-semibold text-slate-300">
              <ChevronLeft className="h-4 w-4" />
              <span>Previous Lesson</span>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline-block">
              Auto-advances when finished
            </span>
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md">
              <span>Next Lesson</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Value Points Row */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4 rounded-xl border border-white/[0.04] bg-[#111827]/40">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">No Recommendations</h4>
            <p className="mt-1 text-xs text-slate-400">
              No autoplaying random videos or algorithmic clickbait sidebars.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.04] bg-[#111827]/40">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">Always Resumes</h4>
            <p className="mt-1 text-xs text-slate-400">
              Never wonder where you stopped. Playback resumes to the exact second.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.04] bg-[#111827]/40">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">Syllabus at Hand</h4>
            <p className="mt-1 text-xs text-slate-400">
              Open the course curriculum drawer anytime without losing your place.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
