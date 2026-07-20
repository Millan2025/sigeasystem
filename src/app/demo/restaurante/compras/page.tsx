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
  X,
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
  exento_iva: false,
};

interface Producto {
  id: string;
  nombre: string;
  sku?: string;
  precio?: number;
  precio_compra?: number;
  stock_minimo?: number;
  stock_maximo?: number;
  proveedor?: string;
  observaciones?: string;
  unidad?: string;
  tipo_unidad?: string;
  descripcion?: string;
  fecha_caducidad?: string;
  ubicacion?: string;
  imagen_url?: string;
  categoria?: string;
  stock?: number;
  exento_iva?: boolean;
}

export default function ComprasPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant") || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";
  const negocioSlug = searchParams.get("slug") || "restaurante";
  const categoriaNegocio = "";

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [proveedor, setProveedor] = useState("");
  const [metodoPago, setMetodoPago] = useState("contado");
  const [mensaje, setMensaje] = useState("");

  const [ivaPorcentaje, setIvaPorcentaje] = useState(19);
  const [retencionPorcentaje, setRetencionPorcentaje] = useState(2.5);
  const [icaPorcentaje, setIcaPorcentaje] = useState(0.5);

  const [resumenContable, setResumenContable] = useState({
    subtotal: 0,
    iva: 0,
    retencion: 0,
    ica: 0,
    total: 0,
  });

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({ ...estadoInicialForm });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    items: { producto_id: string; cantidad: number; precio_compra: number; nombre: string }[];
    proveedor: string;
    metodo_pago: string;
    total: number;
  }>({
    items: [],
    proveedor: "",
    metodo_pago: "contado",
    total: 0,
  });

  const actualizarResumenContable = () => {
    if (seleccionados.length === 0) {
      setResumenContable({ subtotal: 0, iva: 0, retencion: 0, ica: 0, total: 0 });
      return;
    }

    let subtotal = 0;
    let ivaTotal = 0;

    seleccionados.forEach((id) => {
      const p = productos.find((prod) => prod.id === id);
      if (!p) return;
      const stockActual = stockMap[p.id] ?? 0;
      const cantidad = Math.max((p.stock_maximo || 0) - stockActual, 0);
      if (cantidad <= 0) return;
      const precioCompra = p.precio_compra || 0;
      const subtotalProducto = cantidad * precioCompra;
      subtotal += subtotalProducto;
      
      if (!p.exento_iva) {
        ivaTotal += subtotalProducto * (ivaPorcentaje / 100);
      }
    });

    const retencion = subtotal * (retencionPorcentaje / 100);
    const ica = subtotal * (icaPorcentaje / 100);
    const total = subtotal + ivaTotal - retencion - ica;

    setResumenContable({ subtotal, iva: ivaTotal, retencion, ica, total });
  };

  useEffect(() => {
    actualizarResumenContable();
  }, [seleccionados, productos, stockMap, ivaPorcentaje, retencionPorcentaje, icaPorcentaje]);

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

  const prepararConfirmacion = () => {
    if (seleccionados.length === 0) {
      alert("Selecciona al menos un producto.");
      return;
    }

    const items = seleccionados.map((id) => {
      const p = productos.find((prod) => prod.id === id);
      if (!p) return null;
      const stockActual = stockMap[p.id] ?? 0;
      const cantidad = Math.max((p.stock_maximo || 0) - stockActual, 0);
      if (cantidad === 0) return null;
      return {
        producto_id: p.id,
        cantidad: cantidad,
        precio_compra: p.precio_compra || 0,
        nombre: p.nombre,
      };
    }).filter(Boolean) as { producto_id: string; cantidad: number; precio_compra: number; nombre: string }[];

    if (items.length === 0) {
      alert("Todos los productos seleccionados ya tienen stock máximo.");
      return;
    }

    const total = items.reduce((sum, item) => sum + (item.cantidad * item.precio_compra), 0);

    setConfirmData({
      items,
      proveedor: proveedor || "Proveedor general",
      metodo_pago: metodoPago,
      total,
    });
    setShowConfirmModal(true);
  };

  const confirmarCompra = async () => {
    const mensajeConfirmacion = `
      📋 Resumen de la compra:
      • Subtotal: $${resumenContable.subtotal.toLocaleString()}
      • IVA: $${resumenContable.iva.toLocaleString()}
      • Retención: -$${resumenContable.retencion.toLocaleString()}
      • ICA: -$${resumenContable.ica.toLocaleString()}
      • Total a pagar: $${resumenContable.total.toLocaleString()}
      
      ¿Confirmas esta compra?
    `;

    if (!confirm(mensajeConfirmacion)) {
      return;
    }

    const body = {
      tenant_id: tenantId,
      proveedor: confirmData.proveedor,
      metodo_pago: confirmData.metodo_pago,
      fecha: new Date().toISOString().split("T")[0],
      items: confirmData.items.map((item) => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_compra: item.precio_compra,
      })),
    };

    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMensaje(`✅ Compra #${data.data.compra.id} registrada exitosamente. Total: $${resumenContable.total.toLocaleString()}`);
        setSeleccionados([]);
        setShowConfirmModal(false);
        cargarDatos();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };

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
        SKU: p.sku || "",
        "Stock Actual": stockActual,
        "Máximo Requerido": p.stock_maximo || 0,
        "Cantidad a Comprar": Math.max((p.stock_maximo || 0) - stockActual, 0),
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

  const descargarInventarioCompleto = () => {
    const data = productos.map((p) => ({
      Nombre: p.nombre,
      SKU: p.sku || "",
      "Stock Actual": stockMap[p.id] ?? 0,
      "Stock Mínimo": p.stock_minimo || 0,
      "Stock Máximo": p.stock_maximo || 0,
      Unidad: p.unidad || "",
      Proveedor: p.proveedor || "",
      "Precio Venta": p.precio || 0,
      "Precio Compra": p.precio_compra || 0,
      Observaciones: p.observaciones || "",
      Imagen: p.imagen_url || "",
      "Exento IVA": p.exento_iva ? "Sí" : "No",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `inventario_completo_${negocioSlug}.xlsx`);
  };

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

  const guardarProducto = async () => {
    const url = "/api/products";
    const method = editando ? "PUT" : "POST";
    
    let body: any = { ...form, tenant_id: tenantId };
    if (editando) body.id = editando.id;
    
    if (body.fecha_caducidad === "") body.fecha_caducidad = null;
    
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
      exento_iva: p.exento_iva || false,
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
          <RefreshCw className="w-5 h-5 text-stone-900" />
        </button>
        <button
          onClick={descargarInventarioCompleto}
          className="p-2 hover:bg-stone-100 rounded-xl flex items-center gap-1 text-stone-900"
          title="Descargar inventario completo"
        >
          <Download className="w-5 h-5" />
          <span className="text-xs hidden sm:inline">Exportar Inv.</span>
        </button>
        <button
          onClick={generarOrdenCompra}
          className="bg-blue-1000 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"
        >
          <ShoppingBag className="w-4 h-4" /> Generar Orden
        </button>
        <button
          onClick={prepararConfirmacion}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Registrar Compra
        </button>
        <button
          onClick={() => {
            setEditando(null);
            setForm({ ...estadoInicialForm });
            setShowModal(true);
          }}
          className="bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Nuevo Producto
        </button>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        {mensaje && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mb-4 text-emerald-700 font-bold">
            {mensaje}
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-4">
          <h3 className="font-semibold text-stone-800 mb-2">⚖️ Configuración contable</h3>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-stone-900">IVA (%)</label>
              <input
                type="number"
                value={ivaPorcentaje}
                onChange={(e) => setIvaPorcentaje(parseFloat(e.target.value) || 0)}
                className="w-20 border border-stone-300 rounded-xl px-2 py-1 text-sm"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-900">Retención (%)</label>
              <input
                type="number"
                value={retencionPorcentaje}
                onChange={(e) => setRetencionPorcentaje(parseFloat(e.target.value) || 0)}
                className="w-20 border border-stone-300 rounded-xl px-2 py-1 text-sm"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-900">ICA (%)</label>
              <input
                type="number"
                value={icaPorcentaje}
                onChange={(e) => setIcaPorcentaje(parseFloat(e.target.value) || 0)}
                className="w-20 border border-stone-300 rounded-xl px-2 py-1 text-sm"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {seleccionados.length > 0 && (
          <div className="bg-blue-100 border border-blue-300 rounded-2xl p-4 mb-4">
            <h4 className="font-semibold text-stone-800 mb-2">📊 Resumen de la compra</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              <div>
                <span className="text-stone-900">Subtotal</span>
                <p className="font-bold text-stone-800">${resumenContable.subtotal.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-stone-900">IVA</span>
                <p className="font-bold text-stone-800">${resumenContable.iva.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-stone-900">Retención</span>
                <p className="font-bold text-stone-800">-${resumenContable.retencion.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-stone-900">ICA</span>
                <p className="font-bold text-stone-800">-${resumenContable.ica.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-stone-900 font-bold">Total a pagar</span>
                <p className="font-bold text-emerald-700">${resumenContable.total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

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
                <th className="p-2 text-left text-stone-900">Seleccionar</th>
                <th className="p-2 text-left text-stone-900">SKU</th>
                <th className="p-2 text-left text-stone-900">Nombre</th>
                <th className="p-2 text-left text-stone-900">Stock actual</th>
                <th className="p-2 text-left text-stone-900">Mínimo</th>
                <th className="p-2 text-left text-stone-900">Máximo</th>
                <th className="p-2 text-left text-stone-900">Proveedor</th>
                <th className="p-2 text-left text-stone-900">Precio Venta</th>
                <th className="p-2 text-left text-stone-900">Precio Compra</th>
                <th className="p-2 text-left text-stone-900">Exento IVA</th>
                <th className="p-2 text-left text-stone-900">Estado</th>
                <th className="p-2 text-left text-stone-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((p) => {
                const stockActual = stockMap[p.id] ?? 0;
                const esCritico = stockActual < (p.stock_minimo || 0);
                const estaMaximo = stockActual >= (p.stock_maximo || 999999);
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
                    <td className="p-2 text-stone-900 font-mono text-xs">{p.sku || "-"}</td>
                    <td className="p-2 text-stone-800 font-bold">{p.nombre}</td>
                    <td className="p-2 font-bold text-stone-800">{stockActual}</td>
                    <td className="p-2 text-stone-900">{p.stock_minimo || 0}</td>
                    <td className="p-2 text-stone-900">{p.stock_maximo || 0}</td>
                    <td className="p-2 text-stone-900">{p.proveedor || "-"}</td>
                    <td className="p-2 text-stone-800">${p.precio?.toLocaleString()}</td>
                    <td className="p-2 text-stone-800">${(p.precio_compra || 0).toLocaleString()}</td>
                    <td className="p-2 text-stone-900">{p.exento_iva ? "Sí" : "No"}</td>
                    <td className="p-2">
                      {esCritico ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                          Por debajo
                        </span>
                      ) : estaMaximo ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                          Máximo
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="p-2 flex gap-2">
                      <button onClick={() => editarProducto(p)} className="p-1 hover:bg-stone-100 rounded">
                        <Edit className="w-4 h-4 text-stone-900" />
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
                  <td colSpan={12} className="p-4 text-center text-stone-500">
                    No hay productos para este negocio
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD de producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">
              {editando ? `Editar producto: ${editando.nombre}` : "Nuevo Producto"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-stone-900">Imagen del producto</label>
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
                    className="mt-2 bg-blue-1000 text-white px-4 py-1 rounded-xl text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    {uploadingImage ? "Subiendo..." : "Subir imagen"}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-900">SKU</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="Ej. HAR-001"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900">Descripción</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="Ej. Harina de trigo 1kg"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900">Categoría *</label>
                <input
                  type="text"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900">Precio Venta</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900">Precio Compra</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.precio_compra}
                  onChange={(e) => setForm({ ...form, precio_compra: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900">Stock actual</label>
                <input
                  type="text"
                  value={stockMap[editando?.id] ?? 0}
                  disabled
                  className="w-full border border-stone-300 rounded-xl p-2 bg-stone-100 text-stone-900"
                />
                <p className="text-xs text-stone-900 mt-1">El stock se calcula automáticamente</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900">Stock mínimo</label>
                <input
                  type="number"
                  value={form.stock_minimo}
                  onChange={(e) => setForm({ ...form, stock_minimo: parseInt(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900">Stock máximo</label>
                <input
                  type="number"
                  value={form.stock_maximo}
                  onChange={(e) => setForm({ ...form, stock_maximo: parseInt(e.target.value) || 0 })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900">Proveedor</label>
                <input
                  type="text"
                  value={form.proveedor}
                  onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900">Observaciones</label>
                <input
                  type="text"
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900">Unidad</label>
                <input
                  type="text"
                  value={form.unidad}
                  onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="kg, L, unidad, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900">Tipo de unidad</label>
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
                <label className="block text-sm font-bold text-stone-900">Fecha de caducidad</label>
                <input
                  type="date"
                  value={form.fecha_caducidad}
                  onChange={(e) => setForm({ ...form, fecha_caducidad: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900">Ubicación en almacén</label>
                <input
                  type="text"
                  value={form.ubicacion}
                  onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="Estante A1, Pasillo 2"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.exento_iva || false}
                  onChange={(e) => setForm({ ...form, exento_iva: e.target.checked })}
                  className="w-4 h-4 rounded border-stone-300"
                />
                <label className="text-sm font-bold text-stone-900">Exento de IVA</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-900"
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

      {/* Modal de Confirmación de Compra */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Confirmar Compra</h3>
              <button onClick={() => setShowConfirmModal(false)} className="p-1 hover:bg-stone-100 rounded">
                <X className="w-5 h-5 text-stone-900" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-stone-900">Proveedor</label>
                <input
                  type="text"
                  value={confirmData.proveedor}
                  onChange={(e) => setConfirmData({ ...confirmData, proveedor: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-900">Método de Pago</label>
                <select
                  value={confirmData.metodo_pago}
                  onChange={(e) => setConfirmData({ ...confirmData, metodo_pago: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                >
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>

              <div className="border-t pt-3 mt-3">
                <h4 className="font-semibold text-stone-900 mb-2">Productos</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {confirmData.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col border-b border-stone-100 py-2">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-800 font-bold">{item.nombre}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-stone-900">Cantidad:</label>
                          <input
                            type="number"
                            min="0"
                            value={item.cantidad}
                            onChange={(e) => {
                              const newItems = [...confirmData.items];
                              newItems[idx].cantidad = parseInt(e.target.value) || 0;
                              const total = newItems.reduce((sum, i) => sum + (i.cantidad * i.precio_compra), 0);
                              setConfirmData({ ...confirmData, items: newItems, total });
                            }}
                            className="w-16 border border-stone-300 rounded-xl px-2 py-1 text-sm text-stone-800"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-stone-900">Precio:</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precio_compra}
                            onChange={(e) => {
                              const newItems = [...confirmData.items];
                              newItems[idx].precio_compra = parseFloat(e.target.value) || 0;
                              const total = newItems.reduce((sum, i) => sum + (i.cantidad * i.precio_compra), 0);
                              setConfirmData({ ...confirmData, items: newItems, total });
                            }}
                            className="w-20 border border-stone-300 rounded-xl px-2 py-1 text-sm text-stone-800"
                          />
                        </div>
                        <span className="font-bold text-emerald-700">
                          ${(item.cantidad * item.precio_compra).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-lg mt-3 pt-2 border-t">
                  <span>Total</span>
                  <span className="text-emerald-700">${confirmData.total.toLocaleString()}</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  * Los impuestos (IVA, retención, ICA) se calcularán al confirmar.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-900"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCompra}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-xl"
              >
                Confirmar Compra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


