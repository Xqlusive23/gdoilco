const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const apiBase = API;

export class AuthError extends Error {}

// Every admin request carries the session cookie and the header the server requires.
export async function adminApi(path, { method = 'GET', body, raw = false } = {}) {
  const res = await fetch(API + '/api/admin' + path, {
    method,
    credentials: 'include',
    headers: { 'X-Requested-With': 'gdoilco-admin', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw && res.ok) return res;
  let data = {};
  try { data = await res.json(); } catch { /* no body */ }
  if (res.status === 401 && path !== '/login') throw new AuthError(data.error || 'Please sign in.');
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data;
}
