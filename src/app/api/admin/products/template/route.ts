import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Generar CSV con la sección PRODUCTOS (igual que en Excel Maestro)
    let csv = '\uFEFF' // BOM para Excel
    csv += 'SECCION;SKU;NOMBRE;PRECIO;COSTO;STOCK_INICIAL;ES_RECETA;UNIDAD_MEDIDA;PRECIO_POR_KG;CATEGORIA;PROVEEDOR;PROVEEDOR_TELEFONO\n'
    csv += 'PRODUCTO;PAN-001;Pan Aliñado Familiar;5000;1800;50;SI;unidad;;Panaderia;Harinas El Trigo;3001234567\n'
    csv += 'PRODUCTO;PAN-002;Pan Integral;4500;1600;40;SI;unidad;;Panaderia;Harinas El Trigo;3001234567\n'
    csv += 'PRODUCTO;BEB-001;Café Tinto 7oz;1800;600;100;NO;unidad;;Bebidas;Café Colombiano;3009876543\n'
    csv += 'PRODUCTO;VERD-001;Tomate Chonto;0;2500;10;NO;kg;5000;Verduras;Fruver El Campo;3004567890\n'
    csv += 'PRODUCTO;VERD-002;Aguacate Hass;0;4000;15;NO;kg;8000;Verduras;Fruver El Campo;3004567890\n'

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const response = new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=plantilla_productos.csv',
      },
    })
    return response
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
