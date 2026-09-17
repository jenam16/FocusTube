import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, Play } from 'lucide-react';
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
    <section className="relative overflow-hidden pt-14 pb-16 md:pt-24 md:pb-24">
      {/* Very Soft Ambient Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[46rem] h-[22rem] bg-indigo-500/[0.08] rounded-full blur-[130px] pointer-events-none -z-10" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-slate-300 mb-8 backdrop-blur-sm shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Distraction-Free YouTube Learning Platform</span>
        </div>

        {/* Hero Title: 64-72px on desktop, tight tracking, subtle Indigo -> Violet gradient on emphasis */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-[68px] font-heading leading-[1.08] max-w-4xl mx-auto">
          Learn on YouTube.{' '}
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-violet-400">
            Stay Focused.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          FocusTube transforms YouTube learning playlists into a distraction-free learning workspace where you can track progress, stay consistent, and save what matters.
        </p>

        {/* Action CTAs */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5 sm:gap-4">
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-6 py-3.5 text-sm sm:text-base font-semibold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <span>{isAuthenticated ? 'Open Dashboard' : 'Start Learning Free'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={scrollToHowItWorks}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.18] text-slate-300 hover:text-white px-6 py-3.5 text-sm sm:text-base font-medium transition-all duration-200 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 text-indigo-400 fill-current" />
            <span>See How It Works</span>
          </button>
        </div>

        {/* Value Proof Badges */}
        <div className="mt-11 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Zero algorithmic feeds & clickbait</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Second-by-second resume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Timestamped notes & screenshots</span>
          </div>
        </div>
      </div>
    </section>
  );
};
