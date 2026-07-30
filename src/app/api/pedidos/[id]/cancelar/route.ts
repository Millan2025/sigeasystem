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

    // 1. Obtener el pedido con sus items
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*, items')
      .eq('id', id)
      .single()

    if (pedidoError || !pedido) {
      console.error('❌ Pedido no encontrado:', pedidoError)
      return NextResponse.json(
        { success: false, error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    console.log(`📦 Pedido encontrado: ${pedido.id}, estado actual: ${pedido.estado}`)

    // 2. VALIDAR ESTADO - IMPEDIR CANCELACIONES MÚLTIPLES
    if (pedido.estado === 'cancelado') {
      console.warn(`⚠️ El pedido ${id} ya está cancelado. No se permite reversión.`)
      return NextResponse.json(
        { success: false, error: 'El pedido ya está cancelado. No se puede cancelar de nuevo.' },
        { status: 400 }
      )
    }

    if (pedido.estado === 'entregado' || pedido.estado === 'despachado') {
      console.warn(`⚠️ El pedido ${id} ya está ${pedido.estado}. No se puede cancelar.`)
      return NextResponse.json(
        { success: false, error: `No se puede cancelar un pedido en estado "${pedido.estado}"` },
        { status: 400 }
      )
    }

    // 3. ACTUALIZAR ESTADO A 'cancelado' PRIMERO (para evitar reversiones duplicadas)
    console.log('🔄 Actualizando estado a "cancelado"...')
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        estado: 'cancelado',
        cancelado_en: new Date().toISOString(),
        cancelado_por: usuario_id || 'sistema',
        motivo_cancelacion: motivo || 'Cancelado por usuario',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('❌ Error al actualizar estado:', updateError)
      return NextResponse.json(
        { success: false, error: `Error al actualizar estado: ${updateError.message}` },
        { status: 500 }
      )
    }
    console.log('✅ Estado actualizado a "cancelado"')

    // 4. Revertir inventario (sumar stock) solo si el pedido NO es crédito
    const esCredito = pedido.metodo_pago === 'Crédito'
    if (!esCredito && pedido.items && pedido.items.length > 0) {
      console.log('🔄 Revertiendo inventario...')
      for (const item of pedido.items) {
        console.log(`   Producto ${item.producto_id}, cantidad: ${item.cantidad}`)
        const { data: producto, error: prodErr } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', item.producto_id)
          .eq('tenant_id', pedido.tenant_id)
          .single()

        if (prodErr) {
          console.error(`❌ Error al obtener producto ${item.producto_id}:`, prodErr)
          continue // Continuar con otros items en lugar de fallar todo
        }

        const nuevoStock = (producto?.stock || 0) + item.cantidad
        console.log(`   Stock actual: ${producto?.stock || 0}, nuevo: ${nuevoStock}`)

        const { error: updateStockErr } = await supabase
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id', item.producto_id)
          .eq('tenant_id', pedido.tenant_id)

        if (updateStockErr) {
          console.error(`❌ Error al actualizar stock de ${item.producto_id}:`, updateStockErr)
          continue
        }

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

    // 5. Revertir finanzas (si existe transacción)
    console.log('🔄 Revertiendo finanzas...')
    const { data: transaccion } = await supabase
      .from('transacciones')
      .select('id')
      .eq('referencia_id', id)
      .eq('referencia_tipo', 'pedido')
      .maybeSingle()

    if (transaccion) {
      console.log(`   Transacción encontrada: ${transaccion.id}, eliminando...`)
      const { error: deleteError } = await supabase
        .from('transacciones')
        .delete()
        .eq('id', transaccion.id)

      if (deleteError) {
        console.error('❌ Error al eliminar transacción:', deleteError)
        // No interrumpimos el flujo, pero lo logueamos
      } else {
        console.log('   ✅ Transacción eliminada')
      }
    } else {
      console.log('   ℹ️ No se encontró transacción, creando egreso compensatorio...')
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

    console.log('✅ Pedido cancelado exitosamente')
    return NextResponse.json({
      success: true,
      message: 'Pedido cancelado exitosamente',
      pedido_id: id
    })

  } catch (error: any) {
    console.error('❌ Error al cancelar pedido:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}