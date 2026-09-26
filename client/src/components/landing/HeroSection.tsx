import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Play,
  Bookmark,
  Focus,
  Clock,
  Layers,
  FileText,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../hooks';

export const HeroSection: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-20">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[25rem] bg-indigo-500/[0.08] rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Split Grid: Left Copy & CTAs, Right Product Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Top Eyebrow Tagline */}
            <div className="inline-flex items-center gap-2 rounded-full border border-app bg-surface px-3.5 py-1.5 text-xs font-semibold text-secondary shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>Distraction-Free YouTube Learning Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-primary font-heading leading-[1.1]">
              Learn on YouTube.{' '}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-500">
                Stay Focused.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-secondary leading-relaxed font-normal max-w-xl">
              FocusTube transforms YouTube learning playlists into a distraction-free learning workspace where you can track progress, stay consistent, and save what matters.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{isAuthenticated ? 'Open Dashboard' : 'Start Learning Free'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={scrollToHowItWorks}
                className="inline-flex items-center gap-2 rounded-xl border border-app bg-surface hover:bg-surface-elevated text-secondary hover:text-primary px-5 py-3 text-sm font-medium transition-all duration-200 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 text-indigo-500 fill-current" />
                <span>See How It Works</span>
              </button>
            </div>
          </div>

          {/* Right Column: Realistic FocusTube Product Preview Mockup */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl border border-app bg-surface p-4 shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-indigo-500/30">
              {/* Mock Player Header */}
              <div className="flex items-center justify-between border-b border-subtle pb-3 mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="ml-2 font-semibold text-primary truncate max-w-[200px]">
                    CS50: Computer Science
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
                    <Focus className="h-3 w-3" />
                    <span>Focus Active</span>
                  </div>
                  <Bookmark className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                </div>
              </div>

              {/* Video Mock Display */}
              <div className="relative aspect-video w-full rounded-xl bg-slate-950 overflow-hidden border border-white/[0.08] shadow-inner flex flex-col justify-between p-4">
                <div className="flex items-center justify-between text-[11px] text-white/90">
                  <span className="font-mono bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10">
                    Lecture 02: C Memory & Pointers
                  </span>
                  <span className="font-mono bg-indigo-600/80 px-2 py-0.5 rounded-md">
                    Lesson 2 of 24
                  </span>
                </div>

                {/* Center Visual Mock */}
                <div className="flex flex-col items-center justify-center space-y-2 py-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600/80 text-white shadow-lg shadow-indigo-600/40">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>
                  <p className="text-[11px] font-medium text-slate-300">
                    Distraction-free learning space (0 feeds, 0 comments)
                  </p>
                </div>

                {/* Player Bottom Scrub Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-indigo-400" />
                      14:28 / 52:10
                    </span>
                    <span className="text-emerald-400 font-semibold">42% Watched</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" style={{ width: '42%' }} />
                  </div>
                </div>
              </div>

              {/* Micro-Syllabus & Note Snapshot Bar below player */}
              <div className="mt-3.5 grid grid-cols-2 gap-2.5 text-left">
                {/* Syllabus Snippet */}
                <div className="rounded-xl border border-app bg-secondary p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted font-heading">
                    <Layers className="h-3 w-3 text-indigo-400" />
                    <span>Syllabus</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-secondary truncate">
                      <span className="truncate">01 — Computational Logic</span>
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                    </div>
                    <div className="flex items-center justify-between font-semibold text-indigo-500 dark:text-indigo-400 truncate">
                      <span className="truncate">02 — Memory & Pointers</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20">Now</span>
                    </div>
                  </div>
                </div>

                {/* Instant Timestamped Note Snippet */}
                <div className="rounded-xl border border-app bg-secondary p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted font-heading">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3 text-teal-400" />
                      <span>Note @ 14:28</span>
                    </div>
                    <Camera className="h-3 w-3 text-indigo-400" />
                  </div>
                  <p className="text-[11px] text-secondary line-clamp-2 leading-tight">
                    "Pointers store memory addresses of existing variables."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust / Value Strip */}
        <div className="mt-14 border-t border-app pt-7">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2.5 rounded-xl border border-app bg-surface p-3.5 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-medium text-secondary">
                Zero algorithmic feeds & clickbait
              </span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2.5 rounded-xl border border-app bg-surface p-3.5 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-medium text-secondary">
                Second-by-second auto resume
              </span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2.5 rounded-xl border border-app bg-surface p-3.5 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-medium text-secondary">
                Timestamped notes & screenshots
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
