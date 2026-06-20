import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = await supabase.from('cash_sessions').select('*').order('opened_at', { ascending: false }).limit(1)
    return NextResponse.json({ success: true, data: data?.[0] || null, source: 'supabase' })
  } catch {
    return NextResponse.json({ success: true, data: null, source: 'error' })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { cashierName, initialBalance } = body
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data, error } = await supabase.from('cash_sessions').insert({
      cashier_name: cashierName || 'Cajero',
      status: 'open',
      initial_balance: initialBalance || 0,
    }).select().single()
    if (!error && data) return NextResponse.json({ success: true, data, source: 'supabase' }, { status: 201 })
    return NextResponse.json({ success: false, error: 'Error' }, { status: 500 })
  } catch {
    return NextResponse.json({ success: false, error: 'Error' }, { status: 500 })
  }
}
