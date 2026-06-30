import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant') || '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
    const { data, error } = await supabase
      .from('categorias_contables')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('codigo', { ascending: true })
    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { codigo, nombre, tipo, nivel, padre_id, tenant_id } = body
    if (!codigo || !nombre || !tenant_id) {
      return NextResponse.json({ success: false, error: 'Faltan campos' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('categorias_contables')
      .insert({ codigo, nombre, tipo, nivel, padre_id: padre_id || null, tenant_id })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, codigo, nombre, tipo, nivel, padre_id } = body
    if (!id) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    const { data, error } = await supabase
      .from('categorias_contables')
      .update({ codigo, nombre, tipo, nivel, padre_id: padre_id || null })
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
    if (!id) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    const { error } = await supabase
      .from('categorias_contables')
      .delete()
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
