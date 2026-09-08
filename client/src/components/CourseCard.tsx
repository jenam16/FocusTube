import { Link } from 'react-router-dom';
import { PlaySquare, Clock, Video, User } from 'lucide-react';
import { Course } from '../types';
import { formatDuration } from '../utils';

interface CourseCardProps {
  course: Course;
}

export const CourseCard = ({ course }: CourseCardProps) => {
  return (
    <Link
      to={`/courses/${course._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 transition-all duration-200 hover:-translate-y-1 hover:border-gray-700 hover:shadow-xl hover:shadow-red-600/5"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-950">
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
          <span className="inline-flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-xs font-medium text-gray-200 backdrop-blur-sm">
            <Video className="h-3 w-3" />
            {course.totalVideos} {course.totalVideos === 1 ? 'video' : 'videos'}
          </span>
          {course.totalDurationSeconds > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/80 px-2 py-0.5 text-xs font-medium text-red-400 backdrop-blur-sm">
              <Clock className="h-3 w-3" />
              {formatDuration(course.totalDurationSeconds)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          {course.channelName && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <User className="h-3.5 w-3.5 text-gray-500" />
              <span className="truncate">{course.channelName}</span>
            </div>
          )}
          <h3 className="mt-1.5 line-clamp-2 text-base font-semibold text-white group-hover:text-red-400 transition-colors">
            {course.title}
          </h3>
          {course.description && (
            <p className="mt-1.5 line-clamp-2 text-xs text-gray-400">
              {course.description}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-800/80 pt-3 text-xs font-medium text-gray-400">
          <span className="text-gray-500">
            Added {new Date(course.createdAt).toLocaleDateString()}
          </span>
          <span className="text-red-400 group-hover:underline">
            View Syllabus →
          </span>
        </div>
      </div>
    </Link>
  );
};
