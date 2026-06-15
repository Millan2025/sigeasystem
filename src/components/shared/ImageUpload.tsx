'use client'

import { useState } from 'react'
import { Upload, X, Camera } from 'lucide-react'

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  currentImage?: string | null
}

export default function ImageUpload({ onImageUploaded, currentImage }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    
    // Crear preview local
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      // Subir a Supabase Storage
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const fileName = `${Date.now()}-${file.name.replace(/\s/g,'_')}`
      
      const { data, error } = await supabase.storage
        .from('productos')
        .upload(fileName, file)

      if (error) throw error

      // Obtener URL firmada
      const { data: urlData } = await supabase.storage
        .from('productos')
        .createSignedUrl(data.path, 60 * 60 * 24 * 7) // 7 días

      if (urlData?.signedUrl) {
        onImageUploaded(urlData.signedUrl)
      }
    } catch (error) {
      console.error('Error uploading:', error)
      alert('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative">
      <label className="cursor-pointer block">
        {preview ? (
          <div className="relative group">
            <img src={preview} alt="Producto" className="w-full h-48 object-cover rounded-xl border-2 border-stone-200" />
            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
              <span className="text-white text-sm ml-2">Cambiar foto</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-48 bg-stone-100 rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center hover:bg-stone-50 transition">
            <Upload className="w-8 h-8 text-stone-400 mb-2" />
            <span className="text-sm text-stone-500 font-medium">Subir foto del producto</span>
            <span className="text-xs text-stone-400 mt-1">JPG, PNG, WebP</span>
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
      </label>
      {uploading && (
        <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-sm text-stone-600">Subiendo...</span>
        </div>
      )}
    </div>
  )
}
