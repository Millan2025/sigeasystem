import DemoNegocioPage from '@/components/shared/DemoNegocioPage'
const config = {
  tipo: 'Restaurante', icono: '🍽️', color: 'bg-red-600',
  productos: [{ nombre: 'Bandeja Paisa', precio: 18000, icono: '🍛' }, { nombre: 'Sancocho de Gallina', precio: 12000, icono: '🍲' }, { nombre: 'Jugo Natural', precio: 4000, icono: '🧃' }, { nombre: 'Café Tinto', precio: 1800, icono: '☕' }],
  beneficios: ['Gestiona tu menu con fichas tecnicas por plato', 'Food cost: calcula el costo real de cada plato', 'Control de ingredientes y mermas', 'Pedidos a domicilio con asignacion de repartidor', 'Reportes de platos mas vendidos', 'Lista de compras automatica al proveedor'],
  modulos: ['POS', 'Menu', 'Produccion', 'Inventario', 'Domicilios', 'Finanzas', 'Reportes'],
}
export default function DemoRestaurante() { return <DemoNegocioPage config={config} /> }
