import type {
  SearchError,
  SearchErrorKind,
  SearchRepositoriesResponse,
  SortOption,
} from '../types/repository';

/**
 * thin wrapper around the GitHub Search API.
 * - validates HTTP status before touching the payload
 * - maps failures to typed GithubApiError instances
 * - supports AbortSignal so stale requests can be cancelled
 */

const API_BASE = 'https://api.github.com';
export const PER_PAGE = 15;
/** GitHub never serves more than 1000 results for a single search query. */
export const MAX_ACCESSIBLE_RESULTS = 1000;

export interface SearchRepositoriesParams {
  query: string;
  page?: number;
  perPage?: number;
  sort?: SortOption;
  signal?: AbortSignal;
}

export class GithubApiError extends Error {
  readonly kind: SearchErrorKind;
  readonly status: number;
  readonly resetAt?: number;

  constructor(kind: SearchErrorKind, message: string, status: number, resetAt?: number) {
    super(message);
    this.name = 'GithubApiError';
    this.kind = kind;
    this.status = status;
    this.resetAt = resetAt;
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === 'AbortError'
  ) || (
    error instanceof Error && error.name === 'AbortError'
  );
}

function parseResetHeader(response: Response): number | undefined {
  const raw = response.headers.get('X-RateLimit-Reset');
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export async function searchRepositories(
  params: SearchRepositoriesParams,
): Promise<SearchRepositoriesResponse> {
  const { query, page = 1, perPage = PER_PAGE, sort = 'best-match', signal } = params;

  const searchParams = new URLSearchParams({
    q: query.trim(),
    page: String(page),
    per_page: String(perPage),
  });
  if (sort !== 'best-match') {
    searchParams.set('sort', sort);
    searchParams.set('order', 'desc');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/search/repositories?${searchParams.toString()}`, {
      signal,
      headers: { Accept: 'application/vnd.github+json' },
    });
  } catch (error) {
    if (isAbortError(error)) throw error; // caller handles cancellation
    throw new GithubApiError(
      'network',
      'Could not reach api.github.com. Check your internet connection.',
      0,
    );
  }

  if (!response.ok) {
    const remaining = response.headers.get('X-RateLimit-Remaining');

    // 403/429 without quota left (or a secondary rate limit) both mean "slow down".
    if (response.status === 429 || (response.status === 403 && remaining === '0')) {
      throw new GithubApiError(
        'rate-limit',
        'GitHub API rate limit exceeded.',
        response.status,
        parseResetHeader(response),
      );
    }
    if (response.status === 403) {
      // Unauthenticated search is limited to ~10 requests/minute.
      throw new GithubApiError(
        'rate-limit',
        'GitHub search is temporarily throttled for your IP.',
        response.status,
        parseResetHeader(response),
      );
    }
    if (response.status === 422) {
      let detail = 'The search query was rejected by GitHub.';
      try {
        const body: unknown = await response.json();
        if (
          typeof body === 'object' &&
          body !== null &&
          'message' in body &&
          typeof (body as { message?: unknown }).message === 'string'
        ) {
          detail = (body as { message: string }).message;
        }
      } catch {
        // response had no JSON body — keep the default detail
      }
      throw new GithubApiError('validation', detail, response.status);
    }
    throw new GithubApiError(
      'http',
      `GitHub API responded with HTTP ${response.status}.`,
      response.status,
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new GithubApiError('parse', 'GitHub returned an unreadable response.', response.status);
  }

  if (
    typeof data !== 'object' ||
    data === null ||
    !Array.isArray((data as SearchRepositoriesResponse).items)
  ) {
    throw new GithubApiError('parse', 'GitHub response had an unexpected shape.', response.status);
  }

  return data as SearchRepositoriesResponse;
}

/** Normalizes unknown thrown values into the SearchError shape the UI consumes. */
export function toSearchError(error: unknown): SearchError {
  if (error instanceof GithubApiError) {
    return {
      kind: error.kind,
      message: error.message,
      resetAt: error.resetAt,
      httpStatus: error.status || undefined,
    };
  }
  return {
    kind: 'network',
    message: 'An unexpected error occurred while talking to GitHub.',
  };
}
