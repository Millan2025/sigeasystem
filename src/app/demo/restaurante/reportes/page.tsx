"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Download, Filter, Calendar, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

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
      let urlVentas = `/api/ventas?tenant=${tenantId}`;
      if (filtroFecha.start) urlVentas += `&start=${filtroFecha.start}`;
      if (filtroFecha.end) urlVentas += `&end=${filtroFecha.end}`;
      if (filtroMetodoPago !== "todos") urlVentas += `&metodo_pago=${filtroMetodoPago}`;
      const resVentas = await fetch(urlVentas);
      const dataVentas = await resVentas.json();
      if (dataVentas.success) setVentas(dataVentas.data || []);

      let urlCompras = `/api/compras?tenant=${tenantId}`;
      if (filtroFecha.start) urlCompras += `&start=${filtroFecha.start}`;
      if (filtroFecha.end) urlCompras += `&end=${filtroFecha.end}`;
      const resCompras = await fetch(urlCompras);
      const dataCompras = await resCompras.json();
      if (dataCompras.success) setCompras(dataCompras.data || []);

      const resFinanzas = await fetch(`/api/finanzas?tenant=${tenantId}`);
      const dataFinanzas = await resFinanzas.json();
      if (dataFinanzas.success) setFinanzas(dataFinanzas.data || []);

      const resStock = await fetch(`/api/inventory?tenant=${tenantId}&stock=true`);
      const dataStock = await resStock.json();
      if (dataStock.success) setStock(dataStock.data || []);

      const resCreditos = await fetch(`/api/creditos?tenant=${tenantId}`);
      const dataCreditos = await resCreditos.json();
      if (dataCreditos.success) setCreditos(dataCreditos.data || []);
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

  // Exportar Excel mejorado
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    // Hoja Resumen (tabla)
    const resumenData = [
      ["Concepto", "Monto"],
      ["Ventas Totales", totalVentas],
      ["Compras Totales", totalCompras],
      ["Ingresos Financieros", totalIngresos],
      ["Egresos Financieros", totalEgresos],
      ["Créditos Pendientes", totalCreditoPendiente],
      ["Stock Crítico", stockCritico],
    ];
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    wsResumen["!cols"] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

    // Hoja Ventas detallada
    const ventasRows = [["Fecha", "Método Pago", "Total", "Productos"]];
    ventas.forEach(v => {
      const productos = (v.sale_items || []).map((i: any) => `${i.quantity} ${i.productos?.nombre || "Producto"}`).join(", ");
      ventasRows.push([v.fecha, v.metodo_pago, v.total, productos]);
    });
    const wsVentas = XLSX.utils.aoa_to_sheet(ventasRows);
    wsVentas["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas");

    // Hoja Compras detallada
    const comprasRows = [["Fecha", "Proveedor", "Método Pago", "Total", "Productos"]];
    compras.forEach(c => {
      const productos = (c.compra_items || []).map((i: any) => `${i.cantidad} ${i.productos?.nombre || "Producto"}`).join(", ");
      comprasRows.push([c.fecha, c.proveedor, c.metodo_pago, c.total, productos]);
    });
    const wsCompras = XLSX.utils.aoa_to_sheet(comprasRows);
    wsCompras["!cols"] = [{ wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsCompras, "Compras");

    // Hoja Top Productos
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
    const topRows = [["Producto", "Cantidad", "Total"]];
    Object.values(productosVendidos).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10).forEach(p => {
      topRows.push([p.nombre, p.cantidad, p.total]);
    });
    const wsTop = XLSX.utils.aoa_to_sheet(topRows);
    wsTop["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsTop, "Top Productos");

    XLSX.writeFile(wb, `reporte_${negocioSlug}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Exportar CSV con punto y coma
  const exportarCSV = () => {
    const rows = [
      ["Concepto", "Monto"],
      ["Ventas Totales", totalVentas],
      ["Compras Totales", totalCompras],
      ["Ingresos Financieros", totalIngresos],
      ["Egresos Financieros", totalEgresos],
      ["Créditos Pendientes", totalCreditoPendiente],
      ["Stock Crítico", stockCritico],
    ];
    const csvContent = rows.map(row => row.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); // BOM para UTF-8
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_${negocioSlug}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
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
          <Download className="w-4 h-4" /> Excel
        </button>
        <button onClick={exportarCSV} className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1">
          <FileSpreadsheet className="w-4 h-4" /> CSV
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
