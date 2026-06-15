import { NextResponse } from 'next/server'

export async function GET() {
  try {
    if (process.env.DATABASE_URL) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data, error } = await supabase.from('products').select('*').order('name')
      if (!error && data) {
        return NextResponse.json({ success: true, data, source: 'supabase' })
      }
    }
    
    return NextResponse.json({ success: true, data: [], source: 'respaldo' })
  } catch {
    return NextResponse.json({ success: true, data: [], source: 'error' })
  }
}
