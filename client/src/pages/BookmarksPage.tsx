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
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Bookmark className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-heading">
              Bookmarked Lessons
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
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
          isRefetching={isRefetching}
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
                className="group flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#0B101E] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-950/30"
              >
                <div className="space-y-3">
                  {/* Thumbnail and Course info */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#070B14]">
                    {b.course.thumbnail ? (
                      <img
                        src={b.course.thumbnail}
                        alt={b.video.title}
                        className={`h-full w-full object-cover transition-transform duration-300 ${
                          isAvailable ? 'group-hover:scale-105' : 'grayscale'
                        }`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-600">
                        <PlaySquare className="h-8 w-8" />
                      </div>
                    )}

                    {b.video.durationSeconds > 0 && (
                      <div className="absolute bottom-2 right-2 rounded-lg bg-black/85 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-md border border-white/10 font-mono">
                        {formatVideoDuration(b.video.durationSeconds)}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-indigo-400 line-clamp-1">
                      {b.course.title}
                    </span>
                    <h3
                      className={`mt-0.5 text-sm font-semibold line-clamp-2 font-heading tracking-tight ${
                        isAvailable ? 'text-white' : 'text-slate-500 line-through'
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
                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                  {isAvailable ? (
                    <Link
                      to={`/watch/${b.course._id}/${b.video._id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Watch Lesson</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-500">Unavailable</span>
                  )}

                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(b.video._id)}
                    className="inline-flex items-center gap-1 rounded-xl p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
