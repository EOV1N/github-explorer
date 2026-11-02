import { afterEach, describe, expect, it, vi } from 'vitest';
import { GithubApiError, searchRepositories } from '../services/githubApi';

const EMPTY_RESULT = { total_count: 0, incomplete_results: false, items: [] };

function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
}

function mockFetch(impl: (input: RequestInfo | URL) => Promise<Response>) {
  const spy = vi.fn(impl);
  vi.stubGlobal('fetch', spy);
  return spy;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchRepositories', () => {
  it('queries the GitHub search endpoint and returns parsed data', async () => {
    const spy = mockFetch(() => Promise.resolve(jsonResponse(EMPTY_RESULT)));

    const data = await searchRepositories({
      query: 'react',
      page: 2,
      perPage: 15,
      sort: 'stars',
    });

    expect(data).toEqual(EMPTY_RESULT);
    const url = String(spy.mock.calls[0][0]);
    expect(url).toContain('https://api.github.com/search/repositories?');
    expect(url).toContain('q=react');
    expect(url).toContain('page=2');
    expect(url).toContain('per_page=15');
    expect(url).toContain('sort=stars');
    expect(url).toContain('order=desc');
  });

  it('omits sort parameters for the default "best-match"', async () => {
    const spy = mockFetch(() => Promise.resolve(jsonResponse(EMPTY_RESULT)));
    await searchRepositories({ query: 'react' });
    expect(String(spy.mock.calls[0][0])).not.toContain('sort=');
  });

  it('maps a 403 with empty quota to a rate-limit error with reset time', async () => {
    mockFetch(() =>
      Promise.resolve(
        jsonResponse(
          { message: 'API rate limit exceeded' },
          {
            status: 403,
            headers: { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '1893456000' },
          },
        ),
      ),
    );

    const promise = searchRepositories({ query: 'react' });
    await expect(promise).rejects.toMatchObject({
      name: 'GithubApiError',
      kind: 'rate-limit',
      status: 403,
      resetAt: 1893456000,
    });
  });

  it('treats HTTP 429 as a rate-limit too', async () => {
    mockFetch(() => Promise.resolve(jsonResponse({}, { status: 429 })));
    await expect(searchRepositories({ query: 'react' })).rejects.toMatchObject({
      kind: 'rate-limit',
    });
  });

  it('maps HTTP 422 to a validation error with the API message', async () => {
    mockFetch(() =>
      Promise.resolve(
        jsonResponse({ message: 'Validation Failed: query contains only qualifiers' }, { status: 422 }),
      ),
    );

    const error = await searchRepositories({ query: '?' }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(GithubApiError);
    expect((error as GithubApiError).kind).toBe('validation');
    expect((error as GithubApiError).message).toContain('Validation Failed');
  });

  it('maps a rejected fetch to a network error', async () => {
    mockFetch(() => Promise.reject(new TypeError('fetch failed')));
    await expect(searchRepositories({ query: 'react' })).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it('maps other HTTP failures to an http error', async () => {
    mockFetch(() => Promise.resolve(jsonResponse({}, { status: 503 })));
    await expect(searchRepositories({ query: 'react' })).rejects.toMatchObject({
      kind: 'http',
      status: 503,
    });
  });

  it('rejects non-standard payloads as parse errors', async () => {
    mockFetch(() => Promise.resolve(jsonResponse({ unexpected: true })));
    await expect(searchRepositories({ query: 'react' })).rejects.toMatchObject({
      kind: 'parse',
    });
  });

  it('propagates AbortError untouched so the caller can ignore it', async () => {
    mockFetch(() => Promise.reject(new DOMException('Aborted', 'AbortError')));

    const error = await searchRepositories({ query: 'react' }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(DOMException);
    expect((error as DOMException).name).toBe('AbortError');
    expect(error).not.toBeInstanceOf(GithubApiError);
  });
});
