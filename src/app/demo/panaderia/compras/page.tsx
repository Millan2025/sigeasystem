"use client";
import { NEGOCIOS } from '@/config/negocios';
import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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

export default function ComprasPage() {
  const pathname = usePathname();
  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[1] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const searchParams = useSearchParams();
  const tenantFromUrl = searchParams.get("tenant");
  const tenantId = tenantFromUrl || negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";
  const categoriaNegocio = negocio?.categoria || "";

  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [seleccionados, setSeleccionados] = useState<Record<string, { cantidad: number; proveedor: string }>>({});
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [proveedorGeneral, setProveedorGeneral] = useState("");
  const [metodoPago, setMetodoPago] = useState("contado");
  const [mensaje, setMensaje] = useState("");
  const [showResumen, setShowResumen] = useState(false);
  const [impuestos, setImpuestos] = useState({ iva: 0.19, retencion: 0, ica: 0.005, exento: false });

  const [showModal, setShowImportModal] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    precio: 0,
    precio_compra: 0,
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
    console.log("🔍 Iniciando carga de datos...");
    console.log("📌 tenantId:", tenantId);
    console.log("📌 categoriaNegocio:", categoriaNegocio);

    const url = `/api/products?tenant=${tenantId}`;
    console.log("🌐 URL de productos:", url);

    try {
      const resProd = await fetch(url);
      console.log("📦 Respuesta de productos (raw):", resProd.status, resProd.statusText);
      const dataProd = await resProd.json();
      console.log("📦 Datos de productos (parseados):", dataProd);

      if (dataProd.success) {
        console.log("✅ Productos cargados:", dataProd.data?.length || 0);
        if (dataProd.data && dataProd.data.length > 0) {
          console.log("📋 Primer producto:", dataProd.data[0]);
        }
        setProductos(dataProd.data || []);
      } else {
        console.error("❌ Error en la API de productos:", dataProd.error);
        setProductos([]);
      }
    } catch (error) {
      console.error("❌ Error al cargar productos:", error);
      setProductos([]);
    }

    try {
      const resStock = await fetch(`/api/inventory?tenant=${tenantId}&stock=true`);
      const dataStock = await resStock.json();
      console.log("📊 Stock recibido:", dataStock);
      if (dataStock.success) {
        const map: Record<string, number> = {};
        dataStock.data.forEach((s: any) => {
          map[s.id] = s.stock_actual;
        });
        setStockMap(map);
        console.log("📊 Mapa de stock actualizado:", Object.keys(map).length, "productos");
      }
    } catch (error) {
      console.error("❌ Error al cargar stock:", error);
    }

    setLoading(false);
    setMensaje("");
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId, categoriaNegocio]);

  useEffect(() => {
    console.log("🔄 productos actualizados:", productos.length);
    if (productos.length > 0) {
      console.log("📋 Primer producto:", productos[0]);
    }
  }, [productos]);

  const proveedores = [...new Set(productos.map((p) => p.proveedor).filter(Boolean))];

  const productosCriticos = productos.filter((p) => {
    const stockActual = stockMap[p.id] ?? 0;
    const minimo = p.stock_minimo || 0;
    return stockActual < minimo;
  });

  const productosFiltrados = productos.filter((p) => {
    if (filtroProveedor && p.proveedor !== filtroProveedor) return false;
    return true;
  });

  useEffect(() => {
    console.log("🔄 productosFiltrados actualizados:", productosFiltrados.length);
    if (productosFiltrados.length > 0) {
      console.log("📋 Primer producto filtrado:", productosFiltrados[0]);
    }
  }, [productos, filtroProveedor]);

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const newState = { ...prev };
      if (newState[id] !== undefined) {
        delete newState[id];
      } else {
        const p = productos.find(prod => prod.id === id);
        if (p) {
          const stockActual = stockMap[p.id] ?? 0;
          const cantidad = Math.max((p.stock_minimo || 0) - stockActual, 1);
          newState[id] = { cantidad, proveedor: p.proveedor || "" };
        }
      }
      return newState;
    });
  };

  const actualizarCantidad = (id: string, cantidad: number) => {
    if (cantidad < 1) {
      const newState = { ...seleccionados };
      delete newState[id];
      setSeleccionados(newState);
      return;
    }
    setSeleccionados((prev) => ({
      ...prev,
      [id]: { ...prev[id], cantidad },
    }));
  };

  const actualizarProveedor = (id: string, proveedor: string) => {
    setSeleccionados((prev) => ({
      ...prev,
      [id]: { ...prev[id], proveedor },
    }));
  };

  const calcularTotales = () => {
    let subtotal = 0;
    const items = Object.entries(seleccionados).map(([id, { cantidad, proveedor }]) => {
      const p = productos.find(prod => prod.id === id);
      if (!p) return null;
      const precioCompra = p.precio_compra || 0;
      subtotal += cantidad * precioCompra;
      return {
        producto_id: id,
        cantidad: cantidad,
        precio_compra: precioCompra,
        nombre: p.nombre,
        descripcion: p.descripcion || "",
        proveedor: proveedor || p.proveedor || "",
      };
    }).filter(Boolean);

    const tasaIVA = impuestos.exento ? 0 : impuestos.iva;
    const tasaRetencion = impuestos.retencion;
    const tasaICA = impuestos.ica;

    const iva = subtotal * tasaIVA;
    const retencion = subtotal * tasaRetencion;
    const ica = subtotal * tasaICA;
    const total_con_impuestos = subtotal + iva - retencion + ica;

    return { items, subtotal, iva, retencion, ica, total_con_impuestos };
  };

  const registrarCompra = async () => {
    const { items, subtotal, iva, retencion, ica, total_con_impuestos } = calcularTotales();

    if (items.length === 0) {
      alert("Selecciona al menos un producto.");
      return;
    }

    if (!proveedorGeneral) {
      alert("Ingresa el nombre del proveedor general.");
      return;
    }

    const body = {
      tenant_id: tenantId,
      proveedor: proveedorGeneral,
      metodo_pago: metodoPago,
      fecha: new Date().toISOString().split("T")[0],
      items: items,
      subtotal: subtotal,
      iva: iva,
      retencion: retencion,
      ica: ica,
      total_con_impuestos: total_con_impuestos,
    };

    console.log("📤 Enviando compra:", body);

    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log("📥 Respuesta de la API:", data);
      if (data.success) {
        setMensaje(`✅ Compra #${data.data.compra.id.slice(0, 6)} registrada exitosamente. Total: $${total_con_impuestos.toLocaleString()}`);
        setSeleccionados({});
        setShowResumen(false);
        cargarDatos();
        setTimeout(() => setMensaje(""), 8000);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("❌ Error de conexión:", error);
      alert("Error de conexión");
    }
  };

  const generarOrdenCompra = () => {
    const items = Object.entries(seleccionados).map(([id, { cantidad }]) => {
      const p = productos.find((prod) => prod.id === id);
      if (!p) return null;
      const stockActual = stockMap[p.id] ?? 0;
      return {
        Producto: p.nombre,
        "Stock Actual": stockActual,
        "Mínimo Requerido": p.stock_minimo || 0,
        "Cantidad a Comprar": cantidad,
        Proveedor: p.proveedor || "",
        "Precio Compra": p.precio_compra || 0,
        Observaciones: p.observaciones || "",
      };
    }).filter(Boolean);

    if (items.length === 0) {
      alert("Selecciona al menos un producto.");
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(items);
    XLSX.utils.book_append_sheet(wb, ws, "OrdenCompra");
    XLSX.writeFile(wb, `orden_compra_${new Date().toISOString().slice(0, 10)}.xlsx`);
    alert(`📄 Orden de compra generada con ${items.length} productos.`);
  };

  const descargarInventarioCompleto = () => {
    const data = productos.map((p) => ({
      Nombre: p.nombre,
      "Stock Actual": stockMap[p.id] ?? 0,
      "Stock Mínimo": p.stock_minimo || 0,
      Unidad: p.unidad || "",
      Proveedor: p.proveedor || "",
      "Precio Venta": p.precio || 0,
      "Precio Compra": p.precio_compra || 0,
      Observaciones: p.observaciones || "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `inventario_completo_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

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
      setShowImportModal(false);
      setEditando(null);
      setForm({ nombre: "", categoria: "", precio: 0, precio_compra: 0, stock: 0, stock_minimo: 0, proveedor: "", observaciones: "", unidad: "unidad", tipo_unidad: "unidad", icono: "📦" });
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
      precio_compra: p.precio_compra || 0,
      stock: p.stock || 0,
      stock_minimo: p.stock_minimo || 0,
      proveedor: p.proveedor || "",
      observaciones: p.observaciones || "",
      unidad: p.unidad || "unidad",
      tipo_unidad: p.tipo_unidad || "unidad",
      icono: p.icono || "📦",
    });
    setShowImportModal(true);
  };

  const totalSeleccionados = Object.keys(seleccionados).length;
  const { subtotal, iva, retencion, ica, total_con_impuestos } = calcularTotales();

  console.log("🎯 Estado actual - productos:", productos.length, "productosFiltrados:", productosFiltrados.length);

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
          <span className="text-xs hidden sm:inline">Exportar Inv.</span>
        </button>
        <button
          onClick={generarOrdenCompra}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <ShoppingBag className="w-4 h-4" /> Generar Orden
        </button>
        <button
          onClick={() => setShowResumen(true)}
          className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1 ${
            totalSeleccionados > 0 ? 'bg-emerald-500 text-white' : 'bg-stone-300 text-stone-500 cursor-not-allowed'
          }`}
          disabled={totalSeleccionados === 0}
          title="Ver resumen de compra"
        >
          <Plus className="w-4 h-4" /> Ver Resumen ({totalSeleccionados})
        </button>
        <button
          onClick={() => {
            setEditando(null);
            setForm({ nombre: "", categoria: "", precio: 0, precio_compra: 0, stock: 0, stock_minimo: 0, proveedor: "", observaciones: "", unidad: "unidad", tipo_unidad: "unidad", icono: "📦" });
            setShowImportModal(true);
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
          <p
            className={`font-medium ${
              productosCriticos.length > 0 ? "text-red-700" : "text-emerald-700"
            }`}
          >
            {productosCriticos.length > 0
              ? `⚠️ ${productosCriticos.length} productos con stock por debajo del mínimo`
              : "✅ Todos los productos tienen stock adecuado"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center mb-4">
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
            placeholder="Proveedor general *"
            value={proveedorGeneral}
            onChange={(e) => setProveedorGeneral(e.target.value)}
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

          <span className="text-sm text-stone-600">
            Seleccionados: <strong>{totalSeleccionados}</strong> | Total: <strong>${total_con_impuestos.toLocaleString()}</strong>
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="p-2 text-left text-stone-700">Seleccionar</th>
                <th className="p-2 text-left text-stone-700">Nombre</th>
                <th className="p-2 text-left text-stone-700">Stock actual</th>
                <th className="p-2 text-left text-stone-700">Mínimo</th>
                <th className="p-2 text-left text-stone-700">Cant. a Comprar</th>
                <th className="p-2 text-left text-stone-700">Proveedor</th>
                <th className="p-2 text-left text-stone-700">Precio Compra</th>
                <th className="p-2 text-left text-stone-700">Subtotal</th>
                <th className="p-2 text-left text-stone-700">Estado</th>
                <th className="p-2 text-left text-stone-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((p) => {
                const stockActual = stockMap[p.id] ?? 0;
                const esCritico = stockActual < (p.stock_minimo || 0);
                const cantidadSugerida = Math.max((p.stock_minimo || 0) - stockActual, 0);
                const seleccion = seleccionados[p.id];
                const cantidad = seleccion?.cantidad || 0;
                const subtotalItem = cantidad * (p.precio_compra || 0);

                return (
                  <tr key={p.id} className="border-b border-stone-100">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={seleccionados[p.id] !== undefined}
                        onChange={() => toggleSeleccion(p.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-2 text-stone-800 font-medium">{p.nombre}</td>
                    <td className="p-2 font-medium text-stone-800">{stockActual}</td>
                    <td className="p-2 text-stone-600">{p.stock_minimo || 0}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        value={cantidad || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (val > 0) {
                            actualizarCantidad(p.id, val);
                          } else {
                            const newState = { ...seleccionados };
                            delete newState[p.id];
                            setSeleccionados(newState);
                          }
                        }}
                        className="w-20 border border-stone-300 rounded-xl px-2 py-1 text-sm text-stone-800"
                        placeholder="0"
                        disabled={seleccionados[p.id] === undefined}
                      />
                      {cantidadSugerida > 0 && seleccionados[p.id] === undefined && (
                        <span className="text-xs text-stone-400 ml-1">Sug: {cantidadSugerida}</span>
                      )}
                    </td>
                    <td className="p-2">
                      <select
                        value={seleccion?.proveedor || p.proveedor || ""}
                        onChange={(e) => actualizarProveedor(p.id, e.target.value)}
                        className="border border-stone-300 rounded-xl px-2 py-1 text-sm text-stone-800 w-full"
                        disabled={seleccionados[p.id] === undefined}
                      >
                        <option value="">Sin proveedor</option>
                        {proveedores.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 text-stone-800">${(p.precio_compra || 0).toLocaleString()}</td>
                    <td className="p-2 text-stone-800">${subtotalItem.toLocaleString()}</td>
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

      {showResumen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Resumen de Compra</h3>
              <button onClick={() => setShowResumen(false)} className="text-stone-500 hover:text-stone-700">
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            {Object.entries(seleccionados).length === 0 ? (
              <p className="text-stone-500 text-center py-4">No hay productos seleccionados</p>
            ) : (
              <>
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                  {Object.entries(seleccionados).map(([id, { cantidad, proveedor }]) => {
                    const p = productos.find(prod => prod.id === id);
                    if (!p) return null;
                    const precio = p.precio_compra || 0;
                    return (
                      <div key={id} className="flex justify-between text-sm border-b py-1">
                        <span className="text-stone-700">
                          {p.nombre} {p.descripcion ? `(${p.descripcion})` : ''} x {cantidad}
                          {proveedor && <span className="text-xs text-stone-400 ml-1">({proveedor})</span>}
                        </span>
                        <span className="font-medium text-stone-800">${(cantidad * precio).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-3 mt-2 mb-3 space-y-2">
                  <h4 className="text-sm font-semibold text-stone-700">Ajustar impuestos</h4>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <label className="text-sm text-stone-600 w-16">IVA (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={impuestos.iva * 100}
                        onChange={(e) => setImpuestos({ ...impuestos, iva: parseFloat(e.target.value) / 100 || 0 })}
                        className={`w-20 border border-stone-300 rounded-xl px-2 py-1 text-sm text-stone-800 ${impuestos.exento ? 'bg-stone-100 text-stone-400' : ''}`}
                        disabled={impuestos.exento}
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <label className="text-sm text-stone-600 w-16">Retención (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={impuestos.retencion * 100}
                        onChange={(e) => setImpuestos({ ...impuestos, retencion: parseFloat(e.target.value) / 100 || 0 })}
                        className="w-20 border border-stone-300 rounded-xl px-2 py-1 text-sm text-stone-800"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <label className="text-sm text-stone-600 w-16">ICA (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={impuestos.ica * 100}
                        onChange={(e) => setImpuestos({ ...impuestos, ica: parseFloat(e.target.value) / 100 || 0 })}
                        className="w-20 border border-stone-300 rounded-xl px-2 py-1 text-sm text-stone-800"
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <label className="text-sm text-stone-600 flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={impuestos.exento}
                          onChange={(e) => setImpuestos({ ...impuestos, exento: e.target.checked })}
                          className="w-4 h-4"
                        />
                        Exento de IVA
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-800 font-medium">Subtotal</span>
                    <span className="font-medium text-stone-800">${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-800 font-medium">IVA ({Math.round(impuestos.iva * 100)}%)</span>
                    <span className="font-medium text-stone-800">${iva.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-800 font-medium">Retención ({Math.round(impuestos.retencion * 100)}%)</span>
                    <span className="font-medium text-stone-800">${retencion.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-800 font-medium">ICA ({Math.round(impuestos.ica * 100)}%)</span>
                    <span className="font-medium text-stone-800">${ica.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span className="text-stone-800">Total</span>
                    <span className="text-emerald-700">${total_con_impuestos.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowResumen(false)}
                    className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700 hover:bg-stone-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={registrarCompra}
                    className="flex-1 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600"
                  >
                    Confirmar Compra
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-stone-800 mb-4">
              {editando ? `Editar producto: ${editando.nombre}` : "Nuevo Producto"}
            </h3>
            <div className="space-y-3">
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
                <label className="block text-sm font-medium text-stone-700">Icono (emoji)</label>
                <input
                  type="text"
                  value={form.icono}
                  onChange={(e) => setForm({ ...form, icono: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  maxLength={2}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
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