"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation"; import BackButton from "@/components/BackButton";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Minus, Plus, X, RefreshCw } from "lucide-react";

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  icono: string;
  categoria: string;
}

export default function TiendaPage() {
  const pathname = usePathname();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [catFilter, setCatFilter] = useState("Todo");
  const [mensaje, setMensaje] = useState("");
  const [checkoutData, setCheckoutData] = useState({ nombre: "", direccion: "", telefono: "", metodo_pago: "Efectivo" });
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant") || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";
  const negocioSlug = searchParams.get("slug") || "restaurante";
  const categoriaNegocio = ""; // Sin filtro por categoría, mostramos todos los productos del tenant

  const cargarProductos = () => {
    setLoading(true);
    fetch(`/api/products?tenant=${tenantId}&categoria=${encodeURIComponent(categoriaNegocio)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setProductos(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    cargarProductos();
  }, [tenantId, categoriaNegocio]);

  // Cargar carrito desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`carrito_${negocioSlug}`);
    if (saved) setCarrito(JSON.parse(saved));
  }, []);

  // Guardar carrito en localStorage
  useEffect(() => {
    localStorage.setItem(`carrito_${negocioSlug}`, JSON.stringify(carrito));
  }, [carrito]);

  const cats = ["Todo", ...new Set(productos.map(p => p.categoria))];
  const filtered = productos.filter(p => {
    const matchCat = catFilter === "Todo" || p.categoria === catFilter;
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const agregarAlCarrito = (p: Producto) => {
    setCarrito(prev => {
      const exist = prev.find(item => item.id === p.id);
      if (exist) {
        return prev.map(item => item.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { ...p, cantidad: 1 }];
    });
  };

  const quitarDelCarrito = (id: string) => {
    setCarrito(prev => prev.filter(item => item.id !== id));
  };

  const actualizarCantidad = (id: string, delta: number) => {
    setCarrito(prev => prev.map(item => {
      if (item.id === id) {
        const nuevaCant = item.cantidad + delta;
        if (nuevaCant <= 0) return null;
        return { ...item, cantidad: nuevaCant };
      }
      return item;
    }).filter(Boolean));
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  const finalizarPedido = async () => {
    if (carrito.length === 0) {
      alert("Carrito vacío");
      return;
    }
    // Aquí se integrará con /api/orders en el futuro
    alert("✅ Pedido realizado con éxito. Pronto recibirás confirmación.");
    setCarrito([]);
    setShowCart(false);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <BackButton />
        <h1 className="text-xl font-bold text-stone-800">Tienda - {negocioSlug?.titulo}</h1>
        <div className="flex-1"></div>
        <button onClick={cargarProductos} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5 text-stone-700" />
        </button>
        <button onClick={() => setShowCart(true)} className="relative bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          {carrito.length > 0 && <span className="bg-white text-emerald-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{carrito.reduce((s, i) => s + i.cantidad, 0)}</span>}
        </button>
      </header>

      {mensaje && <div className="bg-emerald-50 text-emerald-700 p-3 text-center font-medium border-b border-emerald-200">{mensaje}</div>}

      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-4">
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} className={`px-4 py-1.5 rounded-full text-sm font-medium ${catFilter === c ? 'bg-emerald-500 text-white' : 'bg-white text-stone-700'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="relative mb-4">
          <input type="text" placeholder="Buscar productos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-4 pr-4 py-2 rounded-xl border border-stone-300 bg-white text-stone-800" />
        </div>

        {loading ? (
          <div className="text-center py-8 text-stone-500">Cargando productos...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
                <div className="text-4xl text-center">{p.icono || "📦"}</div>
                <h3 className="font-medium text-stone-800 text-center truncate">{p.nombre}</h3>
                <p className="text-sm text-stone-600 text-center">${p.precio.toLocaleString()}</p>
                <p className="text-xs text-stone-500 text-center">Stock: {p.stock}</p>
                <button onClick={() => agregarAlCarrito(p)} className="w-full mt-2 bg-emerald-500 text-white py-1 rounded-xl text-sm hover:bg-emerald-600">Agregar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Carrito */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Carrito</h3>
              <button onClick={() => setShowCart(false)}><X className="w-5 h-5 text-stone-700" /></button>
            </div>
            {carrito.length === 0 ? (
              <p className="text-center text-stone-500 py-4">Carrito vacío</p>
            ) : (
              <>
                {carrito.map(item => (
                  <div key={item.id} className="flex items-center gap-3 border-b border-stone-100 py-2">
                    <span className="text-2xl">{item.icono}</span>
                    <div className="flex-1">
                      <p className="font-medium text-stone-800">{item.nombre}</p>
                      <p className="text-sm text-stone-600">${item.precio.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => actualizarCantidad(item.id, -1)} className="p-1 hover:bg-stone-100 rounded"><Minus className="w-4 h-4 text-stone-700" /></button>
                      <span className="w-6 text-center text-stone-800">{item.cantidad}</span>
                      <button onClick={() => actualizarCantidad(item.id, 1)} className="p-1 hover:bg-stone-100 rounded"><Plus className="w-4 h-4 text-stone-700" /></button>
                    </div>
                    <button onClick={() => quitarDelCarrito(item.id)} className="text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg mt-4 text-stone-800">
                  <span>Total</span>
                  <span>${totalCarrito.toLocaleString()}</span>
                </div>
                <div className="mt-4 space-y-2">
                  <input type="text" placeholder="Nombre" value={checkoutData.nombre} onChange={e => setCheckoutData({...checkoutData, nombre: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2 text-sm text-stone-800" />
                  <input type="text" placeholder="Dirección" value={checkoutData.direccion} onChange={e => setCheckoutData({...checkoutData, direccion: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2 text-sm text-stone-800" />
                  <input type="text" placeholder="Teléfono" value={checkoutData.telefono} onChange={e => setCheckoutData({...checkoutData, telefono: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2 text-sm text-stone-800" />
                  <select value={checkoutData.metodo_pago} onChange={e => setCheckoutData({...checkoutData, metodo_pago: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2 text-sm text-stone-800">
                    <option value="Efectivo">Efectivo</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Bancolombia">Bancolombia</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Crédito">Crédito</option>
                  </select>
                </div>
                <button onClick={finalizarPedido} className="w-full bg-emerald-500 text-white py-3 rounded-xl mt-4 font-medium">Finalizar Pedido</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}





