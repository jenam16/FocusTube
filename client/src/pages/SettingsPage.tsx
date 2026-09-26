import React, { useState } from 'react';
import {
  User,
  Palette,
  LogOut,
  Check,
  Moon,
  Sun,
  Sliders,
} from 'lucide-react';
import { useAuth, useTheme } from '../hooks';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  // Mock toggle states for client preferences
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [showNotesDrawer, setShowNotesDrawer] = useState(true);
  const [savePlaybackPosition, setSavePlaybackPosition] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePreferences = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl font-heading">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-secondary mt-1">
          Manage your FocusTube profile, learning experience, and account preferences.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="rounded-2xl border border-app bg-surface p-6 space-y-6 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 border-b border-subtle">
          <User className="h-5 w-5 text-indigo-500" />
          <h2 className="text-base font-bold text-primary font-heading">Account Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              readOnly
              value={user?.name || 'Learner'}
              className="w-full rounded-xl border border-app bg-secondary px-3.5 py-2 text-sm text-primary cursor-not-allowed select-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              readOnly
              value={user?.email || 'user@example.com'}
              className="w-full rounded-xl border border-app bg-secondary px-3.5 py-2 text-sm text-primary cursor-not-allowed select-none"
            />
          </div>
        </div>

        <p className="text-xs text-muted">
          Account details are authenticated securely via JWT session. Contact administrator to update your credentials.
        </p>
      </div>

      {/* Appearance & Theme Selector */}
      <div className="rounded-2xl border border-app bg-surface p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 border-b border-subtle">
          <Palette className="h-5 w-5 text-indigo-500" />
          <h2 className="text-base font-bold text-primary font-heading">Appearance & Theme</h2>
        </div>

        <p className="text-xs text-secondary">
          Choose your preferred theme workspace. FocusTube automatically saves your preference and applies it across sessions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Dark Mode Card */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500'
                : 'border-app bg-secondary hover:border-indigo-500/30'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-indigo-400 border border-slate-800">
                <Moon className="h-4 w-4" />
              </div>
              {theme === 'dark' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  <Check className="h-3 w-3" />
                  Active
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-primary font-heading">Focus Dark</h3>
            <p className="text-xs text-secondary mt-1">
              Deep near-black palette engineered for cinematic flow and reduced eye fatigue.
            </p>
          </button>

          {/* Light Mode Card */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex flex-col text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-indigo-500 bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500'
                : 'border-app bg-secondary hover:border-indigo-500/30'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Sun className="h-4 w-4" />
              </div>
              {theme === 'light' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  <Check className="h-3 w-3" />
                  Active
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-primary font-heading">Focus Light</h3>
            <p className="text-xs text-secondary mt-1">
              Crisp modern daylight palette with high-contrast surfaces for daytime productivity.
            </p>
          </button>
        </div>
      </div>

      {/* Learning & Player Experience */}
      <div className="rounded-2xl border border-app bg-surface p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 border-b border-subtle">
          <Sliders className="h-5 w-5 text-indigo-500" />
          <h2 className="text-base font-bold text-primary font-heading">Playback & Learning Preferences</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3.5 rounded-xl bg-secondary border border-app cursor-pointer hover:border-indigo-500/30 transition-colors">
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-semibold text-primary block">
                Continuous Playback (Autoplay Next)
              </span>
              <span className="text-xs text-secondary block">
                Automatically transition to the subsequent lesson when the current lesson completes.
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoplayNext}
              onChange={(e) => setAutoplayNext(e.target.checked)}
              className="h-4 w-4 rounded border-app bg-surface text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-secondary border border-app cursor-pointer hover:border-indigo-500/30 transition-colors">
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-semibold text-primary block">
                Auto-Save Exact Resume Position
              </span>
              <span className="text-xs text-secondary block">
                Sync playback seconds every 5 seconds to effortlessly continue learning across sessions.
              </span>
            </div>
            <input
              type="checkbox"
              checked={savePlaybackPosition}
              onChange={(e) => setSavePlaybackPosition(e.target.checked)}
              className="h-4 w-4 rounded border-app bg-surface text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl bg-secondary border border-app cursor-pointer hover:border-indigo-500/30 transition-colors">
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-semibold text-primary block">
                Focus Mode Notes Drawer
              </span>
              <span className="text-xs text-secondary block">
                Keep quick slide-out drawer available during full distraction-free viewing.
              </span>
            </div>
            <input
              type="checkbox"
              checked={showNotesDrawer}
              onChange={(e) => setShowNotesDrawer(e.target.checked)}
              className="h-4 w-4 rounded border-app bg-surface text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-emerald-500 flex items-center gap-1.5">
            {savedSuccess && (
              <>
                <Check className="h-4 w-4" />
                <span>Preferences saved successfully!</span>
              </>
            )}
          </span>

          <button
            type="button"
            onClick={handleSavePreferences}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all"
          >
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {/* Account Actions / Session */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-rose-500/20">
          <LogOut className="h-5 w-5 text-rose-500" />
          <h2 className="text-base font-bold text-primary font-heading">Account Session</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-primary">Sign Out of FocusTube</h3>
            <p className="text-xs text-secondary mt-0.5">
              Securely terminate your authenticated session on this browser.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/20 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
