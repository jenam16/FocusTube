import React from 'react';
import { ArrowLeft, ListVideo } from 'lucide-react';

interface FocusModeHeaderProps {
  courseTitle: string;
  onExit: () => void;
  onOpenDrawer?: () => void;
  completedVideos?: number;
  totalVideos?: number;
}

export const FocusModeHeader: React.FC<FocusModeHeaderProps> = ({
  courseTitle,
  onExit,
  onOpenDrawer,
  completedVideos,
  totalVideos,
}) => {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0B1120]/90 px-4 backdrop-blur-md sm:px-6 z-10">
      {/* Exit Focus Mode Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111827] px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-sm transition-all hover:border-white/[0.15] hover:bg-[#1E293B] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Exit Focus Mode (Esc)"
          title="Exit Focus Mode (Esc)"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-400" />
          <span>Exit Focus Mode</span>
          <kbd className="hidden rounded bg-[#0B1120] px-1.5 py-0.5 text-[10px] font-mono text-slate-400 sm:inline-block border border-white/[0.08]">
            Esc
          </kbd>
        </button>
      </div>

      {/* Course Title & Progress Information */}
      <div className="mx-4 hidden min-w-0 max-w-md items-center gap-2 md:flex lg:max-w-lg">
        <span className="truncate text-xs font-medium text-slate-300" title={courseTitle}>
          {courseTitle}
        </span>
        {totalVideos !== undefined && totalVideos > 0 && (
          <span className="shrink-0 rounded-full bg-[#111827] px-2.5 py-0.5 text-[10px] font-semibold text-slate-400 border border-white/[0.08]">
            {completedVideos !== undefined ? `${completedVideos}/${totalVideos} completed` : `${totalVideos} lessons`}
          </span>
        )}
      </div>

      {/* Quick Drawer / Syllabus Toggle */}
      <div className="flex items-center gap-2">
        {onOpenDrawer && (
          <button
            type="button"
            onClick={onOpenDrawer}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#111827] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-white/[0.15] hover:bg-[#1E293B] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Open lessons drawer"
          >
            <ListVideo className="h-3.5 w-3.5 text-indigo-400" />
            <span>Lessons</span>
            {totalVideos !== undefined && (
              <span className="text-slate-500">({totalVideos})</span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
