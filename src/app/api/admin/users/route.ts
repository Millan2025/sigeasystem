import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar la clave de servicio (service_role) para acceder a auth.users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Debes agregar esta variable en Vercel
)

export async function GET() {
  try {
    // 1. Obtener todos los usuarios de auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    if (authError) throw authError

    // 2. Obtener todos los usuarios de public.usuarios
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
    if (publicError) throw publicError

    // 3. Combinar: usar auth.users como base y agregar datos de public.usuarios
    const combined = authUsers.users.map((authUser: any) => {
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

    const { data, error } = await supabaseAdmin
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

    // Eliminar solo de public.usuarios (no de auth.users)
    const { error } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true, message: 'Usuario eliminado de la tabla public' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
