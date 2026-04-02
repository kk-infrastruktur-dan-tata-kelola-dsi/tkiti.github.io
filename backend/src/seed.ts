/**
 * Seed script — buat atau update admin user.
 * Jalankan SETELAH migration: pnpm db:migrate
 *
 * Usage:
 *   pnpm db:seed
 *
 * Default credentials (ubah setelah pertama kali login):
 *   username : admin
 *   password : admin123
 */
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from './db/client.js'
import { users } from './db/schema.js'

const username = process.env.SEED_USERNAME ?? 'admin'
const password = process.env.SEED_PASSWORD ?? 'admin123'
const overwrite = process.env.SEED_OVERWRITE === 'true'

const passwordHash = await bcrypt.hash(password, 12)

const existingUser = db.select().from(users).where(eq(users.username, username)).get()

if (!existingUser) {
  db.insert(users).values({ username, passwordHash }).run()
  console.log(`✓ Admin user dibuat: ${username}`)
  console.log('  Segera ganti password setelah pertama kali login!')
  process.exit(0)
}

if (!overwrite) {
  console.log(`ℹ User "${username}" sudah ada. Tidak diubah.`)
  console.log('  Untuk reset password jalankan ulang dengan SEED_OVERWRITE=true')
  process.exit(0)
}

db.update(users).set({ passwordHash }).where(eq(users.id, existingUser.id)).run()
console.log(`✓ Password admin "${username}" berhasil direset`)

process.exit(0)
