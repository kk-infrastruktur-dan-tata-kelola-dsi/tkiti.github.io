import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'
import * as schema from './schema.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Resolve ke /app/data/tkiti.db di dalam Docker, atau ke backend/data/tkiti.db secara lokal
const dataDir = join(__dirname, '../../data')
const dbPath = join(dataDir, 'tkiti.db')

// Pastikan folder data/ ada sebelum SQLite coba buka file
mkdirSync(dataDir, { recursive: true })

const sqlite = new Database(dbPath)

// WAL mode: lebih cepat untuk concurrent reads, aman untuk single-writer
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
