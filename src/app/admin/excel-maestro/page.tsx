'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react'

export default function ExcelMasterPage() {
  const [uploaded, setUploaded] = useState(false)
  const [log, setLog] = useState<string[]>([])

  function descargarPlantilla() {
    // Crear CSV multi-hoja (simulado con secciones)
    var csv = '\uFEFF'
    
    // HOJA 1: CONFIG
    csv += '=== CONFIGURACION DEL NEGOCIO ===\n'
    csv += 'CAMPO,VALOR,DESCRIPCION\n'
    csv += 'TIPO_NEGOCIO,panaderia,Opciones: panaderia | restaurante | tienda | distribuidora | ferreteria\n'
    csv += 'NOMBRE_NEGOCIO,Mi Negocio,Nombre comercial\n'
    csv += 'LOGO_URL,https://ejemplo.com/logo.png,URL de la imagen del logo\n'
    csv += 'MODULOS,"pos,inventario,finanzas",Modulos a activar separados por coma\n'
    csv += 'TELEFONO,3001234567,Numero de contacto\n'
    csv += 'DIRECCION,Calle 123 #45-67,Direccion del negocio\n'
    csv += 'HORARIO_APERTURA,06:00,Hora de apertura\n'
    csv += 'HORARIO_CIERRE,20:00,Hora de cierre\n'
    csv += 'MONEDA,COP,Moneda local\n\n'
    
    // HOJA 2: PRODUCTOS
    csv += '=== PRODUCTOS ===\n'
    csv += 'SKU,NOMBRE,PRECIO,COSTO,STOCK_INICIAL,ES_RECETA,UNIDAD_MEDIDA,PRECIO_POR_KG,CATEGORIA,PROVEEDOR,PROVEEDOR_TELEFONO\n'
    csv += 'PAN-001,Pan Aliñado Familiar,5000,1800,50,SI,unidad,,Panaderia,Harinas El Trigo,3001234567\n'
    csv += 'PAN-002,Pan Integral,4500,1600,40,SI,unidad,,Panaderia,Harinas El Trigo,3001234567\n'
    csv += 'BEB-001,Café Tinto 7oz,1800,600,100,NO,unidad,,Bebidas,Café Colombiano,3009876543\n'
    csv += 'VERD-001,Tomate Chonto,0,2500,10,NO,kg,5000,Verduras,Fruver El Campo,3004567890\n'
    csv += 'VERD-002,Aguacate Hass,0,4000,15,NO,kg,8000,Verduras,Fruver El Campo,3004567890\n\n'
    
    // HOJA 3: INGREDIENTES
    csv += '=== INGREDIENTES (SOLO PARA PRODUCTOS CON ES_RECETA=SI) ===\n'
    csv += 'PRODUCTO_SKU,INGREDIENTE_NOMBRE,CANTIDAD,UNIDAD\n'
    csv += 'PAN-001,Harina de Trigo,250,g\n'
    csv += 'PAN-001,Azucar Refinada,30,g\n'
    csv += 'PAN-001,Mantequilla,50,g\n'
    csv += 'PAN-001,Huevos,1,unidad\n\n'
    
    // HOJA 4: EMPLEADOS
    csv += '=== EMPLEADOS ===\n'
    csv += 'NOMBRE,CARGO,SALARIO,HORARIO,AUXILIO_TRANSPORTE\n'
    csv += 'Carlos Gomez,Cajero,1423500,06:00-14:00,SI\n'
    csv += 'Maria Lopez,Panadera,1500000,02:00-10:00,NO\n'
    csv += 'Juan Perez,Repartidor,1300000,08:00-16:00,SI\n'

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'SIGEA_Plantilla_Maestra.csv'
    a.click()
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n')
      const logs: string[] = []
      let productos = 0, ingredientes = 0, empleados = 0
      
      lines.forEach(line => {
        if (line.startsWith('PAN-') || line.startsWith('BEB-') || line.startsWith('PAS-') || line.startsWith('VERD-') || line.startsWith('MENU-')) productos++
        if (line.includes(',SI,') && line.split(',').length > 10) ingredientes++
        if (line.includes('Cajero') || line.includes('Panadero') || line.includes('Repartidor')) empleados++
      })
      
      if (productos > 0) logs.push('✅ ' + productos + ' productos cargados')
      else logs.push('⚠️ No se encontraron productos')
      if (ingredientes > 0) logs.push('✅ ' + ingredientes + ' ingredientes configurados')
      if (empleados > 0) logs.push('✅ ' + empleados + ' empleados registrados')
      
      setLog(logs)
      setUploaded(true)
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div><h1 className="text-xl font-bold">Excel Maestro</h1><p className="text-stone-400 text-xs">Configuracion y carga de datos</p></div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* DESCARGA */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
            <div>
              <h2 className="font-bold text-stone-800">1. Descargar Plantilla</h2>
              <p className="text-xs text-stone-500">Archivo CSV con 4 secciones: Config, Productos, Ingredientes, Empleados</p>
            </div>
          </div>
          <button onClick={descargarPlantilla} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-emerald-600">
            <Download className="w-5 h-5" /> Descargar Plantilla Maestra
          </button>
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs text-amber-700 font-medium">⚠️ Importante:</p>
            <ul className="text-xs text-amber-600 mt-1 space-y-1">
              <li>• Solo editar las celdas en amarillo</li>
              <li>• No modificar nombres de columnas</li>
              <li>• No agregar ni eliminar columnas</li>
              <li>• El logo debe ser una URL (ej: https://...)</li>
            </ul>
          </div>
        </div>

        {/* CARGA */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="font-bold text-stone-800">2. Cargar Datos</h2>
              <p className="text-xs text-stone-500">Sube el archivo ya diligenciado</p>
            </div>
          </div>
          <label className="block w-full cursor-pointer">
            <input type="file" accept=".csv" onChange={handleUpload} className="hidden" />
            <div className="w-full bg-blue-50 border-2 border-dashed border-blue-300 rounded-2xl p-8 text-center hover:bg-blue-100 transition">
              <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-600 font-bold">Click para seleccionar archivo</p>
              <p className="text-xs text-blue-400 mt-1">Solo archivos CSV</p>
            </div>
          </label>
        </div>

        {/* RESULTADO */}
        {uploaded && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <div>
                <h2 className="font-bold text-stone-800">3. Resultado</h2>
                <p className="text-xs text-stone-500">Datos procesados</p>
              </div>
            </div>
            <div className="space-y-2">
              {log.map((l, i) => (
                <div key={i} className={`p-3 rounded-xl text-sm font-medium ${l.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {l}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
