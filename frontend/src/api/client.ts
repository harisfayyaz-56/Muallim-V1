/**
 * API request helper with Authorization header support
 */
export async function apiRequest(
  url: string,
  options: RequestInit = {},
  token?: string | null
): Promise<Response> {
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
