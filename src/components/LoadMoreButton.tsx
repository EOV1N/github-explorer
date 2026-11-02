import { ChevronDown, Loader2, RotateCcw } from 'lucide-react';
import { MAX_ACCESSIBLE_RESULTS } from '../services/githubApi';
import { formatCount } from '../utils/formatters';

interface LoadMoreButtonProps {
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  loadedCount: number;
  totalCount: number;
  onLoadMore: () => void;
}

export function LoadMoreButton({
  hasMore,
  loading,
  error,
  loadedCount,
  totalCount,
  onLoadMore,
}: LoadMoreButtonProps) {
  if (loadedCount === 0) return null;
  const cappedByApi = totalCount > MAX_ACCESSIBLE_RESULTS;

  return (
    <div className="fade-in flex flex-col items-center gap-2.5 pt-2">
      <p className="font-mono text-xs text-[var(--text-faint)]">
        {formatCount(loadedCount)} of {formatCount(Math.min(totalCount, MAX_ACCESSIBLE_RESULTS))}{' '}
        loaded
      </p>

      {error ? (
        <div className="flex flex-col items-center gap-2.5">
          <p role="alert" className="text-sm text-[var(--danger)]">
            {error}
          </p>
          <button
            type="button"
            onClick={onLoadMore}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent)]"
          >
            <RotateCcw size={14} strokeWidth={2} />
            Retry
          </button>
        </div>
      ) : hasMore ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-5 py-2.5 text-sm font-medium text-[var(--text)] shadow-[var(--shadow-card)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent)] disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 size={15} strokeWidth={2.2} className="animate-spin-slow" />
              Loading…
            </>
          ) : (
            <>
              <ChevronDown size={15} strokeWidth={2.2} />
              Load more
            </>
          )}
        </button>
      ) : (
        <p className="text-xs text-[var(--text-faint)]">
          End of results.
          {cappedByApi && ' GitHub only exposes the first 1,000 matches for any search.'}
        </p>
      )}
    </div>
  );
}
