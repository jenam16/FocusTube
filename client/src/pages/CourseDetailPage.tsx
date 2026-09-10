import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { courseService, progressService, bookmarkService } from '../services';
import { VideoItem, VideoProgress } from '../types';
import {
  YouTubePlayer,
  CourseHeader,
  CourseStats,
  LessonList,
  VideoNavigation,
  LoadingState,
  ErrorState,
  FocusModeHeader,
  FocusModeControls,
  FocusSyllabusDrawer,
  NotesPanel,
  FocusNotesDrawer,
  YTPlayerInstance,
} from '../components';
import {
  getFirstPlayableVideo,
  getNextPlayableVideo,
  getPreviousPlayableVideo,
} from '../utils';


export const CourseDetailPage = () => {
  const params = useParams<{ courseId?: string; id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const courseId = params.courseId || params.id;
  const queryClient = useQueryClient();

  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
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
        // If native browser/video fullscreen is active, let browser exit fullscreen first
        if (document.fullscreenElement) {
          return;
        }
        // If syllabus drawer is open, let drawer handle its own Esc
        if (isDrawerOpen) {
          return;
        }
        // If notes drawer is open, let drawer handle its own Esc
        if (isNotesDrawerOpen) {
          return;
        }
        // Do not intercept if focus is inside an input/textarea
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

  // Fetch course details & syllabus
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseById(courseId!),
    enabled: !!courseId,
  });

  // Fetch course-level video progress
  const { data: progressData } = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => progressService.getCourseProgress(courseId!),
    enabled: !!courseId,
  });

  // Fetch course bookmarks (list of bookmarked videoIds)
  const { data: bookmarksData } = useQuery({
    queryKey: ['course-bookmarks', courseId],
    queryFn: () => bookmarkService.getCourseBookmarks(courseId!),
    enabled: !!courseId,
  });


  // Local optimistic progress cache for real-time UI feedback
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

  // Compute effective course with live progress percentage
  const effectiveCourse = useMemo(() => {
    if (!course) return course;
    const progressPct =
      progressData?.courseProgressPercentage !== undefined
        ? progressData.courseProgressPercentage
        : course.progressPercentage;
    return {
      ...course,
      progressPercentage: progressPct,
    };
  }, [course, progressData?.courseProgressPercentage]);

  // Sort strictly by position ASC
  const sortedVideos = useMemo(() => {
    const rawVideos = data?.videos || [];
    return [...rawVideos].sort((a, b) => a.position - b.position);
  }, [data?.videos]);

  // Declaratively derive the current video from URL query param, local selection, or first playable video
  const currentVideo = useMemo(() => {
    if (sortedVideos.length === 0) return null;

    const requestedVideoId =
      searchParams.get('v') || searchParams.get('video') || selectedVideoId;

    if (requestedVideoId) {
      const target = sortedVideos.find(
        (v) =>
          (v._id === requestedVideoId || v.youtubeVideoId === requestedVideoId) &&
          v.isAvailable !== false
      );
      if (target) return target;
    }

    // Default to first playable video in the playlist
    return getFirstPlayableVideo(sortedVideos);
  }, [sortedVideos, searchParams, selectedVideoId]);

  // Current video progress
  const currentVideoProgress = currentVideo
    ? localProgressMap[currentVideo._id]
    : undefined;

  // Calculate resume start seconds: skip if <= 2s or >= duration - 5s
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
        // Non-blocking: playback continues seamlessly on sync error
      }
    },
    [currentVideo, course, queryClient]
  );

  // Handle periodic progress updates from YouTubePlayer
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

      // Real-time optimistic update of progress percentage
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

  // Flush on unmount
  useEffect(() => {
    return () => {
      flushProgress();
    };
  }, [flushProgress]);

  // Handle user explicitly selecting a video (flushing current progress first)
  const handleSelectVideo = (video: VideoItem) => {
    if (video.isAvailable === false) {
      return;
    }
    flushProgress();
    setSelectedVideoId(video._id);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('v', video._id);
        return next;
      },
      { replace: true }
    );
  };


  // Previous / Next playable video navigation (skipping unavailable videos)
  const previousVideo = useMemo(() => {
    return getPreviousPlayableVideo(sortedVideos, currentVideo?._id);
  }, [sortedVideos, currentVideo]);

  const nextVideo = useMemo(() => {
    return getNextPlayableVideo(sortedVideos, currentVideo?._id);
  }, [sortedVideos, currentVideo]);

  const handlePrevious = () => {
    if (previousVideo) {
      handleSelectVideo(previousVideo);
    }
  };

  const handleNext = () => {
    if (nextVideo) {
      handleSelectVideo(nextVideo);
    }
  };

  if (isLoading) {
    return <LoadingState type="details" />;
  }

  if (error || !course) {
    return (
      <ErrorState
        title="Course not found"
        message="The requested course does not exist or you do not have permission to view it."
        backLink="/courses"
        backLabel="Go back to Courses"
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  const currentVideoIndex = currentVideo
    ? sortedVideos.findIndex((v) => v._id === currentVideo._id)
    : -1;

  const hasAnyPlayableVideos = sortedVideos.some(
    (v) => v.isAvailable !== false && Boolean(v.youtubeVideoId)
  );

  return (
    <div
      className={
        isFocusMode
          ? 'fixed inset-0 z-50 flex flex-col bg-gray-950 text-gray-100 overflow-y-auto'
          : 'space-y-8'
      }
    >
      {isFocusMode ? (
        <FocusModeHeader
          courseTitle={course.title}
          onExit={() => handleToggleFocusMode(false)}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          completedVideos={progressData?.completedVideos}
          totalVideos={sortedVideos.length}
        />
      ) : (
        /* Top Breadcrumb Navigation */
        <div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Courses</span>
          </Link>
        </div>
      )}

      {/* PHASE 4 & 7: VIDEO PLAYER + SYLLABUS SECTION */}
      <section
        aria-label="Video Player and Syllabus"
        className={
          isFocusMode
            ? 'flex-1 flex flex-col justify-center px-4 py-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full'
            : 'space-y-6'
        }
      >
        {/* Layout: Focus Mode (Full Width Centered) vs Theater Mode vs Default (2-Column) */}
        <div
          className={
            isFocusMode
              ? 'w-full'
              : `grid grid-cols-1 gap-6 ${
                  isTheaterMode
                    ? 'grid-cols-1'
                    : 'lg:grid-cols-12 lg:items-start'
                }`
          }
        >
          {/* Player Column */}
          <div
            className={
              isFocusMode
                ? 'w-full space-y-4'
                : `space-y-4 ${
                    isTheaterMode ? 'w-full' : 'lg:col-span-8'
                  }`
            }
          >
            {hasAnyPlayableVideos && currentVideo ? (
              <>
                {/* Official YouTube IFrame Player */}
                <YouTubePlayer
                  key={currentVideo._id}
                  videoId={currentVideo.youtubeVideoId}
                  title={currentVideo.title}
                  initialSeconds={initialSeconds}
                  isTheaterMode={isFocusMode || isTheaterMode}
                  onToggleTheater={
                    isFocusMode
                      ? undefined
                      : () => setIsTheaterMode((prev) => !prev)
                  }
                  onReady={(player) => {
                    playerRef.current = player;
                  }}
                  onProgress={handleProgress}
                  onStateChange={handlePlayerStateChange}
                />

                {/* Player Navigation and Controls */}
                {isFocusMode ? (
                  <FocusModeControls
                    currentVideo={currentVideo}
                    currentVideoProgress={currentVideoProgress}
                    currentIndex={currentVideoIndex >= 0 ? currentVideoIndex : 0}
                    totalVideos={sortedVideos.length}
                    hasPrevious={Boolean(previousVideo)}
                    hasNext={Boolean(nextVideo)}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    onOpenDrawer={() => setIsDrawerOpen(true)}
                    onOpenNotes={() => setIsNotesDrawerOpen(true)}
                    isBookmarked={isCurrentVideoBookmarked}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ) : (
                  <VideoNavigation
                    currentVideo={currentVideo}
                    currentIndex={currentVideoIndex >= 0 ? currentVideoIndex : 0}
                    totalVideos={sortedVideos.length}
                    progress={currentVideoProgress}
                    hasPrevious={Boolean(previousVideo)}
                    hasNext={Boolean(nextVideo)}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    isTheaterMode={isTheaterMode}
                    onToggleTheater={() => setIsTheaterMode((prev) => !prev)}
                    isFocusMode={isFocusMode}
                    onToggleFocusMode={() => handleToggleFocusMode(true)}
                    isBookmarked={isCurrentVideoBookmarked}
                    onToggleBookmark={handleToggleBookmark}
                  />
                )}

                {/* Lesson Notes Panel (Normal Mode) */}
                {!isFocusMode && (
                  <NotesPanel
                    courseId={course._id}
                    videoId={currentVideo._id}
                    currentPlaybackSeconds={currentPlaybackSeconds}
                    onSeekTo={handleSeekTo}
                  />
                )}
              </>

            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 p-12 text-center aspect-video">
                <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
                <h3 className="text-base font-bold text-white">
                  No playable videos available
                </h3>
                <p className="mt-1 max-w-sm text-xs text-gray-400">
                  All videos in this playlist are currently private or unavailable on YouTube.
                </p>
              </div>
            )}
          </div>

          {/* Video List Column (Side-by-Side on Desktop when not Theater Mode & not Focus Mode) */}
          {!isFocusMode && (
            <div
              className={
                isTheaterMode
                  ? 'w-full pt-4'
                  : 'lg:col-span-4'
              }
            >
              <LessonList
                courseId={course._id}
                videos={sortedVideos}
                progressMap={localProgressMap}
                bookmarkedVideoIds={bookmarksData?.bookmarkedVideoIds}
                activeVideoId={currentVideo?._id}
                onSelectVideo={handleSelectVideo}
                maxHeightClass={isTheaterMode ? 'max-h-96' : 'lg:max-h-[620px]'}
              />
            </div>
          )}
        </div>
      </section>

      {/* Normal View Course Info & Stats */}
      {!isFocusMode && (
        <>
          <hr className="border-gray-800/80 my-8" />
          <CourseHeader
            course={effectiveCourse || course}
            firstVideo={currentVideo || sortedVideos[0]}
            completedVideos={progressData?.completedVideos}
            totalAvailableVideos={progressData?.totalAvailableVideos}
            courseCompleted={progressData?.courseCompleted}
          />
          <CourseStats course={effectiveCourse || course} />
        </>
      )}

      {/* Focus Mode Compact Syllabus Drawer */}
      {isFocusMode && (
        <FocusSyllabusDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          courseTitle={course.title}
          videos={sortedVideos}
          progressMap={localProgressMap}
          bookmarkedVideoIds={bookmarksData?.bookmarkedVideoIds}
          activeVideoId={currentVideo?._id}
          onSelectVideo={(video) => {
            handleSelectVideo(video);
            setIsDrawerOpen(false);
          }}
        />
      )}

      {/* Focus Mode Notes Drawer */}
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
