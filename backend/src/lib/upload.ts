import { writeFile, unlink } from 'node:fs/promises'
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Dari dist/lib/ → ../../ = /app/  →  /app/uploads
export const uploadsRoot = join(__dirname, '../../uploads')

export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_SIZE = 5 * 1024 * 1024 // 5MB

type UploadProfile = {
  maxWidth: number
  maxHeight: number
  quality: number
}

const DEFAULT_UPLOAD_PROFILE: UploadProfile = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 78,
}

const UPLOAD_PROFILES: Record<string, UploadProfile> = {
  articles: { maxWidth: 1600, maxHeight: 900, quality: 78 },
  gallery: { maxWidth: 1920, maxHeight: 1280, quality: 80 },
  struktur: { maxWidth: 512, maxHeight: 512, quality: 80 },
}

export function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Hanya jpg, png, atau webp yang diizinkan'
  if (file.size > MAX_SIZE) return 'Ukuran file maksimal 5MB'
  return null
}

function getUploadProfile(subfolder: string): UploadProfile {
  return UPLOAD_PROFILES[subfolder] ?? DEFAULT_UPLOAD_PROFILE
}

/**
 * Simpan file ke uploads/<subfolder>/ dan kembalikan path relatif yang disimpan di DB.
 * Path format: uploads/<subfolder>/<timestamp>-<hex>.<ext>
 */
export async function saveFile(file: File, subfolder: string): Promise<string> {
  const normalizedSubfolder = subfolder.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'misc'
  const dir = join(uploadsRoot, normalizedSubfolder)
  mkdirSync(dir, { recursive: true })

  const profile = getUploadProfile(normalizedSubfolder)
  const filename = `${Date.now()}-${randomBytes(4).toString('hex')}.webp`
  const inputBuffer = Buffer.from(await file.arrayBuffer())
  const optimizedBuffer = await sharp(inputBuffer, { failOn: 'none' })
    .rotate()
    .resize({
      width: profile.maxWidth,
      height: profile.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality: profile.quality,
      effort: 4,
    })
    .toBuffer()
  await writeFile(join(dir, filename), optimizedBuffer)

  return `uploads/${normalizedSubfolder}/${filename}`
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

/**
 * Generate thumbnail URL dari original image path
 * Frontend can use this to request resized thumbnails
 */
export function getThumbnailPath(originalPath: string, width: number = 400): string {
  // Returns the original path with thumbnail parameter
  // The frontend or CDN can use this to request a specific size
  // For now, we return the original - the browser will handle resizing via width/height attributes
  return originalPath
}

/**
 * Get optimal image dimensions for different use cases
 */
export const IMAGE_SIZES = {
  gallery_thumbnail: { width: 400, height: 280 },
  article_thumbnail: { width: 240, height: 170 },
  article_hero: { width: 760, height: 428 },
  article_card: { width: 300, height: 144 },
  avatar: { width: 96, height: 96 },
} as const
