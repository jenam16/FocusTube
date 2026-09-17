import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Focus,
  CalendarCheck,
  Camera,
  Play,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const CoreFeaturesSection: React.FC = () => {
  return (
    <section id="features" className="relative py-16 md:py-24 bg-[#0F172A]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">
            Core Capabilities
          </span>
          <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl font-heading tracking-tight">
            Everything you need to learn. Nothing you don't.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            A restrained, thoughtfully structured toolkit designed specifically for serious self-taught study.
          </p>
        </div>

        {/* Controlled Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Bento Item 1: Large Featured Card - Distraction-Free Learning (Span 7) */}
          <div className="md:col-span-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.045] hover:border-white/[0.16] p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 group">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:-translate-y-0.5 transition-transform duration-200">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                    Distraction-Free Learning
                  </h3>
                  <span className="text-xs text-indigo-400 font-mono">Primary Workspace</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                Keep your learning inside a focused workspace instead of navigating through the normal YouTube experience. Zero algorithmic recommendations, comments, or autoplay clickbait.
              </p>
            </div>

            {/* In-Card Player Preview Graphic */}
            <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#0B1120] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Play className="h-3 w-3 text-indigo-400 fill-current" />
                  <span>CS50: Building REST APIs</span>
                </div>
                <span className="rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold">
                  Zero Distractions
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-[75%] bg-indigo-500 rounded-full" />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Auto-resume: 18:42</span>
                <span>No comments • No sidebars</span>
              </div>
            </div>
          </div>

          {/* Bento Item 2: Focus Mode (Span 5) */}
          <div className="md:col-span-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.045] hover:border-white/[0.16] p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 group">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:-translate-y-0.5 transition-transform duration-200">
                  <Focus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                    Focus Mode
                  </h3>
                  <span className="text-xs text-indigo-400 font-mono">Immersive Study</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Enter a dedicated learning environment designed to keep the session centered around the lesson and curriculum.
              </p>
            </div>

            {/* Quick Actions Preview */}
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-wrap gap-2">
              <span className="rounded-lg border border-white/[0.08] bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 font-medium">
                📸 Video Snapshot
              </span>
              <span className="rounded-lg border border-white/[0.08] bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 font-medium">
                ⭐️ Bookmark Lesson
              </span>
              <span className="rounded-lg border border-white/[0.08] bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 font-medium">
                ☰ Quick Syllabus
              </span>
            </div>
          </div>

          {/* Bento Item 3: Progress Tracking (Span 4) */}
          <div className="md:col-span-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.045] hover:border-white/[0.16] p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 group">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-4 group-hover:-translate-y-0.5 transition-transform duration-200">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white font-heading">
                Progress Tracking
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Automatically keep track of your video progress and continue learning from where you stopped.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-teal-300 font-medium">
              <span>Automatic second-by-second</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>

          {/* Bento Item 4: Daily Learning Tasks (Span 4) */}
          <div className="md:col-span-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.045] hover:border-white/[0.16] p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 group">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 group-hover:-translate-y-0.5 transition-transform duration-200">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white font-heading">
                Daily Learning Tasks
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Turn learning goals into manageable daily tasks and keep your learning routine organized.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-emerald-300 font-medium">
              <span>Study Plan integration</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>

          {/* Bento Item 5: Notes & Bookmarks (Span 4) */}
          <div className="md:col-span-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.045] hover:border-white/[0.16] p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 group">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4 group-hover:-translate-y-0.5 transition-transform duration-200">
                <Camera className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white font-heading">
                Captured Moments & Notes
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Capture an important moment from a lesson and keep it connected to your notes and video.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-amber-300 font-medium">
              <span>Timestamped recall</span>
              <Clock className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
