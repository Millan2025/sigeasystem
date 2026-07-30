import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { motivo, usuario_id } = body

    console.log(`🔍 Cancelando pedido ${id}...`)

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*, items')
      .eq('id', id)
      .single()

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    if (pedido.estado === 'cancelado') {
      return NextResponse.json(
        { success: false, error: 'El pedido ya está cancelado' },
        { status: 400 }
      )
    }

    if (pedido.estado === 'entregado' || pedido.estado === 'despachado') {
      return NextResponse.json(
        { success: false, error: 'No se puede cancelar un pedido ya despachado o entregado' },
        { status: 400 }
      )
    }

    const esCredito = pedido.metodo_pago === 'Crédito'
    if (!esCredito && pedido.items && pedido.items.length > 0) {
      console.log('🔄 Revertiendo inventario...')
      for (const item of pedido.items) {
        const { data: producto } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', item.producto_id)
          .eq('tenant_id', pedido.tenant_id)
          .single()

        const nuevoStock = (producto?.stock || 0) + item.cantidad

        await supabase
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id', item.producto_id)
          .eq('tenant_id', pedido.tenant_id)

        await supabase
          .from('movimientos_inventario')
          .insert({
            producto_id: item.producto_id,
            tipo: 'entrada',
            cantidad: item.cantidad,
            motivo: `Reversión de pedido #${id}`,
            tenant_id: pedido.tenant_id,
            created_at: new Date().toISOString()
          })
      }
    }

    console.log('🔄 Revertiendo finanzas...')
    const { data: transaccion } = await supabase
      .from('transacciones')
      .select('id')
      .eq('referencia_id', id)
      .eq('referencia_tipo', 'pedido')
      .maybeSingle()

    if (transaccion) {
      await supabase
        .from('transacciones')
        .delete()
        .eq('id', transaccion.id)
    } else {
      const { data: categoria } = await supabase
        .from('categorias_contables')
        .select('id')
        .eq('codigo', '4-01-99')
        .eq('tenant_id', pedido.tenant_id)
        .maybeSingle()

      await supabase
        .from('transacciones')
        .insert({
          tipo: 'egreso',
          monto: pedido.total,
          categoria_contable_id: categoria?.id || null,
          descripcion: `Reversión de pedido #${id} - ${motivo || 'Cancelación'}`,
          fecha: new Date().toISOString().split('T')[0],
          tenant_id: pedido.tenant_id,
          referencia_tipo: 'cancelacion',
          referencia_id: id,
          total_con_impuestos: pedido.total,
          metodo_pago: pedido.metodo_pago || 'Otro',
          created_at: new Date().toISOString()
        })
    }

    await supabase
      .from('pedidos')
      .update({
        estado: 'cancelado',
        cancelado_en: new Date().toISOString(),
        cancelado_por: usuario_id || 'sistema',
        motivo_cancelacion: motivo || 'Cancelado por usuario',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      message: 'Pedido cancelado exitosamente',
      pedido_id: id
    })

  } catch (error: any) {
    console.error('❌ Error al cancelar pedido:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}