"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Search, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Venta {
  id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  metodo_pago: string;
  cliente: string;
  fecha: string;
}

export default function VentasPage() {
  const { isDemo, demoTenantId } = useDemoMode()
  const supabase = createClient();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalVentas, setTotalVentas] = useState(0);

  useEffect(() => {
    cargarVentas();
  }, []);

  const cargarVentas = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("usuarios")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!userData) return;

      const { data, error } = await supabase
        .from("ventas")
        .select("*")
        .eq("tenant_id", userData.tenant_id)
        .order("fecha", { ascending: false });

      if (error) {
        console.error("Error:", error);
      } else {
        setVentas(data || []);
        const total = data?.reduce((sum, v) => sum + v.subtotal, 0) || 0;
        setTotalVentas(total);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const ventasFiltradas = ventas.filter(v =>
    v.producto_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportarExcel = () => {
    if (ventas.length === 0) return;
    const headers = ["Producto;Cantidad;Precio Unitario;Subtotal;Método Pago;Cliente;Fecha"];
    const rows = ventas.map(v => 
      [v.producto_nombre, v.cantidad, v.precio_unitario, v.subtotal, v.metodo_pago, v.cliente, new Date(v.fecha).toLocaleString()].join(";")
    );
    const csv = "\uFEFF" + headers.join("\n") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ventas_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-amber-300">💰 Ventas</h1>
            <p className="text-xs text-stone-400">Historial de ventas</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-400">Total</p>
            <p className="text-lg font-bold text-emerald-400">${totalVentas.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar venta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl focus:border-amber-400 outline-none text-stone-800"
            />
          </div>
          <button onClick={exportarExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition text-sm">
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-stone-400">Cargando...</div>
          ) : ventasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              {searchTerm ? "No se encontraron ventas" : "No hay ventas registradas"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-amber-50 border-b border-stone-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Producto</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Cantidad</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Precio</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Subtotal</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Método</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Cliente</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.map((v) => (
                    <tr key={v.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition">
                      <td className="px-4 py-3 text-sm text-stone-800">{v.producto_nombre}</td>
                      <td className="px-4 py-3 text-sm text-stone-600">{v.cantidad}</td>
                      <td className="px-4 py-3 text-sm text-stone-600">${v.precio_unitario.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-bold text-emerald-600">${v.subtotal.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          v.metodo_pago === "Efectivo" ? "bg-emerald-100 text-emerald-700" :
                          v.metodo_pago === "Crédito" ? "bg-rose-100 text-rose-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>{v.metodo_pago}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600">{v.cliente}</td>
                      <td className="px-4 py-3 text-sm text-stone-400">{new Date(v.fecha).toLocaleString()}</td>
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

