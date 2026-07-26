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

    if (!tenant_id || !cliente || !items || !total) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos obligatorios: tenant_id, cliente, items, total' },
        { status: 400 }
      )
    }

    // Guardar items con nombre incluido
    const itemsConNombre = items.map((item: any) => ({
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio: item.precio,
      nombre: item.nombre || 'Producto'
    }))

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
        items: itemsConNombre,
        estado: 'pendiente', // Siempre pendiente hasta confirmación del dueño
        observaciones: observaciones || '',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error al insertar pedido:', error)
      throw error
    }

    console.log('✅ Pedido insertado ID:', data.id)

    // Si el método de pago NO es Crédito, descontar stock e insertar movimientos
    if (metodo_pago !== 'Crédito') {
      console.log('💰 Pedido no-crédito. Descontando stock...')

      try {
        for (const item of items) {
          console.log(`🔍 Procesando item: ${item.producto_id}, cantidad: ${item.cantidad}`)

          // 1. Verificar producto
          const { data: producto, error: prodErr } = await supabase
            .from('productos')
            .select('stock')
            .eq('id', item.producto_id)
            .eq('tenant_id', tenant_id)
            .single()

          if (prodErr || !producto) {
            console.error(`❌ Producto no encontrado ${item.producto_id}:`, prodErr)
            return NextResponse.json({ success: false, error: `Producto no encontrado: ${item.producto_id}` }, { status: 400 })
          }

          const nuevoStock = producto.stock - item.cantidad
          if (nuevoStock < 0) {
            console.error(`❌ Stock insuficiente para ${item.producto_id} (actual: ${producto.stock}, solicitado: ${item.cantidad})`)
            return NextResponse.json({ success: false, error: `Stock insuficiente para ${item.producto_id}` }, { status: 400 })
          }

          // 2. Insertar movimiento de salida
          const { error: movErr } = await supabase
            .from('movimientos_inventario')
            .insert({
              producto_id: item.producto_id,
              tipo: 'salida',
              cantidad: item.cantidad,
              motivo: `Pedido #${data.id}`,
              tenant_id,
              created_at: new Date().toISOString()
            })

          if (movErr) {
            console.error(`❌ Error al insertar movimiento para ${item.producto_id}:`, movErr)
            return NextResponse.json({ success: false, error: `Error al insertar movimiento: ${movErr.message}` }, { status: 500 })
          }
          console.log(`✅ Movimiento insertado para ${item.producto_id}`)

          // 3. Actualizar stock en productos
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
        }

        // Crear venta (opcional, para reportes)
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

        if (!ventaErr) {
          console.log('✅ Venta creada ID:', venta.id)
          // Registrar transacción en finanzas
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
        } else {
          console.warn('⚠️ Error al crear venta (no crítico):', ventaErr)
        }

      } catch (e) {
        console.error('❌ Error al procesar pedido no-crédito:', e)
        return NextResponse.json({ success: false, error: 'Error al procesar el pedido' }, { status: 500 })
      }
    } else {
      console.log('💳 Pedido a crédito. No se descuenta stock (se hará al confirmar).')
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ Error POST /api/pedidos:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT: actualizar estado, observaciones, etc.
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, estado, observaciones } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Se requiere ID' }, { status: 400 })
    }

    const updateData: any = {}
    if (estado) updateData.estado = estado
    if (observaciones !== undefined) updateData.observaciones = observaciones
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('pedidos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ Error PUT /api/pedidos:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
