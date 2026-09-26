import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks';

export const FinalCTASection: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative py-20 md:py-28 bg-app border-t border-app overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34rem] h-[34rem] bg-indigo-500/[0.08] rounded-full blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-app bg-surface px-3.5 py-1 text-xs font-semibold text-secondary mb-6 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          <span>Start in seconds with any public playlist</span>
        </div>

        <h2 className="text-3xl font-extrabold text-primary sm:text-5xl font-heading tracking-tight leading-tight">
          Ready to make YouTube work for your learning?
        </h2>

        <p className="mt-5 text-base sm:text-xl text-secondary max-w-2xl mx-auto leading-relaxed font-normal">
          Bring your learning playlists into FocusTube and start learning with more focus.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-7 py-4 text-base font-semibold shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <span>{isAuthenticated ? 'Open Dashboard' : 'Start Learning Free'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          {!isAuthenticated && (
            <Link
              to="/login"
              className="inline-flex items-center rounded-xl border border-app bg-surface hover:bg-surface-elevated px-7 py-4 text-base font-medium text-secondary hover:text-primary transition-all duration-200 shadow-xs"
            >
              Log In
            </Link>
          )}
        </div>

        <p className="mt-8 text-xs text-muted">
          Free to use • No credit card required • Works with any YouTube educational playlist
        </p>
      </div>
    </section>
  );
};
