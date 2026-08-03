import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tenant = formData.get('tenant') as string;

    if (!file || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Faltan archivo o tenant' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const fileName = Date.now() + '_' + file.name;
    const path = tenant + '/' + fileName;

    const { error } = await supabase.storage
      .from('productos-imagenes')
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error al subir imagen:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('productos-imagenes')
      .getPublicUrl(path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
