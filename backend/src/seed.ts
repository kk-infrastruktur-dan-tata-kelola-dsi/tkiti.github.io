/**
 * Seed script — buat admin user pertama.
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
import { db } from './db/client.js'
import { users } from './db/schema.js'

const username = process.env.SEED_USERNAME ?? 'admin'
const password = process.env.SEED_PASSWORD ?? 'admin123'

const passwordHash = await bcrypt.hash(password, 12)

try {
  db.insert(users).values({ username, passwordHash }).run()
  console.log(`✓ Admin user dibuat: ${username} / ${password}`)
  console.log('  Segera ganti password setelah pertama kali login!')
} catch (err: unknown) {
  if (err instanceof Error && err.message.includes('UNIQUE')) {
    console.log(`  User "${username}" sudah ada, skip.`)
  } else {
    throw err
  }
}

process.exit(0)
