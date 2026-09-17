import React from 'react';
import {
  Play,
  CheckCircle2,
  Bookmark,
  Camera,
  Focus,
  ChevronRight,
  ListVideo,
  Clock,
} from 'lucide-react';

export const ProductPreview: React.FC = () => {
  return (
    <section className="relative px-4 sm:px-6 lg:px-8 pb-16 md:pb-24">
      {/* Soft ambient backlight behind preview */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[26rem] bg-indigo-500/[0.06] rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-6xl">
        {/* Browser / Application Frame Mockup with top highlight */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.10] bg-[#0B1120] shadow-2xl shadow-black/80 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
          {/* Top Window Bar */}
          <div className="flex h-11 items-center justify-between border-b border-white/[0.08] bg-[#111827] px-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-900/90 px-4 py-1 text-xs text-slate-400 font-mono border border-white/[0.06]">
              <span className="text-emerald-400">https://</span>
              <span>focustube.app/watch/full-stack-web-dev/lesson-14</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium">
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="hidden sm:inline">Focus Session Active</span>
            </div>
          </div>

          {/* Inner Application Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Main Video & Lesson Content Area (8 Cols) */}
            <div className="lg:col-span-8 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-white/[0.08] space-y-4">
              {/* Header Bar within app */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-indigo-400">CS50</span>
                  <span>/</span>
                  <span className="text-slate-200">Full-Stack Development</span>
                  <span>/</span>
                  <span>Lesson 14 of 32</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                    <Bookmark className="h-3 w-3 fill-current" />
                    <span>Bookmarked</span>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
                    <Focus className="h-3 w-3" />
                    <span>Focus Mode</span>
                  </div>
                </div>
              </div>

              {/* Video Player Mockup Container */}
              <div className="group relative aspect-video w-full overflow-hidden rounded-xl border border-gray-800 bg-slate-950 shadow-inner">
                {/* Simulated Video Frame Content */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-950 flex flex-col justify-between p-5">
                  {/* Top Overlay Controls */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                      Full-Stack Web Dev • Chapter 4
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-md">
                        <Camera className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Capture Moment</span>
                      </div>
                    </div>
                  </div>

                  {/* Center Play Graphic */}
                  <div className="self-center flex flex-col items-center gap-2 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/40">
                      <Play className="h-6 w-6 fill-current ml-0.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200">
                      Building RESTful API Endpoints & Validation
                    </span>
                  </div>

                  {/* Player Bottom Scrub Bar */}
                  <div className="space-y-1.5 bg-black/50 p-2.5 rounded-lg backdrop-blur-xs">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                      <span>18:42</span>
                      <span className="text-indigo-400 font-semibold">78% completed</span>
                      <span>24:10</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-indigo-500 to-teal-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lesson Info & Actions Below Video */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div>
                  <h3 className="text-base font-bold text-white font-heading">
                    014 — Building High-Performance REST APIs
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" /> 24 mins
                    </span>
                    <span>•</span>
                    <span className="text-indigo-400 font-medium">Automatic resume enabled</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md">
                  <span>Next Lesson</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {/* Sidebar / Syllabus Area (4 Cols) */}
            <div className="lg:col-span-4 bg-[#0F172A]/70 p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <ListVideo className="h-4 w-4 text-indigo-400" />
                    <span>Syllabus (14/32)</span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-400 font-mono">44% Total</span>
                </div>

                {/* Lesson List Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-[#111827]/60 p-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="truncate text-slate-400">012 — Backend Architecture</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">16m</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-[#111827]/60 p-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="truncate text-slate-400">013 — Database Modeling</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">22m</span>
                  </div>

                  {/* Active Lesson */}
                  <div className="flex items-center justify-between rounded-lg border border-indigo-500/40 bg-indigo-500/10 p-2.5 text-xs text-white shadow-xs">
                    <div className="flex items-center gap-2 truncate font-semibold">
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white shrink-0">
                        <Play className="h-2 w-2 fill-current ml-0.5" />
                      </div>
                      <span className="truncate text-indigo-200">014 — REST API Endpoints</span>
                    </div>
                    <span className="text-[10px] text-indigo-300 font-mono">78%</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-[#111827]/40 p-2.5 text-xs text-slate-400 opacity-75">
                    <div className="flex items-center gap-2 truncate">
                      <span className="h-3.5 w-3.5 rounded-full border border-slate-600 flex items-center justify-center text-[9px] text-slate-500 shrink-0">15</span>
                      <span className="truncate">015 — JWT Authentication</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">28m</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-[#111827]/40 p-2.5 text-xs text-slate-400 opacity-75">
                    <div className="flex items-center gap-2 truncate">
                      <span className="h-3.5 w-3.5 rounded-full border border-slate-600 flex items-center justify-center text-[9px] text-slate-500 shrink-0">16</span>
                      <span className="truncate">016 — Media Uploads</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">19m</span>
                  </div>
                </div>
              </div>

              {/* Mini Captured Moment Card */}
              <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#111827] p-3 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Camera className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Saved Moment (18:42)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Note synced</span>
                </div>
                <p className="text-[11px] text-slate-400 italic line-clamp-2">
                  "API Status Code convention: 201 for Created, 204 for No Content."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
