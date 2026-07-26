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
    console.log(`🔍 Confirmando pedido: ${id}`)

    const body = await req.json()
    const { metodo_pago } = body

    // 1. Obtener pedido
    const { data: pedido, error: getErr } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single()

    if (getErr) {
      console.error('❌ Error al obtener pedido:', getErr)
      throw getErr
    }

    if (pedido.estado !== 'pagado') {
      console.warn(`⚠️ Pedido ${id} no está en estado "pagado" (${pedido.estado})`)
      return NextResponse.json({ success: false, error: 'El pedido no está en estado "pagado"' }, { status: 400 })
    }

    const tenant_id = pedido.tenant_id
    const items = pedido.items || []
    const total = pedido.total
    const pago = metodo_pago || pedido.metodo_pago

    console.log(`📦 Procesando ${items.length} items`)

    // 2. Descontar stock y registrar movimientos
    for (const item of items) {
      console.log(`🔍 Producto: ${item.producto_id}, Cantidad: ${item.cantidad}`)

      // Verificar producto
      const { data: prod, error: prodErr } = await supabase
        .from('productos')
        .select('stock')
        .eq('id', item.producto_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (prodErr) {
        console.error(`❌ Producto no encontrado ${item.producto_id}:`, prodErr)
        return NextResponse.json({ success: false, error: `Producto no encontrado: ${item.producto_id}` }, { status: 404 })
      }

      const nuevoStock = prod.stock - item.cantidad
      if (nuevoStock < 0) {
        console.error(`❌ Stock insuficiente para ${item.producto_id} (actual: ${prod.stock}, solicitado: ${item.cantidad})`)
        return NextResponse.json({ success: false, error: `Stock insuficiente para producto ${item.producto_id}` }, { status: 400 })
      }

      // Actualizar stock
      const { error: updateErr } = await supabase
        .from('productos')
        .update({ stock: nuevoStock })
        .eq('id', item.producto_id)
        .eq('tenant_id', tenant_id)

      if (updateErr) {
        console.error(`❌ Error al actualizar stock de ${item.producto_id}:`, updateErr)
        return NextResponse.json({ success: false, error: `Error al actualizar stock: ${updateErr.message}` }, { status: 500 })
      }
      console.log(`✅ Stock actualizado: ${item.producto_id} -> ${nuevoStock}`)

      // Registrar movimiento de salida
      const { error: movErr } = await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: item.producto_id,
          tenant_id,
          tipo: 'salida',
          cantidad: item.cantidad,
          descripcion: `Pedido #${id} (confirmado)`,
          created_at: new Date().toISOString()
        })

      if (movErr) {
        console.error(`❌ Error al registrar movimiento para ${item.producto_id}:`, movErr)
        // No interrumpimos el flujo, solo log
      } else {
        console.log(`✅ Movimiento registrado para ${item.producto_id}`)
      }
    }

    // 3. Crear venta en tabla ventas (sin columna estado)
    console.log(`📝 Creando venta para pedido ${id}`)
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

    if (ventaErr) {
      console.error('❌ Error al crear venta:', ventaErr)
      return NextResponse.json({ success: false, error: `Error al crear venta: ${ventaErr.message}` }, { status: 500 })
    }
    console.log(`✅ Venta creada: ${venta.id}`)

    // 4. Insertar sale_items (opcional, pero recomendado para reportes)
    const saleItems = items.map((item: any) => ({
      sale_id: venta.id,
      product_id: item.producto_id,
      quantity: item.cantidad,
      price_at_sale: item.precio,
      subtotal: item.cantidad * item.precio,
      tenant_id
    }))
    const { error: saleErr } = await supabase
      .from('sale_items')
      .insert(saleItems)
    if (saleErr) {
      console.warn('⚠️ Error al insertar sale_items (no crítico):', saleErr)
    }

    // 5. Actualizar pedido (estado a 'confirmado')
    const { error: updatePedidoErr } = await supabase
      .from('pedidos')
      .update({
        estado: 'confirmado',
        venta_id: venta.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updatePedidoErr) {
      console.error('❌ Error al actualizar pedido:', updatePedidoErr)
      return NextResponse.json({ success: false, error: `Error al actualizar pedido: ${updatePedidoErr.message}` }, { status: 500 })
    }
    console.log(`✅ Pedido ${id} actualizado a 'confirmado'`)

    // 6. Registrar transacción en finanzas
    try {
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
        console.log('✅ Transacción financiera registrada')
      }
    } catch (finErr) {
      console.warn('⚠️ Error al registrar finanzas (no crítico):', finErr)
    }

    return NextResponse.json({ success: true, data: venta })
  } catch (error: any) {
    console.error('❌ Error en confirmar pedido:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
