import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { courseService, progressService, bookmarkService } from '../services';
import { VideoItem, VideoProgress, AISummaryData } from '../types';
import {
  YouTubePlayer,
  CourseHeader,
  CourseStats,
  LessonList,
  VideoNavigation,
  LoadingState,
  ErrorState,
  NotesPanel,
  YTPlayerInstance,
  AISummaryDrawer,
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
  const [currentPlaybackSeconds, setCurrentPlaybackSeconds] = useState(0);
  const playerRef = useRef<YTPlayerInstance | null>(null);

  // Fetch course details & syllabus
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.getCourseById(courseId!),
    enabled: !!courseId,
  });

  // Fetch course-level video progress
  const { data: progressData, isLoading: isProgressLoading } = useQuery({
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

  // Declaratively derive the current video:
  // 1. Explicit requested video from search params (?v= or ?video=)
  // 2. Explicit user selection from syllabus click (selectedVideoId)
  // 3. Saved resume target from server progressData (last watched incomplete or next incomplete)
  // 4. Default to first playable video in the playlist
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

    if (progressData?.resumeTarget?.videoId) {
      const resumeVid = sortedVideos.find(
        (v) =>
          (v._id === progressData.resumeTarget!.videoId ||
            v.youtubeVideoId === progressData.resumeTarget!.videoId) &&
          v.isAvailable !== false
      );
      if (resumeVid) return resumeVid;
    }

    // Default to first playable video in the playlist
    return getFirstPlayableVideo(sortedVideos);
  }, [sortedVideos, searchParams, selectedVideoId, progressData?.resumeTarget]);

  // Current video progress
  const currentVideoProgress = currentVideo
    ? localProgressMap[currentVideo._id]
    : undefined;

  // Calculate resume start seconds: skip if <= 2s, >= duration - 5s, or already completed
  const initialSeconds = useMemo(() => {
    if (!currentVideo) return 0;
    const prog = localProgressMap[currentVideo._id];
    if (prog) {
      if (prog.completed) return 0;
      const watched = prog.watchedSeconds || 0;
      const duration =
        prog.durationSeconds || currentVideo.durationSeconds || 0;
      if (watched <= 2) return 0;
      if (duration > 0 && watched >= duration - 5) return 0;
      return Math.floor(watched);
    }
    if (
      progressData?.resumeTarget &&
      (progressData.resumeTarget.videoId === currentVideo._id ||
        progressData.resumeTarget.videoId === currentVideo.youtubeVideoId) &&
      !progressData.resumeTarget.completed
    ) {
      const watched = progressData.resumeTarget.watchedSeconds || 0;
      const duration =
        progressData.resumeTarget.durationSeconds ||
        currentVideo.durationSeconds ||
        0;
      if (watched <= 2) return 0;
      if (duration > 0 && watched >= duration - 5) return 0;
      return Math.floor(watched);
    }
    return 0;
  }, [currentVideo, localProgressMap, progressData?.resumeTarget]);

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

  // AI Summary State
  const [isSummaryDrawerOpen, setIsSummaryDrawerOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [activeSummary, setActiveSummary] = useState<AISummaryData | null>(null);

  // Sync active summary when switching lessons
  useEffect(() => {
    setActiveSummary(currentVideo?.aiSummary || null);
    setSummaryError(null);
  }, [currentVideo?._id, currentVideo?.aiSummary]);

  const hasExistingSummary = Boolean(
    activeSummary?.summary || currentVideo?.aiSummary?.summary
  );

  const handleOpenSummary = async () => {
    if (!currentVideo || !course) return;

    // If summary is already loaded or in currentVideo, open drawer directly (no network request!)
    if (activeSummary?.summary || currentVideo.aiSummary?.summary) {
      if (!activeSummary && currentVideo.aiSummary) {
        setActiveSummary(currentVideo.aiSummary);
      }
      setIsSummaryDrawerOpen(true);
      return;
    }

    try {
      setIsGeneratingSummary(true);
      setSummaryError(null);
      setIsSummaryDrawerOpen(true);

      const res = await courseService.getVideoSummary(course._id, currentVideo._id);
      setActiveSummary(res.summary);

      // Update TanStack Query cache for the course so the video entity retains the summary
      queryClient.setQueryData(['course', courseId], (oldData: any) => {
        if (!oldData || !oldData.videos) return oldData;
        return {
          ...oldData,
          videos: oldData.videos.map((v: any) =>
            v._id === currentVideo._id ? { ...v, aiSummary: res.summary } : v
          ),
        };
      });
    } catch (err: any) {
      console.error('Failed to get video summary:', err);
      const msg = err?.message || 'Unable to generate summary. Please try again.';
      setSummaryError(msg);
    } finally {
      setIsGeneratingSummary(false);
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

  // Handle video playback state change (e.g. video paused or ended)
  const handlePlayerStateChange = useCallback(
    (event: { data?: number }) => {
      const YT = window.YT;
      if (YT && event.data === YT.PlayerState.PAUSED) {
        flushProgress();
      } else if (YT && event.data === YT.PlayerState.ENDED) {
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

  // Flush on unmount or tab switch / window leave
  useEffect(() => {
    const handleVisibilityOrPageHide = () => {
      if (document.visibilityState === 'hidden') {
        flushProgress();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityOrPageHide);
    window.addEventListener('pagehide', handleVisibilityOrPageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrPageHide);
      window.removeEventListener('pagehide', handleVisibilityOrPageHide);
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

  const requestedVideoId =
    searchParams.get('v') || searchParams.get('video') || selectedVideoId;
  const isResolvingInitialVideo = !requestedVideoId && isProgressLoading;

  if (isLoading || isResolvingInitialVideo) {
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
    <div className="space-y-8">
      {/* Top Breadcrumb Navigation */}
      <div>
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Courses</span>
        </Link>
      </div>

      {/* PHASE 4 & 7: VIDEO PLAYER + SYLLABUS SECTION */}
      <section
        aria-label="Video Player and Syllabus"
        className="space-y-6"
      >
        <div
          className={`grid grid-cols-1 gap-6 ${
            isTheaterMode
              ? 'grid-cols-1'
              : 'lg:grid-cols-12 lg:items-start'
          }`}
        >
          {/* Player Column */}
          <div
            className={`space-y-4 ${
              isTheaterMode ? 'w-full' : 'lg:col-span-8'
            }`}
          >
            {hasAnyPlayableVideos && currentVideo ? (
              <>
                {/* Official YouTube IFrame Player */}
                <YouTubePlayer
                  key={currentVideo._id}
                  videoId={currentVideo.youtubeVideoId}
                  title={currentVideo.title}
                  initialSeconds={initialSeconds}
                  isTheaterMode={isTheaterMode}
                  onToggleTheater={() => setIsTheaterMode((prev) => !prev)}
                  onReady={(player) => {
                    playerRef.current = player;
                  }}
                  onProgress={handleProgress}
                  onStateChange={handlePlayerStateChange}
                />

                {/* Player Navigation and Controls */}
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
                  isBookmarked={isCurrentVideoBookmarked}
                  onToggleBookmark={handleToggleBookmark}
                  onOpenSummary={handleOpenSummary}
                  isGeneratingSummary={isGeneratingSummary}
                  hasExistingSummary={hasExistingSummary}
                />

                {/* Lesson Notes Panel */}
                <NotesPanel
                  courseId={course._id}
                  videoId={currentVideo._id}
                  currentPlaybackSeconds={currentPlaybackSeconds}
                  onSeekTo={handleSeekTo}
                />
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

          {/* Video List Column (Side-by-Side on Desktop when not Theater Mode) */}
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
        </div>
      </section>

      {/* Normal View Course Info & Stats */}
      <hr className="border-gray-800/80 my-8" />
      <CourseHeader
        course={effectiveCourse || course}
        firstVideo={currentVideo || sortedVideos[0]}
        completedVideos={progressData?.completedVideos}
        totalAvailableVideos={progressData?.totalAvailableVideos}
        courseCompleted={progressData?.courseCompleted}
      />
      <CourseStats course={effectiveCourse || course} />

      {/* AI Study Summary Slide-over Drawer */}
      {currentVideo && (
        <AISummaryDrawer
          isOpen={isSummaryDrawerOpen}
          onClose={() => setIsSummaryDrawerOpen(false)}
          videoTitle={currentVideo.title}
          summaryData={activeSummary || currentVideo.aiSummary || null}
          isLoading={isGeneratingSummary}
          error={summaryError}
          onSeekTo={handleSeekTo}
          onRetry={handleOpenSummary}
        />
      )}
    </div>
  );
};
