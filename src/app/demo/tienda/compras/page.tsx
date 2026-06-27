"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ShoppingBag, Download } from "lucide-react";
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
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  const cargarDatos = () => {
    setLoading(true);
    // Obtener productos con stock y proveedor
    fetch(`/api/products?tenant=${tenantId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProductos(d.data || []);
          // También cargamos stock actualizado
          fetch(`/api/inventory?tenant=${tenantId}&stock=true`)
            .then((r) => r.json())
            .then((res) => {
              if (res.success) setStock(res.data || []);
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  // Obtener lista única de proveedores
  const proveedores = [...new Set(productos.map((p) => p.proveedor).filter(Boolean))];

  // Productos con stock por debajo del mínimo
  const productosCriticos = stock.filter((s: any) => {
    const prod = productos.find((p) => p.id === s.id);
    const minimo = prod?.stock_minimo || 0;
    return s.stock_actual < minimo;
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
      alert("Selecciona al menos un producto para generar la orden.");
      return;
    }
    const items = seleccionados
      .map((id) => {
        const p = productos.find((prod) => prod.id === id);
        if (!p) return null;
        return `• ${p.nombre} (Stock actual: ${
          stock.find((s) => s.id === id)?.stock_actual || 0
        }, Mínimo: ${p.stock_minimo || 0})`;
      })
      .filter(Boolean);

    alert(
      `📦 Orden de compra sugerida:\n\n${items.join("\n")}\n\n` +
        `📌 Proveedores involucrados: ${seleccionados
          .map((id) => {
            const p = productos.find((prod) => prod.id === id);
            return p?.proveedor || "Sin proveedor";
          })
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(", ")}`
    );
  };

  const descargarInventarioCompleto = () => {
    const data = stock.map((s: any) => {
      const p = productos.find((prod) => prod.id === s.id);
      return {
        Nombre: p?.nombre || "",
        Categoría: p?.categoria || "",
        "Stock Actual": s.stock_actual,
        "Stock Mínimo": p?.stock_minimo || 0,
        Unidad: p?.unidad || "",
        Proveedor: p?.proveedor || "",
        Precio: p?.precio || 0,
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `inventario_completo_${negocioSlug}.xlsx`);
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
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        {/* Resumen crítico */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-red-700 font-medium">
            ⚠️ {productosCriticos.length} productos con stock por debajo del mínimo
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
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          <h3 className="font-semibold text-stone-800 mb-3">Productos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="p-2 text-left text-stone-700">Seleccionar</th>
                  <th className="p-2 text-left text-stone-700">Nombre</th>
                  <th className="p-2 text-left text-stone-700">Categoría</th>
                  <th className="p-2 text-left text-stone-700">Stock actual</th>
                  <th className="p-2 text-left text-stone-700">Mínimo</th>
                  <th className="p-2 text-left text-stone-700">Proveedor</th>
                  <th className="p-2 text-left text-stone-700">Estado</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((p) => {
                  const stockActual =
                    stock.find((s) => s.id === p.id)?.stock_actual || 0;
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
                      <td className="p-2 text-stone-800">{p.nombre}</td>
                      <td className="p-2 text-stone-600">{p.categoria}</td>
                      <td className="p-2 font-medium text-stone-800">
                        {stockActual}
                      </td>
                      <td className="p-2 text-stone-600">{p.stock_minimo || 0}</td>
                      <td className="p-2 text-stone-600">{p.proveedor || "-"}</td>
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
                    </tr>
                  );
                })}
                {productosFiltrados.length === 0 && (
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
      </div>
    </div>
  );
}
