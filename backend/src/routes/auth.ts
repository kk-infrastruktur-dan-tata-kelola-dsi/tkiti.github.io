import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { signJWT } from '../lib/jwt.js'

export const authRoutes = new Hono()

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

  const user = db.select().from(users).where(eq(users.username, username)).get()

  if (!user) {
    return c.json({ success: false, error: 'Username atau password salah' }, 401)
  }

  const valid = await bcrypt.compare(password, user.passwordHash)

  if (!valid) {
    return c.json({ success: false, error: 'Username atau password salah' }, 401)
  }

  const token = await signJWT({ sub: String(user.id), username: user.username })

  return c.json({
    success: true,
    data: { token },
  })
})
