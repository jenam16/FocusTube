import { PlaySquare, CheckCircle2, AlertCircle, Play, Bookmark } from 'lucide-react';
import { VideoItem, VideoProgress } from '../../types';
import { formatLessonNumber, formatVideoDuration } from '../../utils';
import { CompletedBadge } from '../CompletedBadge';

interface LessonItemProps {
  courseId: string;
  video: VideoItem;
  progress?: VideoProgress;
  isSelected?: boolean;
  isBookmarked?: boolean;
  onSelect?: (video: VideoItem) => void;
}

export const LessonItem = ({
  video,
  progress,
  isSelected = false,
  isBookmarked = false,
  onSelect,
}: LessonItemProps) => {

  const isAvailable = video.isAvailable !== false;

  const handleClick = () => {
    if (!isAvailable) return;
    if (onSelect) {
      onSelect(video);
    }
  };

  const content = (
    <div
      className={`group flex items-center gap-3.5 p-3 sm:gap-4 sm:p-3.5 transition-all text-left w-full rounded-xl ${
        !isAvailable
          ? 'opacity-45 cursor-not-allowed bg-slate-950/20'
          : isSelected
            ? 'bg-indigo-500/12 border border-indigo-500/30 text-white shadow-xs'
            : 'hover:bg-slate-800/50 text-slate-200 border border-transparent hover:border-white/[0.04]'
      }`}
    >
      {/* Lesson Number Badge */}
      <div
        className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors font-heading ${
          !isAvailable
            ? 'bg-slate-800 text-slate-500'
            : isSelected
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : progress?.completed
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
        }`}
      >
        {isSelected ? (
          <Play className="h-3.5 w-3.5 fill-current" />
        ) : progress?.completed ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          formatLessonNumber(video.position)
        )}
      </div>

      {/* Video Thumbnail */}
      <div className="relative aspect-video w-16 sm:w-24 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-slate-950 shadow-xs">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className={`h-full w-full object-cover transition-transform duration-200 ${
              isAvailable ? 'group-hover:scale-105' : 'grayscale'
            }`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-600">
            <PlaySquare className="h-5 w-5" />
          </div>
        )}
        {video.durationSeconds > 0 && (
          <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
            {formatVideoDuration(video.durationSeconds)}
          </div>
        )}
        {/* Playback progress bar at bottom of thumbnail */}
        {progress && (progress.progressPercentage > 0 || progress.completed) && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                progress.completed ? 'bg-emerald-400' : 'bg-indigo-500'
              }`}
              style={{
                width: `${progress.completed ? 100 : Math.min(100, Math.max(0, progress.progressPercentage))}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Title & Availability */}
      <div className="min-w-0 flex-1">
        <h4
          className={`line-clamp-2 text-xs sm:text-sm font-medium transition-colors ${
            !isAvailable
              ? 'text-slate-500 line-through'
              : isSelected
                ? 'font-semibold text-indigo-300'
                : 'text-slate-200 group-hover:text-white'
          }`}
        >
          {video.title}
        </h4>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          {video.durationSeconds > 0 && (
            <span>{formatVideoDuration(video.durationSeconds)}</span>
          )}
          {progress?.completed ? (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            </>
          ) : progress && progress.progressPercentage > 0 ? (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-indigo-400 font-medium">
                {progress.progressPercentage}% watched
              </span>
            </>
          ) : null}
          <span className="text-slate-600">•</span>
          {isAvailable ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <span>Available</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
              <AlertCircle className="h-3 w-3" />
              <span>Video unavailable</span>
            </span>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isBookmarked && (
          <Bookmark
            className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
            aria-label="Bookmarked lesson"
          />
        )}
        {progress?.completed && !isSelected && (
          <CompletedBadge size="xs" />
        )}
        {isSelected && (
          <span className="inline-flex items-center rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
            Playing
          </span>
        )}
      </div>
    </div>
  );

  if (!isAvailable) {
    return (
      <div
        className="block cursor-not-allowed select-none"
        title="This video is currently unavailable"
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl text-left"
    >
      {content}
    </button>
  );
};
