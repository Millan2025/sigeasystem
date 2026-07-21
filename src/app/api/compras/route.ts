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

    let query = supabase
      .from('compras')
      .select('*, compra_items (*, productos (id, nombre, precio_compra))')
      .eq('tenant_id', tenantId)
      .order('fecha', { ascending: false })

    if (startDate) query = query.gte('fecha', startDate)
    if (endDate) query = query.lte('fecha', endDate)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('❌ Error GET /api/compras:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenant_id, proveedor, fecha, metodo_pago, observaciones, items } = body

    console.log('📥 POST /api/compras - Datos recibidos:', { tenant_id, proveedor, metodo_pago, items: items?.length })

    if (!tenant_id || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos: tenant_id e items' },
        { status: 400 }
      )
    }

    const total = items.reduce((sum: number, item: any) => sum + (item.cantidad * item.precio_compra), 0)
    console.log('💰 Total de la compra:', total)

    // 1. Insertar cabecera de compra
    const { data: compra, error: compraErr } = await supabase
      .from('compras')
      .insert({
        tenant_id,
        proveedor: proveedor || '',
        fecha: fecha || new Date().toISOString().split('T')[0],
        total,
        metodo_pago: metodo_pago || 'contado',
        observaciones: observaciones || '',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (compraErr) {
      console.error('❌ Error al insertar compra:', compraErr)
      throw compraErr
    }
    console.log('✅ Compra insertada con ID:', compra.id)

    // 2. Insertar items de compra
    const compraItems = items.map((item: any) => ({
      compra_id: compra.id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_compra: item.precio_compra,
      subtotal: item.cantidad * item.precio_compra
    }))

    const { error: itemsErr } = await supabase
      .from('compra_items')
      .insert(compraItems)

    if (itemsErr) {
      console.error('❌ Error al insertar items:', itemsErr)
      throw itemsErr
    }
    console.log('✅ Items insertados:', compraItems.length)

    // 3. Actualizar stock
    for (const item of items) {
      await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: item.producto_id,
          tipo: 'entrada',
          cantidad: item.cantidad,
          motivo: `Compra #${compra.id}`,
          tenant_id,
          created_at: new Date().toISOString()
        })

      const { data: movs } = await supabase
        .from('movimientos_inventario')
        .select('tipo, cantidad')
        .eq('producto_id', item.producto_id)
        .eq('tenant_id', tenant_id)

      let nuevoStock = 0
      movs?.forEach(m => {
        nuevoStock += m.tipo === 'entrada' ? m.cantidad : -m.cantidad
      })

      await supabase
        .from('productos')
        .update({ stock: nuevoStock })
        .eq('id', item.producto_id)
        .eq('tenant_id', tenant_id)
    }
    console.log('✅ Stock actualizado')

    // 4. REGISTRAR EN FINANZAS (con logs detallados)
    try {
      console.log('🔍 Buscando categoría contable para tenant:', tenant_id)

      // Buscar categoría "Compras" (código 5-01-01)
      let { data: categoria, error: catErr } = await supabase
        .from('categorias_contables')
        .select('id')
        .eq('codigo', '5-01-01')
        .eq('tenant_id', tenant_id)
        .maybeSingle()

      // Si no existe, crearla
      if (!categoria) {
        console.log('⚠️ Categoría 5-01-01 no encontrada, creándola...')
        const { data: newCat, error: createErr } = await supabase
          .from('categorias_contables')
          .insert({
            codigo: '5-01-01',
            nombre: 'Compras',
            tipo: 'costo',
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
          tipo: 'egreso',
          monto: total,
          categoria_contable_id: categoriaId,
          descripcion: `Compra #${compra.id} - ${metodo_pago}`,
          fecha: fecha || new Date().toISOString().split('T')[0],
          metodo_pago: metodo_pago || 'contado',
          tenant_id
        })

        const { error: transError } = await supabase
          .from('transacciones')
          .insert({
            tipo: 'egreso',
            monto: total,
            categoria_contable_id: categoriaId,
            descripcion: `Compra #${compra.id} - ${metodo_pago}`,
            fecha: fecha || new Date().toISOString().split('T')[0],
            impuesto: 0,
            retencion: 0,
            total_con_impuestos: total_con_impuestos,
            metodo_pago: metodo_pago || 'contado',
            tenant_id: tenant_id,
            created_at: new Date().toISOString()
          })

        if (transError) {
          console.error('❌ Error al insertar en transacciones:', transError)
        } else {
          console.log('✅ Transacción registrada en finanzas para compra #' + compra.id)
        }
      } else {
        console.error('❌ No se pudo obtener/crear categoría contable para la compra.')
      }
    } catch (finError) {
      console.error('❌ Error en el registro financiero:', finError)
    }

    return NextResponse.json({
      success: true,
      data: { compra, items: compraItems },
      message: `Compra #${compra.id} registrada`
    })

  } catch (error: any) {
    console.error('❌ Error POST /api/compras:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
