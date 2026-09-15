import React from 'react';
import { ChevronLeft, ChevronRight, ListVideo, FileText } from 'lucide-react';
import { VideoItem, VideoProgress } from '../../types';
import { formatLessonNumber, formatVideoDuration } from '../../utils';
import { CompletedBadge } from '../CompletedBadge';
import { ProgressBar } from '../ProgressBar';
import { BookmarkButton } from '../bookmarks/BookmarkButton';
import { CaptureMomentButton } from '../player/CaptureMomentButton';

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
  courseId?: string;
  getCurrentTimestamp?: () => number;
  playerElement?: HTMLElement | null;
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
  courseId,
  getCurrentTimestamp,
  playerElement,
}) => {
  const isCompleted = Boolean(currentVideoProgress?.completed);
  const progressPct = currentVideoProgress?.progressPercentage || 0;

  return (
    <div className="space-y-4 pt-4">
      {/* Video Details Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <span>Lesson {currentIndex + 1} of {totalVideos}</span>
            {currentVideo.durationSeconds > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 lowercase font-normal font-mono">
                  {formatVideoDuration(currentVideo.durationSeconds)}
                </span>
              </>
            )}
            {isCompleted ? (
              <>
                <span className="text-slate-600">•</span>
                <CompletedBadge size="xs" />
              </>
            ) : progressPct > 0 ? (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-indigo-400 lowercase font-semibold">
                  {progressPct}% watched
                </span>
              </>
            ) : null}
          </div>

          <h2 className="line-clamp-2 text-lg font-bold text-white sm:text-xl font-heading">
            {formatLessonNumber(currentVideo.position)} — {currentVideo.title}
          </h2>
        </div>

        {/* Status / Quick Browse on Right */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {courseId && getCurrentTimestamp && (
            <CaptureMomentButton
              courseId={courseId}
              videoId={currentVideo._id}
              youtubeVideoId={currentVideo.youtubeVideoId}
              videoTitle={currentVideo.title}
              getCurrentTimestamp={getCurrentTimestamp}
              playerElement={playerElement}
              size="sm"
            />
          )}

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
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#111827] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-white/[0.15] hover:bg-[#1E293B] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="View lesson notes"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span>Notes</span>
            </button>
          )}

          {onOpenDrawer && (
            <button
              type="button"
              onClick={onOpenDrawer}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#111827] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-white/[0.15] hover:bg-[#1E293B] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="View all lessons in syllabus"
            >
              <ListVideo className="h-3.5 w-3.5 text-indigo-400" />
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
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            hasPrevious
              ? 'border border-white/[0.08] bg-[#111827] text-slate-200 hover:border-white/[0.15] hover:bg-[#1E293B] hover:text-white active:scale-95 shadow-sm'
              : 'border border-white/[0.04] bg-[#0B1120] text-slate-600 opacity-40 cursor-not-allowed'
          }`}
          aria-label="Previous playable lesson"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous Lesson</span>
        </button>

        <span className="text-xs font-medium text-slate-500 hidden sm:inline-block">
          Lesson {currentIndex + 1} of {totalVideos}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            hasNext
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 active:scale-95'
              : 'border border-white/[0.04] bg-[#0B1120] text-slate-600 opacity-40 cursor-not-allowed'
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
