import { Link } from 'react-router-dom';
import { PlaySquare, ArrowRight, ShieldCheck, Sparkles, Zap, Play } from 'lucide-react';
import { useAuth } from '../hooks';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-white">
      {/* Navbar */}
      <header className="flex h-20 items-center justify-between border-b border-white/[0.08] px-6 max-w-7xl mx-auto w-full bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Play className="h-4 w-4 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-heading">
            Focus<span className="text-indigo-400">Tube</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all active:scale-[0.98]"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all active:scale-[0.98]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 text-center max-w-4xl mx-auto relative">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 mb-8 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Distraction-Free YouTube Learning Platform</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl font-heading leading-tight">
          Learn from YouTube.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-teal-300 to-indigo-200">
            Without distractions.
          </span>
        </h1>

        <p className="mt-6 text-base text-slate-300 sm:text-lg max-w-2xl leading-relaxed">
          Convert educational YouTube playlists into structured courses. Track exact playback progress, stay in deep focus mode, and achieve your learning goals without rabbit holes.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 relative z-10">
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="flex items-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <span>{isAuthenticated ? 'Open Dashboard' : 'Start Learning Free'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          {!isAuthenticated && (
            <Link
              to="/login"
              className="rounded-xl border border-white/[0.08] bg-[#111827] px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-300 hover:text-white hover:border-white/[0.15] hover:bg-[#1E293B] transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5 w-full text-left relative z-10">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
              <Zap className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white font-heading">Focus Mode</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Zero algorithmic recommendations, comments, or sidebar clickbait.</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-3">
              <PlaySquare className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white font-heading">Structured Courses</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Transform raw video playlists into systematic lessons and chapters.</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white font-heading">Exact Progress</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Resume videos second-by-second across devices automatically.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-6 text-center text-xs text-slate-500 bg-[#0B1120]">
        © FocusTube. Distraction-free learning.
      </footer>
    </div>
  );
};
