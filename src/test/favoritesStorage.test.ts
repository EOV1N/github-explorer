import { describe, expect, it } from 'vitest';
import type { Repository } from '../types/repository';
import {
  FAVORITES_STORAGE_KEY,
  isFavorite,
  loadFavorites,
  saveFavorites,
  toggleFavorite,
} from '../utils/favoritesStorage';

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, String(value)),
  };
}

function makeRepo(overrides: Partial<Repository> = {}): Repository {
  return {
    id: 1,
    name: 'hello-world',
    full_name: 'octocat/hello-world',
    description: 'Sample repository',
    language: 'TypeScript',
    stargazers_count: 1200,
    forks_count: 300,
    updated_at: '2026-02-01T10:00:00Z',
    html_url: 'https://github.com/octocat/hello-world',
    owner: {
      login: 'octocat',
      avatar_url: 'https://avatars.githubusercontent.com/u/1',
      html_url: 'https://github.com/octocat',
    },
    ...overrides,
  };
}

describe('loadFavorites', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(loadFavorites(createMemoryStorage())).toEqual([]);
  });

  it('survives corrupted JSON', () => {
    const storage = createMemoryStorage();
    storage.setItem(FAVORITES_STORAGE_KEY, '{not valid json…');
    expect(loadFavorites(storage)).toEqual([]);
  });

  it('rejects payloads that are not arrays', () => {
    const storage = createMemoryStorage();
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify({ id: 1 }));
    expect(loadFavorites(storage)).toEqual([]);
  });

  it('drops malformed entries but keeps valid ones', () => {
    const storage = createMemoryStorage();
    const valid = makeRepo({ id: 7 });
    storage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify([valid, { id: 'oops' }, null, { full_name: 'x/y' }]),
    );
    expect(loadFavorites(storage)).toEqual([valid]);
  });

  it('deduplicates entries by id', () => {
    const storage = createMemoryStorage();
    const repo = makeRepo({ id: 3 });
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([repo, repo]));
    expect(loadFavorites(storage)).toHaveLength(1);
  });

  it('round-trips through saveFavorites', () => {
    const storage = createMemoryStorage();
    const favorites = [makeRepo({ id: 1 }), makeRepo({ id: 2, name: 'second' })];
    saveFavorites(favorites, storage);
    expect(loadFavorites(storage)).toEqual(favorites);
  });
});

describe('toggleFavorite', () => {
  it('adds a repository to the front of the list', () => {
    const existing = makeRepo({ id: 1 });
    const added = makeRepo({ id: 2, name: 'new' });
    const next = toggleFavorite([existing], added);
    expect(next.map((repo) => repo.id)).toEqual([2, 1]);
  });

  it('removes a repository that is already favorited', () => {
    const repo = makeRepo({ id: 1 });
    const other = makeRepo({ id: 2 });
    const next = toggleFavorite([repo, other], repo);
    expect(next).toEqual([other]);
  });

  it('does not mutate the previous list', () => {
    const previous = [makeRepo({ id: 1 })];
    toggleFavorite(previous, makeRepo({ id: 2 }));
    expect(previous).toHaveLength(1);
  });
});

describe('isFavorite', () => {
  it('matches by repository id', () => {
    const favorites = [makeRepo({ id: 10 })];
    expect(isFavorite(favorites, 10)).toBe(true);
    expect(isFavorite(favorites, 11)).toBe(false);
  });
});
