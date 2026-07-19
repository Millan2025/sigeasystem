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
    const categoria = url.searchParams.get('categoria')
    const search = url.searchParams.get('search')

    let query = supabase
      .from('productos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nombre')

    if (categoria && categoria !== 'null') query = query.ilike('categoria', categoria)
    if (search) query = query.ilike('nombre', `%${search}%`)

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
      observaciones, sku, descripcion, fecha_caducidad, ubicacion, imagen_url
    } = body

    if (!nombre || !categoria || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    // Verificar SKU duplicado (solo si se proporciona)
    if (sku) {
      const { data: existing } = await supabase
        .from('productos')
        .select('id')
        .eq('sku', sku)
        .eq('tenant_id', tenant_id)
        .maybeSingle()
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un producto con ese SKU' },
          { status: 409 }
        )
      }
    }

        // Construir objeto de actualización solo con los campos que vienen en el body
    const updateData: any = {};
    const camposPermitidos = [
      "nombre", "categoria", "precio", "precio_compra", "stock", "stock_minimo", "stock_maximo",
      "unidad", "tipo_unidad", "venta_por_peso", "icono", "proveedor", "observaciones",
      "sku", "descripcion", "fecha_caducidad", "ubicacion", "imagen_url"
    ];
    camposPermitidos.forEach((campo) => {
      if (campo in body) {
        // Si el campo está en el body, usamos su valor (puede ser null o vacío)
        // Pero si es undefined, no lo incluimos
        const valor = body[campo];
        if (valor !== undefined) {
          updateData[campo] = valor;
        }
      }
    });
    // Asegurar que updated_at se actualice siempre
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('productos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (stock > 0) {
      await supabase
        .from('movimientos_inventario')
        .insert({
          producto_id: data.id,
          tipo: 'entrada',
          cantidad: stock,
          motivo: 'Stock inicial al crear producto',
          tenant_id,
          created_at: new Date().toISOString()
        })
    }

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
      observaciones, sku, descripcion, fecha_caducidad, ubicacion, imagen_url
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el ID del producto' },
        { status: 400 }
      )
    }

    // Obtener tenant_id del producto
    const { data: existing, error: fetchErr } = await supabase
      .from('productos')
      .select('tenant_id')
      .eq('id', id)
      .single()
    if (fetchErr) throw fetchErr

    if (sku) {
      const { data: dup } = await supabase
        .from('productos')
        .select('id')
        .eq('sku', sku)
        .eq('tenant_id', existing.tenant_id)
        .neq('id', id)
        .maybeSingle()
      if (dup) {
        return NextResponse.json(
          { success: false, error: 'Ya existe otro producto con ese SKU' },
          { status: 409 }
        )
      }
    }

        // Construir objeto de actualización solo con los campos que vienen en el body
    const updateData: any = {};
    const camposPermitidos = [
      "nombre", "categoria", "precio", "precio_compra", "stock", "stock_minimo", "stock_maximo",
      "unidad", "tipo_unidad", "venta_por_peso", "icono", "proveedor", "observaciones",
      "sku", "descripcion", "fecha_caducidad", "ubicacion", "imagen_url"
    ];
    camposPermitidos.forEach((campo) => {
      if (campo in body) {
        // Si el campo está en el body, usamos su valor (puede ser null o vacío)
        // Pero si es undefined, no lo incluimos
        const valor = body[campo];
        if (valor !== undefined) {
          updateData[campo] = valor;
        }
      }
    });
    // Asegurar que updated_at se actualice siempre
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('productos')
      .update(updateData)
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
        { success: false, error: 'Se requiere ID' },
        { status: 400 }
      )
    }

    // Verificar movimientos y ventas
    const { data: movs, error: movErr } = await supabase
      .from('movimientos_inventario')
      .select('id')
      .eq('producto_id', id)
      .limit(1)
    if (movErr) throw movErr
    if (movs && movs.length > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar: tiene movimientos de inventario' },
        { status: 409 }
      )
    }

    const { data: ventas, error: venErr } = await supabase
      .from('ventas')
      .select('id')
      .eq('producto_id', id)
      .limit(1)
    if (venErr) throw venErr
    if (ventas && ventas.length > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar: tiene ventas asociadas' },
        { status: 409 }
      )
    }

    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true, message: 'Producto eliminado' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

