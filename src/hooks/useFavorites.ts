import { useCallback, useMemo, useState } from 'react';
import {
  isFavorite,
  loadFavorites,
  saveFavorites,
  toggleFavorite,
} from '../utils/favoritesStorage';
import type { Repository } from '../types/repository';

/**
 * Favorites backed by localStorage.
 * Reads lazily (once, with validation), writes synchronously on each toggle
 * so the data survives a refresh at any point.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Repository[]>(() => loadFavorites());

  const toggle = useCallback((repository: Repository) => {
    setFavorites((previous) => {
      const next = toggleFavorite(previous, repository);
      saveFavorites(next);
      return next;
    });
  }, []);

  const checkFavorite = useCallback(
    (repositoryId: number) => isFavorite(favorites, repositoryId),
    [favorites],
  );

  return useMemo(
    () => ({
      favorites,
      favoritesCount: favorites.length,
      toggleFavorite: toggle,
      isFavorite: checkFavorite,
    }),
    [favorites, toggle, checkFavorite],
  );
}
