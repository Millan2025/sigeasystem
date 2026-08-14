import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenant');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    console.log('🔔 GET /api/notificaciones:', data?.length || 0, 'notificaciones para', tenantId);
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('❌ Error GET /api/notificaciones:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, tenant_id, leida, marcar_todas } = body;

    if (marcar_todas && tenant_id) {
      // Marcar todas como leídas para el tenant
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida: true })
        .eq('tenant_id', tenant_id)
        .eq('leida', false);

      if (error) throw error;
      console.log('✅ Todas marcadas como leídas para tenant:', tenant_id);
      return NextResponse.json({ success: true });
    }

    if (id && tenant_id) {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leida })
        .eq('id', id)
        .eq('tenant_id', tenant_id);

      if (error) throw error;
      console.log('✅ Notificación marcada:', id, '-> leida:', leida);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ Error PATCH /api/notificaciones:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
