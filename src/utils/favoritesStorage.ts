import type { Repository } from '../types/repository';

/**
 * localStorage persistence for favorites.
 * Every read is validated — corrupted or outdated payloads degrade
 * to an empty list instead of crashing the app.
 * `storage` is injectable so tests can run without a real browser.
 */

export const FAVORITES_STORAGE_KEY = 'github-explorer:favorites:v1';

function isValidRepository(value: unknown): value is Repository {
  if (typeof value !== 'object' || value === null) return false;
  const repo = value as Partial<Repository>;
  return (
    typeof repo.id === 'number' &&
    Number.isFinite(repo.id) &&
    typeof repo.full_name === 'string' &&
    repo.full_name.length > 0 &&
    typeof repo.html_url === 'string' &&
    typeof repo.stargazers_count === 'number' &&
    typeof repo.forks_count === 'number' &&
    typeof repo.updated_at === 'string' &&
    typeof repo.owner === 'object' &&
    repo.owner !== null &&
    typeof repo.owner.login === 'string'
  );
}

export function loadFavorites(storage: Storage = window.localStorage): Repository[] {
  try {
    const raw = storage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop malformed entries, keep valid ones, dedupe by id.
    const seen = new Set<number>();
    const valid: Repository[] = [];
    for (const entry of parsed) {
      if (isValidRepository(entry) && !seen.has(entry.id)) {
        seen.add(entry.id);
        valid.push(entry);
      }
    }
    return valid;
  } catch {
    return [];
  }
}

export function saveFavorites(
  favorites: Repository[],
  storage: Storage = window.localStorage,
): void {
  try {
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Quota exceeded or storage unavailable — favorites simply won't persist.
  }
}

/** Adds the repo to the front of the list, or removes it when already present. */
export function toggleFavorite(
  favorites: Repository[],
  repository: Repository,
): Repository[] {
  const exists = favorites.some((item) => item.id === repository.id);
  if (exists) return favorites.filter((item) => item.id !== repository.id);
  return [repository, ...favorites];
}

export function isFavorite(favorites: Repository[], repositoryId: number): boolean {
  return favorites.some((item) => item.id === repositoryId);
}
