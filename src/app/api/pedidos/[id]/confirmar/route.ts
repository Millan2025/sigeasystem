import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { metodo_pago } = body

    // 1. Obtener pedido
    const { data: pedido, error: getErr } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single()
    if (getErr) throw getErr

    // Si el pedido ya está confirmado, no hacer nada
    if (pedido.estado === 'confirmado') {
      return NextResponse.json({ success: false, error: 'El pedido ya está confirmado' }, { status: 400 })
    }

    // Si el pedido no está en estado 'pagado' (para créditos) o 'pendiente' (para no-crédito, pero debería estar pagado si ya se descontó)
    // Para simplificar, permitimos confirmar solo si estado es 'pagado' (para créditos) o 'pendiente' (para no-crédito que ya se pagó? Mejor permitimos ambos pero condicionamos el descuento)
    // En realidad, el estado después de la creación para no-crédito es 'pagado' (porque se paga en el momento). Para crédito es 'pendiente'.
    // Entonces, para no-crédito, estado debe ser 'pagado'. Para crédito, estado debe ser 'pendiente'.
    // Pero podemos permitir confirmar solo si estado es 'pagado' o 'pendiente' y actuar según el método de pago.

    const tenant_id = pedido.tenant_id
    const items = pedido.items || []
    const total = pedido.total
    const pago = metodo_pago || pedido.metodo_pago

    // 2. Si el pedido es Crédito, descontar stock (porque no se descontó al crear)
    if (pedido.metodo_pago === 'Crédito') {
      if (pedido.estado !== 'pagado') {
        // Solo si está pagado (el dueño lo marcó como pagado)
        // De lo contrario, no debería confirmarse sin pago.
        // Pero asumimos que el dueño ya marcó como pagado.
        // Si no está pagado, devolver error.
        return NextResponse.json({ success: false, error: 'El pedido a crédito debe estar marcado como "pagado" antes de confirmar' }, { status: 400 })
      }

      // Descontar stock
      for (const item of items) {
        const { data: prod, error: prodErr } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', item.producto_id)
          .eq('tenant_id', tenant_id)
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
            descripcion: `Pedido #${id} (confirmado)`,
            created_at: new Date().toISOString()
          })
      }

      // Crear venta
      const { data: venta, error: ventaErr } = await supabase
        .from('ventas')
        .insert({
          tenant_id,
          total,
          metodo_pago: pago,
          cliente: pedido.cliente,
          fecha: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      if (ventaErr) throw ventaErr

      // Registrar finanzas (ingreso)
      const { data: categoria, error: catErr } = await supabase
        .from('categorias_contables')
        .select('id')
        .eq('codigo', '4-01-01')
        .eq('tenant_id', tenant_id)
        .single()
      if (!catErr && categoria) {
        await supabase
          .from('transacciones')
          .insert({
            tipo: 'ingreso',
            monto: total,
            categoria_contable_id: categoria.id,
            descripcion: `Pedido #${id} (${pago})`,
            fecha: new Date().toISOString().split('T')[0],
            impuesto: 0,
            retencion: 0,
            total_con_impuestos: total,
            metodo_pago: pago,
            tenant_id,
            referencia_id: venta.id,
            referencia_tipo: 'venta'
          })
      }

      // Actualizar crédito (si existe)
      try {
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
      } catch (e) {}

      // Actualizar pedido con venta_id
      await supabase
        .from('pedidos')
        .update({
          estado: 'confirmado',
          venta_id: venta.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      return NextResponse.json({ success: true, data: venta })

    } else {
      // Si NO es Crédito, el stock ya se descontó al crear el pedido.
      // Solo confirmar el pedido (cambiar estado a 'confirmado') y crear orden de producción si procede.
      // Además, verificar que ya tenga venta asociada (se creó en el POST)
      // Si no tiene venta, crearla (por si acaso)
      let ventaId = pedido.venta_id
      if (!ventaId) {
        // Crear venta (aunque ya debería existir)
        const { data: venta, error: ventaErr } = await supabase
          .from('ventas')
          .insert({
            tenant_id,
            total,
            metodo_pago: pago,
            cliente: pedido.cliente,
            fecha: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        if (ventaErr) throw ventaErr
        ventaId = venta.id
      }

      // Actualizar pedido
      await supabase
        .from('pedidos')
        .update({
          estado: 'confirmado',
          venta_id: ventaId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      return NextResponse.json({ success: true, message: 'Pedido confirmado' })
    }

  } catch (error: any) {
    console.error('❌ Error en confirmar pedido:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
