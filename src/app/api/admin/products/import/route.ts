import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const tenant_id = formData.get('tenant_id') as string

    console.log("📥 Tenant ID recibido:", tenant_id); console.log("📥 File recibido:", file ? "SI" : "NO"); if (!file || !tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan: archivo y tenant_id' },
        { status: 400 }
      )
    }

    // Leer el archivo Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    // Obtener encabezados (primera fila)
    const headers = rows[0] as string[]
    // Mapear nombres de columnas a índices
    const colMap: { [key: string]: number } = {}
    headers.forEach((h, idx) => {
      const key = h?.toString().trim().toUpperCase()
      if (key) colMap[key] = idx
    })

    // Función para obtener valor de una fila por nombre de columna
    const getVal = (row: any[], colName: string) => {
      const idx = colMap[colName.toUpperCase()]
      return idx !== undefined ? row[idx] : undefined
    }

    // Omitir encabezado
    const productosData = rows.slice(1).filter(row => row.length > 1 && row[0] && row[0].toString().trim() !== '')

    let importados = 0
    let errores = []

    for (const row of productosData) {
      // Extraer valores por nombre de columna
      const sku = getVal(row, 'SKU')?.toString().trim() || null
      const nombre = getVal(row, 'NOMBRE')?.toString().trim()
      const precio = parseFloat(getVal(row, 'PRECIO')) || 0
      const precio_compra = parseFloat(getVal(row, 'COSTO')) || 0
      const stock = parseInt(getVal(row, 'STOCK_INICIAL')) || 0
      const unidad = getVal(row, 'UNIDAD_MEDIDA')?.toString().trim() || 'unidad'
      const categoria = getVal(row, 'CATEGORIA')?.toString().trim() || 'General'
      const proveedor = getVal(row, 'PROVEEDOR')?.toString().trim() || ''
      // Columnas adicionales con valores por defecto
      const descripcion = getVal(row, 'DESCRIPCION')?.toString().trim() || ''
      const stock_minimo = parseInt(getVal(row, 'STOCK_MINIMO')) || 0
      const stock_maximo = parseInt(getVal(row, 'STOCK_MAXIMO')) || 0
      const tipo_unidad = getVal(row, 'TIPO_UNIDAD')?.toString().trim() || 'unidad'
      const venta_por_peso = getVal(row, 'VENTA_POR_PESO')?.toString().trim() === 'SI' || false
      const icono = getVal(row, 'ICONO')?.toString().trim() || '📦'
      const observaciones = getVal(row, 'OBSERVACIONES')?.toString().trim() || ''
      const fecha_caducidad = getVal(row, 'FECHA_CADUCIDAD')?.toString().trim() || null
      const ubicacion = getVal(row, 'UBICACION')?.toString().trim() || ''
      // Campos de la plantilla original que no se usan en la BD
      // ES_RECETA, PRECIO_POR_KG, PROVEEDOR_TELEFONO (se ignoran)

      if (!nombre) {
        errores.push(`Fila sin nombre: ${row.join(',')}`)
        continue
      }

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
      } catch (err) {
        errores.push(`${nombre}: Error de procesamiento`)
      }
    }

    return NextResponse.json({
      success: true,
      importados,
      errores: errores.length > 0 ? errores : null
    })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

