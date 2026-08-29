import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const slugify = (s: string, len = 18) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase()
    .slice(0, len)

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const tenant_id = (body.tenant_id || '') as string
    const stock_inicial = typeof body.stock_inicial === 'number' ? body.stock_inicial : null
    const costo_ratio = typeof body.costo_ratio === 'number' ? body.costo_ratio : null
    const observacion =
      (body.observacion as string) ||
      'STOCK INICIAL importado de catalogo externo (SiviPOS). Sin compra registrada: regularizar con modulo Compras.'

    if (!tenant_id) {
      return NextResponse.json({ success: false, error: 'Falta tenant_id' }, { status: 400 })
    }

    const { data: rows, error } = await supabase
      .from('productos')
      .select('id, sku, nombre, categoria, precio, precio_compra, stock, imagen_url, descripcion, created_at')
      .eq('tenant_id', tenant_id)

    if (error) throw error

    const groups = new Map<string, any[]>()
    for (const r of rows || []) {
      const key =
        (r.nombre || '').toLowerCase().trim() + '|' +
        (r.categoria || '').toLowerCase().trim() + '|' +
        String(Number(r.precio) || 0)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(r)
    }

    let eliminados = 0
    let actualizados = 0
    const errores: string[] = []

    for (const group of groups.values()) {
      group.sort((a, b) => {
        const score = (x: any) => (x.imagen_url ? 4 : 0) + (x.descripcion ? 2 : 0)
        if (score(b) !== score(a)) return score(b) - score(a)
        return String(b.created_at || '').localeCompare(String(a.created_at || ''))
      })

      const keep = group[0]
      const dupes = group.slice(1)

      for (const d of dupes) {
        const del = await supabase.from('productos').delete().eq('id', d.id)
        if (del.error) errores.push(d.nombre + ': ' + del.error.message)
        else eliminados++
      }

      const upd: Record<string, any> = {}

      if ((keep.sku || '').startsWith('LYK-')) {
        upd.sku = 'LYK-' + (slugify(keep.categoria) || 'GEN') + '-' + (slugify(keep.nombre) || 'PROD')
      }
      if (stock_inicial !== null && (keep.stock === 0 || keep.stock === null)) {
        upd.stock = stock_inicial
      }
      if (costo_ratio !== null && (!keep.precio_compra || Number(keep.precio_compra) === 0)) {
        upd.precio_compra = Math.round((Number(keep.precio) || 0) * costo_ratio)
      }
      if (stock_inicial !== null || costo_ratio !== null) {
        upd.observaciones = observacion
      }

      if (Object.keys(upd).length > 0) {
        const up = await supabase.from('productos').update(upd).eq('id', keep.id)
        if (up.error) errores.push('update ' + keep.nombre + ': ' + up.error.message)
        else actualizados++
      }
    }

    return NextResponse.json({ success: true, eliminados, actualizados, errores: errores.length ? errores : null })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
