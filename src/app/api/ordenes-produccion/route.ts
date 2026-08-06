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
    const estado = url.searchParams.get('estado')
    const pedidoId = url.searchParams.get('pedido_id')

    let query = supabase
      .from('ordenes_produccion')
      .select(`
        *,
        producto:producto_id(id, nombre, stock, precio_compra, tipo_producto),
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
    console.error('❌ GET error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pedido_id, tenant_id, tipo, producto_id, cantidad_producida, insumos, nota, creado_por } = body

    if (!tenant_id) {
      return NextResponse.json({ success: false, error: 'tenant_id requerido' }, { status: 400 })
    }

    // Validar producto si existe
    if (producto_id) {
      const { data: producto, error: prodErr } = await supabase
        .from('productos')
        .select('id, nombre, tipo_producto')
        .eq('id', producto_id)
        .eq('tenant_id', tenant_id)
        .single()

      if (prodErr || !producto || producto.tipo_producto !== "producido") {
        return NextResponse.json({ success: false, error: 'Producto no válido para producción' }, { status: 400 })
      }
    }

    // Procesar insumos
    const insumosConPrecios = []
    if (insumos && Array.isArray(insumos) && insumos.length > 0) {
      for (const ins of insumos) {
        if (!ins.insumo_id) continue
        const { data: insumo, error: insErr } = await supabase
          .from('productos')
          .select('id, nombre, precio_compra')
          .eq('id', ins.insumo_id)
          .eq('tenant_id', tenant_id)
          .single()

        if (!insErr && insumo) {
          const subtotal = (ins.cantidad || 0) * (insumo.precio_compra || 0)
          insumosConPrecios.push({
            insumo_id: ins.insumo_id,
            cantidad: ins.cantidad || 0,
            precio_unitario: insumo.precio_compra || 0,
            subtotal,
            nombre: insumo.nombre,
          })
        }
      }
    }

    // INSERTAR ORDEN CON productos: [] PARA COMPATIBILIDAD
    const { data: orden, error: insertErr } = await supabase
      .from('ordenes_produccion')
      .insert({
        pedido_id: pedido_id || null,
        tenant_id,
        tipo: tipo || 'pedido_pos',
        producto_id: producto_id || null,
        cantidad_producida: cantidad_producida || 1,
        nota: nota || '',
        creado_por: creado_por || 'Sistema',
        estado: 'pendiente',
        productos: [],
        fecha_fin: null,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      })
      .select()
      .single()

    if (insertErr) {
      console.error('❌ Error insertando orden:', insertErr)
      throw insertErr
    }

    // INSERTAR INSUMOS EN TABLA RELACIONAL
    if (insumosConPrecios.length > 0) {
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
        console.error('⚠️ Error insertando insumos:', insInsertErr)
      }
    }

    return NextResponse.json({ success: true, data: orden })
  } catch (error: any) {
    console.error('❌ POST error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, estado, producido_por } = body

    if (!id || !estado) {
      return NextResponse.json({ success: false, error: 'Faltan: id, estado' }, { status: 400 })
    }

    const { data: orden, error: getErr } = await supabase
      .from('ordenes_produccion')
      .select('*, insumos:produccion_insumos(*)')
      .eq('id', id)
      .single()

    if (getErr) throw getErr

    if (estado === 'finalizado' && orden.estado !== 'finalizado') {
      const tenantId = orden.tenant_id
      const productoId = orden.producto_id
      const cantidadProducida = orden.cantidad_producida || 1

      // Descontar insumos
      if (orden.insumos && orden.insumos.length > 0) {
        for (const ins of orden.insumos) {
          await supabase.from('movimientos_inventario').insert({
            producto_id: ins.insumo_id,
            tipo: 'salida',
            cantidad: ins.cantidad,
            motivo: `Producción #${orden.id}`,
            tenant_id: tenantId,
            created_at: new Date().toISOString()
          })

          const { data: movs } = await supabase
            .from('movimientos_inventario')
            .select('tipo, cantidad')
            .eq('producto_id', ins.insumo_id)
            .eq('tenant_id', tenantId)

          let nuevoStock = 0
          movs?.forEach(m => {
            nuevoStock += m.tipo === 'entrada' ? m.cantidad : -m.cantidad
          })

          await supabase.from('productos').update({ stock: nuevoStock }).eq('id', ins.insumo_id).eq('tenant_id', tenantId)
        }
      }

      // Añadir producto terminado
      if (productoId) {
        await supabase.from('movimientos_inventario').insert({
          producto_id: productoId,
          tipo: 'entrada',
          cantidad: cantidadProducida,
          motivo: `Producción #${orden.id}`,
          tenant_id: tenantId,
          created_at: new Date().toISOString()
        })

        const { data: movsProd } = await supabase
          .from('movimientos_inventario')
          .select('tipo, cantidad')
          .eq('producto_id', productoId)
          .eq('tenant_id', tenantId)

        let nuevoStockProd = 0
        movsProd?.forEach(m => {
          nuevoStockProd += m.tipo === 'entrada' ? m.cantidad : -m.cantidad
        })

        await supabase.from('productos').update({ stock: nuevoStockProd }).eq('id', productoId).eq('tenant_id', tenantId)
      }
    }

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

    return NextResponse.json({ success: true, data: ordenActualizada })
  } catch (error: any) {
    console.error('❌ PUT error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    const { error } = await supabase.from('ordenes_produccion').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ DELETE error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
