import { Link } from 'react-router-dom';
import { PlaySquare, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { VideoItem } from '../../types';
import { formatLessonNumber, formatVideoDuration } from '../../utils';

interface LessonItemProps {
  courseId: string;
  video: VideoItem;
  isSelected?: boolean;
}

export const LessonItem = ({
  courseId,
  video,
  isSelected = false,
}: LessonItemProps) => {
  const isAvailable = video.isAvailable !== false;

  const content = (
    <div
      className={`group flex items-center gap-3.5 p-3.5 sm:gap-4 sm:p-4 transition-colors ${
        !isAvailable
          ? 'opacity-55 cursor-not-allowed bg-gray-950/20'
          : isSelected
            ? 'bg-red-500/10 border-l-4 border-red-500'
            : 'hover:bg-gray-800/50'
      }`}
    >
      {/* Lesson Number Badge */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
          !isAvailable
            ? 'bg-gray-800 text-gray-500'
            : isSelected
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
              : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700 group-hover:text-white'
        }`}
      >
        {isSelected ? (
          <Play className="h-3.5 w-3.5 fill-current" />
        ) : (
          formatLessonNumber(video.position)
        )}
      </div>

      {/* Video Thumbnail */}
      <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg border border-gray-800 bg-gray-950 sm:w-28 shadow-sm">
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
          <div className="flex h-full w-full items-center justify-center text-gray-600">
            <PlaySquare className="h-6 w-6" />
          </div>
        )}
        {video.durationSeconds > 0 && (
          <div className="absolute bottom-1 right-1 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {formatVideoDuration(video.durationSeconds)}
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="min-w-0 flex-1">
        <h4
          className={`line-clamp-2 text-sm font-medium transition-colors ${
            !isAvailable
              ? 'text-gray-400 line-through'
              : isSelected
                ? 'font-semibold text-red-400'
                : 'text-gray-200 group-hover:text-white'
          }`}
        >
          {video.title}
        </h4>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
          {video.durationSeconds > 0 && (
            <span>{formatVideoDuration(video.durationSeconds)}</span>
          )}
          {isAvailable ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>Available</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
              <AlertCircle className="h-3 w-3" />
              <span>Unavailable video</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Indicator */}
      {isAvailable && (
        <div className="hidden shrink-0 items-center justify-center text-gray-500 group-hover:text-red-400 sm:flex">
          <span className="text-xs font-semibold">Start →</span>
        </div>
      )}
    </div>
  );

  if (!isAvailable) {
    return <div className="block cursor-not-allowed select-none">{content}</div>;
  }

  return (
    <Link
      to={`/watch/${courseId}/${video._id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-inset"
    >
      {content}
    </Link>
  );
};
