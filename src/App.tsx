import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { Header } from './components/Header';
import { LoadMoreButton } from './components/LoadMoreButton';
import { RepositoryList } from './components/RepositoryList';
import { SearchBar } from './components/SearchBar';
import { SkeletonList } from './components/SkeletonCard';
import { Toolbar, type LanguageCount } from './components/Toolbar';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { useFavorites } from './hooks/useFavorites';
import { useRepositorySearch } from './hooks/useRepositorySearch';
import { useTheme } from './hooks/useTheme';
import type { SortOption, ViewMode } from './types/repository';

function readQueryFromUrl(): string {
  try {
    return new URLSearchParams(window.location.search).get('q') ?? '';
  } catch {
    return '';
  }
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const searchApi = useRepositorySearch();
  const favorites = useFavorites();

  const [input, setInput] = useState(readQueryFromUrl);
  const [view, setView] = useState<ViewMode>('search');
  const [languageFilter, setLanguageFilter] = useState('all');

  const { search: runSearch, loadMore, retry } = searchApi;
  const debouncedInput = useDebouncedValue(input, 450);

  // Deep link: ?q=react runs the search immediately on mount.
  const didInitialSearch = useRef(false);
  useEffect(() => {
    if (didInitialSearch.current) return;
    didInitialSearch.current = true;
    const initial = readQueryFromUrl();
    if (initial.trim().length >= 2) runSearch(initial);
  }, [runSearch]);

  // Live search while typing (debounced). Enter / the button trigger it instantly.
  useEffect(() => {
    const nextQuery = debouncedInput.trim();
    if (nextQuery.length < 2 || nextQuery === searchApi.query) return;
    setLanguageFilter('all');
    setView('search');
    runSearch(nextQuery);
    // searchApi.query intentionally omitted: it mirrors the last submitted query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput, runSearch]);

  // Keep the address bar shareable.
  useEffect(() => {
    if (!searchApi.query) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('q') === searchApi.query) return;
    params.set('q', searchApi.query);
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [searchApi.query]);

  const handleSubmit = useCallback(() => {
    setLanguageFilter('all');
    setView('search');
    runSearch(input);
  }, [input, runSearch]);

  const handleSortChange = useCallback(
    (nextSort: SortOption) => {
      if (nextSort === searchApi.sort) return;
      const activeQuery = searchApi.query.trim() || input.trim();
      if (activeQuery.length < 2) return;
      setLanguageFilter('all');
      runSearch(activeQuery, nextSort);
      // searchApi intentionally omitted — sort/query are read from the latest render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [input, runSearch],
  );

  const handleExampleClick = useCallback(
    (example: string) => {
      setInput(example);
      setLanguageFilter('all');
      setView('search');
      runSearch(example);
    },
    [runSearch],
  );

  const languages: LanguageCount[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of searchApi.items) {
      if (item.language) counts.set(item.language, (counts.get(item.language) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [searchApi.items]);

  const visibleItems = useMemo(
    () =>
      languageFilter === 'all'
        ? searchApi.items
        : searchApi.items.filter((item) => item.language === languageFilter),
    [searchApi.items, languageFilter],
  );

  const isBrowsingResults =
    searchApi.status === 'success' || searchApi.status === 'loading-more';

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Header
        view={view}
        onViewChange={setView}
        favoritesCount={favorites.favoritesCount}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto max-w-3xl px-4 pb-10">
        {view === 'search' ? (
          <section aria-label="Repository search" className="pt-8 sm:pt-10">
            <div className="mb-5">
              <h1 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                Find your next favorite repo
              </h1>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                Live results from the GitHub Search API — sort, filter and star what matters.
              </p>
            </div>

            <SearchBar
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              loading={searchApi.status === 'loading'}
            />

            <div className="mt-6">
              {searchApi.status === 'idle' && (
                <EmptyState variant="start" onExampleClick={handleExampleClick} />
              )}

              {searchApi.status === 'loading' && <SkeletonList count={5} />}

              {searchApi.status === 'error' && searchApi.error && (
                <ErrorState error={searchApi.error} onRetry={retry} />
              )}

              {isBrowsingResults &&
                (searchApi.items.length === 0 ? (
                  <EmptyState variant="no-results" query={searchApi.query} />
                ) : (
                  <div className="space-y-5">
                    <Toolbar
                      totalCount={searchApi.totalCount}
                      loadedCount={searchApi.items.length}
                      shownCount={visibleItems.length}
                      sort={searchApi.sort}
                      onSortChange={handleSortChange}
                      languages={languages}
                      languageFilter={languageFilter}
                      onLanguageFilterChange={setLanguageFilter}
                    />

                    {visibleItems.length > 0 ? (
                      <RepositoryList
                        items={visibleItems}
                        isFavorite={favorites.isFavorite}
                        onToggleFavorite={favorites.toggleFavorite}
                        label={`Search results for ${searchApi.query}`}
                      />
                    ) : (
                      <EmptyState variant="no-matches" />
                    )}

                    {searchApi.status === 'loading-more' && (
                      <div className="pt-3">
                        <SkeletonList count={2} />
                      </div>
                    )}

                    <LoadMoreButton
                      hasMore={searchApi.hasMore}
                      loading={searchApi.status === 'loading-more'}
                      error={searchApi.paginationError}
                      loadedCount={searchApi.items.length}
                      totalCount={searchApi.totalCount}
                      onLoadMore={loadMore}
                    />
                  </div>
                ))}
            </div>
          </section>
        ) : (
          <section aria-label="Favorite repositories" className="pt-8 sm:pt-10">
            <div className="mb-5">
              <h1 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                Favorites
              </h1>
              <p className="mt-1 font-mono text-xs text-[var(--text-faint)]">
                {favorites.favoritesCount} saved · stored locally in your browser
              </p>
            </div>

            {favorites.favorites.length === 0 ? (
              <EmptyState variant="no-favorites" />
            ) : (
              <RepositoryList
                items={favorites.favorites}
                isFavorite={favorites.isFavorite}
                onToggleFavorite={favorites.toggleFavorite}
                label="Favorite repositories"
              />
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-[var(--border)] py-6">
        <p className="mx-auto max-w-3xl px-4 font-mono text-xs leading-5 text-[var(--text-faint)]">
          Data — GitHub REST API · unauthenticated search allows ~10 requests/min and the first
          1,000 matches per query
        </p>
      </footer>
    </div>
  );
}
