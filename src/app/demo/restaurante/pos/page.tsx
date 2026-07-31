"use client";

import { useTenant } from "@/hooks/useTenant";
import { useState, useEffect } from "react";
import { ShoppingCart, Minus, Plus, Trash2, X, Scale, Search, Share2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useSearchParams } from "next/navigation";

interface ProductoBase {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
  stock: number;
  imagen_url?: string;
}

interface Producto extends ProductoBase {
  cantidad: number;
}

export default function POSPage() {
  const searchParams = useSearchParams();
  const { tenant: tenantId } = useTenant();
  const negocioSlug = searchParams.get("slug") || "restaurante";

  const [productos, setProductos] = useState<ProductoBase[]>([]);
  const [carrito, setCarrito] = useState<Producto[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("Todo");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [clienteNombre, setClienteNombre] = useState("");
  const [esPeso, setEsPeso] = useState(false);
  const [pesoGramos, setPesoGramos] = useState(0);
  const [productoPesaje, setProductoPesaje] = useState<ProductoBase | null>(null);

  // Cargar productos
  const cargarProductos = () => {
    setLoading(true);
    fetch(/api/products?tenant=)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProductos(d.data || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    cargarProductos();
  }, [tenantId]);

  // CategorÃ­as
  const categorias = ["Todo", ...new Set(productos.map((p) => p.categoria))];

  // Productos filtrados
  const productosFiltrados = productos.filter((p) => {
    if (categoriaSeleccionada !== "Todo" && p.categoria !== categoriaSeleccionada) return false;
    if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  // Funciones del carrito
  const agregarAlCarrito = (producto: ProductoBase) => {
    setCarrito((prev) => {
      const existente = prev.find((p) => p.id === producto.id);
      if (existente) {
        return prev.map((p) =>
          p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const agregarPesaje = () => {
    if (!productoPesaje || pesoGramos <= 0) return;
    const precioTotal = (productoPesaje.precio / 1000) * pesoGramos;
    setCarrito((prev) => {
      const existente = prev.find((p) => p.id === productoPesaje.id);
      if (existente) {
        return prev.map((p) =>
          p.id === productoPesaje.id
            ? { ...p, cantidad: p.cantidad + 1, precio: precioTotal }
            : p
        );
      }
      return [
        ...prev,
        {
          ...productoPesaje,
          cantidad: 1,
          precio: precioTotal,
          nombre: ${productoPesaje.nombre} (g),
        },
      ];
    });
    setProductoPesaje(null);
    setPesoGramos(0);
    setEsPeso(false);
  };

  const eliminarDelCarrito = (id: string) => {
    setCarrito((prev) => prev.filter((p) => p.id !== id));
  };

  const actualizarCantidad = (id: string, cantidad: number) => {
    if (cantidad <= 0) {
      eliminarDelCarrito(id);
      return;
    }
    setCarrito((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad } : p))
    );
  };

  const totalItems = carrito.reduce((sum, p) => sum + p.cantidad, 0);
  const totalPrecio = carrito.reduce((sum, p) => sum + p.precio * p.cantidad, 0);

  // Procesar venta
  const procesarVenta = async () => {
    if (carrito.length === 0) return;

    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          metodo_pago: metodoPago,
          total: totalPrecio,
          items: carrito.map((p) => ({
            producto_id: p.id,
            nombre: p.nombre,
            cantidad: p.cantidad,
            precio: p.precio,
          })),
          cliente: clienteNombre || "Cliente POS",
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("âœ… Venta procesada correctamente");
        setCarrito([]);
        setShowCheckout(false);
        setClienteNombre("");
        cargarProductos();
      } else {
        alert("âŒ Error: " + data.error);
      }
    } catch (error) {
      alert("âŒ Error al procesar la venta");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <BackButton />
        <h1 className="text-xl font-bold text-stone-800 flex-1">Punto de Venta</h1>
        <button onClick={cargarProductos} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5 text-stone-700" />
        </button>
        <button
          onClick={() => setShowCheckout(true)}
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <ShoppingCart className="w-4 h-4" /> Carrito ({totalItems})
        </button>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        {/* BÃºsqueda y categorÃ­as */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-800"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                className={px-3 py-1.5 rounded-full text-sm font-medium }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Productos */}
        {loading ? (
          <div className="text-center py-12 text-stone-500">Cargando productos...</div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-stone-500">No hay productos</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {productosFiltrados.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  if (p.nombre.toLowerCase().includes("peso") || p.nombre.toLowerCase().includes("gramo")) {
                    setProductoPesaje(p);
                    setEsPeso(true);
                  } else {
                    agregarAlCarrito(p);
                  }
                }}
                className="bg-white rounded-2xl p-3 shadow-sm border border-stone-200 hover:shadow-md transition text-left"
              >
                <div className="bg-stone-50 rounded-xl h-20 mb-2 flex items-center justify-center text-3xl">
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt={p.nombre} className="h-16 w-16 object-cover rounded" />
                  ) : (
                    "ðŸ“¦"
                  )}
                </div>
                <h3 className="font-semibold text-stone-800 text-sm leading-tight">{p.nombre}</h3>
                <p className="text-xs text-stone-400">{p.categoria}</p>
                <p className="text-emerald-600 font-bold"></p>
                {p.stock < 10 && <p className="text-xs text-red-500">Stock: {p.stock}</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal de pesaje */}
      {esPeso && productoPesaje && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-stone-800 mb-4">Pesar {productoPesaje.nombre}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Peso (gramos)</label>
                <input
                  type="number"
                  value={pesoGramos}
                  onChange={(e) => setPesoGramos(Number(e.target.value))}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="Ingresa el peso in gramos"
                />
              </div>
              <div className="text-sm text-stone-600">
                Precio for kg: 
                <br />
                Total aproximado: 
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setEsPeso(false); setProductoPesaje(null); setPesoGramos(0); }} className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700">
                Cancelar
              </button>
              <button onClick={agregarPesaje} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl">
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de checkout */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Confirmar Venta</h3>
              <button onClick={() => setShowCheckout(false)}><X className="w-5 h-5 text-stone-700" /></button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {carrito.map((p) => (
                <div key={p.id} className="flex justify-between items-center border-b py-2">
                  <div>
                    <span className="text-sm font-medium text-stone-800">{p.nombre}</span>
                    <span className="text-xs text-stone-500 ml-2">x{p.cantidad}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-600"></span>
                    <button onClick={() => eliminarDelCarrito(p.id)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {carrito.length === 0 && <p className="text-center text-stone-500">Carrito vacÃ­o</p>}
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-emerald-600"></span>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <div>
                <label className="block text-sm font-medium text-stone-700">Cliente</label>
                <input
                  type="text"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                  placeholder="Nombre del cliente (opcional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">MÃ©todo de pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Bancolombia">Bancolombia</option>
                  <option value="Daviplata">Daviplata</option>
                  <option value="CrÃ©dito">CrÃ©dito</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCheckout(false)} className="flex-1 py-2 border border-stone-300 rounded-xl text-stone-700">
                Cancelar
              </button>
              <button onClick={procesarVenta} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl" disabled={carrito.length === 0}>
                Pagar 
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}