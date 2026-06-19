import DemoNegocioPage from '@/components/shared/DemoNegocioPage'

const config = {
  tipo: 'Panaderia',
  icono: '🍞',
  color: 'bg-amber-600',
  productos: [
    { nombre: 'Pan Aliñado Familiar', precio: 5000, icono: '🍞' },
    { nombre: 'Torta Tres Leches', precio: 7500, icono: '🍰' },
    { nombre: 'Croissant', precio: 3200, icono: '🥐' },
    { nombre: 'Pan de Queso', precio: 3800, icono: '🧀' },
    { nombre: 'Café Tinto 7oz', precio: 1800, icono: '☕' },
    { nombre: 'Jugo Natural', precio: 4000, icono: '🧃' },
  ],
  beneficios: [
    'Controla tus recetas y el costo de cada producto',
    'Calcula automaticamente la lista de compras segun ventas',
    'Produccion diaria con ordenes de trabajo',
    'Inventario de ingredientes con alertas de agotamiento',
    'Ventas rapidas desde el celular con buscador',
    'Domicilios: tus clientes compran desde la app',
  ],
  modulos: ['POS', 'Produccion', 'Inventario', 'Recetas', 'Domicilios', 'Finanzas', 'Reportes'],
}

export default function DemoPanaderia() { return <DemoNegocioPage config={config} /> }
