"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  Download,
  Plus,
  Edit,
  Trash2,
  Search,
} from "lucide-react";
import * as XLSX from "xlsx";

const estadoInicialForm = {
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
  sku: "",
  descripcion: "",
  fecha_caducidad: "",
  ubicacion: "",
  imagen_url: "",
};

export default function ComprasPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant") || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";
  const negocioSlug = searchParams.get("slug") || "restaurante";
  const categoriaNegocio = "";

  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [proveedor, setProveedor] = useState("");
  const [metodoPago, setMetodoPago] = useState("contado");
  const [mensaje, setMensaje] = useState("");
  const [titulo, setTitulo] = useState('Compras');

  // Modal CRUD
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({ ...estadoInicialForm });

  // Obtener título del negocio
  useEffect(() => {
    const getTitulo = async () => {
      try {
        const res = await fetch(`/api/business-config?tenant=${tenantId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setTitulo(data.data.nombre_negocio || 'Compras');
        }
      } catch (e) {}
    };
    getTitulo();
  }, [tenantId]);

  const cargarDatos = async () => {
    setLoading(true);
    const url = `/api/products?tenant=${tenantId}&categoria=${encodeURIComponent(categoriaNegocio)}`;
    const resProd = await fetch(url);
    const dataProd = await resProd.json();
    if (dataProd.success) setProductos(dataProd.data || []);

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
    setMensaje("");
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId, categoriaNegocio]);

  const proveedores = [...new Set(productos.map((p) => p.proveedor).filter(Boolean))];

  const productosCriticos = productos.filter((p) => {
    const stockActual = stockMap[p.id] ?? 0;
    const minimo = p.stock_minimo || 0;
    return stockActual < minimo;
  });

  const productosFiltrados = productos.filter((p) => {
    if (filtroProveedor && p.proveedor !== filtroProveedor) return false;
    if (searchTerm && !p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) && !(p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))) return false;
    return true;
  });

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ============================================
  // FUNCIÓN PARA REGISTRAR LA COMPRA
  // ============================================
  const registrarCompra = async () => {
    if (seleccionados.length === 0) {
      alert("Selecciona al menos un producto.");
      return;
    }

    const items = seleccionados.map((id) => {
      const p = productos.find((prod) => prod.id === id);
      if (!p) return null;
      const stockActual = stockMap[p.id] ?? 0;
      const cantidad = Math.max((p.stock_minimo || 0) - stockActual, 0);
      if (cantidad === 0) return null;
      return {
        producto_id: p.id,
        cantidad: cantidad,
        precio_compra: p.precio_compra || 0,
      };
    }).filter(Boolean);

    if (items.length === 0) {
      alert("No hay productos con cantidad a comprar (stock ya es suficiente).");
      return;
    }

    const body = {
      tenant_id: tenantId,
      proveedor: proveedor || "Proveedor general",
      metodo_pago: metodoPago,
      fecha: new Date().toISOString().split("T")[0],
      items: items,
    };

    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMensaje(`✅ Compra #${data.data.compra.id} registrada exitosamente.`);
        setSeleccionados([]);
        cargarDatos();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };

  // ============================================
  // GENERAR ORDEN DE COMPRA (EXCEL)
  // ============================================
  const generarOrdenCompra = () => {
    if (seleccionados.length === 0) {
      alert("Selecciona al menos un producto.");
      return;
    }

    const data = seleccionados.map((id) => {
      const p = productos.find((prod) => prod.id === id);
      if (!p) return null;
      const stockActual = stockMap[p.id] ?? 0;
      return {
        Producto: p.nombre,
        "Stock Actual": stockActual,
        "Mínimo Requerido": p.stock_minimo || 0,
        "Cantidad a Comprar": Math.max((p.stock_minimo || 0) - stockActual, 0),
        Proveedor: p.proveedor || "",
        "Precio Compra": p.precio_compra || 0,
        Observaciones: p.observaciones || "",
      };
    }).filter(Boolean);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "OrdenCompra");
    XLSX.writeFile(wb, `orden_compra_${new Date().toISOString().slice(0,10)}.xlsx`);
    alert(`📦 Orden de compra generada con ${data.length} productos.`);
  };

  // ============================================
  // EXPORTAR INVENTARIO (Excel)
  // ============================================
  const descargarInventarioCompleto = () => {
    const data = productos.map((p) => ({
      Nombre: p.nombre,
      SKU: p.sku || "",
      "Stock Actual": stockMap[p.id] ?? 0,
      "Stock Mínimo": p.stock_minimo || 0,
      Unidad: p.unidad || "",
      Proveedor: p.proveedor || "",
      "Precio Venta": p.precio || 0,
      "Precio Compra": p.precio_compra || 0,
      Observaciones: p.observaciones || "",
      Imagen: p.imagen_url || "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `inventario_completo_${negocioSlug}.xlsx`);
  };

  // ============================================
  // SUBIR IMAGEN
  // ============================================
  const subirImagen = async () => {
    if (!imageFile) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("tenant_id", tenantId);
    try {
      const res = await fetch("/api/upload/product-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setForm((prev) => ({ ...prev, imagen_url: data.url }));
        setImageFile(null);
        alert("✅ Imagen subida correctamente");
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Error de conexión");
    }
    setUploadingImage(false);
  };

  // ============================================
  // CRUD DE PRODUCTOS (CON TODOS LOS CAMPOS)
  // ============================================
  const guardarProducto = async () => {
    const url = "/api/products";
    const method = editando ? "PUT" : "POST";
    
    // Preparar body
    let body: any = { ...form, tenant_id: tenantId };
    if (editando) body.id = editando.id;
    
    // Convertir fecha_caducidad vacío a null
    if (body.fecha_caducidad === "") body.fecha_caducidad = null;
    
    // Asegurar valores numéricos
    body.precio = parseFloat(body.precio) || 0;
    body.precio_compra = parseFloat(body.precio_compra) || 0;
    body.stock = parseInt(body.stock) || 0;
    body.stock_minimo = parseInt(body.stock_minimo) || 0;
    body.stock_maximo = parseInt(body.stock_maximo) || 0;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      setEditando(null);
      setForm({ ...estadoInicialForm });
      setImageFile(null);
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
      nombre: p.nombre || "",
      categoria: p.categoria || "",
      precio: p.precio || 0,
      precio_compra: p.precio_compra || 0,
      stock: p.stock || 0,
      stock_minimo: p.stock_minimo || 0,
      stock_maximo: p.stock_maximo || 0,
      proveedor: p.proveedor || "",
      observaciones: p.observaciones || "",
      unidad: p.unidad || "unidad",
      tipo_unidad: p.tipo_unidad || "unidad",
      sku: p.sku || "",
      descripcion: p.descripcion || "",
      fecha_caducidad: p.fecha_caducidad || "",
      ubicacion: p.ubicacion || "",
      imagen_url: p.imagen_url || "",
    });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <BackButton />
        <h1 className="text-xl font-bold text-stone-800">Compras</h1>
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
          <span className="text-xs hidden sm:inline">Exportar Inv.</span>
        </button>
        <button
          onClick={generarOrdenCompra}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <ShoppingBag className="w-4 h-4" /> Generar Orden
        </button>
        <button
          onClick={registrarCompra}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
          title="Registrar compra y actualizar inventario"
        >
          <Plus className="w-4 h-4" /> Registrar Compra
        </button>
        <button
          onClick={() => {
            setEditando(null);
            setForm({ ...estadoInicialForm });
            setShowModal(true);
          }}
          className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Nuevo Producto
        </button>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        {mensaje && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-4 text-emerald-700 font-medium">
            {mensaje}
          </div>
        )}

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

        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-xl text-sm text-stone-800"
            />
          </div>

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

          <input
            type="text"
            placeholder="Proveedor de esta compra"
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
            className="border border-stone-300 rounded-xl px-3 py-1.5 text-sm text-stone-800 flex-1 min-w-[150px]"
          />
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="border border-stone-300 rounded-xl px-3 py-1.5 text-sm text-stone-800"
          >
            <option value="contado">Contado</option>
            <option value="credito">Crédito</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="p-2 text-left text-stone-700">Seleccionar</th>
                <th className="p-2 text-left text-stone-700">SKU</th>
                <th className="p-2 text-left text-stone-700">Nombre</th>
                <th className="p-2 text-left text-stone-700">Stock actual</th>
                <th className="p-2 text-left text-stone-700">Mínimo</th>
                <th className="p-2 text-left text-stone-700">Proveedor</th>
                <th className="p-2 text-left text-stone-700">Precio Venta</th>
                <th className="p-2 text-left text-stone-700">Precio Compra</th>
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
                    <td className="p-2 text-stone-600 font-mono text-xs">{p.sku || "-"}</td>
                    <td className="p-2 text-stone-800 font-medium">{p.nombre}</td>
                    <td className="p-2 font-medium text-stone-800">{stockActual}</td>
                    <td className="p-2 text-stone-600">{p.stock_minimo || 0}</td>
                    <td className="p-2 text-stone-600">{p.proveedor || "-"}</td>
                    <td className="p-2 text-stone-800">${p.precio?.toLocaleString()}</td>
                    <td className="p-2 text-stone-800">${(p.precio_compra || 0).toLocaleString()}</td>
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
                  <td colSpan={10} className="p-4 text-center text-stone-500">
                    No hay productos para este negocio
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD de producto (con todos los campos, sin icono) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">
              {editando ? `Editar producto: ${editando.nombre}` : "Nuevo Producto"}
            </h3>
            <div className="space-y-3">
              {/* Imagen */}
              <div>
                <label className="block text-sm font-medium text-stone-700">Imagen del producto</label>
                {form.imagen_url && (
                  <div className="mb-2">
                    <img src={form.imagen_url} alt="Producto" className="w-24 h-24 object-cover rounded-xl" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                    }
                  }}
                  className="w-full border border-stone-300 rounded-xl p-2 text-sm text-stone-800"
                />
                {imageFile && (
                  <button
                    type="button"
                    onClick={subirImagen}
                    disabled={uploadingImage}
                    className="mt-2 bg-blue-500 text-white px-4 py-1 rounded-xl text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    {uploadingImage ? "Subiendo..." : "Subir imagen"}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700">SKU (Código de Barras)</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="Ej. HAR-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Descripción</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="Ej. Harina de trigo 1kg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Categoría *</label>
                <input
                  type="text"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Precio Venta</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Precio Compra</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precio_compra}
                  onChange={(e) => setForm({ ...form, precio_compra: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Stock actual</label>
                <input
                  type="text"
                  value={stockMap[editando?.id] ?? 0}
                  disabled
                  className="w-full border border-stone-300 rounded-xl p-2 bg-stone-100 text-stone-600"
                />
                <p className="text-xs text-stone-600 mt-1">El stock se calcula automáticamente</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Stock mínimo</label>
                <input
                  type="number"
                  value={form.stock_minimo}
                  onChange={(e) => setForm({ ...form, stock_minimo: parseInt(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Stock máximo</label>
                <input
                  type="number"
                  value={form.stock_maximo}
                  onChange={(e) => setForm({ ...form, stock_maximo: parseInt(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Proveedor</label>
                <input
                  type="text"
                  value={form.proveedor}
                  onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Observaciones</label>
                <input
                  type="text"
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Unidad</label>
                <input
                  type="text"
                  value={form.unidad}
                  onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="kg, L, unidad, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Tipo de unidad</label>
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
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Fecha de caducidad</label>
                <input
                  type="date"
                  value={form.fecha_caducidad}
                  onChange={(e) => setForm({ ...form, fecha_caducidad: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Ubicación en almacén</label>
                <input
                  type="text"
                  value={form.ubicacion}
                  onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="Estante A1, Pasillo 2"
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
                onClick={guardarProducto}
                disabled={uploadingImage}
                className={`flex-1 py-2 rounded-xl text-white ${uploadingImage ? 'bg-stone-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'}`}
              >
                {uploadingImage ? 'Subiendo imagen...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
