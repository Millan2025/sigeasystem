export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, nombre_usuario, email_contacto, categoria, modulo_relacionado, titulo, descripcion, prioridad } = body;
    
    if (!tenant_id || !titulo || !descripcion || !categoria) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('sugerencias_usuarios')
      .insert([{ 
        tenant_id, 
        nombre_usuario: nombre_usuario || null, 
        email_contacto: email_contacto || null, 
        categoria, 
        modulo_relacionado: modulo_relacionado || null, 
        titulo, 
        descripcion, 
        prioridad: prioridad || 'media', 
        estado: 'pendiente' 
      }])
      .select()
      .single();
    
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenant');
    
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('sugerencias_usuarios')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
