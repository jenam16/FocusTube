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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-app bg-secondary/95 px-4 backdrop-blur-md sm:px-6 z-10">
      {/* Exit Focus Mode Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-2 rounded-xl border border-app bg-surface px-3 py-1.5 text-xs font-semibold text-primary shadow-xs transition-all hover:bg-surface-elevated hover:border-indigo-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
          aria-label="Exit Focus Mode (Esc)"
          title="Exit Focus Mode (Esc)"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-muted" />
          <span>Exit Focus Mode</span>
          <kbd className="hidden rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-muted sm:inline-block border border-app">
            Esc
          </kbd>
        </button>
      </div>

      {/* Course Title & Progress Information */}
      <div className="mx-4 hidden min-w-0 max-w-md items-center gap-2 md:flex lg:max-w-lg">
        <span className="truncate text-xs font-medium text-secondary" title={courseTitle}>
          {courseTitle}
        </span>
        {totalVideos !== undefined && totalVideos > 0 && (
          <span className="shrink-0 rounded-full bg-surface px-2.5 py-0.5 text-[10px] font-semibold text-muted border border-app font-heading">
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
            className="inline-flex items-center gap-1.5 rounded-xl border border-app bg-surface px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary transition-all hover:bg-surface-elevated hover:border-indigo-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            aria-label="Open lessons drawer"
          >
            <ListVideo className="h-3.5 w-3.5 text-indigo-500" />
            <span>Lessons</span>
            {totalVideos !== undefined && (
              <span className="text-muted">({totalVideos})</span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
