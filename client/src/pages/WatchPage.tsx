import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Layers,
  Maximize,
  Minimize,
} from 'lucide-react';
import { courseService, progressService } from '../services';
import { YouTubePlayer } from '../components';
import { VideoProgress } from '../types';
import {
  formatDuration,
  formatLessonNumber,
  formatVideoDuration,
  getNextPlayableVideo,
  getPreviousPlayableVideo,
} from '../utils';

export const WatchPage = () => {
  const { courseId, videoId } = useParams<{
    courseId: string;
    videoId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  // Fetch course and its videos via TanStack Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseById(courseId!),
    enabled: !!courseId,
  });

  // Fetch course progress
  const { data: progressData } = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => progressService.getCourseProgress(courseId!),
    enabled: !!courseId,
  });

  // Local optimistic progress cache
  const [optimisticProgressMap, setOptimisticProgressMap] = useState<
    Record<string, VideoProgress>
  >({});

  // Combine server progress data with local optimistic updates
  const localProgressMap = useMemo(() => {
    const map: Record<string, VideoProgress> = {};
    if (progressData?.progress) {
      for (const p of progressData.progress) {
        map[p.video] = p;
      }
    }
    return { ...map, ...optimisticProgressMap };
  }, [progressData, optimisticProgressMap]);



  const course = data?.course;

  // Sort strictly by position ASC
  const sortedVideos = useMemo(() => {
    const rawVideos = data?.videos || [];
    return [...rawVideos].sort((a, b) => a.position - b.position);
  }, [data?.videos]);

  // Identify current video
  const { currentVideo, currentIndex } = useMemo(() => {
    if (sortedVideos.length === 0) {
      return { currentVideo: null, currentIndex: -1 };
    }

    const idx = sortedVideos.findIndex(
      (v) => v._id === videoId || v.youtubeVideoId === videoId
    );

    if (idx === -1) {
      return {
        currentVideo: sortedVideos[0],
        currentIndex: 0,
      };
    }

    return {
      currentVideo: sortedVideos[idx],
      currentIndex: idx,
    };
  }, [sortedVideos, videoId]);

  const currentVideoProgress = currentVideo
    ? localProgressMap[currentVideo._id]
    : undefined;

  // Initial resume position
  const initialSeconds = useMemo(() => {
    if (!currentVideoProgress) return 0;
    const watched = currentVideoProgress.watchedSeconds || 0;
    const duration =
      currentVideoProgress.durationSeconds ||
      currentVideo?.durationSeconds ||
      0;
    if (watched <= 2) return 0;
    if (duration > 0 && watched >= duration - 5) return 0;
    return Math.floor(watched);
  }, [currentVideoProgress, currentVideo?.durationSeconds]);

  // Ref tracking latest playback position
  const latestPlaybackRef = useRef<{
    videoId: string;
    courseId: string;
    currentTime: number;
    duration: number;
    lastSavedAt: number;
  }>({
    videoId: '',
    courseId: '',
    currentTime: 0,
    duration: 0,
    lastSavedAt: 0,
  });

  // Flush progress to backend
  const flushProgress = useCallback(async () => {
    const { videoId: vId, courseId: cId, currentTime, duration } =
      latestPlaybackRef.current;
    if (!vId || !cId || currentTime <= 0) return;

    try {
      const res = await progressService.updateVideoProgress(vId, {
        courseId: cId,
        watchedSeconds: currentTime,
        durationSeconds: duration,
      });

      setOptimisticProgressMap((prev) => ({
        ...prev,
        [vId]: res.progress,
      }));

      queryClient.invalidateQueries({ queryKey: ['course-progress', cId] });
      queryClient.invalidateQueries({ queryKey: ['recent-progress'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    } catch {
      // Non-blocking
    }
  }, [queryClient]);

  // Handle periodic progress updates from player
  const handleProgress = useCallback(
    (currentTime: number, duration: number) => {
      if (!currentVideo || !course) return;

      const now = Date.now();
      const prev = latestPlaybackRef.current;

      latestPlaybackRef.current = {
        videoId: currentVideo._id,
        courseId: course._id,
        currentTime,
        duration,
        lastSavedAt: prev.lastSavedAt,
      };

      const progressPercentage =
        duration > 0
          ? Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)))
          : 0;

      setOptimisticProgressMap((map) => ({
        ...map,
        [currentVideo._id]: {
          ...(map[currentVideo._id] || {
            _id: '',
            user: '',
            course: course._id,
            video: currentVideo._id,
            createdAt: '',
          }),
          watchedSeconds: currentTime,
          durationSeconds: duration,
          progressPercentage,
          lastWatchedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }));

      if (
        prev.videoId !== currentVideo._id ||
        now - prev.lastSavedAt >= 10000 ||
        Math.abs(currentTime - prev.currentTime) >= 10
      ) {
        latestPlaybackRef.current.lastSavedAt = now;
        flushProgress();
      }
    },
    [currentVideo, course, flushProgress]
  );

  // Flush on unmount or before switching
  useEffect(() => {
    return () => {
      flushProgress();
    };
  }, [flushProgress]);

  const handleNavigateVideo = (targetVideoId: string) => {
    flushProgress();
    navigate(`/watch/${courseId}/${targetVideoId}`);
  };

  // Get previous and next playable videos (skipping unavailable)
  const previousVideo = useMemo(() => {
    return getPreviousPlayableVideo(sortedVideos, currentVideo?._id);
  }, [sortedVideos, currentVideo]);

  const nextVideo = useMemo(() => {
    return getNextPlayableVideo(sortedVideos, currentVideo?._id);
  }, [sortedVideos, currentVideo]);


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
    <div
      className={`mx-auto space-y-6 transition-all duration-300 ${
        isTheaterMode ? 'max-w-7xl' : 'max-w-5xl'
      }`}
    >
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-red-400">
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
            {currentVideoProgress && currentVideoProgress.progressPercentage > 0 && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-red-400 font-semibold lowercase">
                  {currentVideoProgress.progressPercentage}% watched
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {currentVideo.title}
          </h1>
        </div>

        {/* Big Screen / Theater Mode Option */}
        <button
          type="button"
          onClick={() => setIsTheaterMode((prev) => !prev)}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors self-start sm:self-auto shrink-0"
        >
          {isTheaterMode ? (
            <>
              <Minimize className="h-3.5 w-3.5" />
              <span>Default Size</span>
            </>
          ) : (
            <>
              <Maximize className="h-3.5 w-3.5" />
              <span>Big Screen</span>
            </>
          )}
        </button>
      </div>

      {/* Official YouTube IFrame Player */}
      {currentVideo.isAvailable !== false && Boolean(currentVideo.youtubeVideoId) ? (
        <YouTubePlayer
          key={currentVideo._id}
          videoId={currentVideo.youtubeVideoId}
          title={currentVideo.title}
          initialSeconds={initialSeconds}
          isTheaterMode={isTheaterMode}
          onToggleTheater={() => setIsTheaterMode((prev) => !prev)}
          onProgress={handleProgress}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 p-12 text-center aspect-video">
          <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
          <h3 className="text-base font-bold text-white">Video unavailable</h3>
          <p className="mt-1 max-w-sm text-xs text-gray-400">
            This video cannot be played because it has been removed or set to private on YouTube.
          </p>
        </div>
      )}

      {/* Navigation Buttons: Previous & Next Lesson (Skips unavailable) */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        {/* Previous Lesson Button */}
        {previousVideo ? (
          <button
            type="button"
            onClick={() => handleNavigateVideo(previousVideo._id)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-gray-600 hover:bg-gray-700 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous Lesson</span>
          </button>
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
          <button
            type="button"
            onClick={() => handleNavigateVideo(nextVideo._id)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-red-600/25 transition-colors hover:bg-red-500"
          >
            <span>Next Lesson</span>
            <ChevronRight className="h-4 w-4" />
          </button>
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
            const isAvailable = vid.isAvailable !== false;
            const vidProg = localProgressMap[vid._id];
            return (
              <button
                key={vid._id}
                type="button"
                disabled={!isAvailable}
                onClick={() => {
                  if (isAvailable) {
                    handleNavigateVideo(vid._id);
                  }
                }}
                className={`flex w-full items-center gap-3 p-3 text-left transition-colors focus:outline-none ${
                  !isAvailable
                    ? 'opacity-40 cursor-not-allowed'
                    : isCurrent
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
                    !isAvailable
                      ? 'text-gray-500 line-through'
                      : isCurrent
                        ? 'font-semibold text-red-400'
                        : 'text-gray-300'
                  }`}
                >
                  {vid.title}
                </span>
                {vidProg && vidProg.progressPercentage > 0 && (
                  <span className="shrink-0 text-[11px] text-red-400 font-medium">
                    {vidProg.progressPercentage}%
                  </span>
                )}
                {vid.durationSeconds > 0 && (
                  <span className="shrink-0 text-[11px] text-gray-500">
                    {formatVideoDuration(vid.durationSeconds)}
                  </span>
                )}
                {!isAvailable && (
                  <span className="shrink-0 text-[10px] text-amber-500 font-medium">
                    Unavailable
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
