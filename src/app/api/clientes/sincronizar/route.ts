export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Hub central de sincronización
// Llamado por POS, Domicilio, Mesas y Tienda Online
// Cada vez que un cliente compra, este endpoint actualiza su perfil
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenant_id,
      telefono,
      nombre,
      monto,
      canal,           // 'pos' | 'domicilio' | 'mesas' | 'tienda_online'
      cupon_usado,     // código de cupón si aplicó uno
      venta_id,        // ID de la venta o pedido
      items            // detalle de productos (opcional)
    } = body;

    if (!tenant_id || !telefono) {
      return NextResponse.json({
        success: false,
        error: 'tenant_id y telefono son obligatorios'
      }, { status: 400 });
    }

    const telefonoLimpio = String(telefono).replace(/\D/g, '');
    if (telefonoLimpio.length < 7) {
      return NextResponse.json({
        success: false,
        error: 'Teléfono inválido (mínimo 7 dígitos)'
      }, { status: 400 });
    }

    const hoy = new Date().toISOString().split('T')[0];
    const ahora = new Date().toISOString();
    const montoNum = Number(monto) || 0;

    // 1. Buscar cliente existente por teléfono
    const { data: clienteExistente } = await supabase
      .from('clientes_fidelizados')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('telefono', telefonoLimpio)
      .maybeSingle();

    let clienteId: string;
    let esNuevo = false;

    if (clienteExistente) {
      // 2a. Actualizar cliente existente
      const nuevasVisitas = (clienteExistente.total_visitas || 0) + 1;
      const nuevoTotalGastado = Number(clienteExistente.total_gastado || 0) + montoNum;
      const nuevoTicketPromedio = nuevoTotalGastado / nuevasVisitas;

      const { data: actualizado, error: updErr } = await supabase
        .from('clientes_fidelizados')
        .update({
          ultima_visita: ahora,
          total_visitas: nuevasVisitas,
          total_gastado: nuevoTotalGastado,
          ticket_promedio: Math.round(nuevoTicketPromedio),
          sellos_acumulados: (clienteExistente.sellos_acumulados || 0) + 1,
          origen_ultima_compra: canal || 'pos',
          // Si usó cupón, limpiar el cupón activo
          cupon_activo: cupon_usado ? null : clienteExistente.cupon_activo,
        })
        .eq('id', clienteExistente.id)
        .select()
        .single();

      if (updErr) throw updErr;
      clienteId = clienteExistente.id;
    } else {
      // 2b. Crear cliente nuevo
      esNuevo = true;
      const nombreCliente = nombre || 'Cliente nuevo';

      const { data: nuevo, error: insErr } = await supabase
        .from('clientes_fidelizados')
        .insert({
          tenant_id,
          nombre: nombreCliente,
          telefono: telefonoLimpio,
          ultima_visita: ahora,
          total_visitas: 1,
          total_gastado: montoNum,
          ticket_promedio: montoNum,
          sellos_acumulados: 1,
          puntos_acumulados: Math.floor(montoNum / 1000),
          origen_ultima_compra: canal || 'pos',
          segmento_rfm: 'nuevo',
        })
        .select()
        .single();

      if (insErr) throw insErr;
      clienteId = nuevo.id;
    }

    // 3. Registrar log de sincronización
    await supabase.from('logs_sincronizacion').insert({
      tenant_id,
      cliente_id: clienteId,
      telefono: telefonoLimpio,
      canal_origen: canal || 'pos',
      accion: 'compra',
      monto: montoNum,
      detalles: {
        venta_id: venta_id || null,
        cupon_usado: cupon_usado || null,
        es_cliente_nuevo: esNuevo,
        items_count: items ? items.length : 0,
      },
    });

    // 4. Si usó cupón, actualizar métricas del cupón en Marketing
    let cuponInfo = null;
    if (cupon_usado) {
      const { data: cupon } = await supabase
        .from('cupones_campana')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('codigo', cupon_usado.toUpperCase())
        .eq('estado', 'activo')
        .maybeSingle();

      if (cupon) {
        // Verificar que no haya expirado
        const expirado = cupon.fecha_expiracion && new Date(cupon.fecha_expiracion) < new Date();
        const agotado = cupon.usos_actuales >= cupon.usos_maximos;

        if (!expirado && !agotado) {
          // Calcular descuento aplicado
          let descuentoAplicado = 0;
          if (cupon.tipo_descuento === 'porcentaje') {
            descuentoAplicado = montoNum * (Number(cupon.valor_descuento) / 100);
          } else {
            descuentoAplicado = Number(cupon.valor_descuento);
          }

          // Actualizar cupón
          await supabase
            .from('cupones_campana')
            .update({
              usos_actuales: (cupon.usos_actuales || 0) + 1,
              ventas_generadas: Number(cupon.ventas_generadas || 0) + montoNum,
              estado: (cupon.usos_actuales + 1) >= cupon.usos_maximos ? 'agotado' : 'activo',
            })
            .eq('id', cupon.id);

          // Log de cupón redimido
          await supabase.from('logs_sincronizacion').insert({
            tenant_id,
            cliente_id: clienteId,
            telefono: telefonoLimpio,
            canal_origen: canal || 'pos',
            accion: 'cupon_redimido',
            monto: descuentoAplicado,
            detalles: {
              cupon_codigo: cupon_usado,
              cupon_id: cupon.id,
              campana: cupon.nombre_campana,
              descuento_aplicado: descuentoAplicado,
            },
          });

          cuponInfo = {
            codigo: cupon.codigo,
            campana: cupon.nombre_campana,
            descuento_aplicado: Math.round(descuentoAplicado),
          };
        }
      }
    }

    // 5. Verificar triggers de Marketing automáticos
    const triggersActivados: string[] = [];

    if (esNuevo) {
      triggersActivados.push('cliente_nuevo_bienvenida');
    }

    // Verificar si alcanzó premio de sellos (cada 10 sellos)
    const { data: clienteActualizado } = await supabase
      .from('clientes_fidelizados')
      .select('sellos_acumulados')
      .eq('id', clienteId)
      .single();

    if (clienteActualizado && clienteActualizado.sellos_acumulados > 0 && clienteActualizado.sellos_acumulados % 10 === 0) {
      triggersActivados.push('premio_sellos_alcanzado');
    }

    return NextResponse.json({
      success: true,
      cliente: {
        id: clienteId,
        es_nuevo: esNuevo,
        telefono: telefonoLimpio,
      },
      sincronizacion: {
        canal: canal || 'pos',
        monto: montoNum,
        visita_numero: clienteExistente ? (clienteExistente.total_visitas || 0) + 1 : 1,
      },
      cupon: cuponInfo,
      triggers_activados: triggersActivados,
    });
  } catch (error: any) {
    console.error('Error sincronizar cliente:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET: Obtener perfil completo de un cliente por teléfono
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get('tenant');
    const telefono = url.searchParams.get('telefono');

    if (!tenantId || !telefono) {
      return NextResponse.json({ success: false, error: 'Faltan tenant y telefono' }, { status: 400 });
    }

    const telefonoLimpio = String(telefono).replace(/\D/g, '');

    const { data: cliente, error } = await supabase
      .from('clientes_fidelizados')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('telefono', telefonoLimpio)
      .maybeSingle();

    if (error) throw error;

    if (!cliente) {
      return NextResponse.json({ success: true, cliente: null, mensaje: 'Cliente no encontrado' });
    }

    // Obtener historial de compras desde logs
    const { data: historial } = await supabase
      .from('logs_sincronizacion')
      .select('canal_origen, accion, monto, created_at, detalles')
      .eq('tenant_id', tenantId)
      .eq('telefono', telefonoLimpio)
      .eq('accion', 'compra')
      .order('created_at', { ascending: false })
      .limit(20);

    // Obtener cupones redimidos
    const { data: cuponesRedimidos } = await supabase
      .from('logs_sincronizacion')
      .select('monto, created_at, detalles')
      .eq('tenant_id', tenantId)
      .eq('telefono', telefonoLimpio)
      .eq('accion', 'cupon_redimido')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      cliente,
      historial_compras: historial || [],
      cupones_redimidos: cuponesRedimidos || [],
      resumen: {
        total_compras: historial?.length || 0,
        total_gastado: cliente.total_gastado || 0,
        canal_favorito: cliente.origen_ultima_compra || 'pos',
        segmento: cliente.segmento_rfm || 'nuevo',
        sellos: cliente.sellos_acumulados || 0,
        cupones_usados: cuponesRedimidos?.length || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}