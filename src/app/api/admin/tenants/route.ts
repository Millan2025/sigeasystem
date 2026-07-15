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
      password // contraseña proporcionada por el admin (opcional)
    } = body

    if (!nombre_negocio || !tipo || !correo_contacto) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios: nombre_negocio, tipo, correo_contacto' },
        { status: 400 }
      )
    }

    // Generar tenant_id
    const tenant_id = crypto.randomUUID()

    // Generar contraseña (si no se proporciona)
    const userPassword = password && password.length >= 6 ? password : generarPassword()

    // 1. Crear usuario en auth.users
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
      // Si falla, no crear el tenant
      return NextResponse.json(
        { success: false, error: 'Error al crear usuario: ' + authError.message },
        { status: 500 }
      )
    }

    // 2. Insertar en public.usuarios
    const { error: userError } = await supabase
      .from('usuarios')
      .insert({
        id: authUser.user.id,
        email: correo_contacto,
        nombre: gerente || 'Administrador',
        rol: 'admin',
        tenant_id: tenant_id,
        created_at: new Date().toISOString()
      })

    if (userError) {
      // Si falla, eliminar el usuario de auth (opcional, pero mejor hacer rollback)
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { success: false, error: 'Error al crear usuario en la tabla public: ' + userError.message },
        { status: 500 }
      )
    }

    // 3. Insertar en business_config
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
      // Rollback: eliminar usuario y registro public
      await supabase.auth.admin.deleteUser(authUser.user.id)
      await supabase.from('usuarios').delete().eq('id', authUser.user.id)
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
          message: `Usuario creado con email ${correo_contacto} y contraseña temporal.`
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
