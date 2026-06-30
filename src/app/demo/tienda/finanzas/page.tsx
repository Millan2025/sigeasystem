"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
  Receipt,
  FileText,
} from "lucide-react";
import * as XLSX from "xlsx";

const NEGOCIOS = {
  panaderia: { titulo: "Panadería Doña Rosa", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  restaurante: { titulo: "Restaurante Caribe", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  carniceria: { titulo: "Carnicería El Buen Sabor", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  salsamentaria: { titulo: "Salsamentaria La Especial", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  ferreteria: { titulo: "Ferretería El Tornillo", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  tienda: { titulo: "Tienda Surtimax", tenantId: "58d06407-6d1c-4beb-acee-8965001fbbee" },
};

export default function FinanzasPage() {
  const pathname = usePathname();
  const [transacciones, setTransacciones] = useState([]);
  const [resumen, setResumen] = useState({ ingresos: 0, egresos: 0, saldo: 0, impuestos: 0, retenciones: 0 });
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [showModalTransaccion, setShowModalTransaccion] = useState(false);
  const [showModalCategoria, setShowModalCategoria] = useState(false);
  const [showModalPeriodo, setShowModalPeriodo] = useState(false);
  const [filtros, setFiltros] = useState({ start: "", end: "", tipo: "", categoria: "", periodo: "" });
  const [editando, setEditando] = useState<any>(null);
  const [formTransaccion, setFormTransaccion] = useState({
    tipo: "ingreso",
    monto: 0,
    categoria_contable_id: "",
    descripcion: "",
    fecha: "",
    impuesto: 0,
    retencion: 0,
  });
  const [formCategoria, setFormCategoria] = useState({ codigo: "", nombre: "", tipo: "ingreso", nivel: 1, padre_id: "" });
  const [formPeriodo, setFormPeriodo] = useState({ nombre: "", fecha_inicio: "", fecha_fin: "", tipo: "bimestral", cerrado: false });

  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[2] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantId = negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  // Cargar datos iniciales
  const cargarDatos = async () => {
    setLoading(true);
    // Cargar transacciones con filtros
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
      setResumen(data.resumen || { ingresos: 0, egresos: 0, saldo: 0, impuestos: 0, retenciones: 0 });
    }

    // Cargar categorías contables
    const catRes = await fetch(`/api/categorias-contables?tenant=${tenantId}`);
    const catData = await catRes.json();
    if (catData.success) setCategorias(catData.data || []);

    // Cargar períodos fiscales
    const perRes = await fetch(`/api/periodos-fiscales?tenant=${tenantId}`);
    const perData = await perRes.json();
    if (perData.success) setPeriodos(perData.data || []);

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId, filtros]);

  // ============================================
  // CRUD de transacciones
  // ============================================
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
      setShowModalTransaccion(false);
      setEditando(null);
      setFormTransaccion({ tipo: "ingreso", monto: 0, categoria_contable_id: "", descripcion: "", fecha: "", impuesto: 0, retencion: 0 });
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
    });
    setShowModalTransaccion(true);
  };

  // ============================================
  // Exportar a Excel
  // ============================================
  const exportarExcel = () => {
    if (transacciones.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    const data = transacciones.map((t: any) => ({
      Fecha: new Date(t.fecha).toLocaleDateString(),
      Tipo: t.tipo,
      "Categoría": t.categorias_contables?.nombre || "",
      Descripción: t.descripcion || "",
      Monto: t.monto,
      Impuesto: t.impuesto || 0,
      Retención: t.retencion || 0,
      "Total con impuestos": t.total_con_impuestos || 0,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Finanzas");
    ws["!cols"] = Object.keys(data[0]).map(() => ({ wch: 20 }));
    XLSX.writeFile(wb, `finanzas_${negocioSlug}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-stone-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </Link>
        <h1 className="text-xl font-bold text-stone-800">Finanzas - {negocio?.titulo}</h1>
        <div className="flex-1"></div>
        <button onClick={cargarDatos} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5 text-stone-700" />
        </button>
        <button
          onClick={() => {
            setEditando(null);
            setFormTransaccion({ tipo: "ingreso", monto: 0, categoria_contable_id: "", descripcion: "", fecha: "", impuesto: 0, retencion: 0 });
            setShowModalTransaccion(true);
          }}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Nueva Transacción
        </button>
        <button
          onClick={() => setShowModalCategoria(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <BookOpen className="w-4 h-4" /> Categorías
        </button>
        <button
          onClick={() => setShowModalPeriodo(true)}
          className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
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
        {/* Resumen */}
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

        {/* Filtros */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-500" />
              <span className="text-sm font-medium text-stone-700">Filtros:</span>
            </div>
            <input
              type="date"
              value={filtros.start}
              onChange={(e) => setFiltros({ ...filtros, start: e.target.value })}
              className="border border-stone-300 rounded-xl px-3 py-1 text-sm text-stone-800"
            />
            <span className="text-stone-400">-</span>
            <input
              type="date"
              value={filtros.end}
              onChange={(e) => setFiltros({ ...filtros, end: e.target.value })}
              className="border border-stone-300 rounded-xl px-3 py-1 text-sm text-stone-800"
            />
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              className="border border-stone-300 rounded-xl px-3 py-1 text-sm text-stone-800"
            >
              <option value="">Todos los tipos</option>
              <option value="ingreso">Ingresos</option>
              <option value="egreso">Egresos</option>
            </select>
            <select
              value={filtros.categoria}
              onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
              className="border border-stone-300 rounded-xl px-3 py-1 text-sm text-stone-800"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <select
              value={filtros.periodo}
              onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
              className="border border-stone-300 rounded-xl px-3 py-1 text-sm text-stone-800"
            >
              <option value="">Todos los períodos</option>
              {periodos.map((p: any) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla de transacciones */}
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
                    <td className="p-2 text-stone-800">{new Date(t.fecha).toLocaleDateString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.tipo === 'ingreso' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {t.tipo}
                      </span>
                    </td>
                    <td className="p-2 text-stone-600">{t.categorias_contables?.nombre || '-'}</td>
                    <td className="p-2 text-stone-600">{t.descripcion || '-'}</td>
                    <td className="p-2 text-stone-800 font-medium">${t.monto.toLocaleString()}</td>
                    <td className="p-2 text-stone-600">${(t.impuesto || 0).toLocaleString()}</td>
                    <td className="p-2 text-stone-600">${(t.retencion || 0).toLocaleString()}</td>
                    <td className="p-2 text-stone-800 font-bold">${(t.total_con_impuestos || t.monto).toLocaleString()}</td>
                    <td className="p-2 flex gap-2">
                      <button onClick={() => editarTransaccion(t)} className="p-1 hover:bg-stone-100 rounded">
                        <Edit className="w-4 h-4 text-stone-600" />
                      </button>
                      <button onClick={() => eliminarTransaccion(t.id)} className="p-1 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
                {transacciones.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-stone-500">
                      No hay movimientos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Transacción */}
      {showModalTransaccion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">
              {editando ? "Editar Transacción" : "Nueva Transacción"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Tipo</label>
                <select
                  value={formTransaccion.tipo}
                  onChange={(e) => setFormTransaccion({ ...formTransaccion, tipo: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={formTransaccion.monto}
                  onChange={(e) => setFormTransaccion({ ...formTransaccion, monto: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Categoría contable</label>
                <select
                  value={formTransaccion.categoria_contable_id}
                  onChange={(e) => setFormTransaccion({ ...formTransaccion, categoria_contable_id: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                >
                  <option value="">Seleccionar...</option>
                  {categorias.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Descripción</label>
                <input
                  type="text"
                  value={formTransaccion.descripcion}
                  onChange={(e) => setFormTransaccion({ ...formTransaccion, descripcion: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Fecha</label>
                <input
                  type="date"
                  value={formTransaccion.fecha}
                  onChange={(e) => setFormTransaccion({ ...formTransaccion, fecha: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Impuesto</label>
                <input
                  type="number"
                  step="0.01"
                  value={formTransaccion.impuesto}
                  onChange={(e) => setFormTransaccion({ ...formTransaccion, impuesto: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Retención</label>
                <input
                  type="number"
                  step="0.01"
                  value={formTransaccion.retencion}
                  onChange={(e) => setFormTransaccion({ ...formTransaccion, retencion: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModalTransaccion(false)}
                className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700"
              >
                Cancelar
              </button>
              <button
                onClick={guardarTransaccion}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-xl"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Categoría contable (simplificado) */}
      {showModalCategoria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Gestión de Categorías</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categorias.map((c: any) => (
                <div key={c.id} className="flex justify-between items-center border-b py-1">
                  <span><span className="font-mono text-xs text-stone-500">{c.codigo}</span> {c.nombre}</span>
                  <button className="text-red-500 text-sm">Eliminar</button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <input type="text" placeholder="Código" className="w-full border border-stone-300 rounded-xl p-1 mb-1 text-sm" />
              <input type="text" placeholder="Nombre" className="w-full border border-stone-300 rounded-xl p-1 mb-1 text-sm" />
              <select className="w-full border border-stone-300 rounded-xl p-1 mb-1 text-sm">
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
              <button className="w-full bg-emerald-500 text-white rounded-xl py-1 text-sm">Agregar</button>
            </div>
            <button onClick={() => setShowModalCategoria(false)} className="w-full border border-stone-300 py-2 rounded-xl mt-4">Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal Período (simplificado) */}
      {showModalPeriodo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Gestión de Períodos</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {periodos.map((p: any) => (
                <div key={p.id} className="flex justify-between border-b py-1">
                  <span>{p.nombre}</span>
                  <span className="text-sm text-stone-500">{new Date(p.fecha_inicio).toLocaleDateString()} - {new Date(p.fecha_fin).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowModalPeriodo(false)} className="w-full border border-stone-300 py-2 rounded-xl mt-4">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
