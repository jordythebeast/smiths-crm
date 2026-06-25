'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import type { JobPhoto } from '@/lib/types'
import { deletePhoto } from '@/app/actions/jobs'

interface Props {
  jobId: string
  existingPhotos: JobPhoto[]
}

export default function PhotoUpload({ jobId, existingPhotos }: Props) {
  const [photos, setPhotos] = useState<JobPhoto[]>(existingPhotos)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploading(true)
    setError(null)

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${jobId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(path, file)

      if (uploadError) {
        setError('Upload failed: ' + uploadError.message)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('job-photos')
        .getPublicUrl(path)

      const { data: photoRecord, error: dbError } = await supabase
        .from('job_photos')
        .insert({
          job_id: jobId,
          storage_path: path,
          public_url: urlData.publicUrl,
          photo_type: 'check_in',
        })
        .select()
        .single()

      if (dbError) {
        setError('Failed to save photo: ' + dbError.message)
      } else {
        setPhotos((prev) => [...prev, photoRecord])
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDelete(photo: JobPhoto) {
    await deletePhoto(photo.id, photo.storage_path, jobId)
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {photos.map((photo) => (
          <div key={photo.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
            <Image
              src={photo.public_url || ''}
              alt={photo.caption || 'Job photo'}
              fill
              className="object-cover"
            />
            <button
              onClick={() => handleDelete(photo)}
              className="absolute top-1 right-1 bg-black/70 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        ))}

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-red-400 hover:text-red-500 transition-colors"
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <Camera size={20} />
              <span className="text-xs">Add photo</span>
            </>
          )}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
