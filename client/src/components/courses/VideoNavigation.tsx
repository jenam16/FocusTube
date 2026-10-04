import { ChevronLeft, ChevronRight, Maximize, Minimize, Focus, Sparkles, Loader2 } from 'lucide-react';
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
  onOpenSummary?: () => void;
  isGeneratingSummary?: boolean;
  hasExistingSummary?: boolean;
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
  onOpenSummary,
  isGeneratingSummary = false,
  hasExistingSummary = false,
}: VideoNavigationProps) => {

  return (
    <div className="space-y-4">
      {/* Current Watching Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-subtle pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-500 font-heading">
            <span>Currently watching</span>
            <span>•</span>
            <span className="text-secondary">
              Lesson {currentIndex + 1} of {totalVideos}
            </span>
            {currentVideo.durationSeconds > 0 && (
              <>
                <span>•</span>
                <span className="text-muted lowercase font-normal">
                  {formatVideoDuration(currentVideo.durationSeconds)}
                </span>
              </>
            )}
            {progress?.completed ? (
              <>
                <span>•</span>
                <CompletedBadge size="xs" />
              </>
            ) : progress && progress.progressPercentage > 0 ? (
              <>
                <span>•</span>
                <span className="text-indigo-500 font-semibold lowercase">
                  {progress.progressPercentage}% watched
                </span>
              </>
            ) : null}
          </div>

          <h2 className="mt-1 line-clamp-2 text-lg font-bold text-primary sm:text-xl font-heading tracking-tight">
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

          {onOpenSummary && (
            <button
              type="button"
              onClick={onOpenSummary}
              disabled={isGeneratingSummary}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98] cursor-pointer ${
                hasExistingSummary
                  ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/25 shadow-xs'
                  : 'border-app bg-surface text-secondary hover:bg-surface-elevated hover:text-primary hover:border-indigo-500/30'
              } ${isGeneratingSummary ? 'opacity-70 cursor-not-allowed' : ''}`}
              aria-label={hasExistingSummary ? 'View AI Summary' : 'AI Summary'}
              title={
                isGeneratingSummary
                  ? 'Generating AI Summary...'
                  : hasExistingSummary
                  ? 'View AI Summary'
                  : 'Generate AI Study Summary'
              }
            >
              {isGeneratingSummary ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  <span>AI Summary</span>
                </>
              )}
            </button>
          )}

          {onToggleFocusMode && (
            <button
              type="button"
              onClick={onToggleFocusMode}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98] cursor-pointer ${
                isFocusMode
                  ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 shadow-xs'
              }`}
              aria-label={isFocusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
              title="Focus Mode (Distraction-Free Learning)"
            >
              <Focus className="h-3.5 w-3.5 text-indigo-500" />
              <span>{isFocusMode ? 'Exit Focus' : 'Focus Mode'}</span>
            </button>
          )}

          {/* Theater / Big Screen Option */}
          {onToggleTheater && (
            <button
              type="button"
              onClick={onToggleTheater}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-app bg-surface px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary hover:border-indigo-500/30 transition-all shrink-0 cursor-pointer"
            >
              {isTheaterMode ? (
                <>
                  <Minimize className="h-3.5 w-3.5" />
                  <span>Default View</span>
                </>
              ) : (
                <>
                  <Maximize className="h-3.5 w-3.5" />
                  <span>Big Screen</span>
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
              ? 'border border-app bg-surface text-primary hover:border-indigo-500/40 hover:bg-surface-elevated active:scale-95 cursor-pointer shadow-xs'
              : 'border border-app bg-surface/40 text-muted opacity-40 cursor-not-allowed'
          }`}
          aria-label="Previous playable video"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous Lesson</span>
        </button>

        <span className="text-xs font-medium text-secondary">
          Lesson {currentIndex + 1} of {totalVideos}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
            hasNext
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-md shadow-indigo-600/25 active:scale-95 cursor-pointer'
              : 'border border-app bg-surface/40 text-muted opacity-40 cursor-not-allowed'
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
