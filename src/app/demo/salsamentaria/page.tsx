import DemoNegocioPage from '@/components/shared/DemoNegocioPage'
const config = {
  tipo: 'Salsamentaria', icono: '🧀', color: 'bg-yellow-600',
  productos: [{ nombre: 'Queso Campesino (kg)', precio: 28000, icono: '🧀' }, { nombre: 'Jamon (kg)', precio: 32000, icono: '🍖' }, { nombre: 'Salchichon (kg)', precio: 25000, icono: '🌭' }, { nombre: 'Queso Doble Crema (kg)', precio: 30000, icono: '🧀' }, { nombre: 'Mortadela (kg)', precio: 18000, icono: '🥪' }],
  beneficios: ['Control de inventario por peso y fecha de vencimiento', 'Ventas por peso con precio calculado al instante', 'Pedidos a proveedores automatizados', 'Alertas de productos proximos a vencer', 'Distribucion a tiendas y restaurantes', 'Reportes de rotacion de productos'],
  modulos: ['POS', 'Inventario', 'Pedidos', 'Distribucion', 'Finanzas', 'Reportes'],
}
export default function DemoSalsamentaria() { return <DemoNegocioPage config={config} /> }
