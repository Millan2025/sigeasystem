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

    // 🔒 NUEVA LÓGICA: NUNCA descontar stock ni crear venta al crear pedido
    // Solo se procesa al CONFIRMAR (ver /api/pedidos/[id]/confirmar)
    console.log('📝 Pedido pendiente creado. Esperando confirmación del dueño.')
    console.log('💡 Al confirmar se descontará stock y creará venta/transacción')

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
