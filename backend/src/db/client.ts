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

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS content (
    key text PRIMARY KEY NOT NULL,
    value text NOT NULL,
    updated_at integer
  );

  CREATE TABLE IF NOT EXISTS anggota (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    nama text NOT NULL,
    role text NOT NULL,
    divisi text,
    photo text,
    parent_id integer,
    urutan integer
  );

  CREATE TABLE IF NOT EXISTS gallery (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    src text NOT NULL,
    caption text,
    tanggal text,
    urutan integer
  );

  CREATE TABLE IF NOT EXISTS articles (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    excerpt text,
    content text NOT NULL,
    thumbnail text,
    author text,
    published integer DEFAULT false,
    likes integer DEFAULT 0,
    created_at integer,
    updated_at integer
  );
  CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_unique ON articles (slug);

  CREATE TABLE IF NOT EXISTS users (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username);
`)

const anggotaColumns = sqlite.prepare(`PRAGMA table_info(anggota)`).all() as Array<{ name: string }>
if (!anggotaColumns.some((col) => col.name === 'parent_id')) {
  sqlite.exec(`ALTER TABLE anggota ADD COLUMN parent_id integer;`)
}

export const db = drizzle(sqlite, { schema })
