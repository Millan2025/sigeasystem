import DemoNegocioPage from '@/components/shared/DemoNegocioPage'
const config = {
  tipo: 'Ferreteria', icono: '🔩', color: 'bg-slate-700',
  productos: [{ nombre: 'Martillo', precio: 25000, icono: '🔨' }, { nombre: 'Destornillador', precio: 12000, icono: '🪛' }, { nombre: 'Pintura (galon)', precio: 85000, icono: '🎨' }, { nombre: 'Cemento (bulto)', precio: 45000, icono: '🧱' }, { nombre: 'Tornillos (caja)', precio: 8000, icono: '🔩' }, { nombre: 'Cinta Metrica', precio: 15000, icono: '📏' }],
  beneficios: ['Inventario con miles de productos organizados', 'Control de stock por unidad, caja o bulto', 'Pedidos automaticos a proveedores', 'Ventas rapidas con codigo de barras', 'Historial de ventas por cliente', 'Reportes de productos mas rentables'],
  modulos: ['POS', 'Inventario', 'Pedidos', 'Clientes', 'Finanzas', 'Reportes'],
}
export default function DemoFerreteria() { return <DemoNegocioPage config={config} /> }
