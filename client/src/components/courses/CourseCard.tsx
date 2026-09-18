import { Link } from 'react-router-dom';
import { PlaySquare, Clock, Video, User, ArrowRight } from 'lucide-react';
import { Course } from '../../types';
import { formatDuration } from '../../utils';
import { ProgressBar } from '../ProgressBar';
import { CompletedBadge } from '../CompletedBadge';

interface CourseCardProps {
  course: Course;
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const progress = Math.min(100, Math.max(0, Math.round(course.progressPercentage || 0)));
  const isCompleted = progress >= 100;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0B101E] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-950/30">
      {/* Thumbnail Container */}
      <Link
        to={`/courses/${course._id}`}
        tabIndex={-1}
        className="relative aspect-video w-full overflow-hidden bg-slate-950 focus:outline-none"
      >
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-600">
            <PlaySquare className="h-12 w-12" />
          </div>
        )}

        {/* Completed Badge Top-Left Overlay */}
        {isCompleted && (
          <div className="absolute top-2.5 left-2.5">
            <CompletedBadge size="xs" />
          </div>
        )}

        {/* Video Count & Duration Badges */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg bg-black/80 px-2 py-0.5 text-[11px] font-medium text-slate-200 backdrop-blur-md border border-white/[0.08]">
            <Video className="h-3 w-3 text-slate-400" />
            {course.totalVideos} {course.totalVideos === 1 ? 'lesson' : 'lessons'}
          </span>
          {course.totalDurationSeconds > 0 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-black/80 px-2 py-0.5 text-[11px] font-medium text-indigo-300 backdrop-blur-md border border-white/[0.08]">
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
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{course.channelName}</span>
            </div>
          )}
          <Link
            to={`/courses/${course._id}`}
            className="mt-2 block focus:outline-none"
          >
            <h3 className="line-clamp-2 text-base font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors font-heading leading-snug tracking-tight">
              {course.title}
            </h3>
          </Link>
          {course.description && (
            <p className="mt-1.5 line-clamp-1 text-xs text-slate-400 leading-relaxed">
              {course.description}
            </p>
          )}
        </div>

        {/* Progress Display */}
        <div className="mt-5 pt-3.5 border-t border-white/[0.06]">
          <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Progress</span>
            <span
              className={`font-semibold ${
                isCompleted ? 'text-emerald-400' : 'text-slate-300'
              }`}
            >
              {isCompleted ? '✓ Completed' : `${progress}% complete`}
            </span>
          </div>
          <ProgressBar progress={progress} size="sm" />
        </div>

        {/* Action footer */}
        <div className="mt-4 flex items-center justify-between pt-1">
          <span className="text-[11px] font-medium text-slate-400">
            {course.totalVideos} Lessons · {formatDuration(course.totalDurationSeconds)}
          </span>
          <Link
            to={`/courses/${course._id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#0D1527] px-3 py-1.5 text-xs font-semibold text-slate-200 transition-all group-hover:border-indigo-500/40 group-hover:bg-indigo-600 group-hover:text-white shadow-xs"
          >
            <span>Open Course</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
