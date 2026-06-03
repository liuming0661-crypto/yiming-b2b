// Typed fetch helpers — all API calls go through here

async function apiFetch<T>(
  url: string,
  token: string | null,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? `API error ${res.status}`)
  return data
}

export const api = {
  get: <T>(url: string, token: string | null) =>
    apiFetch<T>(url, token, { method: 'GET' }),

  post: <T>(url: string, token: string | null, body: unknown) =>
    apiFetch<T>(url, token, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(url: string, token: string | null, body: unknown) =>
    apiFetch<T>(url, token, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(url: string, token: string | null, body: unknown) =>
    apiFetch<T>(url, token, { method: 'PATCH', body: JSON.stringify(body) }),

  del: <T>(url: string, token: string | null) =>
    apiFetch<T>(url, token, { method: 'DELETE' }),
}
