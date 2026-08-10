import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenant_id, user_id, tipo, titulo, mensaje, icono = 'default', color = 'blue', datos = {} } = body;

    if (!tenant_id || !titulo || !mensaje) {
      return NextResponse.json({ success: false, error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Si no se especifica user_id, obtener todos los usuarios del tenant
    let userIds: string[] = [];
    if (user_id) {
      userIds = [user_id];
    } else {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id')
        .eq('tenant_id', tenant_id);
      userIds = usuarios?.map(u => u.id) || [];
    }

    // Insertar notificación para cada usuario
    const notificaciones = userIds.map(uid => ({
      tenant_id, user_id: uid, tipo, titulo, mensaje, icono, color, datos
    }));

    const { data, error } = await supabase
      .from('notificaciones')
      .insert(notificaciones)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data, count: data?.length || 0 });
  } catch (error: any) {
    console.error('Error enviando notificación:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
