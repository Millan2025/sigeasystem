import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = await supabase.from('employees').select('*')
    return NextResponse.json({ success: true, data: data || [], source: 'supabase' })
  } catch {
    return NextResponse.json({ success: true, data: [], source: 'error' })
  }
}
