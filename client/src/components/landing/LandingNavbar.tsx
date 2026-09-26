import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Menu, X, ArrowRight, Sun, Moon } from 'lucide-react';
import { useAuth, useTheme } from '../../hooks';

export const LandingNavbar: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-app bg-secondary/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25 transition-transform group-hover:scale-105 duration-200">
            <Play className="h-4 w-4 fill-current ml-0.5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary font-heading">
            Focus<span className="text-indigo-500">Tube</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-secondary">
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('features')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('focus-mode')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Focus Mode
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('notes')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Notes
          </button>
        </nav>

        {/* Right CTA / Auth Controls + Theme Switcher */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-app bg-surface text-secondary hover:text-primary hover:border-indigo-500/40 transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500" />
            )}
          </button>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-secondary hover:text-primary hover:bg-surface-elevated transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button + Quick Theme Switch */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-app bg-surface text-secondary"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-app bg-surface text-secondary hover:text-primary transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-app bg-secondary/95 backdrop-blur-md px-4 py-5 shadow-2xl space-y-4">
          <nav className="flex flex-col gap-3 text-sm font-medium text-secondary">
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="text-left py-1.5 hover:text-primary transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="text-left py-1.5 hover:text-primary transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('focus-mode')}
              className="text-left py-1.5 hover:text-primary transition-colors cursor-pointer"
            >
              Focus Mode
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('notes')}
              className="text-left py-1.5 hover:text-primary transition-colors cursor-pointer"
            >
              Notes & Moments
            </button>
          </nav>

          <div className="pt-3 border-t border-app flex flex-col gap-2.5">
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
                  className="flex items-center justify-center rounded-xl border border-app bg-surface px-4 py-2 text-sm font-medium text-secondary hover:text-primary"
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
