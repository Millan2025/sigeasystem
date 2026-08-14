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
  const startTime = Date.now()

  try {
    const { id } = await params
    const body = await req.json()
    const metodo_pago = body.metodo_pago

    const { data: pedido, error: getErr } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single()
    if (getErr) throw getErr

    if (pedido.estado === 'confirmado') {
      return NextResponse.json({ success: false, error: 'Pedido ya confirmado' }, { status: 400 })
    }

    const tenant_id = pedido.tenant_id
    const items: any[] = pedido.items || []
    const total = pedido.total
    const pago = metodo_pago || pedido.metodo_pago
    const fechaISO = new Date().toISOString()
    const fechaStr = fechaISO.split('T')[0]

    const productosIds: string[] = items.map((item: any) => item.producto_id)
    const [productosResult, catResult] = await Promise.all([
      supabase
        .from('productos')
        .select('id, stock')
        .in('id', productosIds)
        .eq('tenant_id', tenant_id),
      supabase
        .from('categorias_contables')
        .select('id')
        .eq('codigo', '4-01-01')
        .eq('tenant_id', tenant_id)
        .maybeSingle()
    ])

    if (productosResult.error) throw productosResult.error
    const productos: any[] = productosResult.data || []
    const categoria = catResult.data
    const prodMap = new Map<string, any>(productos.map((p: any) => [p.id, p]))

    for (const item of items) {
      const prod = prodMap.get(item.producto_id)
      if (!prod) throw new Error('Producto no encontrado: ' + item.producto_id)
      if (prod.stock < item.cantidad) {
        return NextResponse.json(
          { success: false, error: 'Stock insuficiente para ' + item.producto_id },
          { status: 400 }
        )
      }
    }

    const updatesStock = items.map((item: any) => {
      const prod = prodMap.get(item.producto_id)!
      return supabase
        .from('productos')
        .update({ stock: prod.stock - item.cantidad })
        .eq('id', item.producto_id)
        .eq('tenant_id', tenant_id)
    })
    await Promise.all(updatesStock)

    const movimientos = items.map((item: any) => ({
      producto_id: item.producto_id,
      tenant_id,
      tipo: 'salida',
      cantidad: item.cantidad,
      motivo: 'Pedido #' + id.substring(0, 8) + ' (confirmado)',
      created_at: fechaISO
    }))

    const [movsResult, ventaResult] = await Promise.all([
      supabase.from('movimientos_inventario').insert(movimientos),
      supabase
        .from('ventas')
        .insert({
          tenant_id,
          total,
          metodo_pago: pago,
          cliente: pedido.cliente,
          fecha: fechaStr,
          created_at: fechaISO
        })
        .select()
        .single()
    ])

    if (movsResult.error) throw movsResult.error
    if (ventaResult.error) throw ventaResult.error
    const venta = ventaResult.data!

    const ops: any[] = [
      supabase
        .from('pedidos')
        .update({
          estado: 'confirmado',
          venta_id: venta.id,
          updated_at: fechaISO
        })
        .eq('id', id),
      supabase
        .from('usuarios')
        .select('id')
        .eq('tenant_id', tenant_id)
    ]

    if (categoria) {
      ops.push(
        supabase.from('transacciones').insert({
          tipo: 'ingreso',
          monto: total,
          categoria_contable_id: categoria.id,
          descripcion: 'Pedido #' + id.substring(0, 8) + ' (' + pago + ')',
          fecha: fechaStr,
          impuesto: 0,
          retencion: 0,
          total_con_impuestos: total,
          metodo_pago: pago,
          tenant_id,
          referencia_id: venta.id,
          referencia_tipo: 'venta',
          created_at: fechaISO
        })
      )
    }

    const results = await Promise.all(ops)
    const usuariosResult = results[results.length - 1]

    if (usuariosResult.data && usuariosResult.data.length > 0) {
      const notificaciones = usuariosResult.data.map((u: any) => ({
        tenant_id,
        user_id: u.id,
        tipo: 'venta',
        titulo: 'Pedido confirmado',
        mensaje: 'Pedido #' + id.substring(0, 8) + ' de ' + pedido.cliente + ' confirmado - $' + total,
        icono: 'exito',
        color: 'green',
        datos: { pedido_id: id, venta_id: venta.id }
      }))
      await supabase.from('notificaciones').insert(notificaciones)
    }

    const totalTime = Date.now() - startTime
    console.log('Pedido confirmado en', totalTime, 'ms - ID:', id, 'Venta:', venta.id)

    return NextResponse.json({ success: true, data: venta, tiempo_ms: totalTime })

  } catch (error: any) {
    console.error('Error en confirmar pedido:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
