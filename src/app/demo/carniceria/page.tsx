import DemoNegocioPage from '@/components/shared/DemoNegocioPage'

const config = {
  tipo: 'Carniceria',
  icono: '🥩',
  color: 'bg-rose-700',
  productos: [
    { nombre: 'Carne de Res (kg)', precio: 28000, icono: '🥩' },
    { nombre: 'Pechuga de Pollo (kg)', precio: 16000, icono: '🍗' },
    { nombre: 'Cerdo (kg)', precio: 20000, icono: '🐖' },
    { nombre: 'Huevos x30', precio: 15000, icono: '🥚' },
    { nombre: 'Chorizo (kg)', precio: 22000, icono: '🌭' },
  ],
  beneficios: [
    'Productos por peso con calculo automatico de precio',
    'Control de temperatura con sensores IoT',
    'Trazabilidad de cortes y fechas de caducidad',
    'Inventario de neveras y cuartos frios',
    'Ventas rapidas con balanza integrada',
    'Reportes de mermas y perdidas',
  ],
  modulos: ['POS', 'Inventario', 'IoT', 'Reportes', 'Finanzas'],
}

export default function DemoCarniceria() { return <DemoNegocioPage config={config} /> }
