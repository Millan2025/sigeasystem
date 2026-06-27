"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  Download,
  Plus,
  Edit,
  Trash2,
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

export default function ComprasPage() {
  const pathname = usePathname();
  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[2] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantId = negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});

  // Modal CRUD
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    precio: 0,
    stock: 0,
    stock_minimo: 0,
    proveedor: "",
    observaciones: "",
    unidad: "unidad",
    tipo_unidad: "unidad",
    icono: "📦",
  });

  const cargarDatos = async () => {
    setLoading(true);
    // 1. Productos
    const resProd = await fetch(`/api/products?tenant=${tenantId}`);
    const dataProd = await resProd.json();
    if (dataProd.success) setProductos(dataProd.data || []);

    // 2. Stock actual (movimientos)
    const resStock = await fetch(`/api/inventory?tenant=${tenantId}&stock=true`);
    const dataStock = await resStock.json();
    if (dataStock.success) {
      const map: Record<string, number> = {};
      dataStock.data.forEach((s: any) => {
        map[s.id] = s.stock_actual;
      });
      setStockMap(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  // Proveedores únicos
  const proveedores = [...new Set(productos.map((p) => p.proveedor).filter(Boolean))];

  // Productos con stock por debajo del mínimo (usando stockMap)
  const productosCriticos = productos.filter((p) => {
    const stockActual = stockMap[p.id] ?? 0;
    const minimo = p.stock_minimo || 0;
    return stockActual < minimo;
  });

  const productosFiltrados = productos.filter((p) => {
    if (filtroProveedor && p.proveedor !== filtroProveedor) return false;
    return true;
  });

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const generarOrdenCompra = () => {
    if (seleccionados.length === 0) {
      alert("Selecciona al menos un producto.");
      return;
    }

    // Crear Excel con los productos seleccionados
    const data = seleccionados.map((id) => {
      const p = productos.find((prod) => prod.id === id);
      if (!p) return null;
      const stockActual = stockMap[p.id] ?? 0;
      return {
        Producto: p.nombre,
        Categoría: p.categoria,
        "Stock Actual": stockActual,
        "Mínimo Requerido": p.stock_minimo || 0,
        "Cantidad a Comprar": Math.max((p.stock_minimo || 0) - stockActual, 0),
        Proveedor: p.proveedor || "",
        Observaciones: p.observaciones || "",
      };
    }).filter(Boolean);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "OrdenCompra");
    XLSX.writeFile(wb, `orden_compra_${new Date().toISOString().slice(0,10)}.xlsx`);

    // También mostrar resumen
    const totalItems = data.length;
    alert(`📦 Orden de compra generada con ${totalItems} productos.\nSe descargó el archivo Excel.`);
  };

  const descargarInventarioCompleto = () => {
    const data = productos.map((p) => ({
      Nombre: p.nombre,
      Categoría: p.categoria,
      "Stock Actual": stockMap[p.id] ?? 0,
      "Stock Mínimo": p.stock_minimo || 0,
      Unidad: p.unidad || "",
      Proveedor: p.proveedor || "",
      "Precio Unitario": p.precio || 0,
      Observaciones: p.observaciones || "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `inventario_completo_${negocioSlug}.xlsx`);
  };

  // CRUD
  const guardarProducto = async () => {
    const url = "/api/products";
    const method = editando ? "PUT" : "POST";
    const body = editando
      ? { ...form, id: editando.id, tenant_id: tenantId }
      : { ...form, tenant_id: tenantId };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      setEditando(null);
      setForm({ nombre: "", categoria: "", precio: 0, stock: 0, stock_minimo: 0, proveedor: "", observaciones: "", unidad: "unidad", tipo_unidad: "unidad", icono: "📦" });
      cargarDatos();
    } else {
      alert(data.error || "Error al guardar");
    }
  };

  const eliminarProducto = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      cargarDatos();
    } else {
      alert(data.error || "Error al eliminar");
    }
  };

  const editarProducto = (p: any) => {
    setEditando(p);
    setForm({
      nombre: p.nombre,
      categoria: p.categoria,
      precio: p.precio || 0,
      stock: p.stock || 0,
      stock_minimo: p.stock_minimo || 0,
      proveedor: p.proveedor || "",
      observaciones: p.observaciones || "",
      unidad: p.unidad || "unidad",
      tipo_unidad: p.tipo_unidad || "unidad",
      icono: p.icono || "📦",
    });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-stone-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </Link>
        <h1 className="text-xl font-bold text-stone-800">Compras - {negocio?.titulo}</h1>
        <div className="flex-1"></div>
        <button onClick={cargarDatos} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5 text-stone-700" />
        </button>
        <button
          onClick={descargarInventarioCompleto}
          className="p-2 hover:bg-stone-100 rounded-xl flex items-center gap-1 text-stone-700"
          title="Descargar inventario completo"
        >
          <Download className="w-5 h-5" />
          <span className="text-xs hidden sm:inline">Exportar</span>
        </button>
        <button
          onClick={generarOrdenCompra}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <ShoppingBag className="w-4 h-4" /> Generar Orden
        </button>
        <button
          onClick={() => {
            setEditando(null);
            setForm({ nombre: "", categoria: "", precio: 0, stock: 0, stock_minimo: 0, proveedor: "", observaciones: "", unidad: "unidad", tipo_unidad: "unidad", icono: "📦" });
            setShowModal(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Nuevo Producto
        </button>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        {/* Alerta crítica (AHORA REAL) */}
        <div
          className={`rounded-2xl p-4 mb-6 ${
            productosCriticos.length > 0
              ? "bg-red-50 border border-red-200"
              : "bg-emerald-50 border border-emerald-200"
          }`}
        >
          <p className={`font-medium ${productosCriticos.length > 0 ? "text-red-700" : "text-emerald-700"}`}>
            {productosCriticos.length > 0
              ? `⚠️ ${productosCriticos.length} productos con stock por debajo del mínimo`
              : "✅ Todos los productos tienen stock adecuado"}
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={filtroProveedor}
            onChange={(e) => setFiltroProveedor(e.target.value)}
            className="border border-stone-300 rounded-xl px-3 py-1.5 text-sm text-stone-800"
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        {/* Tabla de productos */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="p-2 text-left text-stone-700">Seleccionar</th>
                <th className="p-2 text-left text-stone-700">Nombre</th>
                <th className="p-2 text-left text-stone-700">Categoría</th>
                <th className="p-2 text-left text-stone-700">Stock actual</th>
                <th className="p-2 text-left text-stone-700">Mínimo</th>
                <th className="p-2 text-left text-stone-700">Proveedor</th>
                <th className="p-2 text-left text-stone-700">Observaciones</th>
                <th className="p-2 text-left text-stone-700">Estado</th>
                <th className="p-2 text-left text-stone-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((p) => {
                const stockActual = stockMap[p.id] ?? 0;
                const esCritico = stockActual < (p.stock_minimo || 0);
                return (
                  <tr key={p.id} className="border-b border-stone-100">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={seleccionados.includes(p.id)}
                        onChange={() => toggleSeleccion(p.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-2 text-stone-800 font-medium">{p.nombre}</td>
                    <td className="p-2 text-stone-600">{p.categoria}</td>
                    <td className="p-2 font-medium text-stone-800">{stockActual}</td>
                    <td className="p-2 text-stone-600">{p.stock_minimo || 0}</td>
                    <td className="p-2 text-stone-600">{p.proveedor || "-"}</td>
                    <td className="p-2 text-stone-600">{p.observaciones || ""}</td>
                    <td className="p-2">
                      {esCritico ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          Por debajo
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          OK
                        </span>
                      )}
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
                );
              })}
              {productosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-stone-500">
                    No hay productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">
              {editando ? "Editar Producto" : "Nuevo Producto"}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre *"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="text"
                placeholder="Categoría *"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="number"
                placeholder="Precio"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: parseFloat(e.target.value) || 0 })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="number"
                placeholder="Stock"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="number"
                placeholder="Stock mínimo"
                value={form.stock_minimo}
                onChange={(e) => setForm({ ...form, stock_minimo: parseInt(e.target.value) || 0 })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="text"
                placeholder="Proveedor"
                value={form.proveedor}
                onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="text"
                placeholder="Observaciones"
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="text"
                placeholder="Unidad (ej. kg, L, unidad)"
                value={form.unidad}
                onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <select
                value={form.tipo_unidad}
                onChange={(e) => setForm({ ...form, tipo_unidad: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              >
                <option value="unidad">Unidad</option>
                <option value="kilogramo">Kilogramo</option>
                <option value="gramo">Gramo</option>
                <option value="libra">Libra</option>
                <option value="litro">Litro</option>
                <option value="mililitro">Mililitro</option>
              </select>
              <input
                type="text"
                placeholder="Icono (emoji)"
                value={form.icono}
                onChange={(e) => setForm({ ...form, icono: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                maxLength={2}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
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
