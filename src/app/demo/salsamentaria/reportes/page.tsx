"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import * as XLSX from "xlsx";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  const [ventas, setVentas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [finanzas, setFinanzas] = useState([]);
  const [stock, setStock] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState("hoy");

  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[2] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantId = negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  const cargarDatos = async () => {
    setLoading(true);
    // Obtener ventas
    const resVentas = await fetch(`/api/ventas?tenant=${tenantId}`);
    const dataVentas = await resVentas.json();
    if (dataVentas.success) setVentas(dataVentas.data || []);

    // Obtener compras (si existe)
    try {
      const resCompras = await fetch(`/api/compras?tenant=${tenantId}`);
      const dataCompras = await resCompras.json();
      if (dataCompras.success) setCompras(dataCompras.data || []);
    } catch (e) { setCompras([]); }

    // Obtener finanzas
    const resFinanzas = await fetch(`/api/finanzas?tenant=${tenantId}`);
    const dataFinanzas = await resFinanzas.json();
    if (dataFinanzas.success) setFinanzas(dataFinanzas.data || []);

    // Obtener stock
    const resStock = await fetch(`/api/inventory?tenant=${tenantId}&stock=true`);
    const dataStock = await resStock.json();
    if (dataStock.success) setStock(dataStock.data || []);

    // Obtener créditos
    const resCreditos = await fetch(`/api/creditos?tenant=${tenantId}`);
    const dataCreditos = await resCreditos.json();
    if (dataCreditos.success) setCreditos(dataCreditos.data || []);

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
  const totalCompras = compras.reduce((sum, c) => sum + c.total, 0);
  const totalIngresos = finanzas.filter(f => f.tipo === "ingreso").reduce((sum, f) => sum + f.monto, 0);
  const totalEgresos = finanzas.filter(f => f.tipo === "egreso").reduce((sum, f) => sum + f.monto, 0);
  const totalCreditoPendiente = creditos.filter(c => c.estado === "pendiente").reduce((sum, c) => sum + c.saldo_pendiente, 0);

  const exportarExcel = () => {
    const data = [
      { Concepto: "Total Ventas", Monto: totalVentas },
      { Concepto: "Total Compras", Monto: totalCompras },
      { Concepto: "Ingresos Financieros", Monto: totalIngresos },
      { Concepto: "Egresos Financieros", Monto: totalEgresos },
      { Concepto: "Créditos Pendientes", Monto: totalCreditoPendiente },
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `reporte_${negocioSlug}.xlsx`);
  };

  const chartData = {
    labels: ["Ventas", "Compras", "Ingresos", "Egresos", "Créditos"],
    datasets: [
      {
        label: "Montos",
        data: [totalVentas, totalCompras, totalIngresos, totalEgresos, totalCreditoPendiente],
        backgroundColor: ["#10B981", "#EF4444", "#3B82F6", "#F59E0B", "#8B5CF6"],
      },
    ],
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
        <button
          onClick={exportarExcel}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <Download className="w-4 h-4" /> Exportar Excel
        </button>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Ventas Totales</p>
            <p className="text-2xl font-bold text-emerald-600">${totalVentas.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Compras Totales</p>
            <p className="text-2xl font-bold text-red-600">${totalCompras.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Ingresos (Finanzas)</p>
            <p className="text-2xl font-bold text-blue-600">${totalIngresos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Egresos (Finanzas)</p>
            <p className="text-2xl font-bold text-orange-600">${totalEgresos.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-6">
          <h3 className="font-semibold text-stone-800 mb-2">Resumen Gráfico</h3>
          <div className="h-64">
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-3">Detalle de Ventas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-2 text-stone-700">Fecha</th>
                  <th className="text-left p-2 text-stone-700">Producto</th>
                  <th className="text-left p-2 text-stone-700">Cantidad</th>
                  <th className="text-left p-2 text-stone-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {ventas.slice(0, 10).map((v: any) => (
                  <tr key={v.id} className="border-b border-stone-100">
                    <td className="p-2 text-stone-800">{new Date(v.fecha).toLocaleDateString()}</td>
                    <td className="p-2 text-stone-600">{v.producto_nombre || "Producto"}</td>
                    <td className="p-2 text-stone-600">{v.cantidad}</td>
                    <td className="p-2 text-stone-800 font-medium">${v.total?.toLocaleString() || v.subtotal?.toLocaleString()}</td>
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
