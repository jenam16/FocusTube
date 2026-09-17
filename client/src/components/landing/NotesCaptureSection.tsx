import React from 'react';
import {
  Camera,
  Clock,
  Play,
  FileText,
  Pin,
  ArrowRight,
  Bookmark,
} from 'lucide-react';

export const NotesCaptureSection: React.FC = () => {
  return (
    <section id="notes" className="relative py-16 md:py-24 bg-[#0F172A] border-t border-white/[0.08] overflow-hidden">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[40rem] h-[22rem] bg-indigo-500/[0.06] rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 mb-4">
            <Camera className="h-3.5 w-3.5 text-indigo-400" />
            <span>Integrated Note-Taking & Visual Capture</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white sm:text-5xl font-heading tracking-tight leading-tight">
            Don't just watch. Save what matters.
          </h2>
          <p className="mt-4 text-sm sm:text-lg text-slate-300 leading-relaxed">
            Take notes while learning and capture important moments directly alongside the lesson.
          </p>
        </div>

        {/* Visual Workflow Flow: Video -> Important Moment -> Screenshot -> Note -> Revisit */}
        <div className="mb-12 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#111827] px-3.5 py-2">
            <Play className="h-3.5 w-3.5 text-indigo-400 fill-current" />
            <span>Watch Lesson</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-500" />
          <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#111827] px-3.5 py-2">
            <Camera className="h-3.5 w-3.5 text-teal-400" />
            <span>Capture Moment</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-500" />
          <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#111827] px-3.5 py-2">
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            <span>Attach Note</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-500" />
          <div className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-3.5 py-2 text-indigo-300">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span>Watch Moment Later</span>
          </div>
        </div>

        {/* Realistic Note & Captured Moment Cards Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Feature Highlights */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.045] hover:border-white/[0.16] p-6 space-y-2.5 transition-all duration-200">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Camera className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-white font-heading">
                Clean Video-Only Capture
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Save an exact frame from the lesson without capturing your desktop or browser tabs. Letterbox bars and toolbars are automatically cropped out.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.045] hover:border-white/[0.16] p-6 space-y-2.5 transition-all duration-200">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-white font-heading">
                One-Click "Watch Moment"
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Every snapshot is tied to the exact second in the video. Click "Watch Moment" anytime to jump back and review.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.045] hover:border-white/[0.16] p-6 space-y-2.5 transition-all duration-200">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Bookmark className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-white font-heading">
                Centralized in Notes
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Filter by course, search through your notes, and pin critical definitions. All your insights stay safely saved in your personal workspace.
              </p>
            </div>
          </div>

          {/* Right Column: High-Fidelity Captured Moment Card Mockup */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-white/[0.10] bg-[#111827] p-5 sm:p-6 shadow-2xl shadow-black/80">
              {/* Header inside Note Card */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <span className="text-indigo-400">CS50 Web Dev</span>
                  <span>•</span>
                  <span>Lesson 14</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
                    <Pin className="h-3 w-3 text-indigo-400" />
                    <span>Pinned</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Today, 2:40 PM</span>
                </div>
              </div>

              {/* Simulated Captured Screenshot Graphic */}
              <div className="mt-4 relative aspect-video w-full rounded-xl border border-gray-800 bg-slate-950 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-slate-900 to-black p-4 flex flex-col justify-between">
                  {/* Visual Slide Mockup */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-indigo-300">
                      // Architectural Pattern
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white font-mono">
                      Event-Driven Microservices Architecture
                    </h4>
                  </div>

                  <div className="rounded-lg bg-black/60 p-3 border border-white/[0.06] font-mono text-[11px] text-slate-300 space-y-1 backdrop-blur-xs">
                    <div className="text-emerald-400">✓ Producer sends events to message broker</div>
                    <div className="text-indigo-300">→ Consumer workers scale independently</div>
                    <div className="text-amber-400">! Guaranteed at-least-once delivery semantics</div>
                  </div>

                  {/* Timestamp Badge */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1 rounded-md bg-black/80 px-2.5 py-1 text-xs font-mono font-bold text-emerald-300 backdrop-blur-sm">
                      <Clock className="h-3 w-3" />
                      <span>14:28</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Cloudinary HD WebP
                    </span>
                  </div>
                </div>
              </div>

              {/* Note Content */}
              <div className="mt-4 space-y-2">
                <h3 className="text-sm sm:text-base font-bold text-white font-heading">
                  Snapshot: Core Microservices Message Flow
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Key takeaway from professor at 14:28: Keep message schemas backward compatible. Producers must never break consumers during phased rollouts.
                </p>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="rounded-md border border-white/[0.08] bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                    #architecture
                  </span>
                  <span className="rounded-md border border-white/[0.08] bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                    #backend
                  </span>
                </div>
              </div>

              {/* Note Card Footer with "Watch Moment" CTA */}
              <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Watch Moment at 14:28</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Replays directly at 14:28
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
