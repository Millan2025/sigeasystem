import DemoNegocioPage from '@/components/shared/DemoNegocioPage'

const config = {
  tipo: 'Tienda',
  icono: '🏪',
  color: 'bg-blue-600',
  productos: [
    { nombre: 'Coca-Cola 350ml', precio: 3500, icono: '🥤' },
    { nombre: 'Pan Tajado', precio: 4500, icono: '🍞' },
    { nombre: 'Café Tinto 7oz', precio: 1800, icono: '☕' },
    { nombre: 'Jugo de Naranja', precio: 5000, icono: '🧃' },
    { nombre: 'Agua Mineral', precio: 2500, icono: '💧' },
    { nombre: 'Queso Campesino', precio: 14000, icono: '🧀' },
  ],
  beneficios: [
    'Inventario inteligente con alertas de stock bajo',
    'Ventas rapidas con buscador de productos',
    'Pedidos automaticos a proveedores',
    'Control de caducidad y lotes',
    'Domicilios para tus clientes',
    'Reportes de productos mas y menos vendidos',
  ],
  modulos: ['POS', 'Inventario', 'Pedidos', 'Domicilios', 'Finanzas', 'Reportes'],
}

export default function DemoTienda() { return <DemoNegocioPage config={config} /> }
