import { ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react';
import { VideoItem } from '../../types';
import { formatLessonNumber, formatVideoDuration } from '../../utils';

interface VideoNavigationProps {
  currentVideo: VideoItem;
  currentIndex: number;
  totalVideos: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isTheaterMode?: boolean;
  onToggleTheater?: () => void;
}

export const VideoNavigation = ({
  currentVideo,
  currentIndex,
  totalVideos,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  isTheaterMode = false,
  onToggleTheater,
}: VideoNavigationProps) => {
  return (
    <div className="space-y-4">
      {/* Current Watching Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-800/80 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400">
            <span>Currently watching</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-400">
              Lesson {currentIndex + 1} of {totalVideos}
            </span>
            {currentVideo.durationSeconds > 0 && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 lowercase font-normal">
                  {formatVideoDuration(currentVideo.durationSeconds)}
                </span>
              </>
            )}
          </div>
          <h2 className="mt-1 line-clamp-2 text-lg font-bold text-white sm:text-xl">
            {formatLessonNumber(currentVideo.position)} — {currentVideo.title}
          </h2>
        </div>

        {/* Theater / Big Screen Option */}
        {onToggleTheater && (
          <button
            type="button"
            onClick={onToggleTheater}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800/80 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors shrink-0"
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

      {/* Navigation Buttons: Previous / Next */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            hasPrevious
              ? 'border border-gray-700 bg-gray-800 text-gray-200 hover:border-gray-600 hover:bg-gray-700 hover:text-white active:scale-95'
              : 'border border-gray-800/60 bg-gray-900/30 text-gray-600 opacity-40 cursor-not-allowed'
          }`}
          aria-label="Previous playable video"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous Lesson</span>
        </button>

        <span className="text-xs font-medium text-gray-500">
          Lesson {currentIndex + 1} / {totalVideos}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all ${
            hasNext
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/25 hover:bg-red-500 active:scale-95'
              : 'border border-gray-800/60 bg-gray-900/30 text-gray-600 opacity-40 cursor-not-allowed'
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
