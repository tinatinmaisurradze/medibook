import { ApiError, handleRequest } from './mockApi'
import { translateData, trMessage } from '@/i18n'
import { tr } from '@/i18n'

/** The session token lives in sessionStorage: every browser tab has its own login,
 * so two accounts can be used side by side (the data itself is shared through localStorage). */
const TOKEN_KEY = 'medibook_token'

export const tokenStore = {
  get(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

export { ApiError }

/**
 * Address of the real backend (see server/). When it is empty the app runs on the in-browser mock API.
 * Set it in `.env.local`:  VITE_API_URL=http://localhost:4000
 */
const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/+$/, '')
/** true when data comes from a real server (then other browsers change it too, so screens refresh on a timer) */
export const REMOTE_API = API_URL !== ''

/** Single place that talks to the backend: the real server when configured, otherwise the mock. */
async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  if (!REMOTE_API) return translateData(await handleRequest<T>(method, url, body, tokenStore.get()))

  const token = tokenStore.get()
  let res: Response
  try {
    res = await fetch(`${API_URL}${url}`, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK', tr("სერვერთან კავშირი ვერ დამყარდა. შეამოწმეთ ინტერნეტი და სცადეთ თავიდან"))
  }
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    const e = (data ?? {}) as { code?: string; message?: string }
    throw new ApiError(res.status, e.code ?? 'SERVER_ERROR', e.message ?? tr("დაფიქსირდა შეცდომა. სცადეთ თავიდან"))
  }
  return translateData(data as T)
}

export const http = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
}

export function errorMessage(e: unknown): string {
  return e instanceof ApiError ? trMessage(e.message) : tr("დაფიქსირდა შეცდომა. სცადეთ თავიდან")
}
