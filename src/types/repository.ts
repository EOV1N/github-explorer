/**
 * Domain models for the GitHub search feature.
 * Field names mirror the GitHub REST API payload on purpose,
 * so no mapping layer is required.
 */

export interface RepositoryOwner {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  html_url: string;
  owner: RepositoryOwner;
  topics?: string[];
}

export interface SearchRepositoriesResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Repository[];
}

/** GitHub search supports `sort=stars|forks|updated`; default is "best match". */
export type SortOption = 'best-match' | 'stars' | 'updated';

export type SearchErrorKind = 'network' | 'rate-limit' | 'validation' | 'http' | 'parse';

export interface SearchError {
  kind: SearchErrorKind;
  /** Short human-readable title. */
  message: string;
  /** Optional longer explanation shown under the title. */
  detail?: string;
  /** Unix timestamp (seconds) when the rate-limit window resets. */
  resetAt?: number;
  httpStatus?: number;
}

export type SearchStatus = 'idle' | 'loading' | 'loading-more' | 'success' | 'error';

export type ViewMode = 'search' | 'favorites';
