import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

// Usar SERVICE_ROLE_KEY para bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const tenant_id = formData.get('tenant_id') as string

    if (!file || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan: archivo y tenant_id' },
        { status: 400 }
      )
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'El archivo es demasiado grande (máximo 10MB)' },
        { status: 400 }
      )
    }

    // Leer el archivo
    const buffer = await file.arrayBuffer()
    let workbook
    try {
      workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: true })
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: 'Error al leer el archivo: ' + err.message },
        { status: 400 }
      )
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!sheet) {
      return NextResponse.json(
        { success: false, error: 'El archivo no contiene hojas de cálculo' },
        { status: 400 }
      )
    }

    let jsonData: any[]
    try {
      jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: 'Error al procesar el archivo: ' + err.message },
        { status: 400 }
      )
    }

    if (jsonData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El archivo está vacío o no tiene datos' },
        { status: 400 }
      )
    }

    let importados = 0
    let errores: string[] = []

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      
      const seccion = (row.SECCION || '').toString().trim().toUpperCase()
      if (seccion !== 'PRODUCTO') continue

      const nombre = (row.NOMBRE || '').toString().trim()
      if (!nombre) {
        errores.push(`Fila ${i + 2}: NOMBRE vacío`)
        continue
      }

      const sku = (row.SKU || '').toString().trim() || null
      const precio = parseFloat(row.PRECIO) || 0
      const precio_compra = parseFloat(row.COSTO) || 0
      const stock = parseInt(row.STOCK_INICIAL) || 0
      const unidad = (row.UNIDAD_MEDIDA || '').toString().trim() || 'unidad'
      const categoria = (row.CATEGORIA || '').toString().trim() || 'General'
      const proveedor = (row.PROVEEDOR || '').toString().trim() || ''
      const descripcion = (row.DESCRIPCION || '').toString().trim() || ''
      const stock_minimo = parseInt(row.STOCK_MINIMO) || 0
      const stock_maximo = parseInt(row.STOCK_MAXIMO) || 0
      const tipo_unidad = (row.TIPO_UNIDAD || '').toString().trim() || 'unidad'
      const venta_por_peso = (row.VENTA_POR_PESO || '').toString().trim().toUpperCase() === 'SI'
      const icono = (row.ICONO || '').toString().trim() || '📦'
      const observaciones = (row.OBSERVACIONES || '').toString().trim() || ''
      const fecha_caducidad = (row.FECHA_CADUCIDAD || '').toString().trim() || null
      const ubicacion = (row.UBICACION || '').toString().trim() || ''

      try {
        const { error } = await supabase
          .from('productos')
          .insert({
            tenant_id,
            sku,
            nombre,
            descripcion,
            categoria,
            precio,
            precio_compra,
            stock,
            stock_minimo,
            stock_maximo,
            unidad,
            tipo_unidad,
            venta_por_peso,
            icono,
            proveedor,
            observaciones,
            fecha_caducidad: fecha_caducidad || null,
            ubicacion,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) {
          errores.push(`${nombre}: ${error.message}`)
        } else {
          importados++
        }
      } catch (err: any) {
        errores.push(`${nombre}: Error de procesamiento (${err.message})`)
      }
    }

    return NextResponse.json({
      success: true,
      importados,
      errores: errores.length > 0 ? errores : null
    })

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
