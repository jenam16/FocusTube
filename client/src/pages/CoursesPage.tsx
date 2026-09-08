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

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getCourses,
  });

  const courses = data?.courses || [];

  const filteredCourses = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.channelName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            My Courses
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            All your structured YouTube learning courses in one place.
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

      {/* Search Bar (if courses exist) */}
      {!isLoading && !error && courses.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses by title or channel..."
            className="w-full rounded-xl border border-gray-800 bg-gray-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
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
          title="No courses yet"
          description="Import a YouTube playlist to start learning."
          actionLabel="Import Playlist"
          onAction={() => setIsImportModalOpen(true)}
        />
      )}

      {/* Filtered empty state */}
      {!isLoading && !error && courses.length > 0 && filteredCourses.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">
          No courses matching &quot;{searchTerm}&quot;
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
