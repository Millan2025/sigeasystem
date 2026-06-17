import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, nombre } = await request.json()

    const supabase = (await import('@/lib/supabase/client')).createClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } }
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    // Crear perfil manualmente si el trigger falló
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        nombre: nombre || email,
        rol: 'cliente'
      })
      
      if (profileError) {
        console.error('Error creando perfil:', profileError)
      }
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al registrar' }, { status: 500 })
  }
}
