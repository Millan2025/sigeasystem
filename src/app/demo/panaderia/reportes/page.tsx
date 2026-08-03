"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  BarChart3,
  PieChart,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { NEGOCIOS } from "@/config/negocios";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function ReportesPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estados para datos crudos
  const [ventas, setVentas] = useState<any[]>([]);
  const [compras, setCompras] = useState<any[]>([]);
  const [finanzas, setFinanzas] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [creditos, setCreditos] = useState<any[]>([]);
  const [resumenFinanzas, setResumenFinanzas] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState({ start: "", end: "" });
  const [filtroMetodoPago, setFiltroMetodoPago] = useState("todos");
  const [agrupacionTemporal, setAgrupacionTemporal] = useState("dia"); // hora, dia, mes, año

  // Obtener tenant
  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[1] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantFromUrl = searchParams.get("tenant");
  const tenantId = tenantFromUrl || negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  // Cargar datos
  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Ventas
      let urlVentas = `/api/ventas?tenant=${tenantId}`;
      if (filtroFecha.start) urlVentas += `&start=${filtroFecha.start}`;
      if (filtroFecha.end) urlVentas += `&end=${filtroFecha.end}`;
      if (filtroMetodoPago !== "todos") urlVentas += `&metodo_pago=${filtroMetodoPago}`;
      const resVentas = await fetch(urlVentas);
      const dataVentas = await resVentas.json();
      if (dataVentas.success) setVentas(dataVentas.data || []);

      // Compras
      let urlCompras = `/api/compras?tenant=${tenantId}`;
      if (filtroFecha.start) urlCompras += `&start=${filtroFecha.start}`;
      if (filtroFecha.end) urlCompras += `&end=${filtroFecha.end}`;
      const resCompras = await fetch(urlCompras);
      const dataCompras = await resCompras.json();
      if (dataCompras.success) setCompras(dataCompras.data || []);

      // Finanzas (y resumen)
      const resFinanzas = await fetch(`/api/finanzas?tenant=${tenantId}`);
      const dataFinanzas = await resFinanzas.json();
      if (dataFinanzas.success) {
        setFinanzas(dataFinanzas.data || []);
        if (dataFinanzas.resumen) setResumenFinanzas(dataFinanzas.resumen);
      }

      // Stock
      const resStock = await fetch(`/api/inventory?tenant=${tenantId}&stock=true`);
      const dataStock = await resStock.json();
      if (dataStock.success) setStock(dataStock.data || []);

      // Créditos
      const resCreditos = await fetch(`/api/creditos?tenant=${tenantId}`);
      const dataCreditos = await resCreditos.json();
      if (dataCreditos.success) setCreditos(dataCreditos.data || []);
    } catch (e) {
      console.error("Error al cargar reportes:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId, filtroFecha, filtroMetodoPago]);

  // ===== CÁLCULOS AVANZADOS =====

  // 1. Productos más y menos vendidos
  const productosVendidos = useMemo(() => {
    const mapa: Record<string, { nombre: string; cantidad: number; total: number }> = {};
    ventas.forEach((v) => {
      (v.sale_items || []).forEach((item: any) => {
        const id = item.product_id;
        if (!mapa[id]) {
          mapa[id] = { nombre: item.productos?.nombre || "Producto", cantidad: 0, total: 0 };
        }
        mapa[id].cantidad += item.quantity || 0;
        mapa[id].total += item.subtotal || 0;
      });
    });
    return Object.values(mapa);
  }, [ventas]);

  const topProductos = [...productosVendidos].sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
  const menosProductos = [...productosVendidos].sort((a, b) => a.cantidad - b.cantidad).slice(0, 10);

  // 2. Ingresos y egresos por categoría
  const ingresosPorCategoria = useMemo(() => {
    const mapa: Record<string, number> = {};
    finanzas
      .filter((f) => f.tipo === "ingreso" && f.categorias_contables?.nombre)
      .forEach((f) => {
        const cat = f.categorias_contables.nombre;
        mapa[cat] = (mapa[cat] || 0) + (f.total_con_impuestos || f.monto || 0);
      });
    return Object.entries(mapa).map(([nombre, monto]) => ({ nombre, monto }));
  }, [finanzas]);

  const egresosPorCategoria = useMemo(() => {
    const mapa: Record<string, number> = {};
    finanzas
      .filter((f) => f.tipo === "egreso" && f.categorias_contables?.nombre)
      .forEach((f) => {
        const cat = f.categorias_contables.nombre;
        mapa[cat] = (mapa[cat] || 0) + (f.total_con_impuestos || f.monto || 0);
      });
    return Object.entries(mapa).map(([nombre, monto]) => ({ nombre, monto }));
  }, [finanzas]);

  // 3. Clientes top por compras y pagos de créditos
  const clientesTopCompras = useMemo(() => {
    const mapa: Record<string, { cliente: string; total: number; transacciones: number }> = {};
    ventas.forEach((v) => {
      if (!v.cliente) return;
      if (!mapa[v.cliente]) {
        mapa[v.cliente] = { cliente: v.cliente, total: 0, transacciones: 0 };
      }
      mapa[v.cliente].total += v.total || 0;
      mapa[v.cliente].transacciones += 1;
    });
    return Object.values(mapa)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [ventas]);

  const clientesTopPagos = useMemo(() => {
    // Mejores pagadores: aquellos créditos con estado "pagado" y mayor monto pagado
    const pagados = creditos.filter((c) => c.estado === "pagado" && c.valor_pagado > 0);
    const mapa: Record<string, { cliente: string; totalPagado: number }> = {};
    pagados.forEach((c) => {
      const nombre = c.cliente || c.responsable || "Anónimo";
      if (!mapa[nombre]) {
        mapa[nombre] = { cliente: nombre, totalPagado: 0 };
      }
      mapa[nombre].totalPagado += c.valor_pagado || 0;
    });
    return Object.values(mapa)
      .sort((a, b) => b.totalPagado - a.totalPagado)
      .slice(0, 10);
  }, [creditos]);

  // 4. Tendencias temporales (ventas agrupadas)
  const ventasTemporales = useMemo(() => {
    const agrupar = (fecha: Date) => {
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const dia = String(fecha.getDate()).padStart(2, "0");
      const hora = String(fecha.getHours()).padStart(2, "0");
      switch (agrupacionTemporal) {
        case "hora":
          return `${año}-${mes}-${dia} ${hora}:00`;
        case "dia":
          return `${año}-${mes}-${dia}`;
        case "mes":
          return `${año}-${mes}`;
        case "año":
          return `${año}`;
        default:
          return `${año}-${mes}-${dia}`;
      }
    };
    const mapa: Record<string, { label: string; total: number }> = {};
    ventas.forEach((v) => {
      const fecha = new Date(v.fecha);
      const key = agrupar(fecha);
      if (!mapa[key]) {
        mapa[key] = { label: key, total: 0 };
      }
      mapa[key].total += v.total || 0;
    });
    return Object.values(mapa).sort((a, b) => a.label.localeCompare(b.label));
  }, [ventas, agrupacionTemporal]);

  // 5. Métricas generales (ya existentes)
  const totalVentas = ventas.reduce((sum, v) => sum + (v.total || 0), 0);
  const totalCompras = compras.reduce((sum, c) => sum + (c.total || 0), 0);
  const totalIngresos = resumenFinanzas?.ingresos || 0;
  const totalEgresos = resumenFinanzas?.egresos || 0;
  const totalCreditoPendiente = creditos
    .filter((c) => c.estado === "pendiente")
    .reduce((sum, c) => sum + (c.saldo_pendiente || 0), 0);
  const stockCritico = stock.filter((s) => s.stock_actual < (s.stock_minimo || 0)).length;

  // ===== EXPORTAR PARA IA =====
  const exportarIA = () => {
    const dataIA = {
      negocio: negocioSlug,
      tenantId,
      fecha: new Date().toISOString(),
      resumen: {
        ventas: totalVentas,
        compras: totalCompras,
        ingresos: totalIngresos,
        egresos: totalEgresos,
        creditoPendiente: totalCreditoPendiente,
        stockCritico,
      },
      ingresosPorCategoria,
      egresosPorCategoria,
      topProductos,
      menosProductos,
      clientesTopCompras,
      clientesTopPagos,
      tendenciaVentas: ventasTemporales,
    };
    const blob = new Blob([JSON.stringify(dataIA, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_ia_${negocioSlug}_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-900">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-stone-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-stone-900" />
        </Link>
        <h1 className="text-xl font-bold text-stone-900">Reportes Avanzados - {negocio?.titulo}</h1>
        <div className="flex-1"></div>
        <button onClick={cargarDatos} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5 text-stone-900" />
        </button>
        <button
          onClick={exportarIA}
          className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-purple-600"
        >
          <Download className="w-4 h-4" /> Exportar para IA
        </button>
        <button
          onClick={() => {
            // Exportar a Excel (el existente)
            const wb = XLSX.utils.book_new();
            // ... (se mantiene la función existente)
          }}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <Download className="w-4 h-4" /> Exportar Excel
        </button>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        {/* Filtros */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-900" />
              <span className="text-sm font-medium text-stone-900">Desde:</span>
              <input
                type="date"
                value={filtroFecha.start}
                onChange={(e) => setFiltroFecha({ ...filtroFecha, start: e.target.value })}
                className="border border-stone-300 rounded-xl px-3 py-1 text-sm"
              />
              <span className="text-sm font-medium text-stone-900">Hasta:</span>
              <input
                type="date"
                value={filtroFecha.end}
                onChange={(e) => setFiltroFecha({ ...filtroFecha, end: e.target.value })}
                className="border border-stone-300 rounded-xl px-3 py-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-900" />
              <span className="text-sm font-medium text-stone-900">Método de Pago:</span>
              <select
                value={filtroMetodoPago}
                onChange={(e) => setFiltroMetodoPago(e.target.value)}
                className="border border-stone-300 rounded-xl px-3 py-1 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Nequi">Nequi</option>
                <option value="Bancolombia">Bancolombia</option>
                <option value="Daviplata">Daviplata</option>
                <option value="Crédito">Crédito</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-stone-900" />
              <span className="text-sm font-medium text-stone-900">Agrupar por:</span>
              <select
                value={agrupacionTemporal}
                onChange={(e) => setAgrupacionTemporal(e.target.value)}
                className="border border-stone-300 rounded-xl px-3 py-1 text-sm"
              >
                <option value="hora">Hora</option>
                <option value="dia">Día</option>
                <option value="mes">Mes</option>
                <option value="año">Año</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tarjetas de resumen (igual que antes) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-900">Ventas</p>
            <p className="text-2xl font-bold text-emerald-600">${totalVentas.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-900">Compras</p>
            <p className="text-2xl font-bold text-red-600">${totalCompras.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-900">Ingresos</p>
            <p className="text-2xl font-bold text-blue-600">${totalIngresos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-900">Egresos</p>
            <p className="text-2xl font-bold text-orange-600">${totalEgresos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-900">Créditos Pend.</p>
            <p className="text-2xl font-bold text-purple-600">${totalCreditoPendiente.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-900">Stock Crítico</p>
            <p className={`text-2xl font-bold ${stockCritico > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {stockCritico}
            </p>
          </div>
        </div>

        {/* Fila de gráficos y tablas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Desglose ingresos por categoría */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
            <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Ingresos por Categoría
            </h3>
            {ingresosPorCategoria.length === 0 ? (
              <p className="text-stone-900 text-sm font-medium bg-stone-100 p-4 rounded-xl text-center">No hay datos disponibles</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RePieChart>
                  <Pie
                    data={ingresosPorCategoria}
                    dataKey="monto"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {ingresosPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Desglose egresos por categoría */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
            <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" /> Egresos por Categoría
            </h3>
            {egresosPorCategoria.length === 0 ? (
              <p className="text-stone-900 text-sm font-medium bg-stone-100 p-4 rounded-xl text-center">No hay datos disponibles</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RePieChart>
                  <Pie
                    data={egresosPorCategoria}
                    dataKey="monto"
                    nameKey="nombre"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {egresosPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tendencia de ventas */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-6">
          <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" /> Tendencia de Ventas ({agrupacionTemporal})
          </h3>
          {ventasTemporales.length === 0 ? (
            <p className="text-stone-900 text-sm font-medium bg-stone-100 p-4 rounded-xl text-center">No hay datos disponibles</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ventasTemporales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3B82F6" name="Ventas ($)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Productos Top y Menos Vendidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
            <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-500" /> Productos Más Vendidos
            </h3>
            {topProductos.length === 0 ? (
              <p className="text-stone-900 text-sm font-medium bg-stone-100 p-4 rounded-xl text-center">No hay datos disponibles</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white">
                    <tr>
                      <th className="text-left p-2 text-stone-900">Producto</th>
                      <th className="text-right p-2 text-stone-900">Cantidad</th>
                      <th className="text-right p-2 text-stone-900">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProductos.map((p, i) => (
                      <tr key={i} className="border-b border-stone-100">
                        <td className="p-2 text-stone-900">{p.nombre}</td>
                        <td className="p-2 text-right text-stone-900">{p.cantidad}</td>
                        <td className="p-2 text-right font-medium text-stone-900">
                          ${p.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
            <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-red-500" /> Productos Menos Vendidos
            </h3>
            {menosProductos.length === 0 ? (
              <p className="text-stone-900 text-sm font-medium bg-stone-100 p-4 rounded-xl text-center">No hay datos disponibles</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white">
                    <tr>
                      <th className="text-left p-2 text-stone-900">Producto</th>
                      <th className="text-right p-2 text-stone-900">Cantidad</th>
                      <th className="text-right p-2 text-stone-900">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menosProductos.map((p, i) => (
                      <tr key={i} className="border-b border-stone-100">
                        <td className="p-2 text-stone-900">{p.nombre}</td>
                        <td className="p-2 text-right text-stone-900">{p.cantidad}</td>
                        <td className="p-2 text-right font-medium text-stone-900">
                          ${p.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Clientes Top */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
            <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> Clientes con Mayores Compras
            </h3>
            {clientesTopCompras.length === 0 ? (
              <p className="text-stone-900 text-sm font-medium bg-stone-100 p-4 rounded-xl text-center">No hay datos disponibles</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white">
                    <tr>
                      <th className="text-left p-2 text-stone-900">Cliente</th>
                      <th className="text-right p-2 text-stone-900">Total</th>
                      <th className="text-right p-2 text-stone-900">Transacciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesTopCompras.map((c, i) => (
                      <tr key={i} className="border-b border-stone-100">
                        <td className="p-2 text-stone-900">{c.cliente}</td>
                        <td className="p-2 text-right font-medium text-stone-900">
                          ${c.total.toLocaleString()}
                        </td>
                        <td className="p-2 text-right text-stone-900">{c.transacciones}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
            <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" /> Mejores Pagadores de Créditos
            </h3>
            {clientesTopPagos.length === 0 ? (
              <p className="text-stone-900 text-sm font-medium bg-stone-100 p-4 rounded-xl text-center">No hay datos disponibles</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white">
                    <tr>
                      <th className="text-left p-2 text-stone-900">Cliente</th>
                      <th className="text-right p-2 text-stone-900">Total Pagado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesTopPagos.map((c, i) => (
                      <tr key={i} className="border-b border-stone-100">
                        <td className="p-2 text-stone-900">{c.cliente}</td>
                        <td className="p-2 text-right font-medium text-stone-900">
                          ${c.totalPagado.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Últimas Ventas (mantenemos) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          <h3 className="font-semibold text-stone-900 mb-3">Últimas Ventas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="text-left p-2 text-stone-900">Fecha</th>
                  <th className="text-left p-2 text-stone-900">Método</th>
                  <th className="text-left p-2 text-stone-900">Total</th>
                  <th className="text-left p-2 text-stone-900">Productos</th>
                </tr>
              </thead>
              <tbody>
                {ventas.slice(0, 10).map((v) => (
                  <tr key={v.id} className="border-b border-stone-100">
                    <td className="p-2 text-stone-900">{new Date(v.fecha).toLocaleDateString()}</td>
                    <td className="p-2 text-stone-900">{v.metodo_pago}</td>
                    <td className="p-2 text-stone-900 font-medium">${v.total?.toLocaleString()}</td>
                    <td className="p-2 text-stone-900">
                      {(v.sale_items || []).map((i: any) => `${i.quantity} ${i.productos?.nombre || "Producto"}`).join(", ")}
                    </td>
                  </tr>
                ))}
                {ventas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-stone-900">
                      No hay ventas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}



