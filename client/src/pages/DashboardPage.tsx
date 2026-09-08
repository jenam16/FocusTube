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
} from 'lucide-react';
import { useAuth } from '../hooks';
import { courseService } from '../services';
import {
  CourseCard,
  ImportCourseModal,
  EmptyState,
  LoadingState,
  ErrorState,
} from '../components';
import { formatDuration } from '../utils';

export const DashboardPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getCourses,
  });

  const courses = data?.courses || [];
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

        <button
          type="button"
          onClick={() => setIsImportModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-500 hover:shadow-red-600/35"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Import Playlist</span>
        </button>
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
