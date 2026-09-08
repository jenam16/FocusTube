import { BookOpen, Clock, User, Calendar } from 'lucide-react';
import { Course } from '../../types';
import { formatDuration } from '../../utils';

interface CourseStatsProps {
  course: Course;
}

export const CourseStats = ({ course }: CourseStatsProps) => {
  const formattedDate = course.createdAt
    ? new Date(course.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {/* Total Lessons */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-3.5 sm:p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-gray-400">Total Lessons</p>
          <p className="truncate text-base font-bold text-white sm:text-lg">
            {course.totalVideos}
          </p>
        </div>
      </div>

      {/* Total Duration */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-3.5 sm:p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
          <Clock className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-gray-400">Total Duration</p>
          <p className="truncate text-base font-bold text-white sm:text-lg">
            {formatDuration(course.totalDurationSeconds)}
          </p>
        </div>
      </div>

      {/* Channel */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-3.5 sm:p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400">
          <User className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-gray-400">Channel</p>
          <p className="truncate text-sm font-bold text-white sm:text-base">
            {course.channelName || 'YouTube Creator'}
          </p>
        </div>
      </div>

      {/* Imported Date */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/50 p-3.5 sm:p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
          <Calendar className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-gray-400">Imported</p>
          <p className="truncate text-sm font-bold text-white sm:text-base">
            {formattedDate || 'Recently'}
          </p>
        </div>
      </div>
    </div>
  );
};
