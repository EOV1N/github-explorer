/** Placeholder with the same silhouette as RepositoryCard. */
export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 shadow-[var(--shadow-card)] sm:p-5"
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        <div className="skeleton h-10 w-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <div className="skeleton h-4 w-2/5 rounded-md" />
          <div className="skeleton mt-2.5 h-3 w-full rounded-md" />
          <div className="skeleton mt-1.5 h-3 w-3/4 rounded-md" />
          <div className="mt-3.5 flex gap-4">
            <div className="skeleton h-3 w-14 rounded-md" />
            <div className="skeleton h-3 w-12 rounded-md" />
            <div className="skeleton h-3 w-12 rounded-md" />
            <div className="skeleton h-3 w-20 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading repositories" className="space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
