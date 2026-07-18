import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const tenant_id = formData.get('tenant_id') as string

    if (!file || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan archivo o tenant_id' },
        { status: 400 }
      )
    }

    // Validar tipo y tamaño
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Formato no soportado (usar JPEG, PNG, WEBP, GIF)' },
        { status: 400 }
      )
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Imagen muy grande (máximo 2MB)' },
        { status: 400 }
      )
    }

    // Verificar que el bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) throw listError
    
    const bucketExists = buckets?.some(b => b.name === 'productos-imagenes')
    if (!bucketExists) {
      // Crear el bucket si no existe (requiere service_role)
      const { error: createError } = await supabase.storage.createBucket('productos-imagenes', {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024, // 2MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      })
      if (createError) {
        return NextResponse.json(
          { success: false, error: 'Error al crear el bucket: ' + createError.message },
          { status: 500 }
        )
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${tenant_id}/${Date.now()}_${file.name.replace(/\s/g, '_')}`

    const { data, error } = await supabase.storage
      .from('productos-imagenes')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      // Si el error es que el bucket no existe, intentar crearlo de nuevo
      if (error.message?.includes('bucket not found')) {
        const { error: createError } = await supabase.storage.createBucket('productos-imagenes', {
          public: true,
          fileSizeLimit: 2 * 1024 * 1024
        })
        if (createError) {
          return NextResponse.json(
            { success: false, error: 'Error al crear el bucket: ' + createError.message },
            { status: 500 }
          )
        }
        // Reintentar la subida
        const { data: retryData, error: retryError } = await supabase.storage
          .from('productos-imagenes')
          .upload(fileName, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          })
        if (retryError) {
          return NextResponse.json(
            { success: false, error: 'Error al subir la imagen (después de crear bucket): ' + retryError.message },
            { status: 500 }
          )
        }
        const { data: urlData } = supabase.storage.from('productos-imagenes').getPublicUrl(fileName)
        return NextResponse.json({
          success: true,
          url: urlData.publicUrl,
          message: 'Imagen subida correctamente (bucket creado automáticamente)'
        })
      }
      throw error
    }

    const { data: urlData } = supabase.storage.from('productos-imagenes').getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      message: 'Imagen subida correctamente'
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
