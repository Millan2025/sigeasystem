import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'

    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('❌ Error GET /api/pedidos:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenant_id, cliente, direccion, telefono, metodo_pago, total, items, observaciones } = body

    // Validaciones básicas
    if (!tenant_id || !cliente || !items || !total) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos obligatorios: tenant_id, cliente, items, total' },
        { status: 400 }
      )
    }

    // Determinar estado inicial según método de pago
    const estadoInicial = metodo_pago === 'Crédito' ? 'pendiente' : 'pagado'

    // Insertar pedido
    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        tenant_id,
        cliente,
        direccion: direccion || '',
        telefono: telefono || '',
        metodo_pago,
        total,
        items,                // Guardamos el array como JSON
        estado: estadoInicial,
        observaciones: observaciones || '',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error al insertar pedido:', error)
      throw error
    }

    // Si el método de pago NO es Crédito, registrar venta, finanzas y descontar stock
    if (metodo_pago !== 'Crédito') {
      try {
        // 1. Crear venta
        const { data: venta, error: ventaErr } = await supabase
          .from('ventas')
          .insert({
            tenant_id,
            total,
            metodo_pago,
            cliente,
            fecha: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (ventaErr) {
          console.error('❌ Error al crear venta:', ventaErr)
        } else {
          // 2. Descontar stock y registrar movimientos
          for (const item of items) {
            // Verificar producto
            const { data: producto, error: prodErr } = await supabase
              .from('productos')
              .select('stock')
              .eq('id', item.producto_id)
              .eq('tenant_id', tenant_id)
              .single()

            if (prodErr || !producto) {
              console.warn('⚠️ Producto no encontrado:', item.producto_id)
              continue
            }

            const nuevoStock = producto.stock - item.cantidad
            if (nuevoStock < 0) {
              console.warn(`⚠️ Stock insuficiente para producto ${item.producto_id}`)
              continue
            }

            // Actualizar stock
            await supabase
              .from('productos')
              .update({ stock: nuevoStock })
              .eq('id', item.producto_id)
              .eq('tenant_id', tenant_id)

            // Registrar movimiento de salida
            await supabase
              .from('movimientos_inventario')
              .insert({
                producto_id: item.producto_id,
                tipo: 'salida',
                cantidad: item.cantidad,
                motivo: `Pedido #${data.id}`,
                tenant_id,
                created_at: new Date().toISOString()
              })
          }

          // 3. Registrar transacción en finanzas
          const { data: categoria, error: catErr } = await supabase
            .from('categorias_contables')
            .select('id')
            .eq('codigo', '4-01-01')
            .eq('tenant_id', tenant_id)
            .maybeSingle()

          if (categoria?.id) {
            await supabase
              .from('transacciones')
              .insert({
                tipo: 'ingreso',
                monto: total,
                categoria_contable_id: categoria.id,
                descripcion: `Pedido #${data.id} - ${metodo_pago}`,
                fecha: new Date().toISOString().split('T')[0],
                impuesto: 0,
                retencion: 0,
                total_con_impuestos: total,
                metodo_pago,
                tenant_id,
                referencia_id: venta.id,
                referencia_tipo: 'venta',
                created_at: new Date().toISOString()
              })
          }
        }
      } catch (e) {
        console.error('❌ Error al procesar pago/pedido:', e)
        // No bloqueamos la respuesta, solo log
      }
    } else {
      // Si es Crédito, crear registro en creditos
      try {
        await supabase
          .from('creditos')
          .insert({
            tenant_id,
            cliente,
            responsable: cliente,
            valor_total: total,
            valor_pagado: 0,
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estado: 'pendiente',
            observaciones: `Pedido #${data.id} - Crédito`
          })
      } catch (e) {
        console.error('❌ Error al crear crédito:', e)
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ Error POST /api/pedidos:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
