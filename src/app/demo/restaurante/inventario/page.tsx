"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Search,
  FileUp,
  FileDown,
  Edit,
  Trash2,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function InventarioPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant") || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";
  const negocioSlug = searchParams.get("slug") || "restaurante";
  const categoriaNegocio = ""; // Sin filtro por categoría

  const [movimientos, setMovimientos] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMovimientoModal, setShowMovimientoModal] = useState(false);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [formMovimiento, setFormMovimiento] = useState({ producto_id: "", tipo: "entrada", cantidad: 1, motivo: "" });
  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [importando, setImportando] = useState(false);

  const [editandoProducto, setEditandoProducto] = useState<any>(null);
  const [formProducto, setFormProducto] = useState({
    nombre: "",
    categoria: "",
    precio: 0,
    precio_compra: 0,
    stock: 0,
    stock_minimo: 0,
    stock_maximo: 0,
    proveedor: "",
    observaciones: "",
    unidad: "unidad",
    tipo_unidad: "unidad",
    icono: "📦",
    sku: "",
    descripcion: "",
    fecha_caducidad: "",
    ubicacion: "",
  });

  // Cargar lista de productos para el selector de movimientos
  useEffect(() => {
    fetch(`/api/products?tenant=${tenantId}&categoria=${encodeURIComponent(categoriaNegocio)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProductos(d.data || []);
      });
  }, [tenantId, categoriaNegocio]);

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

  // Movimientos
  const registrarMovimiento = async () => {
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formMovimiento,
        tenant_id: tenantId,
        cantidad: parseInt(formMovimiento.cantidad as any),
      }),
    });
    const data = await res.json();
    if (data.success) {
      setShowMovimientoModal(false);
      cargarDatos();
      setFormMovimiento({ producto_id: "", tipo: "entrada", cantidad: 1, motivo: "" });
    } else {
      alert(data.error || "Error al registrar movimiento");
    }
  };

  // CRUD Productos
  const guardarProducto = async () => {
    const url = "/api/products";
    const method = editandoProducto ? "PUT" : "POST";
    const body = editandoProducto
      ? { ...formProducto, id: editandoProducto.id, tenant_id: tenantId }
      : { ...formProducto, tenant_id: tenantId };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      setShowProductoModal(false);
      setEditandoProducto(null);
      setFormProducto({
        nombre: "",
        categoria: "",
        precio: 0,
        precio_compra: 0,
        stock: 0,
        stock_minimo: 0,
        stock_maximo: 0,
        proveedor: "",
        observaciones: "",
        unidad: "unidad",
        tipo_unidad: "unidad",
        icono: "📦",
        sku: "",
        descripcion: "",
        fecha_caducidad: "",
        ubicacion: "",
      });
      cargarDatos();
      // Recargar lista de productos para el selector
      fetch(`/api/products?tenant=${tenantId}&categoria=${encodeURIComponent(categoriaNegocio)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setProductos(d.data || []);
        });
    } else {
      alert(data.error || "Error al guardar producto");
    }
  };

  const eliminarProducto = async (id: string) => {
    if (!confirm("¿Eliminar este producto? También se eliminarán sus movimientos.")) return;
    const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      cargarDatos();
      fetch(`/api/products?tenant=${tenantId}&categoria=${encodeURIComponent(categoriaNegocio)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setProductos(d.data || []);
        });
    } else {
      alert(data.error || "Error al eliminar");
    }
  };

  const editarProducto = (p: any) => {
    setEditandoProducto(p);
    setFormProducto({
      nombre: p.nombre,
      categoria: p.categoria,
      precio: p.precio || 0,
      precio_compra: p.precio_compra || 0,
      stock: p.stock || 0,
      stock_minimo: p.stock_minimo || 0,
      stock_maximo: p.stock_maximo || 0,
      proveedor: p.proveedor || "",
      observaciones: p.observaciones || "",
      unidad: p.unidad || "unidad",
      tipo_unidad: p.tipo_unidad || "unidad",
      icono: p.icono || "📦",
      sku: p.sku || "",
      descripcion: p.descripcion || "",
      fecha_caducidad: p.fecha_caducidad || "",
      ubicacion: p.ubicacion || "",
    });
    setShowProductoModal(true);
  };

  // Exportar / Importar
  const exportarInventario = () => {
    if (stock.length === 0) {
      alert("No hay datos para exportar");
      return;
    }
    const data = stock.map((p: any) => ({
      SKU: p.sku || "",
      Producto: p.nombre,
      Descripción: p.descripcion || "",
      Categoría: p.categoria || "",
      "Stock Actual": p.stock_actual,
      "Stock Mínimo": p.stock_minimo || 0,
      "Stock Máximo": p.stock_maximo || 0,
      Unidad: p.unidad || "unidad",
      Ubicación: p.ubicacion || "",
      "Fecha Caducidad": p.fecha_caducidad || "",
      Observaciones: p.observaciones || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    ws["!cols"] = Object.keys(data[0]).map(() => ({ wch: 20 }));
    XLSX.writeFile(wb, `inventario_${negocioSlug}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const descargarPlantilla = () => {
    const columnas = [
      "sku",
      "nombre",
      "descripcion",
      "categoria",
      "precio",
      "precio_compra",
      "stock",
      "stock_minimo",
      "stock_maximo",
      "unidad",
      "tipo_unidad",
      "venta_por_peso",
      "icono",
      "proveedor",
      "observaciones",
      "fecha_caducidad",
      "ubicacion",
    ];
    const filaEjemplo = [
      "PAN-001",
      "Pan de Sal",
      "Pan tradicional de sal, 250g",
      "Panaderia",
      2500,
      1800,
      100,
      10,
      200,
      "unidad",
      "unidad",
      false,
      "🍞",
      "Proveedor XYZ",
      "Producto estrella",
      "2026-07-15",
      "Estante A1",
    ];
    const data = [columnas, filaEjemplo];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    ws["!cols"] = columnas.map(() => ({ wch: 20 }));
    XLSX.writeFile(wb, `plantilla_productos_${negocioSlug}.xlsx`);
  };

  const importarProductos = async (file: File) => {
    setImportando(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const productosData = rows.slice(1).filter((row) => row[1] && row[1].trim() !== "");

        if (productosData.length === 0) {
          alert("El archivo no contiene productos para importar.");
          setImportando(false);
          return;
        }

        let importados = 0;
        let errores = [];

        for (const row of productosData) {
          const [
            sku, nombre, descripcion, categoria, precio, precio_compra,
            stock, stock_minimo, stock_maximo, unidad, tipo_unidad,
            venta_por_peso, icono, proveedor, observaciones,
            fecha_caducidad, ubicacion
          ] = row;
          try {
            const res = await fetch("/api/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sku: sku?.trim() || null,
                nombre: nombre.trim(),
                descripcion: descripcion?.trim() || "",
                categoria: categoria.trim() || "General",
                precio: parseFloat(precio) || 0,
                precio_compra: parseFloat(precio_compra) || 0,
                stock: parseInt(stock) || 0,
                stock_minimo: parseInt(stock_minimo) || 0,
                stock_maximo: parseInt(stock_maximo) || 0,
                unidad: unidad?.trim() || "unidad",
                tipo_unidad: tipo_unidad?.trim() || "unidad",
                venta_por_peso: venta_por_peso === true || venta_por_peso === "true" || venta_por_peso === "si",
                icono: icono?.trim() || "📦",
                proveedor: proveedor?.trim() || "",
                observaciones: observaciones?.trim() || "",
                fecha_caducidad: fecha_caducidad?.trim() || null,
                ubicacion: ubicacion?.trim() || "",
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
        fetch(`/api/products?tenant=${tenantId}&categoria=${encodeURIComponent(categoriaNegocio)}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success) setProductos(d.data || []);
          });
        setImportando(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      alert("Error al leer el archivo");
      setImportando(false);
    }
  };

  // Filtros
  const stockFiltrado = stock.filter((p: any) =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const movimientosFiltrados = movimientos.filter((m: any) => {
    if (filtroTipo === "todos") return true;
    return m.tipo === filtroTipo;
  });

  const stockMap = stock.reduce((acc: any, s: any) => {
    acc[s.id] = s.stock_actual;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <BackButton />
        <h1 className="text-xl font-bold text-stone-800">Inventario</h1>
        <div className="flex-1"></div>
        <button onClick={cargarDatos} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5 text-stone-700" />
        </button>
        <button
          onClick={() => setShowMovimientoModal(true)}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Movimiento
        </button>
        <button
          onClick={() => {
            setEditandoProducto(null);
            setFormProducto({
              nombre: "",
              categoria: "",
              precio: 0,
              precio_compra: 0,
              stock: 0,
              stock_minimo: 0,
              stock_maximo: 0,
              proveedor: "",
              observaciones: "",
              unidad: "unidad",
              tipo_unidad: "unidad",
              icono: "📦",
              sku: "",
              descripcion: "",
              fecha_caducidad: "",
              ubicacion: "",
            });
            setShowProductoModal(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Nuevo Producto
        </button>
        <button
          onClick={descargarPlantilla}
          className="p-2 hover:bg-stone-100 rounded-xl flex items-center gap-1 text-stone-700"
          title="Descargar plantilla Excel"
        >
          <FileDown className="w-5 h-5" />
          <span className="text-xs hidden sm:inline">Plantilla</span>
        </button>
        <button
          onClick={exportarInventario}
          className="p-2 hover:bg-stone-100 rounded-xl flex items-center gap-1 text-stone-700 bg-emerald-50"
          title="Exportar inventario actual"
        >
          <FileDown className="w-5 h-5" />
          <span className="text-xs hidden sm:inline">Exportar Inv.</span>
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
        {/* Tabla de stock actual con nuevas columnas */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="font-semibold text-stone-800">Stock Actual</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Buscar por SKU o nombre..."
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
                  <th className="text-left p-2 text-stone-700">SKU</th>
                  <th className="text-left p-2 text-stone-700">Producto</th>
                  <th className="text-left p-2 text-stone-700">Stock</th>
                  <th className="text-left p-2 text-stone-700">Unidad</th>
                  <th className="text-left p-2 text-stone-700">Ubicación</th>
                  <th className="text-left p-2 text-stone-700">Caducidad</th>
                  <th className="text-left p-2 text-stone-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {stockFiltrado.map((p: any) => (
                  <tr key={p.id} className="border-b border-stone-100">
                    <td className="p-2 text-stone-600 font-mono text-xs">{p.sku || "-"}</td>
                    <td className="p-2 text-stone-800 font-medium">
                      <div>{p.nombre}</div>
                      <div className="text-xs text-stone-600 truncate max-w-xs">{p.descripcion || ""}</div>
                    </td>
                    <td className="p-2 font-semibold text-stone-800">{p.stock_actual}</td>
                    <td className="p-2 text-stone-600">{p.unidad || "unidad"}</td>
                    <td className="p-2 text-stone-600">{p.ubicacion || "-"}</td>
                    <td className="p-2 text-stone-600">
                      {p.fecha_caducidad ? new Date(p.fecha_caducidad).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-2 flex gap-2">
                      <button onClick={() => editarProducto(p)} className="p-1 hover:bg-stone-100 rounded">
                        <Edit className="w-4 h-4 text-stone-600" />
                      </button>
                      <button onClick={() => eliminarProducto(p.id)} className="p-1 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
                {stockFiltrado.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-stone-500">
                      No hay productos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historial de movimientos */}
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

      {/* Modal Movimiento */}
      {showMovimientoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Registrar Movimiento</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Producto</label>
                <select
                  value={formMovimiento.producto_id}
                  onChange={(e) => setFormMovimiento({ ...formMovimiento, producto_id: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                >
                  <option value="">Seleccionar...</option>
                  {productos.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.sku ? `(${p.sku})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Tipo</label>
                <select
                  value={formMovimiento.tipo}
                  onChange={(e) => setFormMovimiento({ ...formMovimiento, tipo: e.target.value })}
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
                  value={formMovimiento.cantidad}
                  onChange={(e) =>
                    setFormMovimiento({ ...formMovimiento, cantidad: parseInt(e.target.value) || 1 })
                  }
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Motivo (opcional)</label>
                <input
                  type="text"
                  value={formMovimiento.motivo}
                  onChange={(e) => setFormMovimiento({ ...formMovimiento, motivo: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="Ej. Compra, ajuste"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMovimientoModal(false)}
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

      {/* Modal Producto */}
      {showProductoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">
              {editandoProducto ? `Editar producto: ${editandoProducto.nombre}` : "Nuevo Producto"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">SKU (Código de Barras)</label>
                <input
                  type="text"
                  value={formProducto.sku}
                  onChange={(e) => setFormProducto({ ...formProducto, sku: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="Ej. PAN-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Nombre *</label>
                <input
                  type="text"
                  value={formProducto.nombre}
                  onChange={(e) => setFormProducto({ ...formProducto, nombre: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Descripción</label>
                <input
                  type="text"
                  value={formProducto.descripcion}
                  onChange={(e) => setFormProducto({ ...formProducto, descripcion: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="Ej. Baguette tradicional 250g"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Categoría *</label>
                <input
                  type="text"
                  value={formProducto.categoria}
                  onChange={(e) => setFormProducto({ ...formProducto, categoria: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Precio Venta</label>
                <input
                  type="number"
                  step="0.01"
                  value={formProducto.precio}
                  onChange={(e) => setFormProducto({ ...formProducto, precio: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Precio Compra</label>
                <input
                  type="number"
                  step="0.01"
                  value={formProducto.precio_compra}
                  onChange={(e) => setFormProducto({ ...formProducto, precio_compra: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Stock actual</label>
                <input
                  type="text"
                  value={stockMap[editandoProducto?.id] ?? 0}
                  disabled
                  className="w-full border border-stone-300 rounded-xl p-2 bg-stone-100 text-stone-600"
                />
                <p className="text-xs text-stone-600 mt-1">El stock se calcula automáticamente</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Stock mínimo</label>
                <input
                  type="number"
                  value={formProducto.stock_minimo}
                  onChange={(e) => setFormProducto({ ...formProducto, stock_minimo: parseInt(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Stock máximo</label>
                <input
                  type="number"
                  value={formProducto.stock_maximo}
                  onChange={(e) => setFormProducto({ ...formProducto, stock_maximo: parseInt(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Proveedor</label>
                <input
                  type="text"
                  value={formProducto.proveedor}
                  onChange={(e) => setFormProducto({ ...formProducto, proveedor: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Observaciones</label>
                <input
                  type="text"
                  value={formProducto.observaciones}
                  onChange={(e) => setFormProducto({ ...formProducto, observaciones: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Unidad</label>
                <input
                  type="text"
                  value={formProducto.unidad}
                  onChange={(e) => setFormProducto({ ...formProducto, unidad: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="kg, L, unidad, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Tipo de unidad</label>
                <select
                  value={formProducto.tipo_unidad}
                  onChange={(e) => setFormProducto({ ...formProducto, tipo_unidad: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                >
                  <option value="unidad">Unidad</option>
                  <option value="kilogramo">Kilogramo</option>
                  <option value="gramo">Gramo</option>
                  <option value="libra">Libra</option>
                  <option value="litro">Litro</option>
                  <option value="mililitro">Mililitro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Fecha de caducidad</label>
                <input
                  type="date"
                  value={formProducto.fecha_caducidad}
                  onChange={(e) => setFormProducto({ ...formProducto, fecha_caducidad: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Ubicación en almacén</label>
                <input
                  type="text"
                  value={formProducto.ubicacion}
                  onChange={(e) => setFormProducto({ ...formProducto, ubicacion: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="Estante A1, Pasillo 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Icono (emoji)</label>
                <input
                  type="text"
                  value={formProducto.icono}
                  onChange={(e) => setFormProducto({ ...formProducto, icono: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowProductoModal(false);
                  setEditandoProducto(null);
                }}
                className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700"
              >
                Cancelar
              </button>
              <button
                onClick={guardarProducto}
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
