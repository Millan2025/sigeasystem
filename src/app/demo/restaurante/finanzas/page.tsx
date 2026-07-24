"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation"; import BackButton from "@/components/BackButton";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Download,
  Filter,
  Calendar,
  BookOpen,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";

// Formateador de fecha manual (sin conversión UTC)
const formatDate = (fechaStr: string) => {
  if (!fechaStr) return "-";
  const partes = fechaStr.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

export default function FinanzasPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant") || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";
  const negocioSlug = searchParams.get("slug") || "restaurante";
  const categoriaNegocio = "";
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [resumen, setResumen] = useState({
    ingresos: 0,
    egresos: 0,
    saldo: 0,
    impuestos: 0,
    retenciones: 0,
    desglosePagos: {} as Record<string, number>,
  });
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState(0);
  const [cuentasPorPagar, setCuentasPorPagar] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [showModalTransaccion, setShowImportModalTransaccion] = useState(false);
  const [showModalCategoria, setShowImportModalCategoria] = useState(false);
  const [showModalPeriodo, setShowImportModalPeriodo] = useState(false);
  const [filtros, setFiltros] = useState({ start: "", end: "", tipo: "", categoria: "", periodo: "" });
  const [editando, setEditando] = useState<any>(null);
  const [formTransaccion, setFormTransaccion] = useState({
    tipo: "ingreso",
    monto: 0,
    categoria_contable_id: "",
    descripcion: "",
    fecha: new Date().toLocaleDateString("en-CA"),
    impuesto: 0,
    retencion: 0,
    metodo_pago: "",
  });
  const [formCategoria, setFormCategoria] = useState({ codigo: "", nombre: "", tipo: "ingreso", nivel: 1, padre_id: "" });
  const [formPeriodo, setFormPeriodo] = useState({ nombre: "", fecha_inicio: "", fecha_fin: "", tipo: "bimestral", cerrado: false });

  

  const cargarDatos = async () => {
    setLoading(true);
    // 1. Transacciones y resumen
    let url = `/api/finanzas?tenant=${tenantId}`;
    if (filtros.start) url += `&start=${filtros.start}`;
    if (filtros.end) url += `&end=${filtros.end}`;
    if (filtros.tipo) url += `&tipo=${filtros.tipo}`;
    if (filtros.categoria) url += `&categoria=${filtros.categoria}`;
    if (filtros.periodo) url += `&periodo=${filtros.periodo}`;

    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      setTransacciones(data.data || []);
      setResumen(data.resumen || { ingresos: 0, egresos: 0, saldo: 0, impuestos: 0, retenciones: 0, desglosePagos: {} });
    }

    // 2. Cuentas por Cobrar (saldos pendientes de créditos)
    const creditosRes = await fetch(`/api/creditos?tenant=${tenantId}`);
    const creditosData = await creditosRes.json();
    if (creditosData.success) {
      const pendientes = creditosData.data
        .filter((c: any) => c.estado === "pendiente")
        .reduce((sum: number, c: any) => sum + (c.saldo_pendiente || 0), 0);
      setCuentasPorCobrar(pendientes);
    }

    // 3. Cuentas por Pagar (pendiente de implementar compras a crédito)
    // Por ahora, consultamos si existe la tabla compras y sumamos las que estén pendientes
    try {
      const comprasRes = await fetch(`/api/compras?tenant=${tenantId}`);
      const comprasData = await comprasRes.json();
      if (comprasData.success) {
        const pendientes = comprasData.data
          .filter((c: any) => c.metodo_pago === "credito" && c.estado !== "pagado")
          .reduce((sum: number, c: any) => sum + (c.total || 0), 0);
        setCuentasPorPagar(pendientes);
      }
    } catch (e) {
      // Si la API de compras no existe, dejamos en 0
      setCuentasPorPagar(0);
    }

    // 4. Categorías y períodos
    const catRes = await fetch(`/api/categorias-contables?tenant=${tenantId}`);
    const catData = await catRes.json();
    if (catData.success) setCategorias(catData.data || []);

    const perRes = await fetch(`/api/periodos-fiscales?tenant=${tenantId}`);
    const perData = await perRes.json();
    if (perData.success) setPeriodos(perData.data || []);

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId, filtros]);

  // CRUD transacciones
  const guardarTransaccion = async () => {
    const method = editando ? "PUT" : "POST";
    const body = editando
      ? { ...formTransaccion, id: editando.id, tenant_id: tenantId }
      : { ...formTransaccion, tenant_id: tenantId };

    const res = await fetch("/api/finanzas", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      setShowImportModalTransaccion(false);
      setEditando(null);
      setFormTransaccion({
        tipo: "ingreso",
        monto: 0,
        categoria_contable_id: "",
        descripcion: "",
        fecha: new Date().toLocaleDateString("en-CA"),
        impuesto: 0,
        retencion: 0,
        metodo_pago: "",
      });
      cargarDatos();
    } else {
      alert(data.error || "Error al guardar");
    }
  };

  const eliminarTransaccion = async (id: string) => {
    if (!confirm("¿Eliminar esta transacción?")) return;
    const res = await fetch(`/api/finanzas?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      cargarDatos();
    } else {
      alert(data.error || "Error al eliminar");
    }
  };

  const editarTransaccion = (t: any) => {
    setEditando(t);
    setFormTransaccion({
      tipo: t.tipo,
      monto: t.monto,
      categoria_contable_id: t.categoria_contable_id || "",
      descripcion: t.descripcion || "",
      fecha: t.fecha,
      impuesto: t.impuesto || 0,
      retencion: t.retencion || 0,
      metodo_pago: t.metodo_pago || "",
    });
    setShowImportModalTransaccion(true);
  };

  const exportarExcel = () => {
    if (transacciones.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
        const data = transacciones.map((t: any) => ({
      "#": t.item || '',
      "Fecha": formatDate(t.fecha),
      "Tipo": t.tipo,
      "Categoría": t.categorias_contables?.nombre || '',
      "Descripción": t.descripcion || '',
      "Método de Pago": t.metodo_pago || '',
      "Cantidad": t.cantidad || 1,
      "Precio Unitario": t.precio_unitario || 0,
      "Subtotal": t.subtotal || 0,
      "IVA": t.iva || 0,
      "Retención": t.retencion || 0,
      "ICA": t.ica || 0,
      "Total": t.total || t.total_con_impuestos || 0,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Finanzas");
    ws["!cols"] = Object.keys(data[0]).map(() => ({ wch: 20 }));
    XLSX.writeFile(wb, `finanzas_${negocioSlug}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const agregarCategoria = async () => {
    const res = await fetch("/api/categorias-contables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formCategoria, tenant_id: tenantId }),
    });
    const data = await res.json();
    if (data.success) {
      setFormCategoria({ codigo: "", nombre: "", tipo: "ingreso", nivel: 1, padre_id: "" });
      cargarDatos();
      alert("Categoría agregada");
    } else {
      alert(data.error);
    }
  };

  const crearPeriodo = async () => {
    const res = await fetch("/api/periodos-fiscales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formPeriodo, tenant_id: tenantId }),
    });
    const data = await res.json();
    if (data.success) {
      setFormPeriodo({ nombre: "", fecha_inicio: "", fecha_fin: "", tipo: "bimestral", cerrado: false });
      cargarDatos();
      alert("Período creado");
    } else {
      alert(data.error);
    }
  };

  const generarPeriodosAutomaticos = (tipo: string) => {
    const year = new Date().getFullYear();
    let periodos = [];
    if (tipo === "bimestral") {
      for (let i = 0; i < 6; i++) {
        const start = new Date(year, i * 2, 1);
        const end = new Date(year, i * 2 + 2, 1);
        end.setDate(end.getDate() - 1);
        periodos.push({
          nombre: `Bimestre ${i+1} - ${year}`,
          fecha_inicio: start.toISOString().split('T')[0],
          fecha_fin: end.toISOString().split('T')[0],
          tipo: "bimestral",
        });
      }
    } else if (tipo === "trimestral") {
      for (let i = 0; i < 4; i++) {
        const start = new Date(year, i * 3, 1);
        const end = new Date(year, i * 3 + 3, 1);
        end.setDate(end.getDate() - 1);
        periodos.push({
          nombre: `Trimestre ${i+1} - ${year}`,
          fecha_inicio: start.toISOString().split('T')[0],
          fecha_fin: end.toISOString().split('T')[0],
          tipo: "trimestral",
        });
      }
    } else if (tipo === "semestral") {
      for (let i = 0; i < 2; i++) {
        const start = new Date(year, i * 6, 1);
        const end = new Date(year, i * 6 + 6, 1);
        end.setDate(end.getDate() - 1);
        periodos.push({
          nombre: `Semestre ${i+1} - ${year}`,
          fecha_inicio: start.toISOString().split('T')[0],
          fecha_fin: end.toISOString().split('T')[0],
          tipo: "semestral",
        });
      }
    } else if (tipo === "anual") {
      periodos.push({
        nombre: `Año ${year}`,
        fecha_inicio: `${year}-01-01`,
        fecha_fin: `${year}-12-31`,
        tipo: "anual",
      });
    }
    periodos.forEach(async (p) => {
      await fetch("/api/periodos-fiscales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, tenant_id: tenantId, cerrado: false }),
      });
    });
    cargarDatos();
    alert(`Períodos ${tipo} generados correctamente`);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <BackButton />
        <h1 className="text-xl font-bold text-stone-800">Finanzas - {negocioSlug}</h1>
        <div className="flex-1"></div>
        <button onClick={cargarDatos} className="p-2 hover:bg-stone-100 rounded-xl" title="Actualizar datos">
          <RefreshCw className="w-5 h-5 text-stone-700" />
        </button>
        <button
          onClick={() => {
            setEditando(null);
            setFormTransaccion({
              tipo: "ingreso",
              monto: 0,
              categoria_contable_id: "",
              descripcion: "",
              fecha: new Date().toLocaleDateString("en-CA"),
              impuesto: 0,
              retencion: 0,
              metodo_pago: "",
            });
            setShowImportModalTransaccion(true);
          }}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
          title="Registrar nuevo movimiento"
        >
          <Plus className="w-4 h-4" /> Nueva Transacción
        </button>
        <button
          onClick={() => setShowImportModalCategoria(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
          title="Plan de cuentas"
        >
          <BookOpen className="w-4 h-4" /> Categorías
        </button>
        <button
          onClick={() => setShowImportModalPeriodo(true)}
          className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
          title="Períodos fiscales"
        >
          <Calendar className="w-4 h-4" /> Períodos
        </button>
        <button
          onClick={exportarExcel}
          className="p-2 hover:bg-stone-100 rounded-xl flex items-center gap-1 text-stone-700 bg-emerald-50"
          title="Exportar a Excel"
        >
          <Download className="w-5 h-5" />
          <span className="text-xs hidden sm:inline">Exportar</span>
        </button>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        {/* Resumen principal */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Ingresos</p>
            <p className="text-2xl font-bold text-emerald-600">${resumen.ingresos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Egresos</p>
            <p className="text-2xl font-bold text-red-600">${resumen.egresos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Saldo</p>
            <p className={`text-2xl font-bold ${resumen.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ${resumen.saldo.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Impuestos</p>
            <p className="text-2xl font-bold text-yellow-600">${resumen.impuestos.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 text-center">
            <p className="text-sm text-stone-500">Retenciones</p>
            <p className="text-2xl font-bold text-orange-600">${resumen.retenciones.toLocaleString()}</p>
          </div>
        </div>

        {/* Cuentas por Cobrar / Pagar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-2xl p-4 shadow-sm border border-blue-200 text-center">
            <p className="text-sm text-blue-700">Cuentas por Cobrar</p>
            <p className="text-2xl font-bold text-blue-600">${cuentasPorCobrar.toLocaleString()}</p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4 shadow-sm border border-orange-200 text-center">
            <p className="text-sm text-orange-700">Cuentas por Pagar</p>
            <p className="text-2xl font-bold text-orange-600">${cuentasPorPagar.toLocaleString()}</p>
          </div>
        </div>

        {/* Desglose por método de pago */}
        {resumen.desglosePagos && Object.keys(resumen.desglosePagos).length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-6">
            <h3 className="font-semibold text-stone-800 mb-2">Desglose por Método de Pago</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.entries(resumen.desglosePagos).map(([metodo, monto]) => (
                <div key={metodo} className="bg-stone-50 rounded-xl p-2 text-center">
                  <p className="text-xs text-stone-500">{metodo}</p>
                  <p className="text-sm font-bold text-stone-800">${monto.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-medium text-stone-700">Filtros:</span>
            <input type="date" value={filtros.start} onChange={(e) => setFiltros({ ...filtros, start: e.target.value })} className="border border-stone-300 rounded-xl px-3 py-1 text-sm text-stone-800" />
            <span className="text-stone-600">-</span>
            <input type="date" value={filtros.end} onChange={(e) => setFiltros({ ...filtros, end: e.target.value })} className="border border-stone-300 rounded-xl px-3 py-1 text-sm text-stone-800" />
            <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })} className="border border-stone-300 rounded-xl px-3 py-1 text-sm text-stone-800">
              <option value="">Todos los tipos</option>
              <option value="ingreso">Ingresos</option>
              <option value="egreso">Egresos</option>
            </select>
            <select value={filtros.categoria} onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })} className="border border-stone-300 rounded-xl px-3 py-1 text-sm text-stone-800">
              <option value="">Todas las categorías</option>
              {categorias.map((c: any) => (<option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>))}
            </select>
            <select value={filtros.periodo} onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })} className="border border-stone-300 rounded-xl px-3 py-1 text-sm text-stone-800">
              <option value="">Todos los períodos</option>
              {periodos.map((p: any) => (<option key={p.id} value={p.id}>{p.nombre}</option>))}
            </select>
          </div>
        </div>

        {/* Tabla de movimientos */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-3">Movimientos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-2 text-stone-700">Fecha</th>
                  <th className="text-left p-2 text-stone-700">Tipo</th>
                  <th className="text-left p-2 text-stone-700">Categoría</th>
                  <th className="text-left p-2 text-stone-700">Descripción</th>
                  <th className="text-left p-2 text-stone-700">Método de Pago</th>
                  <th className="text-left p-2 text-stone-700">Monto</th>
                  <th className="text-left p-2 text-stone-700">Impuesto</th>
                  <th className="text-left p-2 text-stone-700">Retención</th>
                  <th className="text-left p-2 text-stone-700">Total</th>
                  <th className="text-left p-2 text-stone-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.map((t: any) => (
                  <tr key={t.id} className="border-b border-stone-100">
                    <td className="p-2 text-stone-800">{formatDate(t.fecha)}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {t.tipo}
                      </span>
                    </td>
                    <td className="p-2 text-stone-600">{t.categorias_contables?.nombre || '-'}</td>
                    <td className="p-2 text-stone-600">{t.descripcion || '-'}</td>
                    <td className="p-2 text-stone-600">{t.metodo_pago || '-'}</td>
                    <td className="p-2 text-stone-800 font-medium">${t.monto.toLocaleString()}</td>
                    <td className="p-2 text-stone-600">${(t.impuesto || 0).toLocaleString()}</td>
                    <td className="p-2 text-stone-600">${(t.retencion || 0).toLocaleString()}</td>
                    <td className="p-2 text-stone-800 font-bold">${(t.total_con_impuestos || t.monto).toLocaleString()}</td>
                    <td className="p-2 flex gap-2">
                      <button onClick={() => editarTransaccion(t)} className="p-1 hover:bg-stone-100 rounded"><Edit className="w-4 h-4 text-stone-600" /></button>
                      <button onClick={() => eliminarTransaccion(t.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </td>
                  </tr>
                ))}
                {transacciones.length === 0 && <tr><td colSpan={10} className="p-4 text-center text-stone-500">No hay movimientos</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Transacción */}
      {showModalTransaccion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">{editando ? "Editar Transacción" : "Nueva Transacción"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Tipo</label>
                <select value={formTransaccion.tipo} onChange={(e) => setFormTransaccion({ ...formTransaccion, tipo: e.target.value })} className="w-full border border-stone-300 rounded-xl p-2 text-stone-800">
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Monto</label>
                <input type="number" step="0.01" value={formTransaccion.monto} onChange={(e) => setFormTransaccion({ ...formTransaccion, monto: parseFloat(e.target.value) || 0 })} className="w-full border border-stone-300 rounded-xl p-2 text-stone-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Categoría contable</label>
                <select value={formTransaccion.categoria_contable_id} onChange={(e) => setFormTransaccion({ ...formTransaccion, categoria_contable_id: e.target.value })} className="w-full border border-stone-300 rounded-xl p-2 text-stone-800">
                  <option value="">Seleccionar...</option>
                  {categorias.map((c: any) => (<option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Descripción</label>
                <input type="text" value={formTransaccion.descripcion} onChange={(e) => setFormTransaccion({ ...formTransaccion, descripcion: e.target.value })} className="w-full border border-stone-300 rounded-xl p-2 text-stone-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Fecha</label>
                <input type="date" value={formTransaccion.fecha} onChange={(e) => setFormTransaccion({ ...formTransaccion, fecha: e.target.value })} className="w-full border border-stone-300 rounded-xl p-2 text-stone-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Impuesto</label>
                <input type="number" step="0.01" value={formTransaccion.impuesto} onChange={(e) => setFormTransaccion({ ...formTransaccion, impuesto: parseFloat(e.target.value) || 0 })} className="w-full border border-stone-300 rounded-xl p-2 text-stone-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Retención</label>
                <input type="number" step="0.01" value={formTransaccion.retencion} onChange={(e) => setFormTransaccion({ ...formTransaccion, retencion: parseFloat(e.target.value) || 0 })} className="w-full border border-stone-300 rounded-xl p-2 text-stone-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Método de pago</label>
                <select value={formTransaccion.metodo_pago} onChange={(e) => setFormTransaccion({ ...formTransaccion, metodo_pago: e.target.value })} className="w-full border border-stone-300 rounded-xl p-2 text-stone-800">
                  <option value="">No aplica</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="Daviplata">Daviplata</option>
                  <option value="Crédito">Crédito</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowImportModalTransaccion(false)} className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700">Cancelar</button>
              <button onClick={guardarTransaccion} className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all duration-200 text-white rounded-xl font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Categorías */}
      {showModalCategoria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Plan de Cuentas</h3>
              <button onClick={() => setShowImportModalCategoria(false)}><X className="w-5 h-5 text-stone-700" /></button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categorias.map((c: any) => (
                <div key={c.id} className="flex justify-between items-center border-b py-1">
                  <span className="text-stone-800"><span className="font-mono text-xs text-stone-500">{c.codigo}</span> {c.nombre}</span>
                  <span className="text-xs text-stone-600">{c.tipo}</span>
                </div>
              ))}
              {categorias.length === 0 && <p className="text-stone-500 text-sm">No hay categorías</p>}
            </div>
            <div className="mt-4 border-t pt-4">
              <h4 className="font-medium text-stone-700 mb-2">Agregar nueva</h4>
              <div className="space-y-2">
                <input type="text" placeholder="Código (ej. 4-01-01)" value={formCategoria.codigo} onChange={(e) => setFormCategoria({...formCategoria, codigo: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2 text-stone-800 text-sm" />
                <input type="text" placeholder="Nombre" value={formCategoria.nombre} onChange={(e) => setFormCategoria({...formCategoria, nombre: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2 text-stone-800 text-sm" />
                <select value={formCategoria.tipo} onChange={(e) => setFormCategoria({...formCategoria, tipo: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2 text-stone-800 text-sm">
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                  <option value="costo">Costo</option>
                </select>
                <button onClick={agregarCategoria} className="w-full bg-emerald-500 text-white rounded-xl py-2 text-sm">Agregar Categoría</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Períodos */}
      {showModalPeriodo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Períodos Fiscales</h3>
              <button onClick={() => setShowImportModalPeriodo(false)}><X className="w-5 h-5 text-stone-700" /></button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto border-b mb-4 pb-4">
              {periodos.map((p: any) => (
                <div key={p.id} className="flex justify-between border-b py-1 text-sm">
                  <span className="text-stone-800">{p.nombre}</span>
                  <span className="text-stone-500">{formatDate(p.fecha_inicio)} - {formatDate(p.fecha_fin)}</span>
                </div>
              ))}
              {periodos.length === 0 && <p className="text-stone-500 text-sm">No hay períodos.</p>}
            </div>
            <div>
              <h4 className="font-medium text-stone-700 mb-2">Generar períodos automáticos</h4>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => generarPeriodosAutomaticos("bimestral")} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-xl text-sm">Bimestres</button>
                <button onClick={() => generarPeriodosAutomaticos("trimestral")} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-xl text-sm">Trimestres</button>
                <button onClick={() => generarPeriodosAutomaticos("semestral")} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-xl text-sm">Semestres</button>
                <button onClick={() => generarPeriodosAutomaticos("anual")} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-xl text-sm">Anual</button>
              </div>
              <div className="mt-4 border-t pt-4">
                <h4 className="font-medium text-stone-700 mb-2">Crear período manual</h4>
                <div className="space-y-2">
                  <input type="text" placeholder="Nombre" value={formPeriodo.nombre} onChange={(e) => setFormPeriodo({...formPeriodo, nombre: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2 text-sm text-stone-800" />
                  <div className="flex gap-2">
                    <input type="date" value={formPeriodo.fecha_inicio} onChange={(e) => setFormPeriodo({...formPeriodo, fecha_inicio: e.target.value})} className="flex-1 border border-stone-300 rounded-xl p-2 text-sm text-stone-800" />
                    <input type="date" value={formPeriodo.fecha_fin} onChange={(e) => setFormPeriodo({...formPeriodo, fecha_fin: e.target.value})} className="flex-1 border border-stone-300 rounded-xl p-2 text-sm text-stone-800" />
                  </div>
                  <button onClick={crearPeriodo} className="w-full bg-emerald-500 text-white rounded-xl py-2 text-sm">Crear Período</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}















