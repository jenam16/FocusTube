import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  PlusCircle,
  Video,
  Clock,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import { useAuth } from '../hooks';
import {
  courseService,
  progressService,
  bookmarkService,
  analyticsService,
} from '../services';
import {
  CourseCard,
  ImportCourseModal,
  EmptyState,
  LoadingState,
  ErrorState,
  ProgressBar,
  CompletedBadge,
  DailyTaskList,
  StreakBadge,
} from '../components';
import { formatDuration, formatLessonNumber, formatVideoDuration, formatTimeAgo } from '../utils';

export const DashboardPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getCourses,
  });

  const { data: recentData } = useQuery({
    queryKey: ['recent-progress'],
    queryFn: progressService.getRecentProgress,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsService.getAnalytics,
  });

  const { data: bookmarksData } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarkService.getBookmarks,
  });

  const recent = recentData?.recent;
  const courses = data?.courses || [];
  const bookmarks = bookmarksData?.bookmarks || [];
  const analytics = analyticsData?.data;


  const courseCount = courses.length;

  const totalVideosCount = courses.reduce(
    (acc, c) => acc + (c.totalVideos || 0),
    0
  );
  const totalDurationSum = courses.reduce(
    (acc, c) => acc + (c.totalDurationSeconds || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Header Greeting & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome to FocusTube{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Distraction-free YouTube learning command center.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {analytics && (
            <StreakBadge
              currentStreak={analytics.currentStreak}
              longestStreak={analytics.longestStreak}
              size="md"
            />
          )}

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-500 hover:shadow-red-600/35"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Import Playlist</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingState type="grid" count={3} />}

      {/* Error State */}
      {!isLoading && error && (
        <ErrorState
          title="Unable to load your dashboard"
          message="Could not retrieve your courses at this moment. Please check your connection."
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      )}

      {/* Empty State when 0 courses */}
      {!isLoading && !error && courseCount === 0 && (
        <EmptyState
          title="No courses yet"
          description="Import your first YouTube playlist and start learning."
          actionLabel="Import Playlist"
          onAction={() => setIsImportModalOpen(true)}
        />
      )}

      {/* Active Dashboard with Real Course Data */}
      {!isLoading && !error && courseCount > 0 && (
        <>
          {/* Actual Stats Bar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3.5 rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">My Courses</p>
                <p className="text-xl font-bold text-white">{courseCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Total Lessons</p>
                <p className="text-xl font-bold text-white">{totalVideosCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">Total Content</p>
                <p className="text-xl font-bold text-white">
                  {formatDuration(totalDurationSum)}
                </p>
              </div>
            </div>
          </div>

          {/* Continue Learning Card */}
          {recent && recent.course && (
            (() => {
              const isRecentCompleted = Boolean(recent.completed);
              const courseCompleted = Boolean(recentData?.courseCompleted);
              const targetVideo =
                isRecentCompleted && recentData?.targetVideo && !courseCompleted
                  ? recentData.targetVideo
                  : recent.video;
              const isAdvancingToNext = Boolean(
                isRecentCompleted && recentData?.nextVideo && !courseCompleted
              );

              if (courseCompleted) {
                return (
                  <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/25 via-gray-900/80 to-gray-900/40 p-5 sm:p-6 backdrop-blur-md shadow-xl">
                    <div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <Link
                        to={`/courses/${recent.course._id}`}
                        className="group/thumb relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-gray-800 bg-gray-950 sm:w-72 lg:w-80 shadow-md block"
                      >
                        {recent.course.thumbnail || recent.video.thumbnail ? (
                          <img
                            src={recent.course.thumbnail || recent.video.thumbnail}
                            alt={recent.course.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-600">
                            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                          </div>
                        )}
                        <div className="absolute top-2.5 left-2.5">
                          <CompletedBadge size="xs" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-emerald-500" />
                      </Link>

                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <CompletedBadge size="sm" />
                          <span className="text-xs text-gray-400 font-medium">
                            All lessons completed 🎉
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-400 truncate">
                            Congratulations!
                          </p>
                          <Link
                            to={`/courses/${recent.course._id}`}
                            className="mt-1 block focus:outline-none"
                          >
                            <h3 className="line-clamp-2 text-base sm:text-lg font-bold text-white hover:text-emerald-400 transition-colors">
                              {recent.course.title}
                            </h3>
                          </Link>
                        </div>

                        <div className="space-y-1.5 max-w-md">
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span className="text-emerald-400 font-semibold">100% Course Completed</span>
                            <span>{recent.course.totalVideos} of {recent.course.totalVideos} lessons</span>
                          </div>
                          <ProgressBar progress={100} size="sm" />
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center pt-2 sm:pt-0">
                        <Link
                          to={`/courses/${recent.course._id}`}
                          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-500 hover:shadow-emerald-600/45"
                        >
                          <span>Review Course</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }

              if (!targetVideo) return null;

              return (
                <div className="overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/20 via-gray-900/80 to-gray-900/40 p-5 sm:p-6 backdrop-blur-md shadow-xl">
                  <div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
                    {/* Thumbnail */}
                    <Link
                      to={`/watch/${recent.course._id}/${targetVideo._id}`}
                      className="group/thumb relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-gray-800 bg-gray-950 sm:w-72 lg:w-80 shadow-md block"
                    >
                      {targetVideo.thumbnail || recent.course.thumbnail ? (
                        <img
                          src={targetVideo.thumbnail || recent.course.thumbnail}
                          alt={targetVideo.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-600">
                          <Play className="h-10 w-10" />
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/50">
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        </div>
                      </div>
                      {/* Bottom progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800">
                        <div
                          className="h-full bg-red-600 transition-all duration-300"
                          style={{
                            width: `${
                              isAdvancingToNext
                                ? 0
                                : Math.min(100, Math.max(0, recent.progressPercentage))
                            }%`,
                          }}
                        />
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {isAdvancingToNext ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Lesson Completed — Up Next
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400 border border-red-500/20">
                            <Play className="h-3 w-3 fill-current" />
                            Continue Learning
                          </span>
                        )}
                        {recent.lastWatchedAt && (
                          <span className="text-xs text-gray-500">
                            Last active {formatTimeAgo(recent.lastWatchedAt)}
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-400 truncate">
                          {recent.course.title}
                        </p>
                        <Link
                          to={`/watch/${recent.course._id}/${targetVideo._id}`}
                          className="mt-1 block focus:outline-none"
                        >
                          <h3 className="line-clamp-2 text-base sm:text-lg font-bold text-white hover:text-red-400 transition-colors">
                            {formatLessonNumber(targetVideo.position)} — {targetVideo.title}
                          </h3>
                        </Link>
                      </div>

                      <div className="space-y-1.5 max-w-md">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>
                            {isAdvancingToNext
                              ? 'Next Lesson Ready'
                              : `${recent.progressPercentage}% watched`}
                          </span>
                          {!isAdvancingToNext && recent.durationSeconds > 0 && (
                            <span>
                              {formatVideoDuration(recent.watchedSeconds)} /{' '}
                              {formatVideoDuration(recent.durationSeconds)}
                            </span>
                          )}
                        </div>
                        <ProgressBar
                          progress={isAdvancingToNext ? 0 : recent.progressPercentage}
                          size="sm"
                        />
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="shrink-0 flex items-center pt-2 sm:pt-0">
                      <Link
                        to={`/watch/${recent.course._id}/${targetVideo._id}`}
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-500 hover:shadow-red-600/45"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        <span>{isAdvancingToNext ? 'Start Next Lesson' : 'Resume Lesson'}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()
          )}

          {/* Dashboard Course Preview Section (Section 16) */}
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-red-400" />
                <h2 className="text-lg font-bold text-white">Your Courses</h2>
              </div>
              <Link
                to="/courses"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
              >
                <span>View all courses</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Display up to 3 preview course cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.slice(0, 3).map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          </div>

          {/* Phase 8 & 10: Daily Learning Tasks & Bookmarked Videos Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Daily Learning Tasks (7 cols) */}
            <div className="lg:col-span-7">
              <DailyTaskList compact />
            </div>

            {/* Bookmarks Preview Widget (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-gray-800 bg-gray-900/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Bookmarked Lessons</h3>
                </div>
                <Link
                  to="/bookmarks"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <span>View all</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {bookmarks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-800/80 p-6 text-center text-xs text-gray-500">
                  No bookmarked lessons yet. Bookmark key videos while learning to find them quickly!
                </div>
              ) : (
                <div className="divide-y divide-gray-800/60 max-h-56 overflow-y-auto">
                  {bookmarks.slice(0, 4).map((b) => (
                    <Link
                      key={b._id}
                      to={`/watch/${b.course._id}/${b.video._id}`}
                      className="flex items-center justify-between gap-3 py-2.5 px-1 hover:bg-gray-800/30 rounded-lg group transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] text-gray-400 block truncate">
                          {b.course.title}
                        </span>
                        <h4 className="text-xs font-medium text-gray-200 group-hover:text-white truncate">
                          {b.video.title}
                        </h4>
                      </div>
                      <Play className="h-3.5 w-3.5 text-gray-500 group-hover:text-red-400 shrink-0 fill-current transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Shared Reusable Import Course Modal */}
      <ImportCourseModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['courses'] });
        }}
      />
    </div>
  );
};
