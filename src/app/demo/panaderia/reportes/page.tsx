"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Download, Filter, Calendar } from "lucide-react";
import * as XLSX from "xlsx";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const NEGOCIOS = {
  panaderia: { titulo: "Panadería Doña Rosa", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  restaurante: { titulo: "Restaurante Caribe", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  carniceria: { titulo: "Carnicería El Buen Sabor", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  salsamentaria: { titulo: "Salsamentaria La Especial", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  ferreteria: { titulo: "Ferretería El Tornillo", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  tienda: { titulo: "Tienda La Esquina De Calidad", tenantId: "58d06407-6d1c-4beb-acee-8965001fbbee" },
};

export default function ReportesPage() {
  const pathname = usePathname();
  const [ventas, setVentas] = useState<any[]>([]);
  const [compras, setCompras] = useState<any[]>([]);
  const [finanzas, setFinanzas] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [creditos, setCreditos] = useState<any[]>([]);
  const [produccion, setProduccion] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState({ start: "", end: "" });
  const [filtroMetodoPago, setFiltroMetodoPago] = useState("todos");

  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[2] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantId = negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

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

      // Finanzas
      const resFinanzas = await fetch(`/api/finanzas?tenant=${tenantId}`);
      const dataFinanzas = await resFinanzas.json();
      if (dataFinanzas.success) setFinanzas(dataFinanzas.data || []);

      // Stock
      const resStock = await fetch(`/api/inventory?tenant=${tenantId}&stock=true`);
      const dataStock = await resStock.json();
      if (dataStock.success) setStock(dataStock.data || []);

      // Créditos
      const resCreditos = await fetch(`/api/creditos?tenant=${tenantId}`);
      const dataCreditos = await resCreditos.json();
      if (dataCreditos.success) setCreditos(dataCreditos.data || []);

      // Producción
      const resProduccion = await fetch(`/api/ordenes-produccion?tenant=${tenantId}`);
      const dataProduccion = await resProduccion.json();
      if (dataProduccion.success) setProduccion(dataProduccion.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId, filtroFecha, filtroMetodoPago]);

  // Métricas
  const totalVentas = ventas.reduce((sum, v) => sum + (v.total || 0), 0);
  const totalCompras = compras.reduce((sum, c) => sum + (c.total || 0), 0);
  const totalIngresos = finanzas.filter(f => f.tipo === "ingreso").reduce((sum, f) => sum + f.monto, 0);
  const totalEgresos = finanzas.filter(f => f.tipo === "egreso").reduce((sum, f) => sum + f.monto, 0);
  const totalCreditoPendiente = creditos.filter(c => c.estado === "pendiente").reduce((sum, c) => sum + (c.saldo_pendiente || 0), 0);
  const stockCritico = stock.filter(s => s.stock_actual < (s.stock_minimo || 0)).length;

  // Ventas por método de pago
  const pagosMap: Record<string, number> = {};
  ventas.forEach(v => {
    const metodo = v.metodo_pago || "Otro";
    pagosMap[metodo] = (pagosMap[metodo] || 0) + (v.total || 0);
  });
  const pagosLabels = Object.keys(pagosMap);
  const pagosData = Object.values(pagosMap);

  // Productos más vendidos (desde items)
  const productosVendidos: Record<string, { nombre: string; cantidad: number; total: number }> = {};
  ventas.forEach(v => {
    (v.sale_items || []).forEach((item: any) => {
      const id = item.product_id;
      if (!productosVendidos[id]) {
        productosVendidos[id] = { nombre: item.productos?.nombre || "Producto", cantidad: 0, total: 0 };
      }
      productosVendidos[id].cantidad += item.quantity || 0;
      productosVendidos[id].total += item.subtotal || 0;
    });
  });
  const topProductos = Object.values(productosVendidos).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

  const chartVentas = {
    labels: pagosLabels,
    datasets: [{ label: "Monto", data: pagosData, backgroundColor: ["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444"] }],
  };

  const chartComparativo = {
    labels: ["Ventas", "Compras", "Ingresos", "Egresos"],
    datasets: [
      {
        label: "Montos",
        data: [totalVentas, totalCompras, totalIngresos, totalEgresos],
        backgroundColor: ["#10B981", "#EF4444", "#3B82F6", "#F59E0B"],
      },
    ],
  };

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    // Hoja resumen
    const resumen = [
      ["Concepto", "Monto"],
      ["Ventas Totales", totalVentas],
      ["Compras Totales", totalCompras],
      ["Ingresos Financieros", totalIngresos],
      ["Egresos Financieros", totalEgresos],
      ["Créditos Pendientes", totalCreditoPendiente],
      ["Stock Crítico", stockCritico],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

    // Hoja ventas detalladas
    const ventasData = ventas.map(v => ({
      Fecha: v.fecha,
      "Método Pago": v.metodo_pago,
      Total: v.total,
      Items: (v.sale_items || []).map((i: any) => `${i.productos?.nombre || "Producto"} x${i.quantity}`).join(", "),
    }));
    const wsVentas = XLSX.utils.json_to_sheet(ventasData);
    XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas");

    // Hoja compras
    const comprasData = compras.map(c => ({
      Fecha: c.fecha,
      Proveedor: c.proveedor,
      Total: c.total,
      "Método Pago": c.metodo_pago,
      Items: (c.compra_items || []).map((i: any) => `${i.productos?.nombre || "Producto"} x${i.cantidad}`).join(", "),
    }));
    const wsCompras = XLSX.utils.json_to_sheet(comprasData);
    XLSX.utils.book_append_sheet(wb, wsCompras, "Compras");

    XLSX.writeFile(wb, `reporte_${negocioSlug}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-stone-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </Link>
        <h1 className="text-xl font-bold text-stone-800">Reportes - {negocio?.titulo}</h1>
        <div className="flex-1"></div>
        <button onClick={cargarDatos} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5 text-stone-700" />
        </button>
        <button onClick={exportarExcel} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1">
          <Download className="w-4 h-4" /> Exportar Excel
        </button>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        {/* Filtros */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-500" />
              <span className="text-sm font-medium text-stone-700">Desde:</span>
              <input type="date" value={filtroFecha.start} onChange={(e) => setFiltroFecha({ ...filtroFecha, start: e.target.value })} className="border border-stone-300 rounded-xl px-3 py-1 text-sm" />
              <span className="text-sm font-medium text-stone-700">Hasta:</span>
              <input type="date" value={filtroFecha.end} onChange={(e) => setFiltroFecha({ ...filtroFecha, end: e.target.value })} className="border border-stone-300 rounded-xl px-3 py-1 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-500" />
              <span className="text-sm font-medium text-stone-700">Método de Pago:</span>
              <select value={filtroMetodoPago} onChange={(e) => setFiltroMetodoPago(e.target.value)} className="border border-stone-300 rounded-xl px-3 py-1 text-sm">
                <option value="todos">Todos</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Nequi">Nequi</option>
                <option value="Bancolombia">Bancolombia</option>
                <option value="Daviplata">Daviplata</option>
                <option value="Crédito">Crédito</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Ventas</p>
            <p className="text-2xl font-bold text-emerald-600">${totalVentas.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Compras</p>
            <p className="text-2xl font-bold text-red-600">${totalCompras.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Ingresos</p>
            <p className="text-2xl font-bold text-blue-600">${totalIngresos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Egresos</p>
            <p className="text-2xl font-bold text-orange-600">${totalEgresos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Créditos Pend.</p>
            <p className="text-2xl font-bold text-purple-600">${totalCreditoPendiente.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Stock Crítico</p>
            <p className={`text-2xl font-bold ${stockCritico > 0 ? "text-red-600" : "text-emerald-600"}`}>{stockCritico}</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
            <h3 className="font-semibold text-stone-800 mb-2">Ventas por Método de Pago</h3>
            <div className="h-48">
              <Pie data={chartVentas} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
            <h3 className="font-semibold text-stone-800 mb-2">Comparativo Ventas vs Compras vs Finanzas</h3>
            <div className="h-48">
              <Bar data={chartComparativo} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* Top productos */}
        {topProductos.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-6">
            <h3 className="font-semibold text-stone-800 mb-2">Top 5 Productos más Vendidos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="text-left p-2 text-stone-700">Producto</th>
                    <th className="text-left p-2 text-stone-700">Cantidad</th>
                    <th className="text-left p-2 text-stone-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductos.map((p, i) => (
                    <tr key={i} className="border-b border-stone-100">
                      <td className="p-2 text-stone-800">{p.nombre}</td>
                      <td className="p-2 text-stone-800">{p.cantidad}</td>
                      <td className="p-2 text-stone-800 font-medium">${p.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabla de Ventas */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-3">Últimas Ventas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-2 text-stone-700">Fecha</th>
                  <th className="text-left p-2 text-stone-700">Método</th>
                  <th className="text-left p-2 text-stone-700">Total</th>
                  <th className="text-left p-2 text-stone-700">Productos</th>
                </tr>
              </thead>
              <tbody>
                {ventas.slice(0, 10).map((v) => (
                  <tr key={v.id} className="border-b border-stone-100">
                    <td className="p-2 text-stone-800">{new Date(v.fecha).toLocaleDateString()}</td>
                    <td className="p-2 text-stone-600">{v.metodo_pago}</td>
                    <td className="p-2 text-stone-800 font-medium">${v.total?.toLocaleString()}</td>
                    <td className="p-2 text-stone-600">
                      {(v.sale_items || []).map((i: any) => `${i.quantity} ${i.productos?.nombre || "Producto"}`).join(", ")}
                    </td>
                  </tr>
                ))}
                {ventas.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-stone-500">No hay ventas</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
