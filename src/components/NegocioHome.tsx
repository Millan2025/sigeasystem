"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  Truck,
  BarChart3,
  TrendingUp,
  ChefHat,
  Phone,
  X,
  ArrowRight,
} from "lucide-react";

const beneficiosPorModulo: Record<string, { titulo: string; icono: string; beneficios: string[]; color: string }> = {
  pos: {
    titulo: "Punto de Venta Inteligente",
    icono: "💰",
    beneficios: [
      "Productos por peso: balanza integrada, precio automático",
      "Cobro: Efectivo, Nequi, Daviplata, Bancolombia",
      "Búsqueda rápida de productos",
      "Descuento automático de inventario",
      "Registro de ventas en tiempo real",
    ],
    color: "bg-emerald-500",
  },
  produccion: {
    titulo: "Producción y Recetas",
    icono: "🏭",
    beneficios: [
      "Fichas técnicas con ingredientes y cantidades exactas",
      "Food cost: costo real vs precio de venta",
      "Cálculo automático de materia prima según ventas",
      "Órdenes de producción diarias",
      "Lista de compras sugerida al proveedor",
      "Adaptable a panadería, restaurante, cafetería",
    ],
    color: "bg-lime-500",
  },
  inventario: {
    titulo: "Inventario Inteligente",
    icono: "📦",
    beneficios: [
      "Control de stock en tiempo real",
      "Alarmas: urgente, pedir ya, OK",
      "Ponderación por importancia del producto",
      "Predicción de agotamiento",
      "Múltiples unidades: kg, g, L, ml, unidades",
      "Exportar a Excel para análisis",
    ],
    color: "bg-amber-500",
  },
  personal: {
    titulo: "Gestión de Personal",
    icono: "👥",
    beneficios: [
      "Registro de empleados con datos completos",
      "Control de asistencia y horarios",
      "Nómina: devengados, deducciones, neto a pagar",
      "Apropiaciones para mediana empresa",
      "Desprendible individual por empleado",
      "Exportar para contador",
    ],
    color: "bg-purple-500",
  },
  pedidos: {
    titulo: "Pedidos y Domicilios",
    icono: "🛵",
    beneficios: [
      "Tus clientes compran desde la app",
      "Recibes notificación de nuevos pedidos",
      "Asignas repartidor disponible",
      "Seguimiento en tiempo real",
      "Confirmación de entrega",
      "Historial de pedidos por cliente",
    ],
    color: "bg-sky-500",
  },
  reportes: {
    titulo: "Reportes y Estadísticas",
    icono: "📈",
    beneficios: [
      "Ventas por hora, día, semana, mes",
      "Top 10 productos más vendidos",
      "Márgenes de ganancia por producto",
      "Métodos de pago: % y montos",
      "Gráficos interactivos",
      "Descargar en Excel para análisis",
    ],
    color: "bg-rose-500",
  },
  finanzas: {
    titulo: "Finanzas y Contabilidad",
    icono: "🏦",
    beneficios: [
      "Estado de Resultados (P&G)",
      "Balance General simplificado",
      "Libro Diario con cuentas contables",
      "Cierre de caja con cuadre automático",
      "Exportar para contador",
      "API de conexión con software DIAN",
    ],
    color: "bg-teal-500",
  },
  tienda: {
    titulo: "Tienda Online",
    icono: "🛒",
    beneficios: [
      "Tus clientes ven tu catálogo actualizado",
      "Búsqueda y filtro por categorías",
      "Carrito de compras",
      "Checkout con datos de entrega",
      "Pago: Efectivo, Nequi, Daviplata, Bancolombia",
      "Pedido confirmado con notificación",
    ],
    color: "bg-orange-500",
  },
};

// Configuración de cada negocio
const NEGOCIOS_CONFIG: Record<string, { titulo: string; icono: string; telefono: string; direccion: string; tenantId: string }> = {
  panaderia: {
    titulo: "Panadería Doña Rosa",
    icono: "🍞",
    telefono: "301-6111412",
    direccion: "Calle 123 # 45-67",
    tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76",
  },
  restaurante: {
    titulo: "Restaurante Caribe",
    icono: "🍽️",
    telefono: "301-6111412",
    direccion: "Carrera 8 # 12-34",
    tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76",
  },
  carniceria: {
    titulo: "Carnicería El Buen Sabor",
    icono: "🥩",
    telefono: "301-6111412",
    direccion: "Avenida 5 # 20-10",
    tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76",
  },
  salsamentaria: {
    titulo: "Salsamentaria La Especial",
    icono: "🧀",
    telefono: "301-6111412",
    direccion: "Calle 10 # 5-30",
    tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76",
  },
  ferreteria: {
    titulo: "Ferretería El Tornillo",
    icono: "🔩",
    telefono: "301-6111412",
    direccion: "Carrera 12 # 8-50",
    tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76",
  },
  tienda: {
    titulo: "Tienda Surtimax",
    icono: "🏪",
    telefono: "301-6111412",
    direccion: "Calle 50 # 20-15",
    tenantId: "58d06407-6d1c-4beb-acee-8965001fbbee",
  },
};

export default function NegocioHome({ negocioSlug }: { negocioSlug: string }) {
  const negocio = NEGOCIOS_CONFIG[negocioSlug];
  if (!negocio) return <div>Negocio no encontrado</div>;

  const [moduloActivo, setModuloActivo] = useState<string | null>(null);

  // Los módulos con sus íconos y colores (igual que en demo)
  const modulos = [
    { id: "pos", label: "Nueva Venta", icon: ShoppingCart, color: "bg-emerald-50 border-emerald-200 text-emerald-600" },
    { id: "produccion", label: "Producción", icon: ChefHat, color: "bg-lime-50 border-lime-200 text-lime-600" },
    { id: "inventario", label: "Inventario", icon: Package, color: "bg-amber-50 border-amber-200 text-amber-600" },
    { id: "personal", label: "Personal", icon: Users, color: "bg-purple-50 border-purple-200 text-purple-600" },
    { id: "pedidos", label: "Pedidos", icon: Truck, color: "bg-sky-50 border-sky-200 text-sky-600" },
    { id: "reportes", label: "Reportes", icon: BarChart3, color: "bg-rose-50 border-rose-200 text-rose-600" },
    { id: "finanzas", label: "Finanzas", icon: TrendingUp, color: "bg-teal-50 border-teal-200 text-teal-600" },
    { id: "tienda", label: "Tienda", icon: ShoppingCart, color: "bg-orange-50 border-orange-200 text-orange-600" },
  ];

  // Datos de ejemplo para el resumen (fijos para demo)
  const ventasHoy = {
    total: 450000,
    transacciones: 24,
    efectivo: 65,
    nequi: 20,
    daviplata: 15,
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Cabecera con nombre, teléfono y dirección */}
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{negocio.titulo}</h1>
            <p className="text-stone-300 text-sm">{negocio.direccion} · Tel: {negocio.telefono}</p>
          </div>
          <span className="px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500">
            Caja Abierta
          </span>
        </div>
      </header>

      <div className="p-4">
        {/* Resumen de ventas (demo) */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white mb-4">
          <p className="text-emerald-100 text-sm">VENTAS DE HOY (DEMO)</p>
          <p className="text-4xl font-bold mt-1">${ventasHoy.total.toLocaleString()}</p>
          <p className="text-sm text-emerald-100 mt-2">
            {ventasHoy.transacciones} transacciones · Efectivo {ventasHoy.efectivo}% · Nequi {ventasHoy.nequi}% · Daviplata {ventasHoy.daviplata}%
          </p>
        </div>

        <h2 className="font-semibold text-stone-700 mb-3">CONOCE CADA MÓDULO (Toca para ver beneficios)</h2>

        {/* Botones en alto relieve */}
        <div className="grid grid-cols-2 gap-3">
          {modulos.map((m) => (
            <Link
              key={m.id}
              href={`/demo/${negocioSlug}/${m.id}`}
              className={`${m.color} rounded-2xl p-5 text-left border-2 shadow-md hover:shadow-xl transition transform hover:scale-105 active:scale-95 no-underline block`}
            >
              <m.icon className="w-7 h-7 mb-2" />
              <span className="font-semibold text-stone-800 block">{m.label}</span>
              <span className="text-xs text-stone-500">Toca para ingresar</span>
            </Link>
          ))}
        </div>

        {/* Botón de WhatsApp */}
        <a
          href={`https://wa.me/${negocio.telefono.replace(/-/g, '')}?text=Hola%20Quiero%20informacion%20de%20SIGEA%20System`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 w-full bg-green-500 text-white rounded-2xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:bg-green-600 transition shadow-md"
        >
          <Phone className="w-5 h-5" /> Escribenos por WhatsApp · {negocio.telefono}
        </a>

        {/* Botón Comenzar Gratis */}
        <Link
          href="/registro"
          className="mt-3 w-full bg-stone-800 text-white rounded-2xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:bg-stone-900 transition shadow-md"
        >
          🚀 Comenzar Gratis <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Modal de beneficios (igual que en demo) */}
      {moduloActivo && beneficiosPorModulo[moduloActivo] && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setModuloActivo(null)}>
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const b = beneficiosPorModulo[moduloActivo];
              return (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{b.icono}</span>
                      <h2 className="font-bold text-xl text-stone-900">{b.titulo}</h2>
                    </div>
                    <button onClick={() => setModuloActivo(null)} className="p-2 hover:bg-stone-100 rounded-xl">
                      <X className="w-5 h-5 text-stone-600" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {b.beneficios.map((ben, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <span className="text-sm text-stone-700">{ben}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/registro" className="mt-4 w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2">
                    🚀 Probar ahora gratis <ArrowRight className="w-5 h-5" />
                  </Link>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
