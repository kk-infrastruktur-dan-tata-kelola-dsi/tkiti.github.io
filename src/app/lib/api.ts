const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000'

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
