import { Link } from 'react-router-dom';
import { PlaySquare, Clock, Video, User, ArrowRight } from 'lucide-react';
import { Course } from '../../types';
import { formatDuration } from '../../utils';
import { ProgressBar } from '../ProgressBar';

interface CourseCardProps {
  course: Course;
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const progress = course.progressPercentage || 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 transition-all duration-200 hover:-translate-y-1 hover:border-gray-700 hover:shadow-xl hover:shadow-red-600/5">
      {/* Thumbnail Container */}
      <Link
        to={`/courses/${course._id}`}
        tabIndex={-1}
        className="relative aspect-video w-full overflow-hidden bg-gray-950 focus:outline-none"
      >
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-600">
            <PlaySquare className="h-12 w-12" />
          </div>
        )}

        {/* Video Count & Duration Badges */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-black/85 px-2 py-0.5 text-xs font-medium text-gray-200 backdrop-blur-sm">
            <Video className="h-3 w-3 text-gray-400" />
            {course.totalVideos} {course.totalVideos === 1 ? 'video' : 'videos'}
          </span>
          {course.totalDurationSeconds > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/85 px-2 py-0.5 text-xs font-medium text-red-400 backdrop-blur-sm">
              <Clock className="h-3 w-3" />
              {formatDuration(course.totalDurationSeconds)}
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {course.channelName && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <User className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <span className="truncate">{course.channelName}</span>
            </div>
          )}
          <Link
            to={`/courses/${course._id}`}
            className="mt-2 block focus:outline-none focus:underline"
          >
            <h3 className="line-clamp-2 text-base font-semibold text-white group-hover:text-red-400 transition-colors">
              {course.title}
            </h3>
          </Link>
          {course.description ? (
            <p className="mt-2 line-clamp-2 text-xs text-gray-400 leading-relaxed">
              {course.description}
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500 italic">
              No description available.
            </p>
          )}
        </div>

        {/* Progress Display */}
        <div className="mt-4 pt-3 border-t border-gray-800/80">
          <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
            <span>Progress</span>
            <span className="font-semibold text-gray-300">
              {progress}% complete
            </span>
          </div>
          <ProgressBar progress={progress} size="sm" />
        </div>

        {/* Action footer */}
        <div className="mt-3.5 flex items-center justify-between pt-1">
          <span className="text-[11px] font-medium text-gray-500">
            {course.totalVideos} Lessons · {formatDuration(course.totalDurationSeconds)}
          </span>
          <Link
            to={`/courses/${course._id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800/80 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-red-600 hover:shadow-md hover:shadow-red-600/20"
          >
            <span>Open Course</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
