import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    const categoria = url.searchParams.get('categoria')
    const search = url.searchParams.get('search')

    let query = supabase
      .from('productos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nombre')

    if (categoria && categoria !== 'null') {
      query = query.ilike('categoria', categoria)
    }
    if (search) {
      query = query.ilike('nombre', `%${search}%`)
    }

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
    const {
      nombre, categoria, precio, precio_compra, stock, unidad, tipo_unidad,
      venta_por_peso, icono, tenant_id, proveedor, stock_minimo, stock_maximo,
      observaciones, sku, descripcion, fecha_caducidad, ubicacion
    } = body

    if (!nombre || !categoria || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos: nombre, categoria, tenant_id' },
        { status: 400 }
      )
    }

    // Verificar SKU duplicado (si se proporciona)
    if (sku) {
      const { data: existingSku } = await supabase
        .from('productos')
        .select('id')
        .eq('sku', sku)
        .eq('tenant_id', tenant_id)
        .maybeSingle()
      if (existingSku) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un producto con ese SKU' },
          { status: 409 }
        )
      }
    }

    const { data, error } = await supabase
      .from('productos')
      .insert({
        nombre,
        categoria,
        precio: precio || 0,
        precio_compra: precio_compra || 0,
        stock: stock || 0,
        stock_minimo: stock_minimo || 0,
        stock_maximo: stock_maximo || 0,
        unidad: unidad || 'unidad',
        tipo_unidad: tipo_unidad || 'unidad',
        venta_por_peso: venta_por_peso || false,
        icono: icono || '📦',
        proveedor: proveedor || '',
        observaciones: observaciones || '',
        sku: sku || null,
        descripcion: descripcion || '',
        fecha_caducidad: fecha_caducidad || null,
        ubicacion: ubicacion || '',
        tenant_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      id, nombre, categoria, precio, precio_compra, stock, unidad, tipo_unidad,
      venta_por_peso, icono, proveedor, stock_minimo, stock_maximo,
      observaciones, sku, descripcion, fecha_caducidad, ubicacion
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el ID del producto' },
        { status: 400 }
      )
    }

    // Si se actualiza SKU, verificar duplicado (excluyendo el mismo producto)
    if (sku) {
      const { data: existingSku } = await supabase
        .from('productos')
        .select('id')
        .eq('sku', sku)
        .eq('tenant_id', (await supabase.from('productos').select('tenant_id').eq('id', id).single()).data?.tenant_id)
        .neq('id', id)
        .maybeSingle()
      if (existingSku) {
        return NextResponse.json(
          { success: false, error: 'Ya existe otro producto con ese SKU' },
          { status: 409 }
        )
      }
    }

    const { data, error } = await supabase
      .from('productos')
      .update({
        nombre,
        categoria,
        precio,
        precio_compra,
        stock,
        stock_minimo,
        stock_maximo,
        unidad,
        tipo_unidad,
        venta_por_peso,
        icono,
        proveedor,
        observaciones,
        sku: sku || null,
        descripcion: descripcion || '',
        fecha_caducidad: fecha_caducidad || null,
        ubicacion: ubicacion || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el ID del producto' },
        { status: 400 }
      )
    }

    const { data: movimientos, error: movErr } = await supabase
      .from('movimientos_inventario')
      .select('id')
      .eq('producto_id', id)
      .limit(1)

    if (movErr) throw movErr
    if (movimientos && movimientos.length > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar el producto porque tiene movimientos de inventario asociados' },
        { status: 409 }
      )
    }

    const { data: ventas, error: ventErr } = await supabase
      .from('ventas')
      .select('id')
      .eq('producto_id', id)
      .limit(1)

    if (ventErr) throw ventErr
    if (ventas && ventas.length > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar el producto porque tiene ventas asociadas' },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Producto eliminado' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
