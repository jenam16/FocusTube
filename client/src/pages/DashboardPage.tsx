import { PlaySquare, PlusCircle } from 'lucide-react';
import { useAuth } from '../hooks';

export const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Header Greeting */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Welcome to FocusTube{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-sm text-gray-400">
          Your distraction-free YouTube learning command center.
        </p>
      </div>

      {/* Empty State Banner */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-4 border border-red-500/20 shadow-inner">
          <PlaySquare className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-semibold text-white">
          No courses yet. Import your first YouTube playlist.
        </h2>
        <p className="mt-2 max-w-sm text-sm text-gray-400">
          Turn any educational playlist into a focused, distraction-free course with automated progress tracking.
        </p>
        <button
          type="button"
          disabled
          className="mt-6 flex items-center gap-2 rounded-xl bg-gray-800 px-4 py-2.5 text-xs font-semibold text-gray-400 cursor-not-allowed border border-gray-700"
          title="Importing will be available in Phase 2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Import Playlist (Coming in Phase 2)</span>
        </button>
      </div>
    </div>
  );
};
