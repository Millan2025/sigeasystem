import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar SERVICE_ROLE_KEY para bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    const estado = url.searchParams.get('estado')
    const pedidoId = url.searchParams.get('pedido_id')

    let query = supabase
      .from('ordenes_produccion')
      .select(`
        *,
        producto:producto_id(id, nombre, stock, precio_compra, es_producido),
        insumos:produccion_insumos(
          id,
          insumo_id,
          cantidad,
          precio_unitario,
          subtotal,
          insumo:insumo_id(id, nombre, stock, precio_compra)
        )
      `)
      .eq('tenant_id', tenantId)
      .order('creado_en', { ascending: false })

    if (estado && estado !== 'todos') query = query.eq('estado', estado)
    if (pedidoId) query = query.eq('pedido_id', pedidoId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pedido_id, tenant_id, tipo, producto_id, cantidad_producida, insumos, nota, creado_por } = body

    if (!tenant_id || !producto_id || !insumos || insumos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos: tenant_id, producto_id, insumos' },
        { status: 400 }
      )
    }

    // Verificar que el producto terminado existe y es producido
    const { data: producto, error: prodErr } = await supabase
      .from('productos')
      .select('id, nombre, es_producido')
      .eq('id', producto_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (prodErr || !producto || !producto.es_producido) {
      return NextResponse.json(
        { success: false, error: 'El producto seleccionado no es válido o no está marcado como producido.' },
        { status: 400 }
      )
    }

    // Obtener precios de insumos y calcular subtotales
    const insumosConPrecios = []
    let totalCosto = 0
    for (const ins of insumos) {
      const { data: insumo, error: insErr } = await supabase
        .from('productos')
        .select('id, nombre, precio_compra, es_insumo')
        .eq('id', ins.insumo_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (insErr || !insumo || !insumo.es_insumo) {
        return NextResponse.json(
          { success: false, error: `El insumo ${ins.insumo_id} no es válido.` },
          { status: 400 }
        )
      }
      const subtotal = ins.cantidad * (insumo.precio_compra || 0)
      insumosConPrecios.push({
        insumo_id: ins.insumo_id,
        cantidad: ins.cantidad,
        precio_unitario: insumo.precio_compra || 0,
        subtotal,
        nombre: insumo.nombre,
      })
      totalCosto += subtotal
    }

    // 1. Insertar la orden
    const { data: orden, error: insertErr } = await supabase
      .from('ordenes_produccion')
      .insert({
        pedido_id: pedido_id || null,
        tenant_id,
        tipo: tipo || 'pedido_pos',
        producto_id,
        cantidad_producida: cantidad_producida || 1,
        nota: nota || '',
        creado_por: creado_por || 'Sistema',
        estado: 'pendiente',
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      })
      .select()
      .single()

    if (insertErr) throw insertErr

    // 2. Insertar los insumos en produccion_insumos
    const insumosInsert = insumosConPrecios.map(ins => ({
      orden_id: orden.id,
      insumo_id: ins.insumo_id,
      cantidad: ins.cantidad,
      precio_unitario: ins.precio_unitario,
      subtotal: ins.subtotal,
      tenant_id
    }))

    const { error: insInsertErr } = await supabase
      .from('produccion_insumos')
      .insert(insumosInsert)

    if (insInsertErr) {
      console.error('Error insertando insumos:', insInsertErr)
      // No hacemos rollback por simplicidad, pero podríamos.
    }

    return NextResponse.json({ success: true, data: orden })
  } catch (error: any) {
    console.error('❌ POST /api/ordenes-produccion error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, estado, producido_por } = body

    if (!id || !estado) {
      return NextResponse.json(
        { success: false, error: 'Faltan: id, estado' },
        { status: 400 }
      )
    }

    // 1. Obtener la orden actual con sus insumos
    const { data: orden, error: getErr } = await supabase
      .from('ordenes_produccion')
      .select(`
        *,
        insumos:produccion_insumos(*)
      `)
      .eq('id', id)
      .single()

    if (getErr) throw getErr

    // 2. Si el nuevo estado es "finalizado", procesar inventario y finanzas
    if (estado === 'finalizado' && orden.estado !== 'finalizado') {
      const tenantId = orden.tenant_id
      const productoId = orden.producto_id
      const cantidadProducida = orden.cantidad_producida || 1

      // 2a. Descontar insumos (movimientos de salida)
      for (const ins of orden.insumos) {
        // Insertar movimiento de salida
        await supabase
          .from('movimientos_inventario')
          .insert({
            producto_id: ins.insumo_id,
            tipo: 'salida',
            cantidad: ins.cantidad,
            motivo: `Producción #${orden.id}`,
            tenant_id: tenantId,
            created_at: new Date().toISOString()
          })

        // Recalcular stock para el insumo
        const { data: movs } = await supabase
          .from('movimientos_inventario')
          .select('tipo, cantidad')
          .eq('producto_id', ins.insumo_id)
          .eq('tenant_id', tenantId)

        let nuevoStock = 0
        movs?.forEach(m => {
          nuevoStock += m.tipo === 'entrada' ? m.cantidad : -m.cantidad
        })

        await supabase
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id', ins.insumo_id)
          .eq('tenant_id', tenantId)
      }

      // 2b. Añadir producto terminado (movimiento de entrada)
      await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: productoId,
          tipo: 'entrada',
          cantidad: cantidadProducida,
          motivo: `Producción #${orden.id}`,
          tenant_id: tenantId,
          created_at: new Date().toISOString()
        })

      // Recalcular stock del producto terminado
      const { data: movsProd } = await supabase
        .from('movimientos_inventario')
        .select('tipo, cantidad')
        .eq('producto_id', productoId)
        .eq('tenant_id', tenantId)

      let nuevoStockProd = 0
      movsProd?.forEach(m => {
        nuevoStockProd += m.tipo === 'entrada' ? m.cantidad : -m.cantidad
      })

      await supabase
        .from('productos')
        .update({ stock: nuevoStockProd })
        .eq('id', productoId)
        .eq('tenant_id', tenantId)

      // 2c. Registrar costo de producción en Finanzas
      const costoTotal = orden.insumos.reduce((sum: number, ins: any) => sum + (ins.subtotal || 0), 0)

      if (costoTotal > 0) {
        // Buscar o crear categoría contable "Costo de Producción" (6-01-01)
        let { data: categoria, error: catErr } = await supabase
          .from('categorias_contables')
          .select('id')
          .eq('codigo', '6-01-01')
          .eq('tenant_id', tenantId)
          .maybeSingle()

        if (!categoria) {
          const { data: newCat, error: createErr } = await supabase
            .from('categorias_contables')
            .insert({
              codigo: '6-01-01',
              nombre: 'Costo de Producción',
              tipo: 'costo',
              tenant_id: tenantId
            })
            .select()
            .single()
          if (!createErr && newCat) categoria = newCat
        }

        if (categoria?.id) {
          const nombresInsumos = orden.insumos.map((ins: any) => ins.nombre || ins.insumo_id).join(', ')
          await supabase
            .from('transacciones')
            .insert({
              tipo: 'egreso',
              monto: costoTotal,
              categoria_contable_id: categoria.id,
              descripcion: `Costo de producción #${orden.id} - ${orden.producto_id} (insumos: ${nombresInsumos})`,
              fecha: new Date().toISOString().split('T')[0],
              impuesto: 0,
              retencion: 0,
              ica: 0,
              total_con_impuestos: costoTotal,
              metodo_pago: 'produccion',
              tenant_id: tenantId,
              referencia_id: orden.id,
              referencia_tipo: 'produccion',
              created_at: new Date().toISOString()
            })
        }
      }
    }

    // 3. Actualizar estado de la orden
    const updateData: any = {
      estado,
      producido_por: producido_por || null,
      actualizado_en: new Date().toISOString()
    }
    if (estado === 'finalizado' && !orden.fecha_fin) {
      updateData.fecha_fin = new Date().toISOString().split('T')[0]
    }

    const { data: ordenActualizada, error: updateErr } = await supabase
      .from('ordenes_produccion')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) throw updateErr

    // 4. Si la orden tiene pedido_id, actualizar el estado del pedido
    if (orden.pedido_id) {
      let nuevoEstadoPedido = null
      if (estado === 'finalizado') {
        nuevoEstadoPedido = 'preparando'
      } else if (estado === 'entregado') {
        nuevoEstadoPedido = 'entregado'
      }

      if (nuevoEstadoPedido) {
        await supabase
          .from('pedidos')
          .update({ estado: nuevoEstadoPedido })
          .eq('id', orden.pedido_id)
      }
    }

    return NextResponse.json({ success: true, data: ordenActualizada })
  } catch (error: any) {
    console.error('❌ PUT /api/ordenes-produccion error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}