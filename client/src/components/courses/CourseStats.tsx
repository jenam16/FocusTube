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
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0B101E] p-3.5 sm:p-4 shadow-lg shadow-black/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/15 text-indigo-400">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-400">Total Lessons</p>
          <p className="truncate text-base font-bold text-white sm:text-lg font-heading">
            {course.totalVideos}
          </p>
        </div>
      </div>

      {/* Total Duration */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0B101E] p-3.5 sm:p-4 shadow-lg shadow-black/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/15 text-teal-400">
          <Clock className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-400">Total Duration</p>
          <p className="truncate text-base font-bold text-white sm:text-lg font-heading">
            {formatDuration(course.totalDurationSeconds)}
          </p>
        </div>
      </div>

      {/* Channel */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0B101E] p-3.5 sm:p-4 shadow-lg shadow-black/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/15 text-sky-400">
          <User className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-400">Channel</p>
          <p className="truncate text-sm font-bold text-white sm:text-base font-heading">
            {course.channelName || 'YouTube Creator'}
          </p>
        </div>
      </div>

      {/* Imported Date */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0B101E] p-3.5 sm:p-4 shadow-lg shadow-black/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/15 text-emerald-400">
          <Calendar className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-400">Imported</p>
          <p className="truncate text-sm font-bold text-white sm:text-base font-heading">
            {formattedDate || 'Recently'}
          </p>
        </div>
      </div>
    </div>
  );
};
