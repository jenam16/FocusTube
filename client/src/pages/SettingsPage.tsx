import React, { useState } from 'react';
import {
  User,
  Palette,
  LogOut,
  Check,
  Moon,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../hooks';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();

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
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-heading">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your FocusTube profile, learning experience, and account preferences.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.06]">
          <User className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Account Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              readOnly
              value={user?.name || 'Learner'}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0B1120] px-3.5 py-2 text-sm text-slate-200 cursor-not-allowed select-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              readOnly
              value={user?.email || 'user@example.com'}
              className="w-full rounded-xl border border-white/[0.08] bg-[#0B1120] px-3.5 py-2 text-sm text-slate-200 cursor-not-allowed select-none"
            />
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Account details are authenticated securely via JWT session. Contact administrator to update your credentials.
        </p>
      </div>

      {/* Learning & Player Experience */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.06]">
          <Sliders className="h-5 w-5 text-teal-400" />
          <h2 className="text-base font-bold text-white">Playback & Learning Preferences</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-xl bg-[#0B1120] border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-semibold text-white block">
                Continuous Playback (Autoplay Next)
              </span>
              <span className="text-xs text-slate-400 block">
                Automatically transition to the subsequent lesson when the current lesson completes.
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoplayNext}
              onChange={(e) => setAutoplayNext(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#0B1120] border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-semibold text-white block">
                Auto-Save Exact Resume Position
              </span>
              <span className="text-xs text-slate-400 block">
                Sync playback seconds every 5 seconds to effortlessly continue learning across sessions.
              </span>
            </div>
            <input
              type="checkbox"
              checked={savePlaybackPosition}
              onChange={(e) => setSavePlaybackPosition(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#0B1120] border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-semibold text-white block">
                Focus Mode Notes Drawer
              </span>
              <span className="text-xs text-slate-400 block">
                Keep quick slide-out drawer available during full distraction-free viewing.
              </span>
            </div>
            <input
              type="checkbox"
              checked={showNotesDrawer}
              onChange={(e) => setShowNotesDrawer(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </label>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-emerald-400 flex items-center gap-1.5">
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
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
          >
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.06]">
          <Palette className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Appearance & Theme</h2>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B1120] border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Moon className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white block">Focus Dark Mode</span>
              <span className="text-xs text-slate-400 block">
                Optimized deep midnight palette (#0F172A) engineered for prolonged screen time and zero eye strain.
              </span>
            </div>
          </div>

          <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-400">
            Active
          </span>
        </div>
      </div>

      {/* Account Actions / Session */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-red-500/20">
          <LogOut className="h-5 w-5 text-rose-400" />
          <h2 className="text-base font-bold text-white">Account Session</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Sign Out of FocusTube</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Securely terminate your authenticated session on this browser.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
