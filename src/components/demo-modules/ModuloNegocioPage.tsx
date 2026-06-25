"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  icono: string;
  unidad: string;
}

export function ModuloNegocioPage({ 
  titulo, 
  icono, 
  negocioSlug,
  categoria,
  tenantId
}: { 
  titulo: string;
  icono: React.ReactNode;
  negocioSlug: string;
  categoria: string;
  tenantId: string;
}) {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products?categoria=${encodeURIComponent(categoria)}&tenant=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setProductos(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [categoria, tenantId]);

  return (
    <div className="min-h-screen bg-stone-50 md:max-w-2xl lg:max-w-4xl mx-auto">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3">
          <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-white/10 rounded-xl transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {icono}
              <h1 className="text-xl font-bold">{titulo}</h1>
            </div>
            <p className="text-stone-300 text-sm">Demo · {productos.length} productos</p>
          </div>
        </div>
      </header>

      <div className="p-4">
        <div className="bg-white rounded-2xl p-6 border border-stone-200">
          <h2 className="font-semibold text-stone-800 mb-4">📦 Productos</h2>
          {loading ? (
            <div className="text-center py-8 text-stone-400">Cargando productos...</div>
          ) : productos.length === 0 ? (
            <div className="text-center py-8 text-stone-400">No hay productos disponibles</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {productos.slice(0, 12).map((p) => (
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
