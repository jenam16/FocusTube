import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Focus,
  CalendarCheck,
  Bookmark,
  Camera,
} from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Distraction-Free Learning',
    description:
      'Keep your learning inside a focused workspace instead of navigating through the normal YouTube experience.',
    accent: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description:
      'Automatically keep track of your video progress and continue learning from where you stopped.',
    accent: 'text-teal-400 border-teal-500/20 bg-teal-500/10',
  },
  {
    icon: Focus,
    title: 'Focus Mode',
    description:
      'Enter a dedicated learning environment designed to keep the session centered around the lesson.',
    accent: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
  },
  {
    icon: CalendarCheck,
    title: 'Daily Learning Tasks',
    description:
      'Turn learning goals into manageable daily tasks and keep your learning routine organized.',
    accent: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
  },
  {
    icon: Bookmark,
    title: 'Notes & Bookmarks',
    description:
      'Save important ideas, videos, and learning points for later.',
    accent: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
  },
  {
    icon: Camera,
    title: 'Captured Moments',
    description:
      'Capture an important moment from a lesson and keep it connected to your notes and video.',
    accent: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10',
  },
];

export const CoreFeaturesSection: React.FC = () => {
  return (
    <section id="features" className="relative py-16 md:py-24 bg-[#0F172A]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
            Core Features
          </span>
          <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl font-heading">
            Built for how you actually learn.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Everything you need to turn YouTube playlists into an effective personal study workspace.
          </p>
        </div>

        {/* Features 2x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group rounded-2xl border border-white/[0.08] bg-[#111827] p-6 hover:border-white/[0.16] hover:bg-[#151E32] transition-all"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border mb-4 ${item.accent}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white font-heading group-hover:text-indigo-200 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
