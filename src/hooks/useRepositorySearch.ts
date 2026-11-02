import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  isAbortError,
  MAX_ACCESSIBLE_RESULTS,
  PER_PAGE,
  searchRepositories,
  toSearchError,
} from '../services/githubApi';
import type {
  Repository,
  SearchError,
  SearchStatus,
  SortOption,
} from '../types/repository';

/**
 * State machine behind repository search.
 *
 * Guarantees:
 * - a new request cancels the previous one (AbortController)
 * - stale responses are dropped via a monotonically increasing request id
 * - "load more" appends deduplicated items, a fresh search replaces them
 * - pagination failures never wipe items that are already on screen
 */

const MIN_QUERY_LENGTH = 2;

interface Snapshot {
  status: SearchStatus;
  query: string;
  sort: SortOption;
  hasMore: boolean;
}

export function useRepositorySearch() {
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [error, setError] = useState<SearchError | null>(null);
  const [paginationError, setPaginationError] = useState<string | null>(null);
  const [items, setItems] = useState<Repository[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortOption>('best-match');

  const pageRef = useRef(0);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const hasMore =
    items.length > 0 && items.length < Math.min(totalCount, MAX_ACCESSIBLE_RESULTS);

  // Latest-state mirror so callbacks can stay referentially stable.
  const snapshotRef = useRef<Snapshot>({ status, query, sort, hasMore });
  useEffect(() => {
    snapshotRef.current = { status, query, sort, hasMore };
  }, [status, query, sort, hasMore]);

  const execute = useCallback(
    async (nextQuery: string, nextSort: SortOption, page: number, append: boolean) => {
      // Cancel whatever is in flight — its result is no longer relevant.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;

      setError(null);
      setPaginationError(null);
      if (!append) setItems([]);
      setStatus(append ? 'loading-more' : 'loading');
      setQuery(nextQuery);
      setSort(nextSort);

      try {
        const data = await searchRepositories({
          query: nextQuery,
          sort: nextSort,
          page,
          perPage: PER_PAGE,
          signal: controller.signal,
        });
        if (requestId !== requestIdRef.current) return; // superseded by a newer request

        pageRef.current = page;
        setTotalCount(data.total_count);
        setItems((previous) => {
          if (!append) return data.items;
          const known = new Set(previous.map((item) => item.id));
          const fresh = data.items.filter((item) => !known.has(item.id));
          return [...previous, ...fresh];
        });
        setStatus('success');
      } catch (requestError) {
        if (requestId !== requestIdRef.current || isAbortError(requestError)) return;
        if (append) {
          // Keep the results already fetched — surface a retryable inline error.
          setPaginationError('Could not load more repositories. Please try again.');
          setStatus('success');
        } else {
          setError(toSearchError(requestError));
          setItems([]);
          setTotalCount(0);
          setStatus('error');
        }
      }
    },
    [],
  );

  /** Starts a fresh search: resets page, items and errors. Never fires an empty request. */
  const search = useCallback(
    (rawQuery: string, requestedSort?: SortOption) => {
      const trimmed = rawQuery.trim();
      const effectiveSort = requestedSort ?? snapshotRef.current.sort;

      if (trimmed.length < MIN_QUERY_LENGTH) {
        abortRef.current?.abort();
        requestIdRef.current += 1;
        setItems([]);
        setTotalCount(0);
        setQuery(trimmed);
        setSort(effectiveSort);
        setPaginationError(null);
        setError({
          kind: 'validation',
          message:
            trimmed.length === 0 ? 'Type a search query first' : 'The query is too short',
          detail: 'Enter at least 2 characters — for example "react hooks" or "tetris".',
        });
        setStatus('error');
        return;
      }

      // Skip exact repeats of a finished / running search.
      const snapshot = snapshotRef.current;
      if (
        snapshot.query === trimmed &&
        snapshot.sort === effectiveSort &&
        (snapshot.status === 'success' || snapshot.status === 'loading')
      ) {
        return;
      }

      void execute(trimmed, effectiveSort, 1, false);
    },
    [execute],
  );

  const loadMore = useCallback(() => {
    const snapshot = snapshotRef.current;
    if (snapshot.status !== 'success' || !snapshot.hasMore) return;
    void execute(snapshot.query, snapshot.sort, pageRef.current + 1, true);
  }, [execute]);

  /** Retries the last failed search (manual only — no automatic retry loops). */
  const retry = useCallback(() => {
    const snapshot = snapshotRef.current;
    if (snapshot.query.trim().length >= MIN_QUERY_LENGTH) {
      void execute(snapshot.query, snapshot.sort, 1, false);
    }
  }, [execute]);

  // Cancel an in-flight request when the app unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  return useMemo(
    () => ({
      status,
      error,
      paginationError,
      items,
      totalCount,
      hasMore,
      query,
      sort,
      perPage: PER_PAGE,
      search,
      loadMore,
      retry,
    }),
    [status, error, paginationError, items, totalCount, hasMore, query, sort, search, loadMore, retry],
  );
}
