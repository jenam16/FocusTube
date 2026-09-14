import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
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
  CheckCircle2,
  Focus,
  Bookmark,
} from 'lucide-react';
import { courseService, progressService, bookmarkService } from '../services';
import {
  YouTubePlayer,
  CompletedBadge,
  FocusModeHeader,
  FocusModeControls,
  FocusSyllabusDrawer,
  NotesPanel,
  FocusNotesDrawer,
  BookmarkButton,
  YTPlayerInstance,
} from '../components';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotesDrawerOpen, setIsNotesDrawerOpen] = useState(false);
  const [currentPlaybackSeconds, setCurrentPlaybackSeconds] = useState(0);
  const playerRef = useRef<YTPlayerInstance | null>(null);

  const isFocusMode = searchParams.get('focus') === 'true';

  const handleToggleFocusMode = useCallback(
    (enabled?: boolean) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const shouldEnable =
            typeof enabled === 'boolean'
              ? enabled
              : next.get('focus') !== 'true';
          if (shouldEnable) {
            next.set('focus', 'true');
          } else {
            next.delete('focus');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Esc key listener to exit Focus Mode
  useEffect(() => {
    if (!isFocusMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (document.fullscreenElement) {
          return;
        }
        if (isDrawerOpen) {
          return;
        }
        if (isNotesDrawerOpen) {
          return;
        }
        const target = event.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
        ) {
          return;
        }

        handleToggleFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFocusMode, isDrawerOpen, isNotesDrawerOpen, handleToggleFocusMode]);

  // Lock body scroll while Focus Mode is active
  useEffect(() => {
    if (isFocusMode) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFocusMode]);

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

  // Fetch course bookmarks
  const { data: bookmarksData } = useQuery({
    queryKey: ['course-bookmarks', courseId],
    queryFn: () => bookmarkService.getCourseBookmarks(courseId!),
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

  // Check if current video is bookmarked
  const isCurrentVideoBookmarked = useMemo(() => {
    if (!currentVideo || !bookmarksData?.bookmarkedVideoIds) return false;
    return bookmarksData.bookmarkedVideoIds.includes(currentVideo._id);
  }, [currentVideo, bookmarksData]);

  const handleToggleBookmark = async () => {
    if (!currentVideo || !course) return;
    try {
      if (isCurrentVideoBookmarked) {
        await bookmarkService.removeBookmark(currentVideo._id);
      } else {
        await bookmarkService.addBookmark({
          courseId: course._id,
          videoId: currentVideo._id,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['course-bookmarks', courseId] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleSeekTo = (seconds: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(seconds, true);
      } catch (err) {
        console.error('Error seeking to timestamp:', err);
      }
    }
  };

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
  const flushProgress = useCallback(
    async (options?: { isEnded?: boolean }) => {
      const vId = latestPlaybackRef.current.videoId || currentVideo?._id;
      const cId = latestPlaybackRef.current.courseId || course?._id;
      const curTime = options?.isEnded
        ? latestPlaybackRef.current.duration || currentVideo?.durationSeconds || 1
        : latestPlaybackRef.current.currentTime;
      const dur =
        latestPlaybackRef.current.duration || currentVideo?.durationSeconds || 0;

      if (!vId || !cId || (curTime <= 0 && !options?.isEnded)) return;

      try {
        const res = await progressService.updateVideoProgress(vId, {
          courseId: cId,
          watchedSeconds: curTime,
          durationSeconds: dur,
          isEnded: options?.isEnded,
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
    },
    [currentVideo, course, queryClient]
  );

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

      setCurrentPlaybackSeconds(currentTime);

      // Check if user watched 85% or reached within last 20 seconds of video
      const isEndingPart =
        duration > 0 &&
        (currentTime / duration >= 0.85 ||
          currentTime >= Math.max(5, duration - 20));

      const wasAlreadyCompleted = Boolean(
        localProgressMap[currentVideo._id]?.completed
      );
      const isNowCompleted = wasAlreadyCompleted || isEndingPart;
      const justCompleted = !wasAlreadyCompleted && isNowCompleted;

      const progressPercentage = isNowCompleted
        ? 100
        : duration > 0
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
          watchedSeconds: isNowCompleted ? duration || currentTime : currentTime,
          durationSeconds: duration,
          progressPercentage,
          completed: isNowCompleted,
          completedAt: isNowCompleted
            ? map[currentVideo._id]?.completedAt || new Date().toISOString()
            : null,
          lastWatchedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }));

      // Periodic sync every 10s, position seek difference > 10s, or newly completed
      if (
        justCompleted ||
        prev.videoId !== currentVideo._id ||
        now - prev.lastSavedAt >= 10000 ||
        Math.abs(currentTime - prev.currentTime) >= 10
      ) {
        latestPlaybackRef.current.lastSavedAt = now;
        flushProgress();
      }
    },
    [currentVideo, course, localProgressMap, flushProgress]
  );

  // Handle video playback state change (e.g. video ended)
  const handlePlayerStateChange = useCallback(
    (event: { data?: number }) => {
      const YT = window.YT;
      if (YT && event.data === YT.PlayerState.ENDED) {
        if (currentVideo && course) {
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
              watchedSeconds: currentVideo.durationSeconds || latestPlaybackRef.current.duration || 0,
              durationSeconds: currentVideo.durationSeconds || latestPlaybackRef.current.duration || 0,
              progressPercentage: 100,
              completed: true,
              completedAt: map[currentVideo._id]?.completedAt || new Date().toISOString(),
              lastWatchedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }));
        }
        flushProgress({ isEnded: true });
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
    navigate(
      `/watch/${courseId}/${targetVideoId}${isFocusMode ? '?focus=true' : ''}`
    );
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
      className={
        isFocusMode
          ? 'fixed inset-0 z-50 flex flex-col bg-gray-950 text-gray-100 overflow-y-auto'
          : `mx-auto space-y-6 transition-all duration-300 ${
              isTheaterMode ? 'max-w-7xl' : 'max-w-5xl'
            }`
      }
    >
      {/* Top Navigation: Focus Mode Header vs Standard Watch Bar */}
      {isFocusMode ? (
        <FocusModeHeader
          courseTitle={course.title}
          onExit={() => handleToggleFocusMode(false)}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          completedVideos={progressData?.completedVideos}
          totalVideos={sortedVideos.length}
        />
      ) : (
        /* Top Bar: Back to Course Navigation */
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
      )}

      {/* Main Content Area */}
      <div
        className={
          isFocusMode
            ? 'flex-1 flex flex-col justify-center px-4 py-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-4'
            : 'space-y-6'
        }
      >
        {/* Lesson Header Information (Standard Mode Only) */}
        {!isFocusMode && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-indigo-400">
                <span>
                  Lesson {lessonNumber} of {totalLessons}
                </span>
                {currentVideo.durationSeconds > 0 && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-slate-400 font-normal">
                      <Clock className="h-3 w-3" />
                      {formatVideoDuration(currentVideo.durationSeconds)}
                    </span>
                  </>
                )}
                {currentVideoProgress?.completed ? (
                  <>
                    <span className="text-slate-600">•</span>
                    <CompletedBadge size="xs" />
                  </>
                ) : currentVideoProgress && currentVideoProgress.progressPercentage > 0 ? (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-indigo-400 font-semibold lowercase">
                      {currentVideoProgress.progressPercentage}% watched
                    </span>
                  </>
                ) : null}
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl font-heading">
                {currentVideo.title}
              </h1>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {/* Bookmark Button */}
              <BookmarkButton
                isBookmarked={isCurrentVideoBookmarked}
                onToggle={handleToggleBookmark}
              />

              {/* Focus Mode Trigger Button */}
              <button
                type="button"
                onClick={() => handleToggleFocusMode(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all active:scale-[0.98]"
                title="Enter Focus Mode"
              >
                <Focus className="h-3.5 w-3.5 text-indigo-400" />
                <span>Focus Mode</span>
              </button>

              {/* Big Screen / Theater Mode Option */}
              <button
                type="button"
                onClick={() => setIsTheaterMode((prev) => !prev)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
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
          </div>
        )}

        {/* Official YouTube IFrame Player */}
        {currentVideo.isAvailable !== false && Boolean(currentVideo.youtubeVideoId) ? (
          <YouTubePlayer
            key={currentVideo._id}
            videoId={currentVideo.youtubeVideoId}
            title={currentVideo.title}
            initialSeconds={initialSeconds}
            isTheaterMode={isFocusMode || isTheaterMode}
            onToggleTheater={
              isFocusMode ? undefined : () => setIsTheaterMode((prev) => !prev)
            }
            onReady={(player) => {
              playerRef.current = player;
            }}
            onProgress={handleProgress}
            onStateChange={handlePlayerStateChange}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#111827]/40 p-12 text-center aspect-video">
            <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
            <h3 className="text-base font-bold text-white font-heading">Video unavailable</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              This video cannot be played because it has been removed or set to private on YouTube.
            </p>
          </div>
        )}

        {/* Navigation / Controls Section */}
        {isFocusMode ? (
          <FocusModeControls
            currentVideo={currentVideo}
            currentVideoProgress={currentVideoProgress}
            currentIndex={currentIndex >= 0 ? currentIndex : 0}
            totalVideos={totalLessons}
            hasPrevious={Boolean(previousVideo)}
            hasNext={Boolean(nextVideo)}
            onPrevious={() => previousVideo && handleNavigateVideo(previousVideo._id)}
            onNext={() => nextVideo && handleNavigateVideo(nextVideo._id)}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenNotes={() => setIsNotesDrawerOpen(true)}
            isBookmarked={isCurrentVideoBookmarked}
            onToggleBookmark={handleToggleBookmark}
          />
        ) : (
          <>
            {/* Navigation Buttons: Previous & Next Lesson (Skips unavailable) */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#111827] p-4 shadow-xs">
              {/* Previous Lesson Button */}
              {previousVideo ? (
                <button
                  type="button"
                  onClick={() => handleNavigateVideo(previousVideo._id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-white/[0.15] hover:bg-slate-700 hover:text-white active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous Lesson</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.04] bg-slate-900/40 px-4 py-2 text-xs font-semibold text-slate-600 opacity-40 cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous Lesson</span>
                </button>
              )}

              <div className="hidden sm:block text-xs text-slate-400 font-medium">
                Lesson {lessonNumber} / {totalLessons}
              </div>

              {/* Next Lesson Button */}
              {nextVideo ? (
                <button
                  type="button"
                  onClick={() => handleNavigateVideo(nextVideo._id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition-all hover:bg-indigo-500 active:scale-95"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.04] bg-slate-900/40 px-4 py-2 text-xs font-semibold text-slate-600 opacity-40 cursor-not-allowed"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Lesson Notes Panel (Normal Mode) */}
            <NotesPanel
              courseId={course._id}
              videoId={currentVideo._id}
              currentPlaybackSeconds={currentPlaybackSeconds}
              onSeekTo={handleSeekTo}
            />

            {/* Quick Lesson Navigator / Full Syllabus Below Player */}
            <div className="mt-8 space-y-3 rounded-2xl border border-white/[0.08] bg-[#111827] p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white font-heading">All Lessons in this Course</h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  Total {formatDuration(course.totalDurationSeconds)}
                </span>
              </div>

              <div className="divide-y divide-white/[0.06] max-h-80 overflow-y-auto rounded-xl border border-white/[0.08] bg-slate-950/40">
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
                            ? 'bg-indigo-500/10 border-l-4 border-indigo-500'
                            : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
                          isCurrent
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : vidProg?.completed
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                              : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {vidProg?.completed && !isCurrent ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          formatLessonNumber(idx)
                        )}
                      </span>
                      <span
                        className={`flex-1 truncate text-xs ${
                          !isAvailable
                            ? 'text-slate-500 line-through'
                            : isCurrent
                              ? 'font-semibold text-indigo-300'
                              : 'text-slate-300'
                        }`}
                      >
                        {vid.title}
                      </span>
                      {bookmarksData?.bookmarkedVideoIds?.includes(vid._id) && (
                        <Bookmark
                          className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0"
                          aria-label="Bookmarked lesson"
                        />
                      )}
                      {vidProg?.completed ? (
                        <CompletedBadge size="xs" />
                      ) : vidProg && vidProg.progressPercentage > 0 ? (
                        <span className="shrink-0 text-[11px] text-indigo-400 font-semibold">
                          {vidProg.progressPercentage}%
                        </span>
                      ) : null}
                      {vid.durationSeconds > 0 && (
                        <span className="shrink-0 text-[11px] text-slate-500 font-mono">
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
          </>
        )}
      </div>

      {/* Focus Mode Syllabus Slide-over Drawer */}
      {isFocusMode && (
        <FocusSyllabusDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          courseTitle={course.title}
          videos={sortedVideos}
          activeVideoId={currentVideo._id}
          progressMap={localProgressMap}
          bookmarkedVideoIds={bookmarksData?.bookmarkedVideoIds}
          onSelectVideo={(video) => {
            setIsDrawerOpen(false);
            handleNavigateVideo(video._id);
          }}
        />
      )}

      {/* Focus Mode Notes Slide-over Drawer */}
      {isFocusMode && currentVideo && (
        <FocusNotesDrawer
          isOpen={isNotesDrawerOpen}
          onClose={() => setIsNotesDrawerOpen(false)}
          courseId={course._id}
          videoId={currentVideo._id}
          videoTitle={currentVideo.title}
          currentPlaybackSeconds={currentPlaybackSeconds}
          onSeekTo={handleSeekTo}
        />
      )}
    </div>
  );
};
