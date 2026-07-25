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
    const pedido_id = formData.get('pedido_id') as string

    if (!file || !pedido_id) {
      return NextResponse.json({ success: false, error: 'Faltan archivo o pedido_id' }, { status: 400 })
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Formato no soportado' }, { status: 400 })
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'Imagen muy grande (máximo 2MB)' }, { status: 400 })
    }

    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === 'comprobantes-pedidos')
    if (!bucketExists) {
      await supabase.storage.createBucket('comprobantes-pedidos', {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `${pedido_id}/${Date.now()}_${file.name.replace(/\s/g, '_')}`
    const { error } = await supabase.storage
      .from('comprobantes-pedidos')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })
    if (error) throw error

    const { data: urlData } = supabase.storage.from('comprobantes-pedidos').getPublicUrl(fileName)

    const { error: updateErr } = await supabase
      .from('pedidos')
      .update({ comprobante_url: urlData.publicUrl })
      .eq('id', pedido_id)
    if (updateErr) throw updateErr

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      message: 'Comprobante subido correctamente'
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
