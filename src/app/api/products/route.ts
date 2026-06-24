import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const url = new URL(request.url)
    const isDemo = url.searchParams.get('demo') === 'true'

    // 🔥 Siempre usar el tenant_id de demo para dev
    const tenantId = '7e045520-5e36-4e3f-a39f-10ea7d6dce76'

    if (!tenantId) {
      return NextResponse.json({ success: true, data: [], source: 'no-tenant' })
    }

    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('nombre')

    if (error) {
      return NextResponse.json({ success: true, data: [], source: 'error' })
    }

    return NextResponse.json({ success: true, data: data || [], source: isDemo ? 'demo' : 'productos' })
  } catch {
    return NextResponse.json({ success: true, data: [], source: 'catch' })
  }
}
