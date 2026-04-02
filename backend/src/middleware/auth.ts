import type { Context, Next } from 'hono'
import { verifyJWT } from '../lib/jwt.js'

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized: token tidak ditemukan' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const payload = await verifyJWT(token)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(c as any).set('jwtPayload', payload)
    await next()
  } catch {
    return c.json({ success: false, error: 'Unauthorized: token tidak valid atau sudah expired' }, 401)
  }
}
