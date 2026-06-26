"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Search,
  FileUp,
  FileDown,
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

export default function InventarioPage() {
  const pathname = usePathname();
  const [movimientos, setMovimientos] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ producto_id: "", tipo: "entrada", cantidad: 1, motivo: "" });
  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [importando, setImportando] = useState(false);

  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[2] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantId = negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  useEffect(() => {
    fetch(`/api/products?tenant=${tenantId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProductos(d.data || []);
      });
  }, [tenantId]);

  const cargarDatos = () => {
    setLoading(true);
    fetch(`/api/inventory?tenant=${tenantId}&stock=true`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStock(d.data || []);
      });

    fetch(`/api/inventory?tenant=${tenantId}&limit=100`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMovimientos(d.data || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  const registrarMovimiento = async () => {
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tenant_id: tenantId,
        cantidad: parseInt(form.cantidad as any),
      }),
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      cargarDatos();
      setForm({ producto_id: "", tipo: "entrada", cantidad: 1, motivo: "" });
    } else {
      alert(data.error || "Error al registrar movimiento");
    }
  };

  // ==============================================
  // EXPORTAR PLANTILLA EXCEL (VACÍA O CON DATOS)
  // ==============================================
  const descargarPlantilla = () => {
    const columnas = [
      "nombre",
      "categoria",
      "precio",
      "stock",
      "unidad",
      "tipo_unidad",
      "venta_por_peso",
      "icono",
    ];
    const filaEjemplo = [
      "Pan de Sal",
      "Panaderia",
      2500,
      100,
      "unidad",
      "unidad",
      false,
      "🍞",
    ];
    const data = [columnas, filaEjemplo];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    // Establecer anchos de columna
    ws["!cols"] = columnas.map(() => ({ wch: 20 }));
    XLSX.writeFile(wb, `plantilla_productos_${negocioSlug}.xlsx`);
  };

  // ==============================================
  // IMPORTAR PRODUCTOS DESDE EXCEL
  // ==============================================
  const importarProductos = async (file: File) => {
    setImportando(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Saltar encabezado (primera fila)
        const productosData = rows.slice(1).filter((row) => row[0] && row[0].trim() !== "");

        if (productosData.length === 0) {
          alert("El archivo no contiene productos para importar.");
          setImportando(false);
          return;
        }

        let importados = 0;
        let errores = [];

        for (const row of productosData) {
          const [nombre, categoria, precio, stock, unidad, tipo_unidad, venta_por_peso, icono] = row;
          try {
            const res = await fetch("/api/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nombre: nombre.trim(),
                categoria: categoria.trim() || "General",
                precio: parseFloat(precio) || 0,
                stock: parseInt(stock) || 0,
                unidad: unidad?.trim() || "unidad",
                tipo_unidad: tipo_unidad?.trim() || "unidad",
                venta_por_peso: venta_por_peso === true || venta_por_peso === "true" || venta_por_peso === "si",
                icono: icono?.trim() || "📦",
                tenant_id: tenantId,
              }),
            });
            const result = await res.json();
            if (result.success) {
              importados++;
            } else {
              errores.push(`${nombre}: ${result.error}`);
            }
          } catch (err) {
            errores.push(`${nombre}: Error de conexión`);
          }
        }

        alert(
          `✅ Productos importados: ${importados}\n` +
          (errores.length > 0 ? `❌ Errores: ${errores.length}\n${errores.join("\n")}` : "")
        );
        cargarDatos();
        setImportando(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      alert("Error al leer el archivo");
      setImportando(false);
    }
  };

  const stockFiltrado = stock.filter((p: any) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const movimientosFiltrados = movimientos.filter((m: any) => {
    if (filtroTipo === "todos") return true;
    return m.tipo === filtroTipo;
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-stone-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </Link>
        <h1 className="text-xl font-bold text-stone-800">Inventario - {negocio?.titulo || "Negocio"}</h1>
        <div className="flex-1"></div>
        <button onClick={cargarDatos} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5 text-stone-700" />
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Movimiento
        </button>
        <button
          onClick={descargarPlantilla}
          className="p-2 hover:bg-stone-100 rounded-xl flex items-center gap-1 text-stone-700"
          title="Descargar plantilla Excel"
        >
          <FileDown className="w-5 h-5" />
          <span className="text-xs hidden sm:inline">Plantilla</span>
        </button>
        <label className="p-2 hover:bg-stone-100 rounded-xl cursor-pointer flex items-center gap-1 text-stone-700">
          <FileUp className="w-5 h-5" />
          <span className="text-xs hidden sm:inline">Importar</span>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                importarProductos(e.target.files[0]);
              }
              e.target.value = "";
            }}
            disabled={importando}
          />
        </label>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        {/* Stock actual con buscador */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-stone-800">Stock Actual</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-1.5 border border-stone-300 rounded-xl text-sm text-stone-800"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-2 text-stone-700">Producto</th>
                  <th className="text-left p-2 text-stone-700">Stock</th>
                  <th className="text-left p-2 text-stone-700">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {stockFiltrado.map((p: any) => (
                  <tr key={p.id} className="border-b border-stone-100">
                    <td className="p-2 text-stone-800">{p.nombre}</td>
                    <td className="p-2 font-semibold text-stone-800">{p.stock_actual}</td>
                    <td className="p-2 text-stone-600">{p.unidad || "unidad"}</td>
                  </tr>
                ))}
                {stockFiltrado.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-stone-500">
                      No hay productos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historial de movimientos con filtro */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-stone-800">Últimos Movimientos</h2>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="border border-stone-300 rounded-xl px-3 py-1 text-sm text-stone-800"
            >
              <option value="todos">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
              <option value="ajuste">Ajustes</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-2 text-stone-700">Fecha</th>
                  <th className="text-left p-2 text-stone-700">Producto</th>
                  <th className="text-left p-2 text-stone-700">Tipo</th>
                  <th className="text-left p-2 text-stone-700">Cantidad</th>
                  <th className="text-left p-2 text-stone-700">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.map((m: any) => (
                  <tr key={m.id} className="border-b border-stone-100">
                    <td className="p-2 text-stone-600">{new Date(m.created_at).toLocaleString()}</td>
                    <td className="p-2 text-stone-800">{m.productos?.nombre || "Producto"}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          m.tipo === "entrada"
                            ? "bg-emerald-100 text-emerald-700"
                            : m.tipo === "salida"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {m.tipo}
                      </span>
                    </td>
                    <td className="p-2 font-medium text-stone-800">{m.cantidad}</td>
                    <td className="p-2 text-stone-600">{m.motivo || "-"}</td>
                  </tr>
                ))}
                {movimientosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-stone-500">
                      No hay movimientos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal para registrar movimiento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Registrar Movimiento</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Producto</label>
                <select
                  value={form.producto_id}
                  onChange={(e) => setForm({ ...form, producto_id: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                >
                  <option value="">Seleccionar...</option>
                  {productos.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                >
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="ajuste">Ajuste</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={form.cantidad}
                  onChange={(e) =>
                    setForm({ ...form, cantidad: parseInt(e.target.value) || 1 })
                  }
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Motivo (opcional)</label>
                <input
                  type="text"
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="Ej. Compra, ajuste"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700"
              >
                Cancelar
              </button>
              <button
                onClick={registrarMovimiento}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-xl"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
