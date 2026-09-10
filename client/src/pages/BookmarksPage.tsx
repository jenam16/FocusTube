import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bookmark,
  Play,
  Trash2,
  AlertCircle,
  PlaySquare,
} from 'lucide-react';
import { bookmarkService } from '../services';
import { LoadingState, EmptyState, ErrorState } from '../components';
import { formatVideoDuration } from '../utils';

export const BookmarksPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarkService.getBookmarks,
  });

  const bookmarks = data?.bookmarks || [];

  const removeMutation = useMutation({
    mutationFn: (videoId: string) => bookmarkService.removeBookmark(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['course-bookmarks'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Bookmark className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Bookmarked Videos
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Quick access to your saved lessons and key learning moments.
            </p>
          </div>
        </div>
      </div>

      {isLoading && <LoadingState type="grid" count={3} />}

      {!isLoading && error && (
        <ErrorState
          title="Unable to load bookmarks"
          message="Could not retrieve your bookmarks at this time. Please check your connection."
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      )}

      {!isLoading && !error && bookmarks.length === 0 && (
        <EmptyState
          title="No bookmarks yet"
          description="Bookmark important video lessons while learning to find and review them easily here."
          actionLabel="Go to Courses"
          onAction={() => navigate('/courses')}
        />
      )}

      {!isLoading && !error && bookmarks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((b) => {
            const isAvailable = b.video.isAvailable !== false;

            return (
              <div
                key={b._id}
                className="group flex flex-col justify-between rounded-2xl border border-gray-800 bg-gray-900/40 p-4 transition-all hover:border-gray-700 hover:bg-gray-900/60"
              >
                <div className="space-y-3">
                  {/* Thumbnail and Course info */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
                    {b.course.thumbnail ? (
                      <img
                        src={b.course.thumbnail}
                        alt={b.video.title}
                        className={`h-full w-full object-cover transition-transform duration-200 ${
                          isAvailable ? 'group-hover:scale-105' : 'grayscale'
                        }`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-600">
                        <PlaySquare className="h-8 w-8" />
                      </div>
                    )}

                    {b.video.durationSeconds > 0 && (
                      <div className="absolute bottom-2 right-2 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                        {formatVideoDuration(b.video.durationSeconds)}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-red-400 line-clamp-1">
                      {b.course.title}
                    </span>
                    <h3
                      className={`mt-0.5 text-sm font-semibold line-clamp-2 ${
                        isAvailable ? 'text-white' : 'text-gray-500 line-through'
                      }`}
                    >
                      {b.video.title}
                    </h3>
                  </div>

                  {!isAvailable && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Video unavailable on YouTube</span>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-800/80 pt-3">
                  {isAvailable ? (
                    <Link
                      to={`/watch/${b.course._id}/${b.video._id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-600/20 hover:bg-red-500 transition-colors"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Watch Lesson</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-500">Unavailable</span>
                  )}

                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(b.video._id)}
                    className="inline-flex items-center gap-1 rounded-lg p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
                    aria-label="Remove bookmark"
                    title="Remove bookmark"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
