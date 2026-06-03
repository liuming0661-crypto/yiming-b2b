const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'products'

export async function uploadFile(
  path: string,
  file: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: file,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Storage upload failed: ${res.status} ${text}`)
  }

  // Public URL
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
}

export function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  }
  return map[mime] ?? 'bin'
}
