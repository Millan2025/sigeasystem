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
    const { tenant_id, mesa_codigo, token_dispositivo, juego_id, respuesta } = body;

    if (!tenant_id || !mesa_codigo || !token_dispositivo || !juego_id) {
      return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
    }

    // 1. Obtener o crear sesión de la mesa
    let { data: sesion } = await supabase
      .from('conecta_sesiones')
      .select('*')
      .eq('mesa_codigo', mesa_codigo)
      .eq('tenant_id', tenant_id)
      .eq('estado', 'activa')
      .order('creado_en', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sesion) {
      const { data: nuevaSesion } = await supabase
        .from('conecta_sesiones')
        .insert({
          tenant_id,
          mesa_codigo,
          token_sesion: crypto.randomUUID(),
          estado: 'activa'
        })
        .select()
        .single();
      sesion = nuevaSesion;
    }

    // 2. Guardar la respuesta de este dispositivo
    await supabase.from('conecta_respuestas').insert({
      sesion_id: sesion.id,
      juego_id,
      token_dispositivo,
      respuesta
    });

    // 3. Verificar si hay respuestas de OTROS dispositivos en esta misma sesión y juego
    const { data: otrasRespuestas } = await supabase
      .from('conecta_respuestas')
      .select('*')
      .eq('sesion_id', sesion.id)
      .eq('juego_id', juego_id)
      .neq('token_dispositivo', token_dispositivo);

    // 4. Lógica de Revelación (Dopamina)
    if (otrasRespuestas && otrasRespuestas.length > 0) {
      // ¡Hay al menos otra persona que jugó! Momento de la revelación.
      const ultimaOtraRespuesta = otrasRespuestas[otrasRespuestas.length - 1];
      const coinciden = ultimaOtraRespuesta.respuesta === respuesta;

      // Obtener datos del juego para el mensaje
      const { data: juego } = await supabase
        .from('conecta_juegos')
        .select('*')
        .eq('id', juego_id)
        .single();

      // 5. GENERAR PREMIO AUTOMÁTICO (Integración con Marketing)
      const codigoCupon = `CONECTA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      await supabase.from('cupones_campana').insert({
        tenant_id,
        nombre_campana: 'Premio Experiencia Conecta',
        codigo: codigoCupon,
        tipo_descuento: 'descuento_porcentaje',
        valor_descuento: 10, // 10% de descuento
        usos_maximos: 1,
        usos_actuales: 0,
        segmento_destino: 'mesa_actual',
        fecha_expiracion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Vence hoy
        estado: 'activo'
      });

      // Marcar sesión como completada (para que no sigan jugando infinitamente y abusando del cupón)
      await supabase
        .from('conecta_sesiones')
        .update({ estado: 'completada', premio_generado: codigoCupon, completado_en: new Date().toISOString() })
        .eq('id', sesion.id);

      return NextResponse.json({
        success: true,
        estado: 'revelacion',
        coinciden,
        mensaje: coinciden ? (juego?.peso_revelacion || '¡Increíble sintonía!') : '¡Tienen misterios por descubrir! 😄',
        premio: {
          codigo: codigoCupon,
          descripcion: '¡10% de descuento en tu cuenta! Muéstraselo al mesero.'
        }
      });
    } else {
      // Aún no hay nadie más, o es el primero en jugar
      return NextResponse.json({
        success: true,
        estado: 'esperando',
        mensaje: '¡Respuesta guardada! Esperando a que tu acompañante responda en su celular...'
      });
    }
  } catch (error: any) {
    console.error('Error conecta jugar:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}