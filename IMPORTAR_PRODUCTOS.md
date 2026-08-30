# IMPORTAR PRODUCTOS

Guia para importar catalogos de productos desde una pagina externa hacia SIGEA.

Caso aplicado: LYKE FOOD desde SiviPOS.

## 1. Objetivo

Importar productos con:

- Nombre
- Precio
- Categoria
- Imagen
- Descripcion cuando exista
- SKU deterministico
- Stock inicial opcional
- Costo estimado opcional

## 2. Flujo general

1. Extraer productos con Puppeteer.
2. Generar archivo CSV compatible con SIGEA.
3. Importar con el endpoint /api/admin/products/import.
4. Ejecutar cleanup para eliminar duplicados y activar venta inmediata.

## 3. Obtener tenant_id

Ejecutar:

```powershell
$r = Invoke-RestMethod "https://sigea-system.vercel.app/api/admin/tenants"
$r.data | Format-Table id, nombre_negocio
```

Para LYKE FOOD:

```
8192036b-d6dd-49f5-b301-b8cbb7b7cb76
```

## 4. Instalar Puppeteer

```powershell
npm install --no-save puppeteer
```

## 5. Configurar variables

```powershell
$env:TENANT_ID="8192036b-d6dd-49f5-b301-b8cbb7b7cb76"
$env:SIGEA_BASE="https://sigea-system.vercel.app"
```

## 6. Ejecutar scraper sin importar

```powershell
node scripts\import-lykefood-sivipos.mjs
```

Esto genera:

- productos-lykefood-sigea.csv
- productos-lykefood.raw.json

Revisar el CSV antes de importar.

## 7. Importar productos

```powershell
node scripts\import-lykefood-sivipos.mjs --import
```

El importador usa UPSERT por SKU.

El SKU debe ser deterministico:

```
LYK-CATEGORIA-NOMBRE
```

Ejemplo:

```
LYK-BEBIDAS-COCA-COLA-PERSONAL
```

Esto evita duplicados en futuras importaciones.

## 8. Formato CSV

Separador: punto y coma (;)

```
SECCION;SKU;NOMBRE;PRECIO;COSTO;STOCK_INICIAL;ES_RECETA;UNIDAD_MEDIDA;PRECIO_POR_KG;CATEGORIA;PROVEEDOR;PROVEEDOR_TELEFONO;DESCRIPCION;IMAGEN_URL
```

Ejemplo:

```
PRODUCTO;LYK-BEBIDAS-AGUA-CON-GAS;Agua Con Gas;3500;0;0;NO;unidad;;Bebidas;;;Agua con gas;https://app.sivipos.co/img/productos/20/1234.jpeg
```

## 9. Cleanup: eliminar duplicados y vender sin compra

Cuando se importan productos desde un catalogo externo, puede ser necesario vender inmediatamente aunque no exista una compra registrada.

Para eso se ejecuta cleanup:

```powershell
$body = @{
  tenant_id     = "8192036b-d6dd-49f5-b301-b8cbb7b7cb76"
  stock_inicial = 100
  costo_ratio   = 0.5
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://sigea-system.vercel.app/api/admin/products/cleanup" -Method Post -Body $body -ContentType "application/json"
```

El cleanup hace:

- Elimina duplicados por nombre + categoria + precio.
- Conserva el producto que tenga imagen o descripcion.
- Normaliza el SKU.
- Asigna stock inicial si el stock esta en cero.
- Asigna costo estimado si el costo esta en cero.
- Agrega observacion de salvedad.

## 10. Salvedad financiera

Cuando se asigna stock sin compra, SIGEA deja la siguiente observacion:

```
STOCK INICIAL importado de catalogo externo (SiviPOS). Sin compra registrada: regularizar con modulo Compras.
```

Esto permite:

- Vender inmediatamente en POS.
- Mostrar valor de inventario en finanzas.
- Mantener salvedad de auditoria.
- Regularizar luego con una compra real.

## 11. Resultado LYKE FOOD

Resultado aplicado:

- Productos finales: 155
- Duplicados eliminados: 292
- Productos actualizados: 155
- Imagenes: 100%
- Stock inicial: 100 unidades
- Costo estimado: 50% del precio de venta

## 12. Troubleshooting

| Problema | Solucion |
|----------|----------|
| Productos duplicados | Ejecutar /api/admin/products/cleanup |
| Error UUID | Verificar tenant_id real |
| Imagenes en cero | Revisar selector de imagenes del scraper |
| POS dice stock cero | Ejecutar cleanup con stock_inicial |
| Finanzas sin costo | Ejecutar cleanup con costo_ratio |
