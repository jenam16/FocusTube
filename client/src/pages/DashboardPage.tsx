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
import {
  formatDuration,
  formatLessonNumber,
  formatVideoTime,
  formatTimeAgo,
} from '../utils';

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
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-heading">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Continue your distraction-free learning and stay on track.
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-600/30 active:scale-[0.98]"
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
          title="Start your learning journey"
          description="Import a YouTube playlist to create your first structured course with zero distractions."
          actionLabel="Import Playlist"
          onAction={() => setIsImportModalOpen(true)}
        />
      )}

      {/* Active Dashboard with Real Course Data */}
      {!isLoading && !error && courseCount > 0 && (
        <>
          {/* Actual Stats Bar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#0B101E]/90 p-5 shadow-xs transition-all hover:border-indigo-500/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-xs">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">My Courses</p>
                <p className="text-2xl font-bold tracking-tight text-white font-heading">{courseCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#0B101E]/90 p-5 shadow-xs transition-all hover:border-teal-500/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-xs">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Lessons</p>
                <p className="text-2xl font-bold tracking-tight text-white font-heading">{totalVideosCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#0B101E]/90 p-5 shadow-xs transition-all hover:border-amber-500/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-xs">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Content</p>
                <p className="text-2xl font-bold tracking-tight text-white font-heading">
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
                  <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/25 via-[#111827]/90 to-slate-900/60 p-5 sm:p-6 backdrop-blur-md shadow-lg">
                    <div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <Link
                        to={`/courses/${recent.course._id}`}
                        className="group/thumb relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-slate-950 sm:w-72 lg:w-80 shadow-md block"
                      >
                        {recent.course.thumbnail || recent.video.thumbnail ? (
                          <img
                            src={recent.course.thumbnail || recent.video.thumbnail}
                            alt={recent.course.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-600">
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
                          <span className="text-xs text-slate-400 font-medium">
                            All lessons completed 🎉
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-400 truncate">
                            Congratulations!
                          </p>
                          <Link
                            to={`/courses/${recent.course._id}`}
                            className="mt-1 block focus:outline-none"
                          >
                            <h3 className="line-clamp-2 text-base sm:text-lg font-bold text-white hover:text-emerald-400 transition-colors font-heading">
                              {recent.course.title}
                            </h3>
                          </Link>
                        </div>

                        <div className="space-y-1.5 max-w-md">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="text-emerald-400 font-semibold">100% Course Completed</span>
                            <span>{recent.course.totalVideos} of {recent.course.totalVideos} lessons</span>
                          </div>
                          <ProgressBar progress={100} size="sm" color="emerald" />
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center pt-2 sm:pt-0">
                        <Link
                          to={`/courses/${recent.course._id}`}
                          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500"
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
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0D1527] via-[#090E1A] to-[#0B1020] p-6 shadow-xl backdrop-blur-md transition-all hover:border-indigo-500/25">
                  <div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
                    {/* Thumbnail */}
                    <Link
                      to={`/watch/${recent.course._id}/${targetVideo._id}`}
                      className="group/thumb relative aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-slate-950 sm:w-72 lg:w-80 shadow-md block"
                    >
                      {targetVideo.thumbnail || recent.course.thumbnail ? (
                        <img
                          src={targetVideo.thumbnail || recent.course.thumbnail}
                          alt={targetVideo.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-600">
                          <Play className="h-10 w-10" />
                        </div>
                      )}
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/40">
                          <Play className="h-5 w-5 fill-current ml-0.5" />
                        </div>
                      </div>
                      {/* Bottom progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
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
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/25">
                            <Play className="h-3 w-3 fill-current" />
                            Continue Learning
                          </span>
                        )}
                        {recent.lastWatchedAt && (
                          <span className="text-xs text-slate-400">
                            Last active {formatTimeAgo(recent.lastWatchedAt)}
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-400 truncate">
                          {recent.course.title}
                        </p>
                        <Link
                          to={`/watch/${recent.course._id}/${targetVideo._id}`}
                          className="mt-1 block focus:outline-none"
                        >
                          <h3 className="line-clamp-2 text-base sm:text-lg font-bold text-white hover:text-indigo-300 transition-colors font-heading">
                            {formatLessonNumber(targetVideo.position)} — {targetVideo.title}
                          </h3>
                        </Link>
                      </div>

                      <div className="space-y-1.5 max-w-md">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            {isAdvancingToNext
                              ? 'Next Lesson Ready'
                              : `${recent.progressPercentage}% watched`}
                          </span>
                          {!isAdvancingToNext && recent.durationSeconds > 0 && (
                            <span className="font-mono text-[11px] text-slate-400">
                              {formatVideoTime(recent.watchedSeconds)} /{' '}
                              {formatVideoTime(recent.durationSeconds)}
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
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:opacity-95 hover:shadow-indigo-600/40 active:scale-[0.98]"
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

          {/* Dashboard Course Preview Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <h2 className="text-lg font-bold text-white font-heading">Your Courses</h2>
              </div>
              <Link
                to="/courses"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
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

          {/* Daily Learning Tasks & Bookmarked Videos Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Daily Learning Tasks (7 cols) */}
            <div className="lg:col-span-7">
              <DailyTaskList compact />
            </div>

            {/* Bookmarks Preview Widget (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-white/[0.07] bg-[#0B101E]/90 p-5 space-y-4 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white font-heading">Bookmarked Lessons</h3>
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
                <div className="rounded-xl border border-dashed border-white/[0.08] p-6 text-center text-xs text-slate-400">
                  No bookmarked lessons yet. Bookmark key videos while learning to find them quickly!
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06] max-h-56 overflow-y-auto">
                  {bookmarks.slice(0, 4).map((b) => (
                    <Link
                      key={b._id}
                      to={`/watch/${b.course._id}/${b.video._id}`}
                      className="flex items-center justify-between gap-3 py-2.5 px-2 hover:bg-white/[0.04] rounded-xl group transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] text-slate-400 block truncate">
                          {b.course.title}
                        </span>
                        <h4 className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                          {b.video.title}
                        </h4>
                      </div>
                      <Play className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 fill-current transition-colors" />
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
