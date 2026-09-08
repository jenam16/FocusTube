import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, PlusCircle, Search } from 'lucide-react';
import { courseService } from '../services';
import { CourseCard, ImportPlaylistModal } from '../components';

export const CoursesPage = () => {
  const queryClient = useQueryClient();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery({
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
      {courses.length > 0 && (
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
      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-gray-800 bg-gray-900/40"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && courses.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500">
            <BookOpen className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold text-white">No courses imported yet</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-400">
            Paste any YouTube playlist link to convert it into a structured course with lessons.
          </p>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="mt-6 flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-600/25 hover:bg-red-500"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Import First Playlist</span>
          </button>
        </div>
      )}

      {/* Filtered empty state */}
      {!isLoading && courses.length > 0 && filteredCourses.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">
          No courses matching &quot;{searchTerm}&quot;
        </div>
      )}

      {/* Grid */}
      {!isLoading && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      )}

      {/* Modal */}
      <ImportPlaylistModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['courses'] });
        }}
      />
    </div>
  );
};
