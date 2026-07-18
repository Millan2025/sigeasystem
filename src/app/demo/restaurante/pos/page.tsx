"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Minus, Plus, Trash2, X, Scale, Search, Share2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useSearchParams } from "next/navigation";

interface ProductoBase {
  id: string;
  nombre: string;
  icono: string;
  stock: number;
  cat: string;
  esPeso: boolean;
  precio?: number;
  precioPorKg?: number;
  tipo_unidad?: string;
  venta_por_peso?: boolean;
  imagen_url?: string;
}

interface CartItem {
  id: string;
  nombre: string;
  icono: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  esPeso?: boolean;
  unidad?: string;
  imagen_url?: string;
}

export default function POSPage() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant") || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";
  const negocioSlug = searchParams.get("slug") || "restaurante";

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showCreditoModal, setShowCreditoModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [creditoData, setCreditoData] = useState({ cliente: "", telefono: "", direccion: "" });
  const [msg, setMsg] = useState("");
  const [catFilter, setCatFilter] = useState("Todo");
  const [searchTerm, setSearchTerm] = useState("");
  const [productos, setProductos] = useState<ProductoBase[]>([]);
  const [pesoModal, setPesoModal] = useState<{ producto: ProductoBase | null; cantidad: number; unidad: string }>({
    producto: null,
    cantidad: 1,
    unidad: "gramos",
  });

  const cargarProductos = () => {
    console.log("🔍 POS: Cargando productos con tenant:", tenantId);
    fetch(`/api/products?tenant=${tenantId}`)
      .then((r) => r.json())
      .then((d) => {
        console.log("📦 POS: Productos recibidos:", d.data?.length || 0);
        if (d.success && d.data.length > 0) {
          setProductos(
            d.data.map((p: any) => ({
              id: p.id,
              nombre: p.nombre,
              icono: p.icono || "📦",
              imagen_url: p.imagen_url || null,
              precio: p.precio || 0,
              stock: p.stock || 0,
              cat: p.categoria || "General",
              esPeso: p.venta_por_peso || false,
              tipo_unidad: p.tipo_unidad || "unidad",
              precioPorKg: p.precioporkg || p.precio || 0,
            }))
          );
        } else {
          console.warn("⚠️ POS: No se recibieron productos o la respuesta no fue exitosa");
        }
      })
      .catch((err) => console.error("❌ POS: Error al cargar productos:", err));
  };

  useEffect(() => {
    cargarProductos();
  }, [tenantId]);

  const cats = ["Todo", ...Array.from(new Set(productos.map((p) => p.cat)))];
  const searchFiltered = searchTerm ? productos.filter((p) => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())) : productos;
  const filtered = catFilter === "Todo" ? searchFiltered : searchFiltered.filter((p) => p.cat === catFilter);
  const totalItems = cart.reduce((s, i) => s + i.cantidad, 0);
  const totalPrecio = cart.reduce((s, i) => s + i.subtotal, 0);

  const addItem = (p: ProductoBase) => {
    if (p.esPeso) {
      setPesoModal({ producto: p, cantidad: 1, unidad: p.tipo_unidad || "gramos" });
      return;
    }
    setCart((prev) => {
      const exist = prev.find((i) => i.id === p.id);
      if (exist) {
        return prev.map((i) =>
          i.id === p.id
            ? { ...i, cantidad: i.cantidad + 1, subtotal: i.precioUnitario * (i.cantidad + 1) }
            : i
        );
      }
      return [
        ...prev,
        {
          id: p.id,
          nombre: p.nombre,
          icono: p.icono,
          imagen_url: p.imagen_url,
          cantidad: 1,
          precioUnitario: p.precio || 0,
          subtotal: p.precio || 0,
          esPeso: false,
        },
      ];
    });
  };

  const confirmarPeso = () => {
    if (!pesoModal.producto || pesoModal.cantidad <= 0) return;
    const { producto, cantidad, unidad } = pesoModal;
    let gramos = 0;
    if (unidad === "gramos") gramos = cantidad;
    else if (unidad === "kilogramos") gramos = cantidad * 1000;
    else if (unidad === "libras") gramos = cantidad * 453.592;

    const precioPorGramo = (producto.precioPorKg || 0) / 1000;
    const precioFinal = Math.round(precioPorGramo * gramos);

    let cantidadBase = 0;
    if (producto.tipo_unidad === "kilogramo") cantidadBase = gramos / 1000;
    else if (producto.tipo_unidad === "gramo") cantidadBase = gramos;
    else if (producto.tipo_unidad === "libra") cantidadBase = gramos / 453.592;
    else cantidadBase = gramos / 1000;

    const item: CartItem = {
      id: producto.id + "-peso",
      nombre: `${producto.nombre} (${cantidad} ${unidad})`,
      icono: producto.icono,
      imagen_url: producto.imagen_url,
      cantidad: cantidadBase,
      precioUnitario: precioFinal,
      subtotal: precioFinal,
      esPeso: true,
      unidad: unidad,
    };
    setCart((prev) => [...prev, item]);
    setPesoModal({ producto: null, cantidad: 1, unidad: "gramos" });
  };

  const pay = async (metodo: string) => {
    if (cart.length === 0) return;

    if (metodo === "Crédito") {
      setShowCreditoModal(true);
      return;
    }

    try {
      const items = cart.map((item) => {
        const producto_id = item.id.includes("-") ? item.id.split("-")[0] : item.id;
        return {
          producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precioUnitario,
          subtotal: item.subtotal,
        };
      });

      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          metodo_pago: metodo,
          total: totalPrecio,
          items,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("✅ Venta #" + data.data.venta.id + " registrada - $" + totalPrecio.toLocaleString());
        setCart([]);
        setShowPay(false);
        setShowCart(false);
        cargarProductos();
        setTimeout(() => setMsg(""), 4000);
      } else {
        alert("Error al registrar venta: " + data.error);
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };

  const guardarCredito = async () => {
    if (!creditoData.cliente) {
      alert("Ingrese el nombre del cliente");
      return;
    }
    try {
      const res = await fetch("/api/creditos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: creditoData.cliente,
          telefono: creditoData.telefono,
          direccion: creditoData.direccion,
          monto: totalPrecio,
          tenant_id: tenantId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("✅ Crédito registrado - $" + totalPrecio.toLocaleString());
        setCart([]);
        setShowPay(false);
        setShowCart(false);
        setShowCreditoModal(false);
        setCreditoData({ cliente: "", telefono: "", direccion: "" });
        cargarProductos();
        setTimeout(() => setMsg(""), 4000);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      <header className="bg-white shadow-sm p-3 flex items-center gap-2 sticky top-0 z-20">
        <BackButton />
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-stone-800 truncate">Nueva Venta</h1>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="p-2 hover:bg-stone-100 rounded-xl text-stone-600"
          title="Compartir accesos"
        >
          <Share2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowCart(true)}
          className="relative bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          {totalItems > 0 && (
            <span className="bg-white text-emerald-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      {msg && <div className="bg-emerald-50 text-emerald-700 p-3 text-center font-medium border-b border-emerald-200">{msg}</div>}

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 flex-wrap mb-4">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  catFilter === c ? "bg-emerald-500 text-white" : "bg-white text-stone-700"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 bg-white text-stone-800"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl p-3 shadow-sm border border-stone-200 cursor-pointer hover:shadow-md transition"
                onClick={() => addItem(p)}
              >
                {p.imagen_url ? (
                  <img src={p.imagen_url} alt={p.nombre} className="w-full h-24 object-cover rounded-lg mb-1" />
                ) : (
                  <div className="text-4xl text-center">{p.icono}</div>
                )}
                <div className="font-semibold text-stone-800 text-sm truncate">{p.nombre}</div>
                <div className="text-xs text-stone-600">{p.cat}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-bold text-emerald-600">${(p.precio || 0).toLocaleString()}</span>
                  <span className="text-xs text-stone-600">Stock: {p.stock}</span>
                </div>
                {p.esPeso && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Por peso</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Carrito */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Carrito</h3>
              <button onClick={() => setShowCart(false)}>
                <X className="w-5 h-5 text-stone-700" />
              </button>
            </div>
            {cart.length === 0 ? (
              <p className="text-stone-500 text-center py-4">Carrito vacío</p>
            ) : (
              <>
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 border-b border-stone-100 py-2">
                    {item.imagen_url ? (
                      <img src={item.imagen_url} alt={item.nombre} className="w-12 h-12 object-cover rounded-lg" />
                    ) : (
                      <span className="text-2xl">{item.icono}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-stone-800 truncate">{item.nombre}</div>
                      <div className="text-xs text-stone-600">${item.precioUnitario.toLocaleString()} c/u</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCart((prev) =>
                            prev
                              .map((i, j) =>
                                j === idx
                                  ? { ...i, cantidad: i.cantidad - 1, subtotal: i.precioUnitario * (i.cantidad - 1) }
                                  : i
                              )
                              .filter((i) => i.cantidad > 0)
                          )
                        }
                        className="p-1 hover:bg-stone-100 rounded"
                      >
                        <Minus className="w-4 h-4 text-stone-700" />
                      </button>
                      <span className="w-6 text-center text-sm text-stone-800">{item.cantidad}</span>
                      <button
                        onClick={() =>
                          setCart((prev) =>
                            prev.map((i, j) =>
                              j === idx
                                ? { ...i, cantidad: i.cantidad + 1, subtotal: i.precioUnitario * (i.cantidad + 1) }
                                : i
                            )
                          )
                        }
                        className="p-1 hover:bg-stone-100 rounded"
                      >
                        <Plus className="w-4 h-4 text-stone-700" />
                      </button>
                    </div>
                    <button
                      onClick={() => setCart((prev) => prev.filter((_, j) => j !== idx))}
                      className="p-1 hover:bg-red-50 text-red-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg mt-4 text-stone-800">
                  <span>Total</span>
                  <span>${totalPrecio.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => {
                    setShowCart(false);
                    setShowPay(true);
                  }}
                  className="w-full bg-emerald-500 text-white py-3 rounded-xl mt-4 font-medium"
                >
                  Cobrar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Pago */}
      {showPay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-stone-800 mb-2">Cobrar</h3>
            <p className="text-2xl font-bold text-emerald-600 mb-4">${totalPrecio.toLocaleString()}</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => pay("Efectivo")} className="w-full bg-stone-100 hover:bg-stone-200 py-2 rounded-xl text-stone-800">
                Efectivo
              </button>
              <button onClick={() => pay("Nequi")} className="w-full bg-stone-100 hover:bg-stone-200 py-2 rounded-xl text-stone-800">
                Nequi
              </button>
              <button onClick={() => pay("Bancolombia")} className="w-full bg-stone-100 hover:bg-stone-200 py-2 rounded-xl text-stone-800">
                Bancolombia
              </button>
              <button onClick={() => pay("Daviplata")} className="w-full bg-stone-100 hover:bg-stone-200 py-2 rounded-xl text-stone-800">
                Daviplata
              </button>
              <button onClick={() => pay("Crédito")} className="w-full bg-stone-100 hover:bg-stone-200 py-2 rounded-xl text-stone-800">
                Crédito
              </button>
            </div>
            <button onClick={() => setShowPay(false)} className="w-full border border-stone-300 py-2 rounded-xl mt-4 text-stone-700">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal Peso */}
      {pesoModal.producto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-stone-800 mb-2">Pesar {pesoModal.producto.nombre}</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-stone-700">Cantidad:</span>
              <input
                type="number"
                value={pesoModal.cantidad}
                onChange={(e) => setPesoModal({ ...pesoModal, cantidad: parseFloat(e.target.value) || 1 })}
                className="border border-stone-300 rounded-xl p-2 w-24 text-stone-800"
                min="0.1"
                step="0.1"
              />
              <select
                value={pesoModal.unidad}
                onChange={(e) => setPesoModal({ ...pesoModal, unidad: e.target.value })}
                className="border border-stone-300 rounded-xl p-2 text-stone-800"
              >
                <option value="gramos">Gramos</option>
                <option value="kilogramos">Kilogramos</option>
                <option value="libras">Libras</option>
              </select>
            </div>
            <p className="text-sm text-stone-600 mb-4">Precio por kg: ${(pesoModal.producto.precioPorKg || 0).toLocaleString()}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPesoModal({ producto: null, cantidad: 1, unidad: "gramos" })}
                className="flex-1 border border-stone-300 py-2 rounded-xl text-stone-700"
              >
                Cancelar
              </button>
              <button onClick={confirmarPeso} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl">
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crédito */}
      {showCreditoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-stone-800 mb-2">Registrar Crédito</h3>
            <p className="text-sm text-stone-600 mb-4">Total: ${totalPrecio.toLocaleString()}</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre del cliente"
                value={creditoData.cliente}
                onChange={(e) => setCreditoData({ ...creditoData, cliente: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="text"
                placeholder="Teléfono"
                value={creditoData.telefono}
                onChange={(e) => setCreditoData({ ...creditoData, telefono: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
              <input
                type="text"
                placeholder="Dirección"
                value={creditoData.direccion}
                onChange={(e) => setCreditoData({ ...creditoData, direccion: e.target.value })}
                className="w-full border border-stone-300 rounded-xl p-2 text-stone-800"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowCreditoModal(false);
                  setCreditoData({ cliente: "", telefono: "", direccion: "" });
                }}
                className="flex-1 border border-stone-300 py-2 rounded-xl text-stone-700"
              >
                Cancelar
              </button>
              <button onClick={guardarCredito} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Compartir */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-stone-800">Compartir Accesos</h3>
              <button onClick={() => setShowShareModal(false)}>
                <X className="w-5 h-5 text-stone-700" />
              </button>
            </div>
            <p className="text-sm text-stone-600 mb-4">Comparte estos enlaces con tu equipo y clientes</p>
            <div className="space-y-3">
              <a
                href={`https://wa.me/?text=POS%20Vendedor%3A%20${typeof window !== "undefined" ? window.location.origin : ""}/demo/${negocioSlug}/pos`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-green-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-medium hover:bg-green-600 transition"
              >
                <span className="text-xl">💰</span> POS Vendedor
              </a>
              <a
                href={`https://wa.me/?text=Tienda%20Clientes%3A%20${typeof window !== "undefined" ? window.location.origin : ""}/demo/${negocioSlug}/tienda`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-medium hover:bg-blue-600 transition"
              >
                <span className="text-xl">🛒</span> Tienda Clientes
              </a>
              <a
                href={`https://wa.me/?text=App%20Repartidor%3A%20${typeof window !== "undefined" ? window.location.origin : ""}/repartidor`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-purple-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-medium hover:bg-purple-600 transition"
              >
                <span className="text-xl">🛵</span> App Repartidor
              </a>
            </div>
            <button onClick={() => setShowShareModal(false)} className="w-full border border-stone-300 py-2 rounded-xl mt-4 text-stone-700">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
