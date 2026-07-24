import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { metodo_pago } = body

    // 1. Obtener el pedido
    const { data: pedido, error: getErr } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single()
    if (getErr) throw getErr
    if (pedido.estado !== 'pendiente') {
      return NextResponse.json({ success: false, error: 'El pedido ya fue procesado' }, { status: 400 })
    }

    const tenant_id = pedido.tenant_id
    const items = pedido.items
    const total = pedido.total
    const pago = metodo_pago || pedido.metodo_pago

    // 2. Descontar stock
    for (const item of items) {
      const { data: prod, error: prodErr } = await supabase
        .from('productos')
        .select('stock')
        .eq('id', item.producto_id)
        .single()
      if (prodErr) throw prodErr

      const nuevoStock = prod.stock - item.cantidad
      if (nuevoStock < 0) {
        return NextResponse.json({ success: false, error: `Stock insuficiente para ${item.producto_id}` }, { status: 400 })
      }

      await supabase
        .from('productos')
        .update({ stock: nuevoStock })
        .eq('id', item.producto_id)
        .eq('tenant_id', tenant_id)

      await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: item.producto_id,
          tenant_id,
          tipo: 'salida',
          cantidad: item.cantidad,
          descripcion: `Pedido #${id}`,
          created_at: new Date().toISOString()
        })
    }

    // 3. Crear venta
    const { data: venta, error: ventaErr } = await supabase
      .from('ventas')
      .insert({
        tenant_id,
        total,
        metodo_pago: pago,
        estado: 'completada',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    if (ventaErr) throw ventaErr

    // 4. Actualizar pedido
    await supabase
      .from('pedidos')
      .update({
        estado: 'confirmado',
        venta_id: venta.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    // 5. Si es Crédito
    if (pago === 'Crédito') {
      const { data: credito, error: credErr } = await supabase
        .from('creditos')
        .select('id, saldo_pendiente, valor_pagado')
        .eq('tenant_id', tenant_id)
        .eq('cliente', pedido.cliente)
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!credErr && credito) {
        const nuevoSaldo = credito.saldo_pendiente - total
        await supabase
          .from('creditos')
          .update({
            valor_pagado: (credito.valor_pagado || 0) + total,
            saldo_pendiente: nuevoSaldo,
            estado: nuevoSaldo <= 0 ? 'pagado' : 'pendiente'
          })
          .eq('id', credito.id)
      }

      const { data: categoria, error: catErr } = await supabase
        .from('categorias_contables')
        .select('id')
        .eq('codigo', '1-01-01')
        .eq('tenant_id', tenant_id)
        .single()

      if (!catErr && categoria) {
        await supabase
          .from('transacciones')
          .insert({
            tipo: 'ingreso',
            monto: total,
            categoria_contable_id: categoria.id,
            descripcion: `Pedido #${id} (Crédito confirmado)`,
            fecha: new Date().toISOString().split('T')[0],
            impuesto: 0,
            retencion: 0,
            total_con_impuestos: total,
            metodo_pago: 'Crédito',
            tenant_id,
            referencia_id: venta.id,
            referencia_tipo: 'venta'
          })
      }
    }

    return NextResponse.json({ success: true, data: venta })
  } catch (error: any) {
    console.error('❌ Error en confirmar pedido:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
