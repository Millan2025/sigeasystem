import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, serviceKey || anonKey)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, rol, activo, password } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Se requiere ID' }, { status: 400 })
    }

    // 1. Actualizar en public.usuarios (rol, activo)
    const updateData: any = {}
    if (rol !== undefined) updateData.rol = rol
    if (activo !== undefined) updateData.activo = activo

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', id)
    }

    // 2. Cambiar contraseña en auth.users (si se envió y tiene al menos 6 caracteres)
    if (password && password.length >= 6) {
      await supabase.auth.admin.updateUserById(id, { password })
    }

    // 3. Obtener datos actualizados
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
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
      return NextResponse.json({ success: false, error: 'Se requiere ID' }, { status: 400 })
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
