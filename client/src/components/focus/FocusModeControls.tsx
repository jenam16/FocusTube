import React from 'react';
import { ChevronLeft, ChevronRight, ListVideo, FileText } from 'lucide-react';
import { VideoItem, VideoProgress } from '../../types';
import { formatLessonNumber, formatVideoDuration } from '../../utils';
import { CompletedBadge } from '../CompletedBadge';
import { ProgressBar } from '../ProgressBar';
import { BookmarkButton } from '../bookmarks/BookmarkButton';

interface FocusModeControlsProps {
  currentVideo: VideoItem;
  currentVideoProgress?: VideoProgress;
  currentIndex: number;
  totalVideos: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onOpenDrawer?: () => void;
  onOpenNotes?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => Promise<void>;
}

export const FocusModeControls: React.FC<FocusModeControlsProps> = ({
  currentVideo,
  currentVideoProgress,
  currentIndex,
  totalVideos,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onOpenDrawer,
  onOpenNotes,
  isBookmarked = false,
  onToggleBookmark,
}) => {

  const isCompleted = Boolean(currentVideoProgress?.completed);
  const progressPct = currentVideoProgress?.progressPercentage || 0;

  return (
    <div className="space-y-4 pt-4">
      {/* Video Details Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-800/80 pb-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400">
            <span>Lesson {currentIndex + 1} of {totalVideos}</span>
            {currentVideo.durationSeconds > 0 && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 lowercase font-normal">
                  {formatVideoDuration(currentVideo.durationSeconds)}
                </span>
              </>
            )}
            {isCompleted ? (
              <>
                <span className="text-gray-600">•</span>
                <CompletedBadge size="xs" />
              </>
            ) : progressPct > 0 ? (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-red-400 lowercase font-semibold">
                  {progressPct}% watched
                </span>
              </>
            ) : null}
          </div>

          <h2 className="line-clamp-2 text-lg font-bold text-white sm:text-xl">
            {formatLessonNumber(currentVideo.position)} — {currentVideo.title}
          </h2>
        </div>

        {/* Status / Quick Browse on Right */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {onToggleBookmark && (
            <BookmarkButton
              isBookmarked={isBookmarked}
              onToggle={onToggleBookmark}
              size="sm"
            />
          )}

          {onOpenNotes && (
            <button
              type="button"
              onClick={onOpenNotes}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800/80 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:border-gray-600 hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="View lesson notes"
            >
              <FileText className="h-3.5 w-3.5 text-red-400" />
              <span>Notes</span>
            </button>
          )}

          {onOpenDrawer && (
            <button
              type="button"
              onClick={onOpenDrawer}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800/80 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:border-gray-600 hover:bg-gray-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label="View all lessons in syllabus"
            >
              <ListVideo className="h-3.5 w-3.5 text-red-400" />
              <span>Syllabus</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar (if watched but not complete) */}
      {!isCompleted && progressPct > 0 && (
        <div className="w-full">
          <ProgressBar progress={progressPct} size="sm" />
        </div>
      )}

      {/* Navigation Row: Previous / Current / Next */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
            hasPrevious
              ? 'border border-gray-700 bg-gray-800 text-gray-200 hover:border-gray-600 hover:bg-gray-700 hover:text-white active:scale-95 shadow-sm'
              : 'border border-gray-800/60 bg-gray-900/30 text-gray-600 opacity-40 cursor-not-allowed'
          }`}
          aria-label="Previous playable lesson"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous Lesson</span>
        </button>

        <span className="text-xs font-medium text-gray-500 hidden sm:inline-block">
          Lesson {currentIndex + 1} of {totalVideos}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
            hasNext
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/25 hover:bg-red-500 active:scale-95'
              : 'border border-gray-800/60 bg-gray-900/30 text-gray-600 opacity-40 cursor-not-allowed'
          }`}
          aria-label="Next playable lesson"
        >
          <span>Next Lesson</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
