import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  CheckCircle2,
  BookOpen,
  Flame,
  ListTodo,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { analyticsService } from '../services';
import { LoadingState, ErrorState, ProgressBar } from '../components';

export const AnalyticsPage: React.FC = () => {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsService.getAnalytics,
  });

  const stats = data?.data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl font-heading">
              Learning Analytics
            </h1>
            <p className="text-xs sm:text-sm text-secondary">
              Deterministic progress insights, completed lessons, streaks, and tasks.
            </p>
          </div>
        </div>
      </div>

      {isLoading && <LoadingState type="grid" count={4} />}

      {!isLoading && error && (
        <ErrorState
          title="Unable to load analytics"
          message="Could not retrieve your learning metrics at this time."
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      )}

      {!isLoading && !error && stats && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Completed Videos */}
            <div className="rounded-2xl border border-app bg-surface p-5 space-y-2 shadow-sm hover:border-indigo-500/30 transition-all duration-200">
              <div className="flex items-center justify-between text-secondary">
                <span className="text-xs font-semibold">Completed Lessons</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-primary font-heading tracking-tight">
                {stats.completedVideos}
              </div>
              <p className="text-[11px] text-muted">
                Videos watched ≥ 90% or completed
              </p>
            </div>

            {/* Completed Courses */}
            <div className="rounded-2xl border border-app bg-surface p-5 space-y-2 shadow-sm hover:border-indigo-500/30 transition-all duration-200">
              <div className="flex items-center justify-between text-secondary">
                <span className="text-xs font-semibold">Completed Courses</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-primary font-heading tracking-tight">
                {stats.completedCourses} / {stats.totalCourses}
              </div>
              <p className="text-[11px] text-muted">
                Courses where all lessons are done
              </p>
            </div>

            {/* Learning Streak */}
            <div className="rounded-2xl border border-app bg-surface p-5 space-y-2 shadow-sm hover:border-indigo-500/30 transition-all duration-200">
              <div className="flex items-center justify-between text-secondary">
                <span className="text-xs font-semibold">Current Streak</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Flame className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-primary font-heading tracking-tight">
                {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
              </div>
              <p className="text-[11px] text-muted">
                Best streak: {stats.longestStreak} {stats.longestStreak === 1 ? 'day' : 'days'}
              </p>
            </div>

            {/* Daily Tasks Completion Rate */}
            <div className="rounded-2xl border border-app bg-surface p-5 space-y-2 shadow-sm hover:border-indigo-500/30 transition-all duration-200">
              <div className="flex items-center justify-between text-secondary">
                <span className="text-xs font-semibold">Tasks Completed</span>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500 border border-teal-500/20">
                  <ListTodo className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-primary font-heading tracking-tight">
                {stats.tasks.completed} / {stats.tasks.total}
              </div>
              <div className="pt-1">
                <ProgressBar progress={stats.tasks.completionRate} size="sm" />
              </div>
            </div>
          </div>

          {/* Deterministic Learning Insights */}
          <div className="rounded-2xl border border-app bg-surface p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-primary font-heading">Learning Insights</h3>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {stats.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-app bg-secondary p-3 text-xs text-primary leading-relaxed flex items-start gap-2.5"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[11px] font-bold text-indigo-500 border border-indigo-500/20">
                    {idx + 1}
                  </span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Completion Breakdown (Past 7 Days) */}
          <div className="rounded-2xl border border-app bg-surface p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-primary font-heading">
                Activity in the Last 7 Days
              </h3>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center">
              {stats.weeklyActivity.map((day) => {
                const totalActions = day.videosCompleted + day.tasksCompleted;
                const hasActivity = totalActions > 0;

                return (
                  <div
                    key={day.date}
                    className={`flex flex-col items-center justify-between rounded-xl border p-2.5 space-y-2 transition-all ${
                      hasActivity
                        ? 'border-indigo-500/40 bg-indigo-500/10 shadow-xs'
                        : 'border-app bg-secondary'
                    }`}
                  >
                    <span className="text-[11px] font-semibold text-secondary">
                      {day.label}
                    </span>

                    <div className="flex flex-col items-center">
                      <span
                        className={`text-lg font-bold font-heading ${
                          hasActivity ? 'text-primary' : 'text-muted'
                        }`}
                      >
                        {totalActions}
                      </span>
                      <span className="text-[9px] text-muted">actions</span>
                    </div>

                    <div className="text-[9px] text-secondary space-y-0.5">
                      <div>{day.videosCompleted}v</div>
                      <div>{day.tasksCompleted}t</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Course Completion Breakdown */}
          {stats.courseStats.length > 0 && (
            <div className="rounded-2xl border border-app bg-surface p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-primary font-heading">
                  Course Completion Status
                </h3>
              </div>

              <div className="divide-y divide-subtle rounded-xl border border-app bg-secondary">
                {stats.courseStats.map((cs) => (
                  <div
                    key={cs.courseId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-primary truncate">
                        {cs.title}
                      </h4>
                      <span className="text-[11px] text-secondary">
                        {cs.completedVideos} / {cs.totalAvailableVideos} lessons completed
                      </span>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-48 shrink-0">
                      <div className="flex-1">
                        <ProgressBar progress={cs.completionPercentage} size="sm" />
                      </div>
                      <span className="text-xs font-semibold text-secondary w-10 text-right">
                        {cs.completionPercentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
