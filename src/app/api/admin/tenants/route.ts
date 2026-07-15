import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, serviceKey || anonKey)

// Función para generar contraseña aleatoria
function generarPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Función para buscar usuario por email en auth.users (sin filtros en la llamada)
async function findUserByEmail(email: string) {
  try {
    // Obtener todos los usuarios y filtrar en JavaScript
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
      password
    } = body

    if (!nombre_negocio || !tipo || !correo_contacto) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios: nombre_negocio, tipo, correo_contacto' },
        { status: 400 }
      )
    }

    const tenant_id = crypto.randomUUID()
    const existingUser = await findUserByEmail(correo_contacto)
    let authUserId: string

    if (existingUser) {
      authUserId = existingUser.id
    } else {
      const userPassword = password && password.length >= 6 ? password : generarPassword()
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
    }

    // Insertar o actualizar en public.usuarios (usando upsert para evitar duplicados)
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
      return NextResponse.json(
        { success: false, error: 'Error al actualizar usuario en tabla public: ' + userError.message },
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
      return NextResponse.json(
        { success: false, error: 'Error al crear tenant: ' + error.message },
        { status: 500 }
      )
    }

    const credenciales = {
      email: correo_contacto,
      password: existingUser ? ' (usuario ya existente, conserva su contraseña actual)' : (password && password.length >= 6 ? password : 'contraseña generada automáticamente, revisa el log'),
      message: existingUser
        ? `El usuario ${correo_contacto} ya estaba registrado. Se asignó al tenant.`
        : `Usuario ${correo_contacto} creado con ${password && password.length >= 6 ? 'la contraseña proporcionada' : 'una contraseña generada automáticamente'}.`
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        tenant_id: data.id,
        credentials: credenciales
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
    if (!id) {
      return NextResponse.json({ success: false, error: 'Se requiere ID' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('business_config')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Error al eliminar cliente: ' + deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Cliente eliminado' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
