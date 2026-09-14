interface LoadingStateProps {
  type?: 'grid' | 'details';
  count?: number;
}

export const LoadingState = ({
  type = 'grid',
  count = 4,
}: LoadingStateProps) => {
  if (type === 'details') {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Back Link Skeleton */}
        <div className="h-6 w-28 rounded-lg bg-slate-800/70" />

        {/* Hero Banner Skeleton */}
        <div className="flex flex-col gap-6 rounded-2xl border border-white/[0.06] bg-[#111827]/60 p-6 sm:p-8 md:flex-row">
          <div className="aspect-video w-full md:w-80 rounded-xl bg-slate-800/80" />
          <div className="flex-1 space-y-4">
            <div className="h-4 w-32 rounded bg-slate-800" />
            <div className="h-8 w-3/4 rounded bg-slate-800" />
            <div className="h-4 w-full rounded bg-slate-800" />
            <div className="h-4 w-2/3 rounded bg-slate-800" />
            <div className="h-10 w-36 rounded-xl bg-slate-800 pt-2" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-white/[0.06] bg-[#111827]/60"
            />
          ))}
        </div>

        {/* Lessons Skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-40 rounded bg-slate-800" />
          <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-[#111827]/60 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-800/60" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111827]/60 animate-pulse"
        >
          <div className="aspect-video w-full bg-slate-800/80" />
          <div className="p-5 space-y-3">
            <div className="h-3 w-1/3 rounded bg-slate-800" />
            <div className="h-4 w-full rounded bg-slate-800" />
            <div className="h-3 w-2/3 rounded bg-slate-800" />
            <div className="pt-3 border-t border-white/[0.06] flex justify-between">
              <div className="h-3 w-1/4 rounded bg-slate-800" />
              <div className="h-3 w-1/4 rounded bg-slate-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
