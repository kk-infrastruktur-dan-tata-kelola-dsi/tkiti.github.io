import { writeFile, unlink } from 'node:fs/promises'
import { mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Dari dist/lib/ → ../../ = /app/  →  /app/uploads
export const uploadsRoot = join(__dirname, '../../uploads')

export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Hanya jpg, png, atau webp yang diizinkan'
  if (file.size > MAX_SIZE) return 'Ukuran file maksimal 5MB'
  return null
}

/**
 * Simpan file ke uploads/<subfolder>/ dan kembalikan path relatif yang disimpan di DB.
 * Path format: uploads/<subfolder>/<timestamp>-<hex>.<ext>
 */
export async function saveFile(file: File, subfolder: string): Promise<string> {
  const dir = join(uploadsRoot, subfolder)
  mkdirSync(dir, { recursive: true })

  const ext = extname(file.name).toLowerCase() || '.jpg'
  const filename = `${Date.now()}-${randomBytes(4).toString('hex')}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(join(dir, filename), buffer)

  return `uploads/${subfolder}/${filename}`
}

/**
 * Hapus file dari disk berdasarkan path relatif yang tersimpan di DB.
 * relativePath contoh: "uploads/gallery/1234-abcd.jpg"
 */
export async function deleteFile(relativePath: string): Promise<void> {
  try {
    // Strip prefix "uploads/" lalu join ke uploadsRoot
    const rel = relativePath.replace(/^uploads\//, '')
    await unlink(join(uploadsRoot, rel))
  } catch {
    // File tidak ada atau sudah terhapus, skip
  }
}
