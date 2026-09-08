import { useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { courseService } from '../services';
import { VideoItem } from '../types';
import {
  YouTubePlayer,
  CourseHeader,
  CourseStats,
  LessonList,
  VideoNavigation,
  LoadingState,
  ErrorState,
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

  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
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

  // Handle user explicitly selecting a video
  const handleSelectVideo = (video: VideoItem) => {
    if (video.isAvailable === false) {
      // Unavailable video clicked: do not attempt playback, keep current playable video
      return;
    }
    setSelectedVideoId(video._id);
    setSearchParams({ v: video._id }, { replace: true });
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

      {/* PHASE 4: VIDEO PLAYER + SYLLABUS SECTION */}
      <section aria-label="Video Player and Syllabus" className="space-y-6">
        {/* Layout: Theater Mode (Full Width) vs Default (2-Column on Desktop) */}
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
                  isTheaterMode={isTheaterMode}
                  onToggleTheater={() => setIsTheaterMode((prev) => !prev)}
                />

                {/* Player Navigation and Current Video Info */}
                <VideoNavigation
                  currentVideo={currentVideo}
                  currentIndex={currentVideoIndex >= 0 ? currentVideoIndex : 0}
                  totalVideos={sortedVideos.length}
                  hasPrevious={Boolean(previousVideo)}
                  hasNext={Boolean(nextVideo)}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  isTheaterMode={isTheaterMode}
                  onToggleTheater={() => setIsTheaterMode((prev) => !prev)}
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
              activeVideoId={currentVideo?._id}
              onSelectVideo={handleSelectVideo}
              maxHeightClass={isTheaterMode ? 'max-h-96' : 'lg:max-h-[620px]'}
            />
          </div>
        </div>
      </section>

      <hr className="border-gray-800/80 my-8" />

      {/* Course Header Banner & Progress */}
      <CourseHeader course={course} firstVideo={currentVideo || sortedVideos[0]} />

      {/* Course Statistics */}
      <CourseStats course={course} />
    </div>
  );
};
