import React from 'react';
import {
  Play,
  CheckCircle2,
  Bookmark,
  Camera,
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
        {/* Browser / Application Frame Mockup */}
        <div className="relative overflow-hidden rounded-2xl border border-app bg-surface shadow-2xl">
          {/* Top Window Bar */}
          <div className="flex h-11 items-center justify-between border-b border-app bg-secondary px-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-surface px-4 py-1 text-xs text-muted font-mono border border-app">
              <span className="text-emerald-500">https://</span>
              <span>focustube.app/watch/full-stack-web-dev/lesson-14</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-indigo-500 font-medium font-heading">
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="hidden sm:inline">Focus Session Active</span>
            </div>
          </div>

          {/* Inner Application Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Main Video & Lesson Content Area (8 Cols) */}
            <div className="lg:col-span-8 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-app space-y-4">
              {/* Header Bar within app */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-indigo-500 font-semibold">CS50</span>
                  <span>/</span>
                  <span className="text-secondary font-medium">Full-Stack Development</span>
                  <span>/</span>
                  <span>Lesson 14 of 32</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-500">
                    <Bookmark className="h-3 w-3 fill-current" />
                    <span>Bookmarked</span>
                  </div>
                </div>
              </div>

              {/* Video Player Mockup Container */}
              <div className="group relative aspect-video w-full overflow-hidden rounded-xl border border-app bg-slate-950 shadow-inner">
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
                  <h3 className="text-base font-bold text-primary font-heading">
                    014 — Building High-Performance REST APIs
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted" /> 24 mins
                    </span>
                    <span>•</span>
                    <span className="text-indigo-500 font-medium">Automatic resume enabled</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md">
                  <span>Next Lesson</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {/* Right Course Syllabus & Notes Sidebar Area (4 Cols) */}
            <div className="lg:col-span-4 bg-secondary p-4 sm:p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <ListVideo className="h-4 w-4 text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary font-heading">
                      Course Curriculum
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-500">
                    14/32 Done
                  </span>
                </div>

                {/* Simulated Lesson Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-app text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate text-secondary">
                        012 — Intro to Routing & Express
                      </span>
                    </div>
                    <span className="text-[10px] text-muted font-mono shrink-0">
                      16m
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-app text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate text-secondary">
                        013 — Middleware & Error Handlers
                      </span>
                    </div>
                    <span className="text-[10px] text-muted font-mono shrink-0">
                      21m
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs shadow-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                      <span className="truncate font-semibold text-indigo-500 dark:text-indigo-300">
                        014 — Building High-Performance REST APIs
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-500 font-mono shrink-0">
                      Active
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-app text-xs opacity-75">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="h-2 w-2 rounded-full bg-muted shrink-0" />
                      <span className="truncate text-muted">
                        015 — Database Schemas & Models
                      </span>
                    </div>
                    <span className="text-[10px] text-muted font-mono shrink-0">
                      19m
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Note Callout inside syllabus */}
              <div className="rounded-xl border border-app bg-surface p-3 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-indigo-500 font-heading">📌 Pinned Note @ 14:28</span>
                  <span className="text-muted font-mono text-[10px]">Cloudinary</span>
                </div>
                <p className="text-[11px] text-secondary leading-snug">
                  "API payloads must validate boundary conditions before passing into domain services."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
