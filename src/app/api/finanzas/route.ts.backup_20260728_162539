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

    const { data, error } = await query
    if (error) throw error

    const expandedData: any[] = []
    let itemCounter = 1

    for (const t of data || []) {
      // Si es compra o venta, expandir en items
      if (t.referencia_tipo === 'compra' && t.referencia_id) {
        const { data: items, error: itemsErr } = await supabase
          .from('compra_items')
          .select('*, productos(id, nombre)')
          .eq('compra_id', t.referencia_id)

        if (itemsErr) {
          console.error('Error al obtener items de compra:', itemsErr)
          expandedData.push({
            ...t,
            cantidad: 1,
            precio_unitario: t.monto,
            subtotal: t.monto,
            iva: 0,
            retencion: 0,
            ica: 0,
            item: itemCounter++,
            descripcion: `Compra #${t.referencia_id} - ${t.categorias_contables?.nombre || 'Compras'}`
          })
          continue
        }

        if (items && items.length > 0) {
          const subtotalTotal = items.reduce((sum, i) => sum + (i.cantidad * i.precio_compra), 0)
          const ivaTotal = t.impuesto || 0
          const retencionTotal = t.retencion || 0
          const icaTotal = t.ica || 0
          // Construir descripción con nombres de productos
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
              // También guardamos la descripción resumida en un campo extra para mostrar en la vista general
              descripcion_resumida: descripcionBase
            })
          }
        } else {
          expandedData.push({
            ...t,
            cantidad: 1,
            precio_unitario: t.monto,
            subtotal: t.monto,
            iva: 0,
            retencion: 0,
            ica: 0,
            item: itemCounter++,
            descripcion: `Compra #${t.referencia_id} - ${t.categorias_contables?.nombre || 'Compras'}`
          })
        }
      } else if (t.referencia_tipo === 'venta' && t.referencia_id) {
        // 🔥 Expandir ventas en items y construir descripción con productos
        const { data: items, error: itemsErr } = await supabase
          .from('sale_items')
          .select('*, productos(id, nombre)')
          .eq('sale_id', t.referencia_id)

        if (itemsErr) {
          console.error('Error al obtener items de venta:', itemsErr)
          expandedData.push({
            ...t,
            cantidad: 1,
            precio_unitario: t.monto,
            subtotal: t.monto,
            iva: 0,
            retencion: 0,
            ica: 0,
            item: itemCounter++,
            descripcion: `Venta #${t.referencia_id} - ${t.categorias_contables?.nombre || 'Ventas'}`
          })
          continue
        }

        if (items && items.length > 0) {
          const ivaTotal = t.impuesto || 0
          const retencionTotal = t.retencion || 0
          const icaTotal = t.ica || 0
          const subtotalTotal = items.reduce((sum, i) => sum + (i.quantity * i.price_at_sale), 0)
          // Construir descripción con nombres de productos
          const nombres = items.map(i => i.productos?.nombre || 'Producto').join(', ')
          const metodo = t.metodo_pago || ''
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
              descripcion_resumida: descripcionBase
            })
          }
        } else {
          expandedData.push({
            ...t,
            cantidad: 1,
            precio_unitario: t.monto,
            subtotal: t.monto,
            iva: 0,
            retencion: 0,
            ica: 0,
            item: itemCounter++,
            descripcion: `Venta #${t.referencia_id} - ${t.categorias_contables?.nombre || 'Ventas'}`
          })
        }
      } else {
        // Transacciones no compra/venta (ej: créditos, abonos, gastos operativos)
        let desc = t.descripcion || ''
        if (t.referencia_tipo === 'credito') {
          // Obtener nombre del cliente desde la transacción o desde el crédito
          const { data: credito } = await supabase
            .from('creditos')
            .select('cliente')
            .eq('id', t.referencia_id)
            .single()
          const cliente = credito?.cliente || 'Cliente'
          desc = `Crédito #${t.referencia_id} - ${cliente}`
        } else if (t.referencia_tipo === 'abono') {
          desc = `Abono a crédito #${t.referencia_id}`
        } else if (t.tipo === 'egreso' && t.categorias_contables?.nombre === 'Compras') {
          desc = `Compra - ${t.descripcion || ''}`
        } else if (t.tipo === 'ingreso' && t.categorias_contables?.nombre === 'Cuentas por Cobrar') {
          desc = `Crédito - ${t.descripcion || ''}`
        }
        if (t.categorias_contables?.nombre === 'Gastos Operativos') {
          desc = t.descripcion || 'Gasto operativo'
        }

        expandedData.push({
          ...t,
          cantidad: 1,
          precio_unitario: t.monto,
          subtotal: t.monto,
          iva: 0,
          retencion: 0,
          ica: 0,
          item: itemCounter++,
          descripcion: desc,
          descripcion_resumida: desc
        })
      }
    }

    // Recalcular resumen
    const ingresos = expandedData.filter(t => t.tipo === 'ingreso').reduce((sum, t) => sum + (t.total || t.total_con_impuestos || 0), 0)
    const egresos = expandedData.filter(t => t.tipo === 'egreso').reduce((sum, t) => sum + (t.total || t.total_con_impuestos || 0), 0)
    const impuestos = expandedData.reduce((sum, t) => sum + (t.iva || 0), 0)
    const retenciones = expandedData.reduce((sum, t) => sum + (t.retencion || 0), 0)
    const saldo = ingresos - egresos

    const desglosePagos: Record<string, number> = {}
    expandedData.filter(t => t.tipo === 'ingreso').forEach(t => {
      let metodo = t.metodo_pago || 'Otro'
      if (metodo === 'Otro') metodo = 'Otros'
      if (metodo === 'Confirmado') metodo = 'Otros'
      desglosePagos[metodo] = (desglosePagos[metodo] || 0) + (t.total || t.total_con_impuestos || 0)
    })

    const costo_ventas = expandedData
      .filter(t => t.tipo === 'egreso' && t.categorias_contables?.nombre === 'Compras')
      .reduce((sum, t) => sum + (t.total || t.total_con_impuestos || 0), 0)

    let gastos_operativos = 0
    try {
      const { data: gastosData, error: gastosErr } = await supabase
        .from('gastos_operativos')
        .select('monto')
        .eq('tenant_id', tenantId)
      if (!gastosErr && gastosData) {
        gastos_operativos = gastosData.reduce((sum, g) => sum + (g.monto || 0), 0)
      }
    } catch (e) {
      console.error('Error al obtener gastos operativos:', e)
    }

    const utilidad_bruta = ingresos - costo_ventas
    const utilidad_neta = utilidad_bruta - gastos_operativos

    return NextResponse.json({
      success: true,
      data: expandedData,
      resumen: {
        ingresos,
        egresos,
        saldo,
        impuestos,
        retenciones,
        desglosePagos,
        costo_ventas,
        gastos_operativos,
        utilidad_bruta,
        utilidad_neta
      }
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
        // updated_at eliminado porque la columna no existe
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








