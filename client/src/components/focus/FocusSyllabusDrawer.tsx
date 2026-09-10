import React, { useMemo, useEffect } from 'react';
import { X, BookOpen, CheckCircle2, Play, AlertCircle, Bookmark } from 'lucide-react';
import { VideoItem, VideoProgress } from '../../types';
import { formatLessonNumber, formatVideoDuration } from '../../utils';
import { CompletedBadge } from '../CompletedBadge';

interface FocusSyllabusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  videos: VideoItem[];
  progressMap?: Record<string, VideoProgress>;
  bookmarkedVideoIds?: string[];
  activeVideoId?: string;
  onSelectVideo: (video: VideoItem) => void;
}

export const FocusSyllabusDrawer: React.FC<FocusSyllabusDrawerProps> = ({
  isOpen,
  onClose,
  courseTitle,
  videos,
  progressMap,
  bookmarkedVideoIds,
  activeVideoId,
  onSelectVideo,
}) => {
  // Close drawer on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { sortedVideos, completedCount, availableCount } = useMemo(() => {
    const sorted = [...videos].sort((a, b) => a.position - b.position);
    let comp = 0;
    let avail = 0;
    for (const v of sorted) {
      if (v.isAvailable !== false) {
        avail++;
        const p = progressMap ? progressMap[v._id] || progressMap[v.youtubeVideoId] : undefined;
        if (p?.completed) comp++;
      }
    }
    return { sortedVideos: sorted, completedCount: comp, availableCount: avail };
  }, [videos, progressMap]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Course Syllabus"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-gray-800 bg-gray-950 shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-gray-800/80 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Syllabus</span>
              {availableCount > 0 && (
                <>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-400 font-normal">
                    {completedCount}/{availableCount} completed
                  </span>
                </>
              )}
            </div>
            <h3 className="mt-0.5 truncate text-sm font-bold text-white" title={courseTitle}>
              {courseTitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-800 p-2 text-gray-400 hover:border-gray-700 hover:bg-gray-900 hover:text-white transition-colors ml-3"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Video List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-gray-900">
          {sortedVideos.map((video) => {
            const isCurrent = video._id === activeVideoId || video.youtubeVideoId === activeVideoId;
            const isAvailable = video.isAvailable !== false;
            const progress = progressMap ? progressMap[video._id] || progressMap[video.youtubeVideoId] : undefined;
            const isCompleted = Boolean(progress?.completed);

            return (
              <button
                key={video._id}
                type="button"
                disabled={!isAvailable}
                onClick={() => {
                  if (isAvailable) {
                    onSelectVideo(video);
                  }
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                  !isAvailable
                    ? 'opacity-40 cursor-not-allowed bg-transparent'
                    : isCurrent
                      ? 'bg-red-600/15 border border-red-500/40 text-white shadow-sm'
                      : 'hover:bg-gray-900/80 text-gray-300'
                }`}
              >
                {/* Lesson number / check badge */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    !isAvailable
                      ? 'bg-gray-800 text-gray-500'
                      : isCurrent
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : isCompleted
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/50'
                          : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {isCurrent ? (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    formatLessonNumber(video.position)
                  )}
                </div>

                {/* Title & Metadata */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-xs font-medium ${
                      !isAvailable
                        ? 'text-gray-500 line-through'
                        : isCurrent
                          ? 'font-semibold text-red-400'
                          : 'text-gray-200'
                    }`}
                  >
                    {video.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-500">
                    {video.durationSeconds > 0 && (
                      <span>{formatVideoDuration(video.durationSeconds)}</span>
                    )}
                    {isCompleted ? (
                      <span className="text-emerald-400 font-medium">• Completed</span>
                    ) : progress && progress.progressPercentage > 0 ? (
                      <span className="text-red-400 font-medium">• {progress.progressPercentage}%</span>
                    ) : null}
                    {!isAvailable && (
                      <span className="text-amber-500 flex items-center gap-0.5">
                        <AlertCircle className="h-3 w-3" /> Unavailable
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Indicator */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {bookmarkedVideoIds?.includes(video._id) && (
                    <Bookmark
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                      aria-label="Bookmarked lesson"
                    />
                  )}
                  {isCompleted && !isCurrent && (
                    <CompletedBadge size="xs" />
                  )}
                  {isCurrent && (
                    <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/30">
                      Playing
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
