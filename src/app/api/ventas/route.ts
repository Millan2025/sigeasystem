import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET: listar ventas (opcional)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('fecha', { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: crear venta, guardar en ventas, descontar stock
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenant_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal, metodo_pago, cliente } = body

    if (!tenant_id || !producto_id || !cantidad || !precio_unitario) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos: tenant_id, producto_id, cantidad, precio_unitario' },
        { status: 400 }
      )
    }

    // 1. Insertar venta
    const { data: venta, error: ventaErr } = await supabase
      .from('ventas')
      .insert({
        tenant_id,
        producto_id,
        producto_nombre: producto_nombre || 'Producto',
        cantidad,
        precio_unitario,
        subtotal: subtotal || (cantidad * precio_unitario),
        metodo_pago: metodo_pago || 'Efectivo',
        cliente: cliente || 'Mostrador',
        fecha: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (ventaErr) throw ventaErr

    // 2. Descontar stock (crear movimiento de salida)
    const { error: movErr } = await supabase
      .from('movimientos_inventario')
      .insert({
        producto_id: producto_id,
        tipo: 'salida',
        cantidad: cantidad,
        motivo: `Venta #${venta.id}`,
        tenant_id,
        created_at: new Date().toISOString()
      })

    if (movErr) throw movErr

    // 3. Actualizar stock en productos (suma de movimientos)
    const { data: movs, error: movsErr } = await supabase
      .from('movimientos_inventario')
      .select('tipo, cantidad')
      .eq('producto_id', producto_id)
      .eq('tenant_id', tenant_id)

    if (movsErr) throw movsErr

    let nuevoStock = 0
    movs?.forEach(m => {
      nuevoStock += m.tipo === 'entrada' ? m.cantidad : -m.cantidad
    })

    await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', producto_id)
      .eq('tenant_id', tenant_id)

    // 4. (Opcional) Registrar ingreso en Finanzas (cuando esté listo)

    return NextResponse.json({
      success: true,
      data: venta,
      message: `Venta #${venta.id} registrada y stock actualizado`
    })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
