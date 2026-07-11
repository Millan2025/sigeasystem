import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar la clave de servicio si existe, si no usar la anónima
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Crear cliente con la clave disponible (prioridad a service_role)
const supabase = createClient(
  supabaseUrl,
  serviceKey || anonKey
)

export async function GET() {
  try {
    // Si tenemos service_key, podemos obtener auth.users + public.usuarios
    let combined = []
    
    if (serviceKey) {
      // 1. Obtener auth.users (solo con service role)
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      if (authError) throw authError

      // 2. Obtener public.usuarios
      const { data: publicUsers, error: publicError } = await supabase
        .from('usuarios')
        .select('*')
      if (publicError) throw publicError

      // Combinar
      combined = authUsers.users.map((authUser: any) => {
        const publicData = publicUsers.find((u: any) => u.id === authUser.id)
        return {
          id: authUser.id,
          email: authUser.email,
          nombre: publicData?.nombre || null,
          apellido: publicData?.apellido || null,
          rol: publicData?.rol || 'usuario',
          tenant_id: publicData?.tenant_id || null,
          activo: publicData?.activo !== undefined ? publicData.activo : true,
          created_at: publicData?.created_at || authUser.created_at,
          updated_at: publicData?.updated_at || null,
        }
      })
    } else {
      // Sin service_key: solo consultar public.usuarios
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      combined = data.map((u: any) => ({
        id: u.id,
        email: u.email,
        nombre: u.nombre || null,
        apellido: u.apellido || null,
        rol: u.rol || 'usuario',
        tenant_id: u.tenant_id || null,
        activo: u.activo !== undefined ? u.activo : true,
        created_at: u.created_at,
        updated_at: u.updated_at || null,
      }))
    }

    return NextResponse.json({ success: true, data: combined })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, rol, activo } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Se requiere ID' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (rol !== undefined) updateData.rol = rol
    if (activo !== undefined) updateData.activo = activo

    const { data, error } = await supabase
      .from('usuarios')
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

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true, message: 'Usuario eliminado' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
