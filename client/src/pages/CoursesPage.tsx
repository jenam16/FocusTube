import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Search } from 'lucide-react';
import { courseService } from '../services';
import {
  CourseGrid,
  ImportCourseModal,
  EmptyState,
  LoadingState,
  ErrorState,
} from '../components';

export const CoursesPage = () => {
  const queryClient = useQueryClient();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getCourses,
  });

  const courses = data?.courses || [];

  const completedCount = courses.filter((c) => (c.progressPercentage || 0) >= 100).length;
  const inProgressCount = courses.length - completedCount;

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.channelName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const isCompleted = (c.progressPercentage || 0) >= 100;
    if (statusFilter === 'completed') return isCompleted;
    if (statusFilter === 'in-progress') return !isCompleted;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-heading">
            My Courses
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Manage your learning courses and track progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsImportModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-600/30 active:scale-[0.98]"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Import Playlist</span>
        </button>
      </div>

      {/* Search & Filter Controls Bar */}
      {!isLoading && !error && courses.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search courses by title or channel..."
              className="w-full rounded-xl border border-white/[0.08] bg-[#111827] py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#111827] border border-white/[0.08] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              All ({courses.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in-progress')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === 'in-progress'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === 'completed'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && <LoadingState type="grid" count={4} />}

      {/* Error State */}
      {!isLoading && error && (
        <ErrorState
          title="Unable to load your courses"
          message="Failed to retrieve your courses. Please check your network and try again."
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && courses.length === 0 && (
        <EmptyState
          title="Start your learning journey"
          description="Import a YouTube playlist to create your first course with structured lessons and progress tracking."
          actionLabel="Import Playlist"
          onAction={() => setIsImportModalOpen(true)}
        />
      )}

      {/* Filtered empty state */}
      {!isLoading && !error && courses.length > 0 && filteredCourses.length === 0 && (
        <div className="py-16 text-center text-sm text-slate-400 rounded-2xl border border-dashed border-white/[0.08] bg-[#111827]/40">
          No courses matching &quot;{searchTerm}&quot; in this filter.
        </div>
      )}

      {/* Course Grid */}
      {!isLoading && !error && filteredCourses.length > 0 && (
        <CourseGrid courses={filteredCourses} />
      )}

      {/* Reusable Import Modal */}
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
