interface PlaceholderPageProps {
  title: string;
  description: string;
}

export const PlaceholderPage = ({
  title,
  description,
}: PlaceholderPageProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-center text-sm text-gray-400">
        This section is reserved for future phases.
      </div>
    </div>
  );
};

export const StudyPlanPage = () => (
  <PlaceholderPage
    title="Study Plan"
    description="Plan your daily learning schedule and goals."
  />
);

export const FocusPage = () => (
  <PlaceholderPage
    title="Focus Sessions"
    description="Immerse in deep learning sessions with timer and zero distractions."
  />
);

export const AnalyticsPage = () => (
  <PlaceholderPage
    title="Analytics"
    description="Track your watch time, streaks, and course completion rates."
  />
);

export const BookmarksPage = () => (
  <PlaceholderPage
    title="Bookmarks"
    description="Saved video timestamps and key moments."
  />
);

export const NotesPage = () => (
  <PlaceholderPage
    title="Notes"
    description="Your notes synchronized with video timestamps."
  />
);

export const SettingsPage = () => (
  <PlaceholderPage
    title="Settings"
    description="Manage your FocusTube account preferences."
  />
);
