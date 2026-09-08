import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Film,
  Layers,
} from 'lucide-react';
import { courseService } from '../services';
import { formatDuration, formatLessonNumber, formatVideoDuration } from '../utils';

export const WatchPage = () => {
  const { courseId, videoId } = useParams<{
    courseId: string;
    videoId: string;
  }>();
  const navigate = useNavigate();

  // Fetch course and its videos via TanStack Query (leveraging cache from course detail)
  const { data, isLoading, error } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseById(courseId!),
    enabled: !!courseId,
  });

  const course = data?.course;

  // Sort strictly by position ASC
  const sortedVideos = useMemo(() => {
    const rawVideos = data?.videos || [];
    return [...rawVideos].sort((a, b) => a.position - b.position);
  }, [data?.videos]);

  // Identify current video, previous video, and next video
  const { currentVideo, currentIndex, previousVideo, nextVideo } = useMemo(() => {
    if (sortedVideos.length === 0) {
      return {
        currentVideo: null,
        currentIndex: -1,
        previousVideo: null,
        nextVideo: null,
      };
    }

    const idx = sortedVideos.findIndex(
      (v) => v._id === videoId || v.youtubeVideoId === videoId
    );

    if (idx === -1) {
      // Default to first video if not found
      return {
        currentVideo: sortedVideos[0],
        currentIndex: 0,
        previousVideo: null,
        nextVideo: sortedVideos.length > 1 ? sortedVideos[1] : null,
      };
    }

    return {
      currentVideo: sortedVideos[idx],
      currentIndex: idx,
      previousVideo: idx > 0 ? sortedVideos[idx - 1] : null,
      nextVideo: idx < sortedVideos.length - 1 ? sortedVideos[idx + 1] : null,
    };
  }, [sortedVideos, videoId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
        <div className="h-6 w-32 rounded bg-gray-800" />
        <div className="h-10 w-2/3 rounded bg-gray-800" />
        <div className="aspect-video w-full rounded-2xl bg-gray-900 border border-gray-800" />
        <div className="flex justify-between">
          <div className="h-10 w-36 rounded-xl bg-gray-800" />
          <div className="h-10 w-36 rounded-xl bg-gray-800" />
        </div>
      </div>
    );
  }

  if (error || !course || !currentVideo) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-800 bg-gray-900/40 p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Lesson not found</h2>
        <p className="mt-1 text-sm text-gray-400">
          The requested lesson or course could not be located.
        </p>
        <Link
          to={courseId ? `/courses/${courseId}` : '/courses'}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-red-600/25 hover:bg-red-500"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{courseId ? 'Back to Course' : 'Back to Courses'}</span>
        </Link>
      </div>
    );
  }

  const lessonNumber = currentIndex + 1;
  const totalLessons = sortedVideos.length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Top Bar: Back to Course Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <Link
          to={`/courses/${course._id}`}
          className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Course</span>
        </Link>

        <span className="truncate text-xs font-medium text-gray-400">
          {course.title}
        </span>
      </div>

      {/* Lesson Header Information */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
          <span>
            Lesson {lessonNumber} of {totalLessons}
          </span>
          {currentVideo.durationSeconds > 0 && (
            <>
              <span className="text-gray-600">•</span>
              <span className="flex items-center gap-1 text-gray-400 font-normal">
                <Clock className="h-3 w-3" />
                {formatVideoDuration(currentVideo.durationSeconds)}
              </span>
            </>
          )}
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          {currentVideo.title}
        </h1>
      </div>

      {/* VIDEO PLAYER PLACEHOLDER (Phase 3 Shell ONLY - No iframe/API as instructed) */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl">
        {/* Subtle background thumbnail blur if available */}
        {currentVideo.thumbnail && (
          <img
            src={currentVideo.thumbnail}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-15 blur-sm"
          />
        )}

        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-600/10 text-red-500 mb-4 shadow-lg shadow-red-600/10">
            <Film className="h-8 w-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-800 bg-gray-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
            Video Player Shell
          </div>

          <h3 className="text-base font-bold text-white sm:text-lg">
            Phase 4 Placeholder
          </h3>
          <p className="mt-1 max-w-md text-xs text-gray-400 sm:text-sm">
            The official YouTube IFrame Player, playback controls, and progress
            tracking will be integrated in Phase 4.
          </p>
        </div>
      </div>

      {/* Navigation Buttons: Previous & Next Lesson */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        {/* Previous Lesson Button */}
        {previousVideo ? (
          <Link
            to={`/watch/${course._id}/${previousVideo._id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-600 hover:bg-gray-700 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous Lesson</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-2 text-xs font-semibold text-gray-600 opacity-40 cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous Lesson</span>
          </button>
        )}

        <div className="hidden sm:block text-xs text-gray-500 font-medium">
          Lesson {lessonNumber} / {totalLessons}
        </div>

        {/* Next Lesson Button */}
        {nextVideo ? (
          <Link
            to={`/watch/${course._id}/${nextVideo._id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-red-600/25 transition-colors hover:bg-red-500"
          >
            <span>Next Lesson</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-2 text-xs font-semibold text-gray-600 opacity-40 cursor-not-allowed"
          >
            <span>Next Lesson</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick Lesson Navigator / Full Syllabus Below Player */}
      <div className="mt-8 space-y-3 rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-bold text-white">All Lessons in this Course</h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Total {formatDuration(course.totalDurationSeconds)}
          </span>
        </div>

        <div className="divide-y divide-gray-800/60 max-h-80 overflow-y-auto rounded-xl border border-gray-800/80 bg-gray-950/40">
          {sortedVideos.map((vid, idx) => {
            const isCurrent = vid._id === currentVideo._id;
            return (
              <button
                key={vid._id}
                type="button"
                onClick={() => navigate(`/watch/${course._id}/${vid._id}`)}
                className={`flex w-full items-center gap-3 p-3 text-left transition-colors focus:outline-none ${
                  isCurrent
                    ? 'bg-red-500/10 border-l-4 border-red-500'
                    : 'hover:bg-gray-800/40'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-bold ${
                    isCurrent
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {formatLessonNumber(idx)}
                </span>
                <span
                  className={`flex-1 truncate text-xs ${
                    isCurrent
                      ? 'font-semibold text-red-400'
                      : 'text-gray-300'
                  }`}
                >
                  {vid.title}
                </span>
                {vid.durationSeconds > 0 && (
                  <span className="shrink-0 text-[11px] text-gray-500">
                    {formatVideoDuration(vid.durationSeconds)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
