"use client";
import { useEffect, useState } from "react";

const TENANT_ID = "11111111-1111-1111-1111-111111111111";
const lbl = (c: string) => { const u = c.trim().toUpperCase(); return u.startsWith("MESA") ? u : "MESA " + u; };

type Prod = { id: string; nombre: string; precio: number; categoria?: string; descripcion?: string; imagen_url?: string; icono?: string; stock?: number };
type Item = { producto_id: string; nombre: string; precio: number; cantidad: number; obs: string; imagen_url?: string; icono?: string };
type Pedido = { id: string; estado: string; total: number; created_at: string; observaciones: string; direccion?: string };
type Config = { nequi?: string; bancolombia?: string; daviplata?: string; nombre_negocio?: string };

export default function MesaPage() {
  const [mesa, setMesa] = useState("");
  const [tenantId, setTenantId] = useState(TENANT_ID);
  const [etiqueta, setEtiqueta] = useState("");
  const [productos, setProductos] = useState<Prod[]>([]);
  const [config, setConfig] = useState<Config>({});
  const [nombre, setNombre] = useState("");
  const [comensales, setComensales] = useState(1);
  const [carrito, setCarrito] = useState<Item[]>([]);
  const [metodo_pago, setMetodo_pago] = useState("Efectivo");
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [pedidosMesa, setPedidosMesa] = useState<Pedido[]>([]);
  const [vista, setVista] = useState<"menu" | "estado">("menu");
  const [copiado, setCopiado] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalSolicitud, setModalSolicitud] = useState(false);
  const [textoSolicitud, setTextoSolicitud] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("m") || "";
    const t = params.get("t") || TENANT_ID;
    setTenantId(t);
    setMesa(m.trim().toUpperCase());
    setEtiqueta(lbl(m));
    (async () => {
      try {
        const r = await fetch(`/api/products?tenant=${t}`);
        const j = await r.json();
        const arr: any[] = j.data || [];
        arr.sort((a, b) => String(a.categoria || "").localeCompare(String(b.categoria || "")) || String(a.nombre).localeCompare(String(b.nombre)));
        setProductos(arr.map((p) => ({ id: p.id, nombre: p.nombre, precio: Number(p.precio), categoria: p.categoria, descripcion: p.descripcion, imagen_url: p.imagen_url, icono: p.icono || "🍽️", stock: Number(p.stock || 0) })));
      } catch (e) {}
      try {
        const r2 = await fetch(`/api/tenant-config?tenant=${t}`);
        const j2 = await r2.json();
        if (j2.success && j2.data) setConfig(j2.data);
      } catch (e) {}
    })();
  }, []);

  // Polling cada 5s para refrescar stock y pedidos
  useEffect(() => {
    const refrescar = async () => {
      try {
        const r = await fetch(`/api/products?tenant=${t}`);
        const j = await r.json();
        const arr: any[] = j.data || [];
        setProductos((prev) => prev.map((p) => {
          const nuevo = arr.find((x: any) => x.id === p.id);
          return nuevo ? { ...p, stock: Number(nuevo.stock || 0) } : p;
        }));
      } catch {}
    };
    const t = setInterval(refrescar, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!etiqueta) return;
    const cargar = async () => {
      try {
        const r = await fetch(`/api/pedidos?tenant=${tenantId}`);
        const j = await r.json();
        const todos: Pedido[] = j.data || j || [];
        setPedidosMesa(todos.filter((p) => (p.direccion || "").toUpperCase() === etiqueta));
      } catch (e) {}
    };
    cargar();
    const t = setInterval(cargar, 5000);
    return () => clearInterval(t);
  }, [etiqueta]);

  const add = (p: Prod) => {
    if ((p.stock || 0) <= 0) { setOk("❌ Producto agotado"); setTimeout(() => setOk(null), 2000); return; }
    setCarrito((c) => {
      const e = c.find((x) => x.producto_id === p.id && !x.obs);
      if (e) return c.map((x) => (x === e ? { ...x, cantidad: x.cantidad + 1 } : x));
      return [...c, { producto_id: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1, obs: "", imagen_url: p.imagen_url, icono: p.icono }];
    });
    setOk("✅ Agregado a la canasta");
    setTimeout(() => setOk(null), 1500);
  };
  const setObs = (idx: number, obs: string) => setCarrito((c) => c.map((x, i) => (i === idx ? { ...x, obs } : x)));
  const setQty = (idx: number, cantidad: number) => setCarrito((c) => c.map((x, i) => (i === idx ? { ...x, cantidad: Math.max(1, cantidad) } : x)));
  const del = (idx: number) => setCarrito((c) => c.filter((_, i) => i !== idx));
  const total = carrito.reduce((a, x) => a + x.precio * x.cantidad, 0);
  const totalItems = carrito.reduce((a, x) => a + x.cantidad, 0);

  const copiar = (texto: string, tipo: string) => { navigator.clipboard.writeText(texto); setCopiado(tipo); setTimeout(() => setCopiado(""), 2000); };

  const enviar = async () => {
    if (!nombre.trim()) return alert("Ingresa tu nombre");
    if (carrito.length === 0) return alert("Agrega algo al pedido");
    setEnviando(true);
    const items = carrito.map((x) => ({ producto_id: x.producto_id, nombre: x.nombre, precio: x.precio, cantidad: x.cantidad }));
    const obsGlobal = carrito.filter((x) => x.obs).map((x) => `${x.nombre} x${x.cantidad}: ${x.obs}`).join(" | ");
    const obsFinal = `COMENSALES:${comensales} | CLIENTE:${nombre} | PAGO:${metodo_pago}` + (obsGlobal ? " | " + obsGlobal : "");
    const r = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, cliente: `${nombre} (${etiqueta})`, direccion: etiqueta, telefono: "", metodo_pago, total, items, observaciones: obsFinal }),
    });
    const j = await r.json();
    setEnviando(false);
    if (j.success) {
      setOk("✅ Pedido enviado a cocina");
      setCarrito([]);
      setModalAbierto(false);
      setVista("estado");
      setTimeout(() => setOk(null), 3000);
    } else { alert("Error: " + (j.error || "desconocido")); }
  };

  const pedirCuenta = async () => {
    setEnviando(true);
    await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId, cliente: `SOLICITA MESERO (${etiqueta})`, direccion: etiqueta, telefono: "", metodo_pago: "Solicita mesero", total: 0, items: [{ producto_id: "mesero", nombre: "Solicita mesero/cuenta", precio: 0, cantidad: 1 }], observaciones: `${etiqueta} solicita mesero para verificar cuenta y despedida` }),
    });
    setEnviando(false);
    setOk("🙋 Mesero notificado, viene en camino");
    setTimeout(() => setOk(null), 4000);
  };

  const estadoColor = (e: string) => e === "pendiente" ? "bg-amber-500" : (e === "listo" || e === "despachado") ? "bg-emerald-500" : "bg-stone-400";
  const estadoLabel = (e: string) => e === "pendiente" ? "En preparación" : (e === "listo" || e === "despachado") ? "Listo, mesero en camino" : "En preparación";

  if (!mesa) return <div className="min-h-screen bg-stone-900 text-white p-6 flex items-center justify-center">⚠️ Falta el código de mesa en el QR (usa ?m=A1)</div>;

  const stockBadge = (s: number) => {
    if (s <= 0) return <span className="absolute top-2 left-2 bg-rose-600 text-white rounded-full px-2 py-0.5 text-[10px] font-bold shadow">AGOTADO</span>;
    if (s <= 3) return <span className="absolute top-2 left-2 bg-amber-500 text-white rounded-full px-2 py-0.5 text-[10px] font-bold shadow">Últimas {s}</span>;
    return null;
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 pb-32">
      <div className="bg-stone-900 text-white px-4 py-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-stone-400">{config.nombre_negocio || "Restaurante"}</p>
            <h1 className="text-2xl font-extrabold text-[#fdb813]">🍽️ {etiqueta}</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setVista("menu")} className={"px-3 py-1.5 rounded-lg text-xs font-bold " + (vista === "menu" ? "bg-[#fdb813] text-stone-900" : "bg-stone-700")}>Menú</button>
            <button onClick={() => setVista("estado")} className={"px-3 py-1.5 rounded-lg text-xs font-bold relative " + (vista === "estado" ? "bg-[#fdb813] text-stone-900" : "bg-stone-700")}>
              Estado {pedidosMesa.length > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{pedidosMesa.length}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {ok && <div className="bg-emerald-600 text-white rounded-xl p-3 mb-3 text-center font-bold animate-pulse fixed top-20 left-1/2 -translate-x-1/2 z-20 shadow-xl max-w-md w-[90%]">{ok}</div>}

        {vista === "menu" && (
          <>
            <div className="bg-white rounded-xl p-4 border border-stone-200 mb-4 shadow-sm">
              <p className="font-bold mb-2">👤 Tus datos</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2" />
                <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3">
                  <span className="text-sm">Comensales:</span>
                  <button onClick={() => setComensales(Math.max(1, comensales - 1))} className="bg-stone-200 rounded px-2">-</button>
                  <span className="font-bold">{comensales}</span>
                  <button onClick={() => setComensales(comensales + 1)} className="bg-stone-200 rounded px-2">+</button>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-extrabold text-lg mb-2">📋 Menú ({productos.length} platos) · Stock en vivo</p>
              {productos.length === 0 && <p className="text-stone-500 text-sm">Cargando menú…</p>}
              {Array.from(new Set(productos.map((p) => p.categoria || "Otros"))).map((cat) => (
                <div key={cat} className="mb-4">
                  <p className="font-extrabold text-sm text-stone-700 uppercase tracking-wide mb-2 border-b-2 border-[#fdb813] pb-1">{cat}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {productos.filter((p) => (p.categoria || "Otros") === cat).map((p) => {
                      const agotado = (p.stock || 0) <= 0;
                      return (
                        <div key={p.id} className={"bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm " + (agotado ? "opacity-60" : "hover:shadow-md transition")}>
                          <div className="h-32 bg-gradient-to-br from-stone-100 to-stone-200 relative overflow-hidden">
                            {p.imagen_url ? (
                              <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-5xl">{p.icono}</div>
                            )}
                            <div className="absolute top-2 right-2 bg-stone-900 text-[#fdb813] rounded-full px-2 py-1 text-xs font-bold shadow-lg">${(p.precio/1000).toFixed(0)}K</div>
                            {stockBadge(p.stock || 0)}
                          </div>
                          <div className="p-3">
                            <p className="font-extrabold text-sm">{p.nombre}</p>
                            {p.descripcion && <p className="text-xs text-stone-500 mt-1 line-clamp-2">{p.descripcion}</p>}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-stone-500">Stock: {p.stock || 0}</span>
                              <button onClick={() => add(p)} disabled={agotado} className={"rounded-lg py-1.5 px-3 text-xs font-bold " + (agotado ? "bg-stone-200 text-stone-400 cursor-not-allowed" : "bg-stone-900 text-[#fdb813] hover:bg-stone-800 transition")}>
                                {agotado ? "Agotado" : "+ Añadir"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {vista === "estado" && (
          <div>
            <p className="font-extrabold text-lg mb-3">📋 Pedidos de {etiqueta}</p>
            {pedidosMesa.length === 0 && (
              <div className="bg-white rounded-xl p-6 text-center border border-stone-200">
                <p className="text-stone-500">Aún no has pedido nada</p>
                <button onClick={() => setVista("menu")} className="mt-3 bg-[#fdb813] text-stone-900 rounded-lg px-4 py-2 font-bold">Ver menú</button>
              </div>
            )}
            {pedidosMesa.map((p) => (
              <div key={p.id} className="bg-white rounded-xl p-3 border border-stone-200 mb-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-stone-500">{new Date(p.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</p>
                  <span className={"text-white text-xs rounded-full px-2 py-0.5 font-bold " + estadoColor(p.estado)}>{estadoLabel(p.estado)}</span>
                </div>
                <p className="font-bold">${Number(p.total).toLocaleString()}</p>
                {p.observaciones && <p className="text-xs text-stone-500 mt-1">{p.observaciones}</p>}
              </div>
            ))}
            {pedidosMesa.length > 0 && (
              <button onClick={pedirCuenta} disabled={enviando} className="w-full mt-4 bg-stone-900 text-[#fdb813] rounded-xl py-3 font-extrabold disabled:opacity-50">
                🙋 {enviando ? "Notificando..." : "Solicitar mesero / cuenta"}
              </button>
            )}
          </div>
        )}
      </div>

      {carrito.length > 0 && vista === "menu" && (
        <button onClick={() => setModalAbierto(true)} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-stone-900 text-white rounded-full shadow-2xl flex items-center gap-3 px-5 py-3 hover:scale-105 transition border-2 border-[#fdb813]">
          <span className="text-2xl">🛒</span>
          <div className="text-left">
            <p className="text-xs text-stone-400">Tu pedido</p>
            <p className="font-extrabold text-[#fdb813]">{totalItems} items · ${total.toLocaleString()}</p>
          </div>
          <span className="bg-[#fdb813] text-stone-900 rounded-full px-3 py-1 text-xs font-extrabold">Ver →</span>
        </button>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setModalAbierto(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-stone-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-lg">🛒 Tu pedido</p>
                <p className="text-xs text-stone-500">{etiqueta} · {nombre || "Sin nombre"}</p>
              </div>
              <button onClick={() => setModalAbierto(false)} className="bg-stone-100 rounded-full w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-200">✕</button>
            </div>

            <div className="p-4">
              {carrito.map((x, i) => (
                <div key={i} className="flex gap-3 border-b border-stone-100 py-3">
                  <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0">
                    {x.imagen_url ? <img src={x.imagen_url} alt={x.nombre} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">{x.icono}</div>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="font-bold text-sm">{x.nombre}</p>
                      <button onClick={() => del(i)} className="text-rose-500 text-xs ml-2">✕</button>
                    </div>
                    <p className="text-emerald-700 font-bold text-sm mt-0.5">${(x.precio * x.cantidad).toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => setQty(i, x.cantidad - 1)} className="bg-stone-200 rounded px-2 text-sm">-</button>
                      <span className="font-bold w-6 text-center">{x.cantidad}</span>
                      <button onClick={() => setQty(i, x.cantidad + 1)} className="bg-stone-200 rounded px-2 text-sm">+</button>
                    </div>
                    <input value={x.obs} onChange={(e) => setObs(i, e.target.value)} placeholder="Observaciones..." className="mt-1 w-full bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs" />
                  </div>
                </div>
              ))}

              <div className="mt-4 pt-4 border-t-2 border-stone-200">
                <p className="font-bold mb-2">💳 Forma de pago</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button onClick={() => setMetodo_pago("Efectivo")} className={"rounded-lg py-2 text-sm font-bold " + (metodo_pago === "Efectivo" ? "bg-emerald-600 text-white" : "bg-stone-100")}>💵 Efectivo</button>
                  <button onClick={() => setMetodo_pago("Tarjeta")} className={"rounded-lg py-2 text-sm font-bold " + (metodo_pago === "Tarjeta" ? "bg-emerald-600 text-white" : "bg-stone-100")}>💳 Tarjeta</button>
                </div>
                <p className="font-bold text-sm mb-2">📱 Transferencia digital</p>
                {config.nequi && (
                  <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-2 mb-2">
                    <div><p className="text-xs text-purple-600 font-bold">NEQUI</p><p className="font-bold">{config.nequi}</p></div>
                    <button onClick={() => copiar(config.nequi!, "nequi")} className="bg-purple-600 text-white rounded px-3 py-1 text-xs font-bold">{copiado === "nequi" ? "✓ Copiado" : "Copiar"}</button>
                  </div>
                )}
                {config.daviplata && (
                  <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                    <div><p className="text-xs text-red-600 font-bold">DAVIPLATA</p><p className="font-bold">{config.daviplata}</p></div>
                    <button onClick={() => copiar(config.daviplata!, "daviplata")} className="bg-red-600 text-white rounded px-3 py-1 text-xs font-bold">{copiado === "daviplata" ? "✓ Copiado" : "Copiar"}</button>
                  </div>
                )}
                {config.bancolombia && (
                  <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                    <div><p className="text-xs text-yellow-700 font-bold">BANCOLOMBIA</p><p className="font-bold">{config.bancolombia}</p></div>
                    <button onClick={() => copiar(config.bancolombia!, "bancolombia")} className="bg-yellow-600 text-white rounded px-3 py-1 text-xs font-bold">{copiado === "bancolombia" ? "✓ Copiado" : "Copiar"}</button>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t-2 border-stone-200 bg-stone-50 rounded-xl p-3">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-extrabold">TOTAL</span>
                  <span className="font-extrabold text-emerald-700">${total.toLocaleString()}</span>
                </div>
              </div>

              <button onClick={enviar} disabled={enviando} className="w-full mt-4 bg-[#fdb813] text-stone-900 rounded-xl py-4 font-extrabold text-lg disabled:opacity-50 hover:bg-[#e8a800] transition shadow-lg">
                {enviando ? "Enviando a cocina..." : `✓ Confirmar pedido · $${total.toLocaleString()}`}
              </button>
              <p className="text-xs text-stone-500 text-center mt-2">Al confirmar, el stock se descuenta automáticamente en inventario</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
