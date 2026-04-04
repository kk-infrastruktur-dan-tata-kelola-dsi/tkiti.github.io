import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { signJWT } from '../lib/jwt.js'

export const authRoutes = new Hono()

// Rate limiting untuk login endpoint
// key: "<ip>", value: { attempts: number, resetTime: number }
const loginAttempts = new Map<string, { attempts: number; resetTime: number }>()
const LOGIN_MAX_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 menit
const LOGIN_CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 menit

// Cleanup expired entries secara berkala
const loginCleanupInterval = setInterval(() => {
  const now = Date.now()
  let deleted = 0
  
  for (const [key, data] of loginAttempts.entries()) {
    if (now >= data.resetTime) {
      loginAttempts.delete(key)
      deleted++
    }
  }
  
  if (deleted > 0) {
    console.log(`[LoginRateLimit] Cleaned up ${deleted} expired entries`)
  }
}, LOGIN_CLEANUP_INTERVAL)

// Prevent cleanup from keeping process alive
if (typeof loginCleanupInterval.unref === 'function') {
  (loginCleanupInterval as NodeJS.Timeout).unref()
}

function getLoginRateLimit(ip: string): { blocked: boolean; remainingAttempts: number } {
  const now = Date.now()
  const record = loginAttempts.get(ip)
  
  // Jika tidak ada record atau window sudah reset
  if (!record || now >= record.resetTime) {
    return { blocked: false, remainingAttempts: LOGIN_MAX_ATTEMPTS }
  }
  
  // Jika sudah melebihi batas
  if (record.attempts >= LOGIN_MAX_ATTEMPTS) {
    const remainingMs = record.resetTime - now
    const remainingMinutes = Math.ceil(remainingMs / 60000)
    console.log(`[LoginRateLimit] IP ${ip} blocked for ${remainingMinutes} more minutes`)
    return { blocked: true, remainingAttempts: 0 }
  }
  
  return { blocked: false, remainingAttempts: LOGIN_MAX_ATTEMPTS - record.attempts }
}

function recordLoginAttempt(ip: string): void {
  const now = Date.now()
  const record = loginAttempts.get(ip)
  
  if (!record || now >= record.resetTime) {
    // New record atau reset window
    loginAttempts.set(ip, {
      attempts: 1,
      resetTime: now + LOGIN_WINDOW_MS,
    })
  } else {
    // Increment existing record
    record.attempts++
  }
}

function clearLoginRateLimit(ip: string): void {
  loginAttempts.delete(ip)
}

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  )
}

// POST /auth/login
authRoutes.post('/login', async (c) => {
  let body: { username?: string; password?: string }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: 'Body harus berupa JSON' }, 400)
  }

  const { username, password } = body

  if (!username || !password) {
    return c.json({ success: false, error: 'Username dan password diperlukan' }, 400)
  }

  // Check rate limit
  const ip = getClientIp(c)
  const rateLimit = getLoginRateLimit(ip)
  
  if (rateLimit.blocked) {
    return c.json(
      { 
        success: false, 
        error: 'Terlalu banyak percobaan login. Silakan coba lagi dalam beberapa menit.' 
      },
      429
    )
  }

  // Record this login attempt
  recordLoginAttempt(ip)

  const user = db.select().from(users).where(eq(users.username, username)).get()

  if (!user) {
    return c.json({ success: false, error: 'Username atau password salah' }, 401)
  }

  const valid = await bcrypt.compare(password, user.passwordHash)

  if (!valid) {
    return c.json({ success: false, error: 'Username atau password salah' }, 401)
  }

  // Clear rate limit on successful login
  clearLoginRateLimit(ip)

  const token = await signJWT({ sub: String(user.id), username: user.username })

  return c.json({
    success: true,
    data: { token },
  })
})
