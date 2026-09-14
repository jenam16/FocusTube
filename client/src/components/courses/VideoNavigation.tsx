import { ChevronLeft, ChevronRight, Maximize, Minimize, Focus } from 'lucide-react';
import { VideoItem, VideoProgress } from '../../types';
import { formatLessonNumber, formatVideoDuration } from '../../utils';
import { CompletedBadge } from '../CompletedBadge';
import { BookmarkButton } from '../bookmarks/BookmarkButton';

interface VideoNavigationProps {
  currentVideo: VideoItem;
  currentIndex: number;
  totalVideos: number;
  progress?: VideoProgress;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => Promise<void>;
}

export const VideoNavigation = ({
  currentVideo,
  currentIndex,
  totalVideos,
  progress,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  isTheaterMode = false,
  onToggleTheater,
  isFocusMode = false,
  onToggleFocusMode,
  isBookmarked = false,
  onToggleBookmark,
}: VideoNavigationProps) => {


  return (
    <div className="space-y-4">
      {/* Current Watching Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <span>Currently watching</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              Lesson {currentIndex + 1} of {totalVideos}
            </span>
            {currentVideo.durationSeconds > 0 && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 lowercase font-normal">
                  {formatVideoDuration(currentVideo.durationSeconds)}
                </span>
              </>
            )}
            {progress?.completed ? (
              <>
                <span className="text-slate-600">•</span>
                <CompletedBadge size="xs" />
              </>
            ) : progress && progress.progressPercentage > 0 ? (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-indigo-400 font-semibold lowercase">
                  {progress.progressPercentage}% watched
                </span>
              </>
            ) : null}
          </div>

          <h2 className="mt-1 line-clamp-2 text-lg font-bold text-white sm:text-xl font-heading">
            {formatLessonNumber(currentVideo.position)} — {currentVideo.title}
          </h2>
        </div>

        {/* Focus Mode & Theater Mode Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {onToggleBookmark && (
            <BookmarkButton
              isBookmarked={isBookmarked}
              onToggle={onToggleBookmark}
              size="md"
            />
          )}

          {onToggleFocusMode && (
            <button
              type="button"
              onClick={onToggleFocusMode}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98] ${
                isFocusMode
                  ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'border-indigo-500/30 bg-indigo-950/30 text-indigo-300 hover:border-indigo-500/60 hover:bg-indigo-900/40 hover:text-white'
              }`}
              aria-label={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
              title="Focus Mode (Distraction-Free Learning)"
            >
              <Focus className="h-3.5 w-3.5 text-indigo-400" />
              <span>{isFocusMode ? 'Exit Focus' : 'Focus Mode'}</span>
            </button>
          )}

          {/* Theater / Big Screen Option */}
          {onToggleTheater && (
            <button
              type="button"
              onClick={onToggleTheater}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors shrink-0"
            >
              {isTheaterMode ? (
                <>
                  <Minimize className="h-3.5 w-3.5" />
                  <span>Default View</span>
                </>
              ) : (
                <>
                  <Maximize className="h-3.5 w-3.5" />
                  <span>Big Screen (Theater)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Buttons: Previous / Next */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            hasPrevious
              ? 'border border-white/[0.08] bg-slate-800/80 text-slate-200 hover:border-white/[0.15] hover:bg-slate-700 hover:text-white active:scale-95'
              : 'border border-white/[0.04] bg-slate-900/30 text-slate-600 opacity-40 cursor-not-allowed'
          }`}
          aria-label="Previous playable video"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous Lesson</span>
        </button>

        <span className="text-xs font-medium text-slate-500">
          Lesson {currentIndex + 1} / {totalVideos}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
            hasNext
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 active:scale-95'
              : 'border border-white/[0.04] bg-slate-900/30 text-slate-600 opacity-40 cursor-not-allowed'
          }`}
          aria-label="Next playable video"
        >
          <span>Next Lesson</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
