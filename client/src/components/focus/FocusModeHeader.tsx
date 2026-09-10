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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-800/80 bg-gray-950/80 px-4 backdrop-blur-md sm:px-6 z-10">
      {/* Exit Focus Mode Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-700/80 bg-gray-900/80 px-3 py-1.5 text-xs font-semibold text-gray-200 shadow-sm transition-all hover:border-gray-600 hover:bg-gray-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          aria-label="Exit Focus Mode (Esc)"
          title="Exit Focus Mode (Esc)"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-gray-400" />
          <span>Exit Focus Mode</span>
          <kbd className="hidden rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 sm:inline-block border border-gray-700/60">
            Esc
          </kbd>
        </button>
      </div>

      {/* Course Title & Progress Information */}
      <div className="mx-4 hidden min-w-0 max-w-md items-center gap-2 md:flex lg:max-w-lg">
        <span className="truncate text-xs font-medium text-gray-300" title={courseTitle}>
          {courseTitle}
        </span>
        {totalVideos !== undefined && totalVideos > 0 && (
          <span className="shrink-0 rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-gray-400 border border-gray-800">
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
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-700 hover:bg-gray-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Open lessons drawer"
          >
            <ListVideo className="h-3.5 w-3.5 text-red-400" />
            <span>Lessons</span>
            {totalVideos !== undefined && (
              <span className="text-gray-500">({totalVideos})</span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
