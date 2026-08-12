import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: Resetear TODAS las cifras financieras del negocio
// Requiere confirmación con token "RESETEAR"
export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const tenantId = url.searchParams.get('tenant')
    const body = await request.json()

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Falta tenant_id' }, { status: 400 })
    }

    // DOBLE CONFIRMACIÓN DE SEGURIDAD
    if (body.confirmacion !== 'RESETEAR') {
      return NextResponse.json({ 
        success: false, 
        error: 'Confirmación inválida. Debes escribir RESETEAR' 
      }, { status: 400 })
    }

    // Tablas a resetear (solo cifras, NO catálogos)
    const tablasAResetear = [
      { tabla: 'sale_items', campo: 'tenant_id' },
      { tabla: 'compras', campo: 'tenant_id' },
      { tabla: 'ventas', campo: 'tenant_id' },
      { tabla: 'pedidos', campo: 'tenant_id' },
      { tabla: 'creditos', campo: 'tenant_id' },
      { tabla: 'cash_sessions', campo: 'user_id' },
      { tabla: 'movimientos_inventario', campo: 'tenant_id' },
      { tabla: 'transacciones', campo: 'tenant_id' },
    ]

    const resultados: any = {}
    let totalRegistrosBorrados = 0

    // 1. Resetear cash_sessions primero (por FK con sales)
    const { error: cashErr } = await supabase
      .from('cash_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (cashErr) {
      console.error('Error borrando cash_sessions:', cashErr)
      resultados.cash_sessions = `error: ${cashErr.message}`
    } else {
      resultados.cash_sessions = 'borrado (cascade con sales)'
    }

    // 2. Resetear cada tabla con tenant_id
    for (const { tabla, campo } of tablasAResetear) {
      if (tabla === 'cash_sessions') continue

      try {
        const { error, count } = await supabase
          .from(tabla)
          .delete()
          .eq(campo, tenantId)

        if (error) {
          resultados[tabla] = `error: ${error.message}`
          console.error(`Error borrando ${tabla}:`, error)
        } else {
          resultados[tabla] = `${count || 0} registros borrados`
          totalRegistrosBorrados += (count || 0)
        }
      } catch (e: any) {
        resultados[tabla] = `error: ${e.message}`
      }
    }

    // 3. Resetear stock de productos a 0
    const { error: stockErr } = await supabase
      .from('productos')
      .update({ stock: 0, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)

    if (stockErr) {
      resultados.productos_stock = `error: ${stockErr.message}`
    } else {
      resultados.productos_stock = 'stock reseteado a 0'
    }

    return NextResponse.json({
      success: true,
      message: `Finanzas reseteadas. ${totalRegistrosBorrados} registros eliminados.`,
      detalles: resultados
    })
  } catch (error: any) {
    console.error('❌ Error en reset de finanzas:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
