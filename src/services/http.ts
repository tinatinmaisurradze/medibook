import { ApiError, handleRequest } from './mockApi'

const TOKEN_KEY = 'medibook_token'

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}

export { ApiError }

/** Single place that talks to the (mock) backend. Replace the body to use a real API. */
function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  return handleRequest<T>(method, url, body, tokenStore.get())
}

export const http = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
}

export function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'დაფიქსირდა შეცდომა. სცადეთ თავიდან'
}
