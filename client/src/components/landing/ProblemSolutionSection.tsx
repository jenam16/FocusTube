import { Sparkles, CheckCircle2 } from 'lucide-react';

export const ProblemSolutionSection: React.FC = () => {
  return (
    <section className="relative py-14 md:py-20 bg-[#0F172A]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">
            The Problem & The Solution
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-bold text-white font-heading tracking-tight">
            YouTube has great learning content.{' '}
            <span className="text-slate-400 block sm:inline">
              But it's still YouTube.
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
            Recommendations, Shorts, and comment sections are engineered to keep you browsing.
            FocusTube turns that high-quality learning content into a quiet, structured study workspace.
          </p>
        </div>

        {/* Clean 2-Column Comparison Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Column 1: The YouTube Friction */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827]/70 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono mb-4">
                <span>The Common Friction</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-500 mt-0.5">•</span>
                  <span>Sidebar feeds and autoplay distract from rigorous study sessions.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-500 mt-0.5">•</span>
                  <span>Hard to track exact progress across a 30-part technical course.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-slate-500 mt-0.5">•</span>
                  <span>Important diagrams, code slides, and key takeaways easily get lost.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-slate-500">
              A platform built for entertainment, not deliberate study.
            </div>
          </div>

          {/* Column 2: The FocusTube Solution */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-[#111827] to-[#111827] p-6 flex flex-col justify-between shadow-lg shadow-indigo-950/20">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider font-mono mb-4">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>The FocusTube Workspace</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>A distraction-free player with zero algorithmic feeds or comment threads.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Second-by-second auto-resume across every video in your playlist.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>One-click video-only screenshot notes with timestamp jump-back.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.08] text-xs text-indigo-300 font-medium flex items-center gap-1">
              <span>Designed specifically for serious self-taught learning.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
