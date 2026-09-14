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
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-heading">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-8 text-center text-sm text-slate-400">
        This section is reserved for future phases.
      </div>
    </div>
  );
};
