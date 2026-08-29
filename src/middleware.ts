import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Rutas que requieren login
  const rutasProtegidas = ['/pos', '/inventario', '/personal', '/pedidos', '/produccion', '/reportes', '/finanzas', '/admin', '/cliente']
  // Rutas publicas que NO requieren login
  const rutasPublicas = ['/mesa', '/mesas', '/mesas-gestion', '/login', '/registro', '/demo', '/intro', '/']
  const esPublica = rutasPublicas.some(r => path === r || path.startsWith(r + '/'))
  
  const necesitaAuth = rutasProtegidas.some(r => path.startsWith(r))

  if (necesitaAuth && !user && !esPublica) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🔒 PROTECCIÓN ADMIN: Solo admin_master puede acceder a /admin y /api/admin/*
  const esRutaAdmin = path.startsWith('/admin') || path.startsWith('/api/admin')
  
  if (esRutaAdmin && user) {
    // Verificar rol en la tabla usuarios
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()
    
    if (!usuario || usuario.rol !== 'admin_master') {
      // Redirigir no-admins al dashboard del dueño
      if (path.startsWith('/api/admin')) {
        return NextResponse.json({ success: false, error: 'Acceso denegado: se requiere rol admin_master' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
