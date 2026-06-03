'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'

interface Props {
  images: string[]
  onChange: (images: string[]) => void
  token: string | null
}

export function ImageUploader({ images, onChange, token }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(files: FileList | null) {
    if (!files || !token) return
    setUploading(true)
    setError('')
    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('image', file)
      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error ?? 'Upload failed')
        uploaded.push(json.data.url)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      }
    }
    if (uploaded.length) onChange([...images, ...uploaded])
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function remove(idx: number) {
    onChange(images.filter((_, i) => i !== idx))
  }

  return (
    <div>
      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {images.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
              <Image src={url} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xl transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center cursor-pointer hover:border-gray-400 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        {uploading ? (
          <p className="text-sm text-blue-600">Uploading…</p>
        ) : (
          <>
            <p className="text-sm text-gray-500">Click or drag images here</p>
            <p className="text-xs text-gray-400 mt-1">JPG / PNG / WEBP · max 10 MB each</p>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}
