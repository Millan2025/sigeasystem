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

    console.log("📥 === INICIO IMPORTACIÓN ===")
    console.log("📥 Tenant ID recibido:", tenant_id)
    console.log("📥 File recibido:", file ? `SI - ${file.name} (${file.size} bytes)` : "NO")
    
    if (!file || !tenant_id) {
      console.log("❌ Error: Faltan archivo o tenant_id")
      return NextResponse.json(
        { success: false, error: 'Faltan: archivo y tenant_id' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      console.log("❌ Error: Tipo de archivo no válido:", file.type)
      return NextResponse.json(
        { success: false, error: 'El archivo debe ser Excel (.xlsx o .xls)' },
        { status: 400 }
      )
    }

    // Leer el archivo Excel
    console.log("📖 Leyendo archivo Excel...")
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    console.log("📊 Filas totales:", rows.length)

    // Obtener encabezados (primera fila)
    const headers = rows[0] as string[]
    console.log("📋 Encabezados:", headers)

    // Mapear nombres de columnas a índices
    const colMap: { [key: string]: number } = {}
    headers.forEach((h, idx) => {
      const key = h?.toString().trim().toUpperCase()
      if (key) colMap[key] = idx
    })
    console.log("🗺️ Mapa de columnas:", Object.keys(colMap))

    // Función para obtener valor de una fila por nombre de columna
    const getVal = (row: any[], colName: string) => {
      const idx = colMap[colName.toUpperCase()]
      return idx !== undefined ? row[idx] : undefined
    }

    // Omitir encabezado
    const productosData = rows.slice(1).filter(row => row.length > 1 && row[0] && row[0].toString().trim() !== '')
    console.log("📦 Productos a procesar:", productosData.length)

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
      const descripcion = getVal(row, 'DESCRIPCION')?.toString().trim() || ''
      const stock_minimo = parseInt(getVal(row, 'STOCK_MINIMO')) || 0
      const stock_maximo = parseInt(getVal(row, 'STOCK_MAXIMO')) || 0
      const tipo_unidad = getVal(row, 'TIPO_UNIDAD')?.toString().trim() || 'unidad'
      const venta_por_peso = getVal(row, 'VENTA_POR_PESO')?.toString().trim() === 'SI' || false
      const icono = getVal(row, 'ICONO')?.toString().trim() || '📦'
      const observaciones = getVal(row, 'OBSERVACIONES')?.toString().trim() || ''
      const fecha_caducidad = getVal(row, 'FECHA_CADUCIDAD')?.toString().trim() || null
      const ubicacion = getVal(row, 'UBICACION')?.toString().trim() || ''

      if (!nombre) {
        errores.push(`Fila sin nombre: ${row.join(',')}`)
        continue
      }

      try {
        console.log(`🔄 Insertando: ${nombre} (tenant: ${tenant_id})`)
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
          console.log(`❌ Error insertando ${nombre}:`, error.message)
          errores.push(`${nombre}: ${error.message}`)
        } else {
          console.log(`✅ Insertado: ${nombre}`)
          importados++
        }
      } catch (err) {
        console.log(`❌ Error procesando ${nombre}:`, err)
        errores.push(`${nombre}: Error de procesamiento`)
      }
    }

    console.log(`📊 FINAL: ${importados} importados, ${errores.length} errores`)
    if (errores.length > 0) {
      console.log("❌ Errores:", errores)
    }

    return NextResponse.json({
      success: true,
      importados,
      errores: errores.length > 0 ? errores : null
    })

  } catch (error: any) {
    console.log("❌ Error general:", error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
