export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenant');
    const segmento = url.searchParams.get('tipo') || 'todos';
    const canal = url.searchParams.get('canal'); // filtrar por canal preferido

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant' }, { status: 400 });
    }

    let query = supabase
      .from('clientes_fidelizados')
      .select('id, nombre, telefono, ultima_visita, total_visitas, total_gastado, ticket_promedio, segmento_rfm, canal_preferido, cupon_activo, fecha_ultimo_contacto')
      .eq('tenant_id', tenantId);

    // Filtrar por segmento RFM
    switch (segmento) {
      case 'vip':
        query = query.eq('segmento_rfm', 'vip');
        break;
      case 'activo':
        query = query.eq('segmento_rfm', 'activo');
        break;
      case 'en_riesgo':
        query = query.eq('segmento_rfm', 'en_riesgo');
        break;
      case 'inactivo':
        query = query.eq('segmento_rfm', 'inactivo');
        break;
      case 'nuevo':
        query = query.eq('segmento_rfm', 'nuevo');
        break;
      case 'inactivos_30d':
        const hace30 = new Date(Date.now() - 30 * 86400000).toISOString();
        query = query.or(`ultima_visita.lt.${hace30},ultima_visita.is.null`);
        break;
      case 'cumpleanos_mes':
        const mesActual = String(new Date().getMonth() + 1).padStart(2, '0');
        query = query.ilike('fecha_cumpleanos', `%-${mesActual}-%`);
        break;
      case 'con_cupon_pendiente':
        query = query.not('cupon_activo', 'is', null);
        break;
      case 'sin_compra_mes':
        const haceMes = new Date(Date.now() - 30 * 86400000).toISOString();
        query = query.or(`ultima_visita.lt.${haceMes},ultima_visita.is.null`);
        break;
      case 'mejores_gastadores':
        query = query.order('total_gastado', { ascending: false }).limit(20);
        break;
      case 'mas_frecuentes':
        query = query.order('total_visitas', { ascending: false }).limit(20);
        break;
      // 'todos' no aplica filtro adicional
    }

    // Filtrar por canal preferido si se especifica
    if (canal && canal !== 'todos') {
      query = query.eq('canal_preferido', canal);
    }

    const { data, error } = await query.order('total_gastado', { ascending: false });
    if (error) throw error;

    // Filtrar teléfonos válidos
    const clientesValidos = (data || []).filter((c: any) => {
      const tel = String(c.telefono || '').replace(/\D/g, '');
      return tel.length >= 7;
    });

    // Calcular estadísticas del segmento
    const stats = {
      total_clientes: clientesValidos.length,
      total_gastado_segmento: clientesValidos.reduce((s: number, c: any) => s + Number(c.total_gastado || 0), 0),
      ticket_promedio_segmento: clientesValidos.length > 0
        ? Math.round(clientesValidos.reduce((s: number, c: any) => s + Number(c.ticket_promedio || 0), 0) / clientesValidos.length)
        : 0,
      visitas_promedio: clientesValidos.length > 0
        ? Math.round(clientesValidos.reduce((s: number, c: any) => s + Number(c.total_visitas || 0), 0) / clientesValidos.length)
        : 0,
    };

    return NextResponse.json({
      success: true,
      segmento,
      stats,
      clientes: clientesValidos,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}