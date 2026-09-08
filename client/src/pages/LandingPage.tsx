import { Link } from 'react-router-dom';
import { PlaySquare, ArrowRight, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useAuth } from '../hooks';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col justify-between">
      {/* Navbar */}
      <header className="flex h-20 items-center justify-between border-b border-gray-800/80 px-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/30">
            <PlaySquare className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Focus<span className="text-red-500">Tube</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-500 transition-colors"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-500 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs font-medium text-red-400 mb-8">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Distraction-Free YouTube Learning Platform</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Learn from YouTube.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-amber-500">
            Without the distractions.
          </span>
        </h1>

        <p className="mt-6 text-lg text-gray-400 sm:text-xl max-w-2xl">
          Convert educational YouTube playlists into structured courses. Track exact playback progress, stay in deep focus mode, and achieve your learning goals.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-red-600/30 hover:bg-red-500 transition-all hover:-translate-y-0.5"
          >
            <span>{isAuthenticated ? 'Open Dashboard' : 'Start Learning Free'}</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
          {!isAuthenticated && (
            <Link
              to="/login"
              className="rounded-xl border border-gray-800 bg-gray-900/60 px-6 py-3.5 text-base font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 mb-3">
              <Zap className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Focus Mode</h3>
            <p className="mt-1 text-xs text-gray-400">Zero algorithmic recommendations, comments, or sidebar clickbait.</p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 mb-3">
              <PlaySquare className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Structured Courses</h3>
            <p className="mt-1 text-xs text-gray-400">Transform raw video playlists into systematic lessons and chapters.</p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 mb-3">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Exact Progress</h3>
            <p className="mt-1 text-xs text-gray-400">Resume videos second-by-second across devices automatically.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 py-6 text-center text-xs text-gray-500">
        © FocusTube. Distraction-free learning.
      </footer>
    </div>
  );
};
