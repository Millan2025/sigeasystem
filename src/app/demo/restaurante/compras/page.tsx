"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ShoppingCart, CheckCircle } from "lucide-react";

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
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [filtroProveedor, setFiltroProveedor] = useState("");

  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[2] || "restaurante";
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantId = negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  const cargarDatos = () => {
    setLoading(true);
    fetch(`/api/products?tenant=${tenantId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProductos(d.data || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  // Productos que necesitan compra (stock <= stock_minimo)
  const productosRecomendados = productos.filter((p: any) => {
    const stockActual = p.stock || 0;
    const minimo = p.stock_minimo || 5;
    return stockActual <= minimo;
  });

  // Proveedores únicos de los productos recomendados
  const proveedores = [...new Set(productosRecomendados.map((p: any) => p.proveedor || "Sin proveedor"))];

  // Filtrar por proveedor
  const filtrados = productosRecomendados.filter((p: any) => {
    const prov = p.proveedor || "Sin proveedor";
    return filtroProveedor ? prov === filtroProveedor : true;
  });

  const toggleSeleccion = (id: string) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const generarOrdenCompra = () => {
    if (seleccionados.length === 0) {
      alert("Seleccione al menos un producto");
      return;
    }
    const items = seleccionados.map((id) => {
      const p = productos.find((prod: any) => prod.id === id);
      return `${p.nombre} (Stock: ${p.stock}, Mínimo: ${p.stock_minimo})`;
    });
    alert(
      `📦 Orden de compra generada para:\n\n${items.join("\n")}\n\n` +
      `Total productos: ${seleccionados.length}\n` +
      `Proveedores: ${[...new Set(seleccionados.map(id => {
        const p = productos.find((prod: any) => prod.id === id);
        return p.proveedor || "Sin proveedor";
      }))].join(", ")}`
    );
    // Aquí se podría guardar en una tabla "ordenes_compra"
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-stone-100 rounded-xl">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </Link>
        <h1 className="text-xl font-bold text-stone-800">Compras - {negocio?.titulo || "Negocio"}</h1>
        <div className="flex-1"></div>
        <button onClick={cargarDatos} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5 text-stone-700" />
        </button>
        <button
          onClick={generarOrdenCompra}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <ShoppingCart className="w-4 h-4" /> Generar Orden
        </button>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-stone-800">
              Recomendaciones de Compra ({productosRecomendados.length})
            </h2>
            <select
              value={filtroProveedor}
              onChange={(e) => setFiltroProveedor(e.target.value)}
              className="border border-stone-300 rounded-xl px-3 py-1 text-sm text-stone-800"
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-center text-stone-500 py-8">Cargando...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-center text-stone-500 py-8">
              ✅ No hay productos que necesiten compra. ¡Inventario saludable!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="text-left p-2 text-stone-700">Seleccionar</th>
                    <th className="text-left p-2 text-stone-700">Producto</th>
                    <th className="text-left p-2 text-stone-700">Categoría</th>
                    <th className="text-left p-2 text-stone-700">Stock Actual</th>
                    <th className="text-left p-2 text-stone-700">Stock Mínimo</th>
                    <th className="text-left p-2 text-stone-700">Faltante</th>
                    <th className="text-left p-2 text-stone-700">Proveedor</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p: any) => (
                    <tr key={p.id} className="border-b border-stone-100">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={seleccionados.includes(p.id)}
                          onChange={() => toggleSeleccion(p.id)}
                          className="w-4 h-4 accent-emerald-500"
                        />
                      </td>
                      <td className="p-2 text-stone-800">{p.nombre}</td>
                      <td className="p-2 text-stone-600">{p.categoria}</td>
                      <td className="p-2 font-medium text-red-600">{p.stock}</td>
                      <td className="p-2 text-stone-600">{p.stock_minimo || 5}</td>
                      <td className="p-2 font-bold text-orange-600">
                        {(p.stock_minimo || 5) - (p.stock || 0)}
                      </td>
                      <td className="p-2 text-stone-600">{p.proveedor || "Sin proveedor"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
