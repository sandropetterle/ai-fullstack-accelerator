/**
 * Strapi 5 REST API client.
 * Server-side only — never imported in client components.
 * Uses Next.js `fetch` with ISR revalidation built in.
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export class CmsUnavailableError extends Error {
  constructor(path: string, status?: number) {
    super(`CMS unavailable: ${path}${status ? ` (HTTP ${status})` : ''}`);
    this.name = 'CmsUnavailableError';
  }
}

/**
 * Fetch a Strapi endpoint with ISR caching.
 * @param path  API path, e.g. "/global" → GET /api/global
 * @param revalidate  ISR revalidation seconds (0 = no-store)
 * @param params  Extra query params (e.g. populate)
 */
export async function fetchStrapi<T>(
  path: string,
  revalidate = 300,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`/api${path}`, STRAPI_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {};
  if (STRAPI_TOKEN) {
    headers['Authorization'] = `Bearer ${STRAPI_TOKEN}`;
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers,
      next: revalidate === 0 ? { revalidate: 0 } : { revalidate },
    });
  } catch {
    // Network error (ECONNREFUSED, DNS failure, etc.) — treat as CMS unavailable.
    // This allows safeFetch callers to use fallback content during Docker build
    // when STRAPI_URL is not reachable.
    throw new CmsUnavailableError(path);
  }

  if (!res.ok) {
    throw new CmsUnavailableError(path, res.status);
  }

  const json = await res.json();
  // Strapi 5 wraps single types as { data: { ... } }
  return json.data as T;
}
