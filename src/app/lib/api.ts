export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000').replace(/\/$/, '')
export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://tkiti.tech').replace(/\/$/, '')

type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/** Decode JWT payload tanpa library — hanya untuk cek expiry */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export function getToken(): string | null {
  return localStorage.getItem('admin_token')
}

export function setToken(token: string): void {
  localStorage.setItem('admin_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('admin_token')
}

export function getUsername(): string {
  try {
    const token = getToken()
    if (!token) return ''
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return (payload.username as string) ?? ''
  } catch {
    return ''
  }
}

/**
 * Fetch wrapper dengan auth header otomatis.
 * Jika response 401 → clear token + redirect ke login.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getToken()

  const isFormData = options.body instanceof FormData

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/admin/login'
    throw new Error('Sesi habis, silakan login kembali')
  }

  return res.json() as Promise<ApiResponse<T>>
}

type ApiImageOptions = {
  width?: number
  height?: number
  quality?: number
}

export function toAbsoluteApiUrl(path?: string | null, options?: ApiImageOptions): string | null {
  if (!path) return null

  const trimmed = path.trim()
  const isAbsolute = /^https?:\/\//i.test(trimmed)
  let baseUrl = trimmed

  if (!isAbsolute) {
    const normalized = trimmed.replace(/^\/+/, '')
    const encoded = normalized
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/')

    if (normalized.startsWith('uploads/')) {
      baseUrl = `${API_URL}/${encoded}`
    } else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(normalized)) {
      baseUrl = `${API_URL}/${encoded}`
    } else {
      baseUrl = `${API_URL}/${encoded}`
    }
  }

  // Add image optimization query parameters if provided
  if (options?.width || options?.height || options?.quality) {
    let optimizedUrl: URL
    try {
      optimizedUrl = new URL(baseUrl)
    } catch {
      return baseUrl
    }

    if (options.width) optimizedUrl.searchParams.set('w', String(options.width))
    if (options.height) optimizedUrl.searchParams.set('h', String(options.height))
    if (options.quality) optimizedUrl.searchParams.set('q', String(options.quality))
    return optimizedUrl.toString()
  } else {
    return baseUrl
  }
}
