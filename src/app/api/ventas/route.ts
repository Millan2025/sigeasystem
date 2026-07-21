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
    const startDate = url.searchParams.get('start')
    const endDate = url.searchParams.get('end')
    const metodo_pago = url.searchParams.get('metodo_pago')

    let query = supabase
      .from('ventas')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('fecha', { ascending: false })

    if (startDate) query = query.gte('fecha', startDate)
    if (endDate) query = query.lte('fecha', endDate)
    if (metodo_pago) query = query.eq('metodo_pago', metodo_pago)

    const { data, error } = await query
    if (error) throw error

    const total = data?.reduce((sum, v) => sum + (v.total || 0), 0) || 0
    const transacciones = data?.length || 0

    return NextResponse.json({
      success: true,
      data: data || [],
      totales: { total, count: transacciones }
    })
  } catch (error: any) {
    console.error('❌ Error en /api/ventas GET:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenant_id, metodo_pago, total, items } = body

    if (!tenant_id || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos: tenant_id e items son requeridos' },
        { status: 400 }
      )
    }

    console.log('📥 POST /api/ventas - Datos recibidos:', { tenant_id, metodo_pago, total, items: items?.length })

    // 1. Insertar cabecera de venta
    const { data: venta, error: ventaErr } = await supabase
      .from('ventas')
      .insert({
        tenant_id,
        metodo_pago,
        total,
        fecha: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (ventaErr) throw ventaErr
    console.log('✅ Venta insertada con ID:', venta.id)

    // 2. Insertar items en sale_items (si existe la tabla)
    try {
      const saleItems = items.map((item: any) => ({
        sale_id: venta.id,
        product_id: item.producto_id,
        quantity: item.cantidad,
        price_at_sale: item.precio_unitario,
        subtotal: item.subtotal,
        tenant_id: tenant_id
      }))

      const { error: itemsErr } = await supabase
        .from('sale_items')
        .insert(saleItems)

      if (itemsErr) console.warn('⚠️ No se pudieron insertar items en sale_items:', itemsErr)
    } catch (e) {
      console.warn('⚠️ Error al insertar items:', e)
    }

    // 3. Descontar stock
    for (const item of items) {
      await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: item.producto_id,
          tipo: 'salida',
          cantidad: item.cantidad,
          motivo: `Venta #${venta.id}`,
          tenant_id,
          created_at: new Date().toISOString()
        })

      const { data: movs } = await supabase
        .from('movimientos_inventario')
        .select('tipo, cantidad')
        .eq('producto_id', item.producto_id)
        .eq('tenant_id', tenant_id)

      if (movs) {
        let nuevoStock = 0
        movs.forEach(m => {
          nuevoStock += m.tipo === 'entrada' ? m.cantidad : -m.cantidad
        })
        await supabase
          .from('productos')
          .update({ stock: nuevoStock })
          .eq('id', item.producto_id)
          .eq('tenant_id', tenant_id)
      }
    }
    console.log('✅ Stock actualizado')

    // 4. REGISTRAR INGRESO EN FINANZAS (transacciones)
    try {
      // Buscar categoría "Ingresos operacionales" (código 4-01-01)
      let { data: categoria, error: catErr } = await supabase
        .from('categorias_contables')
        .select('id')
        .eq('codigo', '4-01-01')
        .eq('tenant_id', tenant_id)
        .maybeSingle()

      // Si no existe, crearla
      if (!categoria) {
        console.log('⚠️ Categoría 4-01-01 no encontrada, creándola...')
        const { data: newCat, error: createErr } = await supabase
          .from('categorias_contables')
          .insert({
            codigo: '4-01-01',
            nombre: 'Ingresos operacionales',
            tipo: 'ingreso',
            tenant_id: tenant_id
          })
          .select()
          .single()

        if (createErr) {
          console.error('❌ Error al crear categoría:', createErr)
        } else {
          categoria = newCat
          console.log('✅ Categoría creada:', categoria.id)
        }
      }

      if (categoria?.id) {
        const categoriaId = categoria.id
        const total_con_impuestos = total // Por ahora sin impuestos

        console.log('📝 Insertando en transacciones:', {
          tipo: 'ingreso',
          monto: total,
          categoria_contable_id: categoriaId,
          descripcion: `Venta #${venta.id} - ${metodo_pago}`,
          fecha: new Date().toISOString().split('T')[0],
          metodo_pago: metodo_pago,
          tenant_id
        })

        const { error: transError } = await supabase
          .from('transacciones')
          .insert({
            tipo: 'ingreso',
            monto: total,
            categoria_contable_id: categoriaId,
            descripcion: `Venta #${venta.id} - ${metodo_pago}`,
            fecha: new Date().toISOString().split('T')[0],
            impuesto: 0,
            retencion: 0,
            total_con_impuestos: total_con_impuestos,
            metodo_pago: metodo_pago,
            tenant_id: tenant_id,
            created_at: new Date().toISOString()
          })

        if (transError) {
          console.error('❌ Error al insertar en transacciones:', transError)
        } else {
          console.log('✅ Transacción registrada en finanzas para venta #' + venta.id)
        }
      } else {
        console.error('❌ No se pudo obtener/crear categoría para la venta.')
      }
    } catch (finError) {
      console.error('❌ Error en el registro financiero:', finError)
    }

    return NextResponse.json({
      success: true,
      data: { venta },
      message: `Venta #${venta.id} registrada`
    })

  } catch (error: any) {
    console.error('❌ Error en /api/ventas POST:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
