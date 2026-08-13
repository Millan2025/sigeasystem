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

    if (pedido.estado === 'confirmado') {
      return NextResponse.json({ success: false, error: 'El pedido ya está confirmado' }, { status: 400 })
    }

    const tenant_id = pedido.tenant_id
    const items = pedido.items || []
    const total = pedido.total
    const pago = metodo_pago || pedido.metodo_pago

    console.log('🔒 Confirmando pedido. Descontando stock y creando venta...')

    // 2. Descontar stock de todos los items
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
          motivo: `Pedido #${id} (confirmado)`,
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
        cliente: pedido.cliente,
        fecha: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    if (ventaErr) throw ventaErr

    // 4. Registrar transacción financiera
    const { data: categoria, error: catErr } = await supabase
      .from('categorias_contables')
      .select('id')
      .eq('codigo', '4-01-01')
      .eq('tenant_id', tenant_id)
      .maybeSingle()
    
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
          referencia_tipo: 'venta',
          created_at: new Date().toISOString()
        })
    }

    // 5. Actualizar pedido
    await supabase
      .from('pedidos')
      .update({
        estado: 'confirmado',
        venta_id: venta.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    return NextResponse.json({ success: true, data: venta })

  } catch (error: any) {
    console.error('❌ Error en confirmar pedido:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
