import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks';

export const LandingNavbar: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0F172A]/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform group-hover:scale-105">
            <Play className="h-4 w-4 fill-current ml-0.5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-heading">
            Focus<span className="text-indigo-400">Tube</span>
          </span>
        </Link>

        {/* Center / Right Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
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
            Notes
          </button>
        </nav>

        {/* Right CTA / Auth Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all active:scale-[0.98]"
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
                Log In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 transition-all active:scale-[0.98]"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500"
            >
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500"
            >
              <span>Start</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#0F172A] px-4 py-5 shadow-2xl space-y-4">
          <nav className="flex flex-col gap-3 text-sm font-medium text-slate-300">
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="text-left py-1.5 hover:text-white transition-colors"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="text-left py-1.5 hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('focus-mode')}
              className="text-left py-1.5 hover:text-white transition-colors"
            >
              Focus Mode
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('notes')}
              className="text-left py-1.5 hover:text-white transition-colors"
            >
              Notes & Moments
            </button>
          </nav>

          <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2.5">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl border border-white/[0.08] bg-[#111827] px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
