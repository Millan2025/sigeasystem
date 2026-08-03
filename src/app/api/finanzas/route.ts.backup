import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: listar transacciones
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    const startDate = url.searchParams.get('start')
    const endDate = url.searchParams.get('end')
    const tipo = url.searchParams.get('tipo')
    const categoriaId = url.searchParams.get('categoria')
    const periodoId = url.searchParams.get('periodo')

    let query = supabase
      .from('transacciones')
      .select('*, categorias_contables(*)')
      .eq('tenant_id', tenantId)
      .order('fecha', { ascending: false })

    if (startDate) query = query.gte('fecha', startDate)
    if (endDate) query = query.lte('fecha', endDate)
    if (tipo) query = query.eq('tipo', tipo)
    if (categoriaId) query = query.eq('categoria_contable_id', categoriaId)

    if (periodoId) {
      const { data: periodo } = await supabase
        .from('periodos_fiscales')
        .select('fecha_inicio, fecha_fin')
        .eq('id', periodoId)
        .single()
      if (periodo) {
        query = query.gte('fecha', periodo.fecha_inicio).lte('fecha', periodo.fecha_fin)
      }
    }

    // Paginación (50 registros por página)
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data, error } = await query
    if (error) throw error

    // Obtener todos los IDs de ventas y compras en lote
    const saleIds = data?.filter(t => t.referencia_tipo === 'venta' && t.referencia_id).map(t => t.referencia_id) || []
    const compraIds = data?.filter(t => t.referencia_tipo === 'compra' && t.referencia_id).map(t => t.referencia_id) || []

    // Obtener todos los items de ventas de una vez (intentando con sale_id y venta_id)
    let saleItemsMap: Record<string, any[]> = {}
    if (saleIds.length > 0) {
      // Intentar con 'sale_id'
      let { data: saleItems } = await supabase
        .from('sale_items')
        .select('*, productos(id, nombre)')
        .in('sale_id', saleIds)
      
      // Si no hay, intentar con 'venta_id'
      if (!saleItems || saleItems.length === 0) {
        const { data: items } = await supabase
          .from('sale_items')
          .select('*, productos(id, nombre)')
          .in('venta_id', saleIds)
        saleItems = items
      }

      // Si aún no hay, obtener productos directamente de la tabla 'ventas'
      if (!saleItems || saleItems.length === 0) {
        // Consultar la tabla ventas con sus productos (asumiendo relación venta_productos)
        const { data: ventasConProductos } = await supabase
          .from('ventas')
          .select('id, venta_productos(productos(id, nombre), cantidad, precio)')
          .in('id', saleIds)
        
        if (ventasConProductos) {
          ventasConProductos.forEach((v: any) => {
            if (v.venta_productos && v.venta_productos.length > 0) {
              saleItemsMap[v.id] = v.venta_productos.map((vp: any) => ({
                ...vp,
                quantity: vp.cantidad,
                price_at_sale: vp.precio,
                productos: vp.productos || { nombre: 'Producto' }
              }))
            }
          })
        }
      } else {
        // Construir el map normalmente
        saleItems.forEach(item => {
          if (!saleItemsMap[item.sale_id]) saleItemsMap[item.sale_id] = []
          saleItemsMap[item.sale_id].push(item)
        })
      }
    }

    // Obtener todos los items de compras de una vez (similar)
    let compraItemsMap: Record<string, any[]> = {}
    if (compraIds.length > 0) {
      const { data: compraItems } = await supabase
        .from('compra_items')
        .select('*, productos(id, nombre)')
        .in('compra_id', compraIds)
      if (compraItems) {
        compraItems.forEach(item => {
          if (!compraItemsMap[item.compra_id]) compraItemsMap[item.compra_id] = []
          compraItemsMap[item.compra_id].push(item)
        })
      }
    }

    // Expandir datos usando los maps
    const expandedData: any[] = []
    let itemCounter = 1

    for (const t of data || []) {
      const esVenta = t.referencia_tipo === 'venta' && t.referencia_id
      const esCompra = t.referencia_tipo === 'compra' && t.referencia_id

      if (esVenta) {
        const items = saleItemsMap[t.referencia_id] || []
        if (items.length === 0) {
          expandedData.push({ ...t, cantidad: 1, precio_unitario: t.monto, subtotal: t.monto, iva: 0, retencion: 0, ica: 0, item: itemCounter++, descripcion: `Venta #${t.referencia_id}`, descripcion_resumida: `Venta #${t.referencia_id}`, items: [] })
          continue
        }
        const ivaTotal = t.impuesto || 0
        const retencionTotal = t.retencion || 0
        const icaTotal = t.ica || 0
        const subtotalTotal = items.reduce((sum, i) => sum + (i.quantity * i.price_at_sale), 0)
        const metodo = t.metodo_pago || ''
        const nombres = items.map(i => i.productos?.nombre || 'Producto').join(', ')
        const descripcionBase = `Venta #${t.referencia_id} - ${metodo} - ${nombres}`

        for (const item of items) {
          const subtotalItem = item.quantity * item.price_at_sale
          const proporcional = subtotalTotal > 0 ? subtotalItem / subtotalTotal : 0
          expandedData.push({
            ...t,
            descripcion: item.productos?.nombre || 'Producto',
            cantidad: item.quantity,
            precio_unitario: item.price_at_sale,
            subtotal: subtotalItem,
            iva: ivaTotal * proporcional,
            retencion: retencionTotal * proporcional,
            ica: icaTotal * proporcional,
            total: subtotalItem + (ivaTotal * proporcional) - (retencionTotal * proporcional) - (icaTotal * proporcional),
            item: itemCounter++,
            descripcion_resumida: descripcionBase,
            items: items.map(i => ({
              nombre: i.productos?.nombre || 'Producto',
              cantidad: i.quantity,
              precio: i.price_at_sale,
              subtotal: i.quantity * i.price_at_sale
            }))
          })
        }
      } else if (esCompra) {
        const items = compraItemsMap[t.referencia_id] || []
        if (items.length === 0) {
          expandedData.push({ ...t, cantidad: 1, precio_unitario: t.monto, subtotal: t.monto, iva: 0, retencion: 0, ica: 0, item: itemCounter++, descripcion: `Compra #${t.referencia_id}`, descripcion_resumida: `Compra #${t.referencia_id}`, items: [] })
          continue
        }
        const subtotalTotal = items.reduce((sum, i) => sum + (i.cantidad * i.precio_compra), 0)
        const ivaTotal = t.impuesto || 0
        const retencionTotal = t.retencion || 0
        const icaTotal = t.ica || 0
        const nombres = items.map(i => i.productos?.nombre || 'Producto').join(', ')
        const descripcionBase = `Compra #${t.referencia_id} - ${nombres}`

        for (const item of items) {
          const subtotalItem = item.cantidad * item.precio_compra
          const proporcional = subtotalTotal > 0 ? subtotalItem / subtotalTotal : 0
          expandedData.push({
            ...t,
            descripcion: item.productos?.nombre || 'Producto',
            cantidad: item.cantidad,
            precio_unitario: item.precio_compra,
            subtotal: subtotalItem,
            iva: ivaTotal * proporcional,
            retencion: retencionTotal * proporcional,
            ica: icaTotal * proporcional,
            total: subtotalItem + (ivaTotal * proporcional) - (retencionTotal * proporcional) - (icaTotal * proporcional),
            item: itemCounter++,
            descripcion_resumida: descripcionBase,
            items: items.map(i => ({
              nombre: i.productos?.nombre || 'Producto',
              cantidad: i.cantidad,
              precio: i.precio_compra,
              subtotal: i.cantidad * i.precio_compra
            }))
          })
        }
      } else {
        // Otras transacciones
        let desc = t.descripcion || ''
        if (t.referencia_tipo === 'credito') {
          const { data: credito } = await supabase.from('creditos').select('cliente').eq('id', t.referencia_id).single()
          desc = `Crédito #${t.referencia_id} - ${credito?.cliente || 'Cliente'}`
        } else if (t.referencia_tipo === 'abono') {
          desc = `Abono a crédito #${t.referencia_id}`
        } else if (t.categorias_contables?.nombre === 'Gastos Operativos') {
          desc = t.descripcion || 'Gasto operativo'
        }
        expandedData.push({ ...t, cantidad: 1, precio_unitario: t.monto, subtotal: t.monto, total: t.monto, iva: 0, retencion: 0, ica: 0, item: itemCounter++, descripcion: desc, descripcion_resumida: desc, items: [] })
      }
    }

    // Recalcular resumen
    const ingresos = expandedData.filter(t => t.tipo === "ingreso").reduce((sum, t) => sum + (t.total || t.total_con_impuestos || t.monto || 0), 0)
    const egresos = expandedData.filter(t => t.tipo === "egreso").reduce((sum, t) => sum + (t.total || t.total_con_impuestos || t.monto || 0), 0)
    const impuestos = expandedData.reduce((sum, t) => sum + (t.iva || 0), 0)
    const retenciones = expandedData.reduce((sum, t) => sum + (t.retencion || 0), 0)
    const saldo = ingresos - egresos

    const desglosePagos: Record<string, number> = {}
    expandedData.filter(t => t.tipo === 'ingreso').forEach(t => {
      let metodo = t.metodo_pago || 'Otro'
      if (metodo === 'Otro' || metodo === 'Confirmado') metodo = 'Otros'
      desglosePagos[metodo] = (desglosePagos[metodo] || 0) + (t.total || t.total_con_impuestos || 0)
    })

    const costo_ventas = expandedData.filter(t => t.tipo === 'egreso' && t.categorias_contables?.nombre === 'Compras').reduce((sum, t) => sum + (t.total || t.total_con_impuestos || 0), 0)
    let gastos_operativos = 0
    try {
      const { data: gastosData } = await supabase.from('gastos_operativos').select('monto').eq('tenant_id', tenantId)
      if (gastosData) gastos_operativos = gastosData.reduce((sum, g) => sum + (g.monto || 0), 0)
    } catch (e) {}

    const utilidad_bruta = ingresos - costo_ventas
    const utilidad_neta = utilidad_bruta - gastos_operativos

    return NextResponse.json({
      success: true,
      data: expandedData,
      resumen: { ingresos, egresos, saldo, impuestos, retenciones, desglosePagos, costo_ventas, gastos_operativos, utilidad_bruta, utilidad_neta }
    })
  } catch (error: any) {
    console.error('❌ Error GET /api/finanzas:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: crear transacción
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tipo, monto, categoria_contable_id, descripcion, fecha, tenant_id, impuesto, retencion, metodo_pago } = body

    if (!tipo || !monto || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan: tipo, monto, tenant_id' },
        { status: 400 }
      )
    }

    const total_con_impuestos = monto + (impuesto || 0) - (retencion || 0)

    const { data, error } = await supabase
      .from('transacciones')
      .insert({
        tipo,
        monto,
        categoria_contable_id: categoria_contable_id || null,
        descripcion: descripcion || '',
        fecha: fecha || new Date().toISOString().split('T')[0],
        impuesto: impuesto || 0,
        retencion: retencion || 0,
        total_con_impuestos,
        metodo_pago: metodo_pago || null,
        tenant_id,
        created_at: new Date().toISOString()
      })
      .select('*, categorias_contables(*)')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ Error POST /api/finanzas:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT: actualizar transacción
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, tipo, monto, categoria_contable_id, descripcion, fecha, impuesto, retencion, metodo_pago, tenant_id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere ID' },
        { status: 400 }
      )
    }

    const total_con_impuestos = monto + (impuesto || 0) - (retencion || 0)

    const { data, error } = await supabase
      .from('transacciones')
      .update({
        tipo,
        monto,
        categoria_contable_id: categoria_contable_id || null,
        descripcion: descripcion || '',
        fecha: fecha || new Date().toISOString().split('T')[0],
        impuesto: impuesto || 0,
        retencion: retencion || 0,
        total_con_impuestos,
        metodo_pago: metodo_pago || null
      })
      .eq('id', id)
      .select('*, categorias_contables(*)')
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('❌ Error PUT /api/finanzas:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE: eliminar transacción
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere ID' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('transacciones')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true, message: 'Transacción eliminada' })
  } catch (error: any) {
    console.error('❌ Error DELETE /api/finanzas:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

