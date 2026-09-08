import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  PlaySquare,
  Clock,
  Video,
  User,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { courseService } from '../services';
import { formatDuration, formatVideoDuration } from '../utils';

export const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['course', id],
    queryFn: () => courseService.getCourseById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-800" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-900/60" />
        <div className="h-96 animate-pulse rounded-2xl bg-gray-900/60" />
      </div>
    );
  }

  if (error || !data?.course) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-800 bg-gray-900/40 p-12 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-white">Course Not Found</h2>
        <p className="mt-1 text-sm text-gray-400">
          The course you requested does not exist or has been removed.
        </p>
        <Link
          to="/courses"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-800 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Courses</span>
        </Link>
      </div>
    );
  }

  const { course, videos } = data;

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div>
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Courses</span>
        </Link>
      </div>

      {/* Course Hero Banner */}
      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Thumbnail */}
          <div className="relative aspect-video w-full md:w-80 shrink-0 overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-600">
                <PlaySquare className="h-12 w-12" />
              </div>
            )}
            <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              {course.totalVideos} {course.totalVideos === 1 ? 'lesson' : 'lessons'}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col justify-between space-y-4">
            <div>
              {course.channelName && (
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400">
                  <User className="h-3.5 w-3.5" />
                  <span>{course.channelName}</span>
                </div>
              )}
              <h1 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">
                {course.title}
              </h1>
              {course.description && (
                <p className="mt-2 text-sm text-gray-400 line-clamp-3 leading-relaxed">
                  {course.description}
                </p>
              )}
            </div>

            {/* Badges / Stats */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-400 border-t border-gray-800/80 pt-4">
              <div className="flex items-center gap-1.5">
                <Video className="h-4 w-4 text-gray-500" />
                <span>{course.totalVideos} Videos indexed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>Total Duration: {formatDuration(course.totalDurationSeconds)}</span>
              </div>
              <a
                href={`https://www.youtube.com/playlist?list=${course.playlistId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors ml-auto"
              >
                <span>Original Playlist</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 3 Notice Card */}
      <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/30 p-4 text-xs text-gray-400">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Course indexed in MongoDB. IFrame Player and progress tracking will be active in Phase 3.</span>
        </div>
        <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
          Phase 2 Complete
        </span>
      </div>

      {/* Course Syllabus / Video List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Course Syllabus</h2>
          <span className="text-xs text-gray-400">
            {videos.length} {videos.length === 1 ? 'Lesson' : 'Lessons'}
          </span>
        </div>

        <div className="divide-y divide-gray-800/80 rounded-2xl border border-gray-800 bg-gray-900/50 overflow-hidden">
          {videos.map((video) => (
            <div
              key={video._id}
              className="flex items-center gap-4 p-4 transition-colors hover:bg-gray-800/40"
            >
              {/* Position Number */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-800/60 text-xs font-bold text-gray-400">
                {video.position + 1}
              </div>

              {/* Video Thumbnail */}
              <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg bg-gray-950 border border-gray-800 sm:w-28">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-600">
                    <PlaySquare className="h-6 w-6" />
                  </div>
                )}
                {video.durationSeconds > 0 && (
                  <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {formatVideoDuration(video.durationSeconds)}
                  </div>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-semibold text-white">
                  {video.title}
                </h4>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                  {video.durationSeconds > 0 && (
                    <span>{formatVideoDuration(video.durationSeconds)}</span>
                  )}
                  {video.isAvailable ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Ready</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-400">
                      <AlertCircle className="h-3 w-3" />
                      <span>Unavailable Video</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
