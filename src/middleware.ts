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

  // Rutas que requieren autenticación
  const rutasProtegidas = ['/pos', '/inventario', '/personal', '/pedidos', '/produccion', '/reportes', '/finanzas', '/admin']
  const necesitaAuth = rutasProtegidas.some(r => request.nextUrl.pathname.startsWith(r))

  // Rutas públicas (no requieren auth)
  const rutasPublicas = ['/login', '/registro', '/tienda', '/entregas', '/api', '/_next', '/favicon.ico']
  const esPublica = rutasPublicas.some(r => request.nextUrl.pathname.startsWith(r))

  if (necesitaAuth && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin Master solo para rol admin_master
  if (request.nextUrl.pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single()
    
    if (profile?.rol !== 'admin_master') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
