"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const TENANT = "demo-restaurante";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Prod = { id: string; nombre: string; precio: number; categoria?: string; imagen?: string; descripcion?: string };
type Item = { producto_id: string; nombre: string; precio: number; cantidad: number; obs: string };
type Pedido = { id: string; estado: string; total: number; created_at: string; observaciones: string };

export default function MesaPage() {
  const [mesa, setMesa] = useState("");
  const [productos, setProductos] = useState<Prod[]>([]);
  const [nombre, setNombre] = useState("");
  const [comensales, setComensales] = useState(1);
  const [carrito, setCarrito] = useState<Item[]>([]);
  const [metodo_pago, setMetodo_pago] = useState("Efectivo");
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [pedidosMesa, setPedidosMesa] = useState<Pedido[]>([]);
  const [vista, setVista] = useState<"menu" | "estado">("menu");

  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("m") || "";
    setMesa(m.toUpperCase());
    (async () => {
      const { data } = await sb.from("products").select("*").eq("tenant_id", TENANT).order("nombre");
      setProductos((data as Prod[]) || []);
    })();
  }, []);

  // Polling cada 5s de pedidos de ESTA mesa (identificados por direccion="MESA XX")
  useEffect(() => {
    if (!mesa) return;
    const cargar = async () => {
      const r = await fetch(`/api/pedidos?tenant=${TENANT}`);
      const j = await r.json();
      const todos: Pedido[] = j.data || j || [];
      const mios = todos.filter((p: any) => (p.direccion || "").toUpperCase() === "MESA " + mesa);
      setPedidosMesa(mios);
    };
    cargar();
    const t = setInterval(cargar, 5000);
    return () => clearInterval(t);
  }, [mesa]);

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

  const enviar = async () => {
    if (!nombre.trim()) return alert("Ingresa tu nombre");
    if (carrito.length === 0) return alert("Agrega algo al pedido");
    setEnviando(true);
    const items = carrito.map((x) => ({
      producto_id: x.producto_id, nombre: x.nombre, precio: x.precio, cantidad: x.cantidad,
    }));
    const obsGlobal = carrito.filter((x) => x.obs).map((x) => `${x.nombre} x${x.cantidad}: ${x.obs}`).join(" | ");
    const obsFinal = `COMENSALES:${comensales} | CLIENTE:${nombre}` + (obsGlobal ? " | " + obsGlobal : "");
    const r = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: TENANT,
        cliente: `${nombre} (MESA ${mesa})`,
        direccion: `MESA ${mesa}`,
        telefono: "",
        metodo_pago,
        total,
        items,
        observaciones: obsFinal,
      }),
    });
    const j = await r.json();
    setEnviando(false);
    if (j.success) {
      setOk("✅ Pedido enviado a cocina");
      setCarrito([]);
      setVista("estado");
    } else {
      alert("Error: " + (j.error || "desconocido"));
    }
  };

  const pedirCuenta = async () => {
    if (!nombre.trim() && !window.confirm("¿Sin nombre? Sigue igual")) return;
    setEnviando(true);
    await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: TENANT,
        cliente: `SOLICITA MESERO (MESA ${mesa})`,
        direccion: `MESA ${mesa}`,
        telefono: "",
        metodo_pago: "Solicita mesero",
        total: 0,
        items: [{ producto_id: "mesero", nombre: "Solicita mesero/cuenta", precio: 0, cantidad: 1 }],
        observaciones: `MESA ${mesa} solicita mesero para verificar cuenta y despedida`,
      }),
    });
    setEnviando(false);
    setOk("🙋 Mesero notificado, viene en camino");
    setTimeout(() => setOk(null), 4000);
  };

  const estadoColor = (e: string) => {
    if (e === "pendiente") return "bg-amber-500";
    if (e === "en_preparacion" || e === "en cocina") return "bg-blue-500";
    if (e === "listo" || e === "despachado") return "bg-emerald-500";
    if (e === "entregado") return "bg-stone-500";
    return "bg-stone-400";
  };
  const estadoLabel = (e: string) => {
    if (e === "pendiente") return "En preparación";
    if (e === "listo" || e === "despachado") return "Listo, mesero en camino";
    if (e === "entregado") return "Entregado";
    return "En preparación";
  };

  if (!mesa) return (
    <div className="min-h-screen bg-stone-900 text-stone-100 p-6 flex items-center justify-center">
      <p>⚠️ Falta el código de mesa en el QR (usa <code>?m=A1</code>)</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 pb-24">
      {/* Header mesa */}
      <div className="bg-stone-900 text-white px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-stone-400">Restaurante Demo</p>
            <h1 className="text-2xl font-extrabold text-[#fdb813]">🍽️ MESA {mesa}</h1>
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
            {/* Datos cliente */}
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

            {/* Menu por categorias */}
            <div className="mb-4">
              <p className="font-extrabold text-lg mb-2">📋 Menú</p>
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

            {/* Carrito */}
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
                  <p className="font-bold mb-2">💳 Forma de pago (regístrala al mesero)</p>
                  <div className="grid grid-cols-4 gap-1">
                    {["Efectivo", "Nequi", "Daviplata", "Tarjeta"].map((m) => (
                      <button key={m} onClick={() => setMetodo_pago(m)} className={"rounded-lg py-2 text-xs font-bold " + (metodo_pago === m ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-700")}>{m}</button>
                    ))}
                  </div>
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
            <p className="font-extrabold text-lg mb-3">📋 Pedidos de tu mesa</p>
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
                <p className="font-bold">${p.total.toLocaleString()}</p>
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
