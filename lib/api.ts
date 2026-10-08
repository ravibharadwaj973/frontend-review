'use client';

const TOKEN_KEY = 'reviewrankr.token';

// The app used to be called Starling. Move saved sign-ins to the new names once, so nobody is logged out.
if (typeof window !== 'undefined') {
  try {
    for (const k of ['token', 'prevToken', 'adminReturn']) {
      const old = window.localStorage.getItem(`starling.${k}`);
      if (old !== null) {
        if (window.localStorage.getItem(`reviewrankr.${k}`) === null) window.localStorage.setItem(`reviewrankr.${k}`, old);
        window.localStorage.removeItem(`starling.${k}`);
      }
    }
  } catch {
    /* storage unavailable */
  }
}

export function getToken(): string | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function setToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;
  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type Options = { method?: string; body?: unknown; form?: FormData; signal?: AbortSignal };

export async function api<T = any>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { method: opts.method || (body ? 'POST' : 'GET'), headers, body, signal: opts.signal });
  } catch {
    throw new ApiError(0, 'Can’t reach the server. Check that the API is running.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token && typeof window !== 'undefined' && !path.startsWith('/auth/')) {
      setToken(null);
      try {
        window.localStorage.removeItem('reviewrankr.prevToken');
        window.localStorage.removeItem('reviewrankr.adminReturn');
      } catch {
        /* ignore */
      }
      window.location.href = '/login?expired=1';
    }
    if (data?.code === 'account_suspended' && typeof window !== 'undefined') window.dispatchEvent(new Event('reviewrankr:account'));
    throw new ApiError(res.status, data?.error || `Request failed (${res.status})`, data?.details);
  }
  return data as T;
}

export const fetcher = (path: string) => api(path);
