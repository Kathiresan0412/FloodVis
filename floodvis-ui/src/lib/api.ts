/**
 * Central API configuration and helpers for FloodVis backend.
 */

export const API_BASE =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    : "http://localhost:4000";

/**
 * Returns headers with Bearer token when available (client-side).
 * Always includes Content-Type for JSON when body is used.
 */
export function getAuthHeaders(includeJson = true): HeadersInit {
  if (typeof window === "undefined") {
    return includeJson ? { "Content-Type": "application/json" } : {};
  }
  const token = localStorage.getItem("fv_token");
  const headers: Record<string, string> = includeJson
    ? { "Content-Type": "application/json" }
    : {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Authenticated GET. Uses getAuthHeaders(false) so no Content-Type is set (GET has no body).
 */
export async function apiGet<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T }> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    method: "GET",
    headers: getAuthHeaders(false),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

/**
 * Authenticated POST. Sends JSON body with auth headers.
 */
export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T }> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

/**
 * Authenticated PUT. Sends JSON body with auth headers.
 */
export async function apiPut<T = unknown>(
  path: string,
  body: unknown,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T }> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

/**
 * Authenticated DELETE.
 */
export async function apiDelete(
  path: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number }> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  return { ok: res.ok, status: res.status };
}
