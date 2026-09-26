import React from 'react';
import { Sparkles, CheckCircle2, XCircle } from 'lucide-react';

export const ProblemSolutionSection: React.FC = () => {
  return (
    <section className="relative py-16 md:py-20 bg-app border-t border-app">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 font-heading">
            The Problem & The Solution
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-bold text-primary font-heading tracking-tight">
            YouTube has great learning content.{' '}
            <span className="text-muted block sm:inline">
              But it's still YouTube.
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-secondary leading-relaxed">
            Recommendations, Shorts, and comment sections are engineered to keep you browsing.
            FocusTube turns that high-quality learning content into a quiet, structured study workspace.
          </p>
        </div>

        {/* Clean 2-Column Split Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: The YouTube Distractions */}
          <div className="rounded-2xl border border-rose-500/20 bg-surface p-6 sm:p-7 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 uppercase tracking-wider font-heading mb-5">
                <XCircle className="h-4 w-4" />
                <span>The YouTube Distraction Friction</span>
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-secondary">
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 mt-0.5">•</span>
                  <span>Sidebar feeds, algorithmic recommendations, and clickbait pull you away from deep study.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 mt-0.5">•</span>
                  <span>Hard to track exact lesson progress, overall completion, and resume spots across multi-part playlists.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 mt-0.5">•</span>
                  <span>Crucial diagrams, code slides, and key explanations easily get lost in lengthy videos.</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-subtle text-xs text-muted">
              Built for entertainment and ad engagement, not deliberate study.
            </div>
          </div>

          {/* Column 2: The FocusTube Workspace Solution */}
          <div className="rounded-2xl border border-indigo-500/30 bg-surface p-6 sm:p-7 flex flex-col justify-between shadow-lg shadow-indigo-600/5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 uppercase tracking-wider font-heading mb-5">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <span>The FocusTube Focused Workspace</span>
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-primary">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>A distraction-free player with zero algorithmic feeds, recommended videos, or comment threads.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Second-by-second auto-resume across every video in your playlist.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>One-click video-only screenshot notes with timestamp jump-back to the exact frame.</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-subtle text-xs text-indigo-500 font-medium flex items-center gap-1.5">
              <span>Engineered specifically for self-taught, high-retention learning.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
