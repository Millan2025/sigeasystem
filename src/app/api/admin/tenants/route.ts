export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, serviceKey || anonKey)

// Función para buscar usuario por email en auth.users
async function findUserByEmail(email: string) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) throw error
    return data.users?.find((u: any) => u.email === email) || null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('business_config')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    const mapped = data.map(row => ({ ...row, tenant_id: row.id }))
    return NextResponse.json({ success: true, data: mapped })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nombre_negocio,
      tipo,
      gerente,
      correo_contacto,
      telefono,
      direccion,
      plan,
      logo_url,
      whatsapp,
      nequi,
      bancolombia,
      daviplata,
      color_principal,
      color_secundario,
      nit,
      cedula,
      password
    } = body

    if (!nombre_negocio || !tipo || !correo_contacto || !password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios: nombre_negocio, tipo, correo_contacto, password (mínimo 6 caracteres)' },
        { status: 400 }
      )
    }

    const tenant_id = crypto.randomUUID()
    const existingUser = await findUserByEmail(correo_contacto)
    let authUserId: string
    let userPassword = password

    if (existingUser) {
      // Si el usuario ya existe, no podemos cambiar la contraseña aquí (se actualiza en el PUT)
      // Pero para la creación, asumimos que no existe.
      return NextResponse.json(
        { success: false, error: 'El correo ya está registrado. Usa otro correo o edita el usuario existente.' },
        { status: 409 }
      )
    }

    // Crear usuario en auth.users con la contraseña proporcionada
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: correo_contacto,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        nombre: gerente || 'Administrador',
        tenant_id: tenant_id
      }
    })
    if (authError) {
      return NextResponse.json(
        { success: false, error: 'Error al crear usuario: ' + authError.message },
        { status: 500 }
      )
    }
    authUserId = authUser.user.id

    // Insertar en public.usuarios
    const { error: userError } = await supabase
      .from('usuarios')
      .upsert({
        id: authUserId,
        email: correo_contacto,
        nombre: gerente || 'Administrador',
        rol: 'admin',
        tenant_id: tenant_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (userError) {
      // Rollback: eliminar usuario de auth
      await supabase.auth.admin.deleteUser(authUserId)
      return NextResponse.json(
        { success: false, error: 'Error al guardar usuario en tabla public: ' + userError.message },
        { status: 500 }
      )
    }

    // Insertar en business_config
    const { data, error } = await supabase
      .from('business_config')
      .insert({
        id: tenant_id,
        nombre_negocio,
        tipo_negocio: tipo,
        gerente: gerente || null,
        correo_contacto,
        telefono: telefono || null,
        direccion: direccion || null,
        plan: plan || 'Free',
        nit: nit || null,
        cedula: cedula || null,
        logo_url: logo_url || null,
        whatsapp: whatsapp || null,
        nequi: nequi || null,
        bancolombia: bancolombia || null,
        daviplata: daviplata || null,
        color_principal: color_principal || '#10B981',
        color_secundario: color_secundario || '#059669',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      // Rollback: eliminar usuario de auth y public
      await supabase.auth.admin.deleteUser(authUserId)
      await supabase.from('usuarios').delete().eq('id', authUserId)
      return NextResponse.json(
        { success: false, error: 'Error al crear tenant: ' + error.message },
        { status: 500 }
      )
    }

    // Devolver datos del tenant + credenciales
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        tenant_id: data.id,
        credentials: {
          email: correo_contacto,
          password: userPassword,
          message: `Cliente creado con éxito. Credenciales: Email: ${correo_contacto}, Contraseña: ${userPassword}`
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      nombre_negocio,
      tipo,
      gerente,
      correo_contacto,
      telefono,
      direccion,
      plan,
      logo_url,
      whatsapp,
      nequi,
      bancolombia,
      daviplata,
      color_principal,
      color_secundario,
      nit,
      cedula,
      password
    } = body

    if (!id || !nombre_negocio || !tipo || !correo_contacto) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    // 1. Actualizar cliente
    const { data, error } = await supabase
      .from('business_config')
      .update({
        nombre_negocio,
        tipo_negocio: tipo,
        gerente,
        correo_contacto,
        telefono,
        direccion,
        plan,
        nit,
        cedula,
        logo_url,
        whatsapp,
        nequi,
        bancolombia,
        daviplata,
        color_principal,
        color_secundario
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al actualizar cliente: ' + error.message },
        { status: 500 }
      )
    }

    // 2. Si se proporciona contraseña, actualizar usuario
    if (password && password.length >= 6) {
      const existingUser = await findUserByEmail(correo_contacto)
      if (existingUser) {
        const { error: updateAuthError } = await supabase.auth.admin.updateUserById(existingUser.id, { password })
        if (updateAuthError) {
          return NextResponse.json(
            { success: false, error: 'Error al actualizar contraseña: ' + updateAuthError.message },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { success: false, error: 'No se encontró usuario con ese correo para actualizar contraseña' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: { ...data, tenant_id: data.id }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'Se requiere ID' }, { status: 400 })

    // 1) Limpieza en cascada de tablas dependientes (mejor esfuerzo)
    const tablas = [
      'sale_items', 'sales', 'compra_items', 'compras', 'pedidos', 'creditos',
      'facturas', 'sellos', 'puntos_movimientos', 'canjes', 'clientes_fidelizados',
      'movimientos_inventario', 'ordenes_produccion', 'traslados', 'remisiones',
      'transacciones', 'cash_sessions', 'notificaciones', 'mensajes',
      'campanas_fidelizacion', 'premios', 'config_fidelizacion', 'config_facturacion',
      'plantillas_factura', 'config_whatsapp', 'publicaciones_whatsapp', 'piezas_marketing',
      'mesas', 'customer_orders', 'order_items', 'employees', 'asistencias',
      'nominas_pagadas', 'gastos_operativos', 'categorias_contables',
      'periodos_fiscales', 'configuracion_impuestos', 'cupones', 'crm_prospectos',
      'leads', 'productos'
    ]
    const errores: string[] = []
    for (const t of tablas) {
      const r1 = await supabase.from(t).delete().eq('tenant_id', id)
      if (r1.error) {
        const r2 = await supabase.from(t).delete().eq('business_config_id', id)
        if (r2.error && r2.error.message.indexOf('does not exist') === -1) {
          errores.push(t + ': ' + r1.error.message)
        }
      }
    }

    // 2) Eliminar usuarios auth + fila en usuarios
    const usu = await supabase.from('usuarios').select('id').eq('tenant_id', id)
    if (usu.data && usu.data.length) {
      for (const u of usu.data) {
        try { await supabase.auth.admin.deleteUser(u.id) } catch (e) {}
      }
      await supabase.from('usuarios').delete().eq('tenant_id', id)
    }

    // 3) Eliminar el negocio al final
    const del = await supabase.from('business_config').delete().eq('id', id)
    if (del.error) {
      return NextResponse.json(
        { success: false, error: 'Error al eliminar cliente: ' + del.error.message + (errores.length ? ' | Dependencias: ' + errores.join('; ') : '') },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true, message: 'Cliente y todos sus datos eliminados' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
