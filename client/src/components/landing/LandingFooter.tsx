import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { useAuth } from '../../hooks';

export const LandingFooter: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-white/[0.08] bg-[#0B1120] py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center md:items-start gap-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
              </div>
              <span className="text-lg font-bold text-white font-heading">
                Focus<span className="text-indigo-400">Tube</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Learn on YouTube. Stay Focused.
            </p>
          </div>

          {/* Nav Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('focus-mode')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Focus Mode
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('notes')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Notes & Moments
            </button>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-8 pt-6 border-t border-white/[0.04] text-center text-xs text-slate-400">
          © {new Date().getFullYear()} FocusTube. A distraction-free learning environment for YouTube playlists.
        </div>
      </div>
    </footer>
  );
};
