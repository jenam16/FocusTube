import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PlaySquare,
  PlusCircle,
  BookOpen,
  Video,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks';
import { courseService } from '../services';
import { CourseCard, ImportPlaylistModal } from '../components';
import { formatDuration } from '../utils';

export const DashboardPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: courseService.getCourses,
  });

  const courses = data?.courses || [];

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
            Your distraction-free YouTube learning command center.
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

      {/* Overview Stats Bar (if courses exist) */}
      {!isLoading && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3.5 rounded-2xl border border-gray-800 bg-gray-900/60 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Total Courses</p>
              <p className="text-xl font-bold text-white">{courses.length}</p>
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
              <p className="text-xs font-medium text-gray-400">Content Duration</p>
              <p className="text-xl font-bold text-white">
                {formatDuration(totalDurationSum)}
              </p>
            </div>
          </div>
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

      {/* Empty State when 0 courses */}
      {!isLoading && courses.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 shadow-inner">
            <PlaySquare className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            No courses yet. Import your first YouTube playlist.
          </h2>
          <p className="mt-2 max-w-sm text-sm text-gray-400">
            Turn any educational playlist into a focused, distraction-free course
            with automated syllabus indexing.
          </p>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="mt-6 flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-500"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Import YouTube Playlist</span>
          </button>
        </div>
      )}

      {/* Courses Grid */}
      {!isLoading && courses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-red-400" />
              <h2 className="text-lg font-bold text-white">Your Courses</h2>
            </div>
            <span className="text-xs text-gray-400">
              {courses.length} {courses.length === 1 ? 'course' : 'courses'} available
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        </div>
      )}

      {/* Import Modal */}
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
