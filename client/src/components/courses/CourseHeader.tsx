import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  PlaySquare,
  User,
  ExternalLink,
  Play,
} from 'lucide-react';
import { Course, VideoItem } from '../../types';
import { formatDuration } from '../../utils';
import { ProgressBar } from '../ProgressBar';
import { CompletedBadge } from '../CompletedBadge';

interface CourseHeaderProps {
  course: Course;
  firstVideo?: VideoItem;
  completedVideos?: number;
  totalAvailableVideos?: number;
  courseCompleted?: boolean;
}

export const CourseHeader = ({
  course,
  firstVideo,
  completedVideos,
  totalAvailableVideos,
  courseCompleted,
}: CourseHeaderProps) => {
  const progress = course.progressPercentage || 0;
  const isFinished = courseCompleted || progress >= 100;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Courses</span>
        </Link>
      </div>

      {/* Hero Banner */}
      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Thumbnail */}
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-gray-800 bg-gray-950 md:w-80 lg:w-96 shadow-lg">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-600">
                <PlaySquare className="h-12 w-12" />
              </div>
            )}
            <div className="absolute bottom-2.5 right-2.5 rounded-md bg-black/85 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              {course.totalVideos} {course.totalVideos === 1 ? 'Lesson' : 'Lessons'}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col justify-between space-y-4">
            <div>
              {course.channelName && (
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-400">
                  <User className="h-3.5 w-3.5" />
                  <span>{course.channelName}</span>
                </div>
              )}
              <h1 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                {course.title}
              </h1>
              {course.description ? (
                <p className="mt-3 text-sm text-gray-400 line-clamp-3 leading-relaxed">
                  {course.description}
                </p>
              ) : (
                <p className="mt-3 text-xs italic text-gray-500">
                  No description available.
                </p>
              )}
            </div>

            {/* Course Progress Section */}
            <div className="rounded-xl border border-gray-800/80 bg-gray-950/40 p-3.5">
              <div className="mb-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">Course Progress</span>
                  {isFinished && <CompletedBadge size="xs" />}
                </div>
                <span className="font-bold text-gray-200">
                  {completedVideos !== undefined
                    ? `${completedVideos} of ${totalAvailableVideos ?? course.totalVideos} completed (${progress}%)`
                    : `${progress}% complete`}
                </span>
              </div>
              <ProgressBar progress={progress} size="md" />
            </div>

            {/* Actions & Links */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {firstVideo && (
                <Link
                  to={`/watch/${course._id}/${firstVideo._id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-500 hover:shadow-red-600/35"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>
                    {isFinished
                      ? 'Review Course'
                      : progress > 0
                        ? 'Continue Learning'
                        : 'Start Learning'}
                  </span>
                </Link>
              )}

              <a
                href={`https://www.youtube.com/playlist?list=${course.playlistId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800/80 px-3.5 py-2.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-800 hover:text-white"
              >
                <span>Original YouTube Playlist</span>
                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
              </a>

              <span className="text-xs text-gray-500 ml-auto hidden sm:inline-block">
                Total Duration: {formatDuration(course.totalDurationSeconds)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
