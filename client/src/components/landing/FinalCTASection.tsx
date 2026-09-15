import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks';

export const FinalCTASection: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative py-20 md:py-28 bg-[#0F172A] border-t border-white/[0.08] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 mb-6">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Start in seconds with any public playlist</span>
        </div>

        <h2 className="text-3xl font-extrabold text-white sm:text-5xl font-heading tracking-tight leading-tight">
          Ready to make YouTube work for your learning?
        </h2>

        <p className="mt-5 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Bring your learning playlists into FocusTube and start learning with more focus.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-600/35 hover:bg-indigo-500 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span>{isAuthenticated ? 'Open Dashboard' : 'Start Learning Free'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          {!isAuthenticated && (
            <Link
              to="/login"
              className="inline-flex items-center rounded-xl border border-white/[0.08] bg-[#111827] px-7 py-4 text-base font-semibold text-slate-300 hover:text-white hover:border-white/[0.16] hover:bg-[#1E293B] transition-colors"
            >
              Log In
            </Link>
          )}
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Free to use • No credit card required • Works with any YouTube educational playlist
        </p>
      </div>
    </section>
  );
};
