"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const NEGOCIOS = {
  panaderia: { titulo: "Panadería Doña Rosa", categoria: "Panaderia", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  restaurante: { titulo: "Restaurante Caribe", categoria: "Restaurante", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  carniceria: { titulo: "Carnicería El Buen Sabor", categoria: "Carniceria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  salsamentaria: { titulo: "Salsamentaria La Especial", categoria: "Salsamentaria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  ferreteria: { titulo: "Ferretería El Tornillo", categoria: "Ferreteria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  tienda: { titulo: "Tienda Surtimax", categoria: "Tienda", tenantId: "58d06407-6d1c-4beb-acee-8965001fbbee" },
};

const TITULOS = {
  pos: "Punto de Venta",
  inventario: "Inventario",
  produccion: "Producción",
  finanzas: "Finanzas",
  pedidos: "Pedidos",
  personal: "Personal",
  reportes: "Reportes",
  tienda: "Tienda"
};

export default function ModuloNegocioPage() {
  const pathname = usePathname();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!pathname) {
    return <div className="p-8 text-center text-stone-500">Cargando...</div>;
  }

  const pathParts = pathname.split('/');
  const negocioSlug = pathParts[2] || '';
  const moduloName = pathParts[3] || '';

  // Usar type assertion para acceder a los objetos
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const titulo = TITULOS[moduloName as keyof typeof TITULOS] || "Modulo";

  useEffect(() => {
    if (negocio) {
      fetch(`/api/products?categoria=${encodeURIComponent(negocio.categoria)}&tenant=${negocio.tenantId}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) setProductos(d.data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [negocio]);

  if (!negocio) {
    return <div className="p-8 text-center text-stone-500">Negocio no encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-stone-50 md:max-w-2xl lg:max-w-4xl mx-auto">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3">
          <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-white/10 rounded-xl transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{titulo} - {negocio.titulo}</h1>
            <p className="text-stone-300 text-sm">Demo · {productos.length} productos</p>
          </div>
        </div>
      </header>

      <div className="p-4">
        <div className="bg-white rounded-2xl p-6 border border-stone-200">
          <h2 className="font-semibold text-stone-800 mb-4">Productos</h2>
          {loading ? (
            <div className="text-center py-8 text-stone-400">Cargando productos...</div>
          ) : productos.length === 0 ? (
            <div className="text-center py-8 text-stone-400">No hay productos disponibles</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {productos.slice(0, 12).map((p: any) => (
                <div key={p.id} className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                  <div className="text-2xl">{p.icono || "📦"}</div>
                  <div className="text-sm font-semibold text-stone-800 truncate">{p.nombre}</div>
                  <div className="text-xs text-stone-400">{p.unidad || "unidad"}</div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-bold text-emerald-600">${p.precio?.toLocaleString()}</span>
                    <span className="text-xs text-stone-400">Stock: {p.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
