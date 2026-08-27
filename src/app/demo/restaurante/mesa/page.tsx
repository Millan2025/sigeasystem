"use client";
import { useEffect, useState } from "react";

const TENANT_ID = "11111111-1111-1111-1111-111111111111";
const lbl = (c: string) => { const u = c.trim().toUpperCase(); return u.startsWith("MESA") ? u : "MESA " + u; };

type Prod = { id: string; nombre: string; precio: number; categoria?: string; descripcion?: string };
type Item = { producto_id: string; nombre: string; precio: number; cantidad: number; obs: string };
type Pedido = { id: string; estado: string; total: number; created_at: string; observaciones: string; direccion?: string };
type Config = { nequi?: string; bancolombia?: string; daviplata?: string };

export default function MesaPage() {
  const [mesa, setMesa] = useState("");
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

  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("m") || "";
    setMesa(m.trim().toUpperCase());
    setEtiqueta(lbl(m));
    (async () => {
      try {
        const r = await fetch(`/api/products?tenant=${TENANT_ID}`);
        const j = await r.json();
        const arr: any[] = j.data || [];
        arr.sort((a, b) => String(a.categoria || "").localeCompare(String(b.categoria || "")) || String(a.nombre).localeCompare(String(b.nombre)));
        setProductos(arr.map((p) => ({ id: p.id, nombre: p.nombre, precio: Number(p.precio), categoria: p.categoria, descripcion: p.descripcion })));
      } catch (e) {}
      try {
        const r2 = await fetch(`/api/tenant-config?tenant=${TENANT_ID}`);
        const j2 = await r2.json();
        if (j2.success && j2.data) setConfig(j2.data);
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (!etiqueta) return;
    const cargar = async () => {
      try {
        const r = await fetch(`/api/pedidos?tenant=${TENANT_ID}`);
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
    setCarrito((c) => {
      const e = c.find((x) => x.producto_id === p.id && !x.obs);
      if (e) return c.map((x) => (x === e ? { ...x, cantidad: x.cantidad + 1 } : x));
      return [...c, { producto_id: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1, obs: "" }];
    });
  };
  const setObs = (idx: number, obs: string) => setCarrito((c) => c.map((x, i) => (i === idx ? { ...x, obs } : x)));
  const setQty = (idx: number, cantidad: number) => setCarrito((c) => c.map((x, i) => (i === idx ? { ...x, cantidad: Math.max(1, cantidad) } : x)));
  const del = (idx: number) => setCarrito((c) => c.filter((_, i) => i !== idx));
  const total = carrito.reduce((a, x) => a + x.precio * x.cantidad, 0);

  const copiar = (texto: string, tipo: string) => { navigator.clipboard.writeText(texto); setCopiado(tipo); setTimeout(() => setCopiado(""), 2000); };

  const enviar = async () => {
    if (!nombre.trim()) return alert("Ingresa tu nombre");
    if (carrito.length === 0) return alert("Agrega algo al pedido");
    setEnviando(true);
    const items = carrito.map((x) => ({ producto_id: x.producto_id, nombre: x.nombre, precio: x.precio, cantidad: x.cantidad }));
    const obsGlobal = carrito.filter((x) => x.obs).map((x) => `${x.nombre} x${x.cantidad}: ${x.obs}`).join(" | ");
    const obsFinal = `COMENSALES:${comensales} | CLIENTE:${nombre}` + (obsGlobal ? " | " + obsGlobal : "");
    const r = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: TENANT_ID, cliente: `${nombre} (${etiqueta})`, direccion: etiqueta, telefono: "", metodo_pago, total, items, observaciones: obsFinal }),
    });
    const j = await r.json();
    setEnviando(false);
    if (j.success) { setOk("✅ Pedido enviado a cocina"); setCarrito([]); setVista("estado"); }
    else { alert("Error: " + (j.error || "desconocido")); }
  };

  const pedirCuenta = async () => {
    setEnviando(true);
    await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: TENANT_ID, cliente: `SOLICITA MESERO (${etiqueta})`, direccion: etiqueta, telefono: "", metodo_pago: "Solicita mesero", total: 0, items: [{ producto_id: "mesero", nombre: "Solicita mesero/cuenta", precio: 0, cantidad: 1 }], observaciones: `${etiqueta} solicita mesero para verificar cuenta y despedida` }),
    });
    setEnviando(false);
    setOk("🙋 Mesero notificado, viene en camino");
    setTimeout(() => setOk(null), 4000);
  };

  const estadoColor = (e: string) => e === "pendiente" ? "bg-amber-500" : (e === "listo" || e === "despachado") ? "bg-emerald-500" : "bg-stone-400";
  const estadoLabel = (e: string) => e === "pendiente" ? "En preparación" : (e === "listo" || e === "despachado") ? "Listo, mesero en camino" : "En preparación";

  if (!mesa) return <div className="min-h-screen bg-stone-900 text-white p-6 flex items-center justify-center">⚠️ Falta el código de mesa en el QR (usa ?m=A1)</div>;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 pb-24">
      <div className="bg-stone-900 text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-stone-400">Restaurante Demo SIGEA</p>
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
        {ok && <div className="bg-emerald-600 text-white rounded-xl p-3 mb-3 text-center font-bold animate-pulse">{ok}</div>}

        {vista === "menu" && (
          <>
            <div className="bg-white rounded-xl p-4 border border-stone-200 mb-4">
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
              <p className="font-extrabold text-lg mb-2">📋 Menú ({productos.length} platos)</p>
              {productos.length === 0 && <p className="text-stone-500 text-sm">Cargando menú…</p>}
              {Array.from(new Set(productos.map((p) => p.categoria || "Otros"))).map((cat) => (
                <div key={cat} className="mb-3">
                  <p className="font-bold text-sm text-stone-600 uppercase tracking-wide mb-1">{cat}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {productos.filter((p) => (p.categoria || "Otros") === cat).map((p) => (
                      <div key={p.id} className="bg-white rounded-xl p-3 border border-stone-200 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold">{p.nombre}</p>
                          {p.descripcion && <p className="text-xs text-stone-500 mt-0.5">{p.descripcion}</p>}
                          <p className="text-emerald-700 font-bold mt-1">${p.precio.toLocaleString()}</p>
                        </div>
                        <button onClick={() => add(p)} className="bg-stone-900 text-[#fdb813] rounded-lg px-3 py-2 text-sm font-bold">+ Añadir</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {carrito.length > 0 && (
              <div className="bg-white rounded-xl p-4 border-2 border-[#fdb813] mb-4">
                <p className="font-extrabold mb-2">🛒 Tu pedido ({carrito.length})</p>
                {carrito.map((x, i) => (
                  <div key={i} className="border-b border-stone-100 py-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm">{x.nombre}</p>
                      <button onClick={() => del(i)} className="text-rose-500 text-xs">✕</button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => setQty(i, x.cantidad - 1)} className="bg-stone-200 rounded px-2 text-sm">-</button>
                      <span className="font-bold w-6 text-center">{x.cantidad}</span>
                      <button onClick={() => setQty(i, x.cantidad + 1)} className="bg-stone-200 rounded px-2 text-sm">+</button>
                      <span className="text-sm text-stone-500 ml-2">${(x.precio * x.cantidad).toLocaleString()}</span>
                    </div>
                    <input value={x.obs} onChange={(e) => setObs(i, e.target.value)} placeholder="Observaciones: sin cebolla, término medio..." className="mt-1 w-full bg-stone-50 border border-stone-200 rounded px-2 py-1 text-xs" />
                  </div>
                ))}

                <div className="mt-3 pt-3 border-t border-stone-200">
                  <p className="font-bold mb-2">💳 Forma de pago</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button onClick={() => setMetodo_pago("Efectivo")} className={"rounded-lg py-2 text-sm font-bold " + (metodo_pago === "Efectivo" ? "bg-emerald-600 text-white" : "bg-stone-100")}>💵 Efectivo</button>
                    <button onClick={() => setMetodo_pago("Tarjeta")} className={"rounded-lg py-2 text-sm font-bold " + (metodo_pago === "Tarjeta" ? "bg-emerald-600 text-white" : "bg-stone-100")}>💳 Tarjeta</button>
                  </div>
                  <p className="font-bold text-sm mb-2">📱 Transferencia digital (toca para copiar)</p>
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

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-200">
                  <p className="font-extrabold text-lg">Total: <span className="text-emerald-700">${total.toLocaleString()}</span></p>
                  <button onClick={enviar} disabled={enviando} className="bg-[#fdb813] text-stone-900 rounded-lg px-5 py-3 font-extrabold disabled:opacity-50">
                    {enviando ? "Enviando..." : "✓ Enviar a cocina"}
                  </button>
                </div>
              </div>
            )}
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
    </div>
  );
}
