import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const fechaBogota = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })

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
      .order('created_at', { ascending: false })

    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)
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
    console.error('Error GET /api/ventas:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  console.log('POS INICIO:', new Date().toISOString())

  try {
    const body = await request.json()
    const { tenant_id, metodo_pago, total, items } = body

    if (!tenant_id || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos: tenant_id e items' },
        { status: 400 }
      )
    }

    const fechaISO = new Date().toISOString()
    const fechaStr = fechaBogota()
    const productosIds: string[] = items.map((item: any) => item.producto_id)

    // OLA 1: PARALELO - Obtener todos los productos + categoría contable a la vez
    const [productosResult, catResult] = await Promise.all([
      supabase
        .from('productos')
        .select('id, stock, nombre')
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
    let categoria = catResult.data
    const prodMap = new Map<string, any>(productos.map((p: any) => [p.id, p]))

    console.log('OLA 1 (productos + categoria):', Date.now() - startTime, 'ms')

    // Validar stock suficiente
    for (const item of items) {
      const prod = prodMap.get(item.producto_id)
      if (!prod) {
        return NextResponse.json(
          { success: false, error: 'Producto no encontrado: ' + item.producto_id },
          { status: 400 }
        )
      }
      if (prod.stock < item.cantidad) {
        return NextResponse.json(
          { success: false, error: 'Stock insuficiente para ' + prod.nombre },
          { status: 400 }
        )
      }
    }

    // OLA 2: PARALELO - Insertar venta + crear categoría si no existe
    let venta: any
    const opsOla2: any[] = [
      supabase
        .from('ventas')
        .insert({
          tenant_id,
          metodo_pago: metodo_pago || 'contado',
          total,
          fecha: fechaISO,
          created_at: fechaISO
        })
        .select()
        .single()
    ]

    if (!categoria) {
      opsOla2.push(
        supabase
          .from('categorias_contables')
          .insert({
            codigo: '4-01-01',
            nombre: 'Ingresos Operacionales',
            tipo: 'ingreso',
            tenant_id: tenant_id
          })
          .select()
          .single()
      )
    }

    const resultsOla2 = await Promise.all(opsOla2)
    const ventaResult = resultsOla2[0]
    if (ventaResult.error) throw ventaResult.error
    venta = ventaResult.data

    if (!categoria && resultsOla2[1]) {
      const catResult2 = resultsOla2[1]
      if (!catResult2.error && catResult2.data) {
        categoria = catResult2.data
      }
    }

    console.log('OLA 2 (venta creada):', Date.now() - startTime, 'ms')

    // OLA 3: PARALELO - Insertar sale_items + movimientos + actualizar stocks
    const saleItems = items.map((item: any) => ({
      sale_id: venta.id,
      product_id: item.producto_id,
      quantity: item.cantidad,
      price_at_sale: item.precio_unitario,
      subtotal: item.subtotal,
      tenant_id: tenant_id
    }))

    const movimientos = items.map((item: any) => ({
      producto_id: item.producto_id,
      tipo: 'salida',
      cantidad: item.cantidad,
      motivo: 'Venta #' + venta.id,
      tenant_id,
      created_at: fechaISO
    }))

    const updatesStock = items.map((item: any) => {
      const prod = prodMap.get(item.producto_id)!
      return supabase
        .from('productos')
        .update({ stock: prod.stock - item.cantidad })
        .eq('id', item.producto_id)
        .eq('tenant_id', tenant_id)
    })

    await Promise.all([
      supabase.from('sale_items').insert(saleItems),
      supabase.from('movimientos_inventario').insert(movimientos),
      ...updatesStock
    ])

    console.log('OLA 3 (items + movimientos + stock):', Date.now() - startTime, 'ms')

    // OLA 4: PARALELO - Insertar transacción financiera (solo si hay categoría)
    if (categoria?.id) {
      await supabase.from('transacciones').insert({
        tipo: 'ingreso',
        monto: total,
        categoria_contable_id: categoria.id,
        descripcion: 'Venta #' + venta.id + ' - ' + (metodo_pago || 'contado'),
        fecha: fechaISO,
        impuesto: 0,
        retencion: 0,
        total_con_impuestos: total,
        metodo_pago: metodo_pago || 'contado',
        tenant_id: tenant_id,
        created_at: fechaISO
      })
    }

    const totalTime = Date.now() - startTime
    console.log('POS completado en', totalTime, 'ms - Venta:', venta.id)

    return NextResponse.json({
      success: true,
      data: { venta },
      message: 'Venta #' + venta.id + ' registrada',
      tiempo_ms: totalTime
    })
  } catch (error: any) {
    console.error('Error POST /api/ventas:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
