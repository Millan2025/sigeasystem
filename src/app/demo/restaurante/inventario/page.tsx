"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, RefreshCw, FileUp, FileDown } from "lucide-react";

const NEGOCIOS = {
  panaderia: { titulo: "Panadería Doña Rosa", categoria: "Panaderia", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  restaurante: { titulo: "Restaurante Caribe", categoria: "Restaurante", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  carniceria: { titulo: "Carnicería El Buen Sabor", categoria: "Carniceria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  salsamentaria: { titulo: "Salsamentaria La Especial", categoria: "Salsamentaria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  ferreteria: { titulo: "Ferretería El Tornillo", categoria: "Ferreteria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  tienda: { titulo: "Tienda Surtimax", categoria: "Tienda", tenantId: "58d06407-6d1c-4beb-acee-8965001fbbee" },
};

export default function InventarioPage() {
  const pathname = usePathname();
  const [movimientos, setMovimientos] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ producto_id: '', tipo: 'entrada', cantidad: 1, motivo: '' });
  const [productos, setProductos] = useState([]);

  const pathParts = pathname?.split('/') || [];
  const negocioSlug = pathParts[2] || 'restaurante';
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantId = negocio?.tenantId || '7e045520-5e36-4e3f-a39f-10ea7d6dce76';

  useEffect(() => {
    fetch(`/api/products?tenant=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setProductos(d.data || []);
      });
  }, [tenantId]);

  const cargarDatos = () => {
    setLoading(true);
    fetch(`/api/inventory?tenant=${tenantId}&stock=true`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setStock(d.data || []);
      });

    fetch(`/api/inventory?tenant=${tenantId}&limit=50`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setMovimientos(d.data || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  const registrarMovimiento = async () => {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        tenant_id: tenantId,
        cantidad: parseInt(form.cantidad as any)
      })
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      cargarDatos();
      setForm({ producto_id: '', tipo: 'entrada', cantidad: 1, motivo: '' });
    } else {
      alert(data.error || 'Error al registrar movimiento');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    alert('Funcionalidad de carga masiva en desarrollo');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-stone-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Inventario - {negocio?.titulo || 'Negocio'}</h1>
        <div className="flex-1"></div>
        <button onClick={cargarDatos} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5" />
        </button>
        <button onClick={() => setShowModal(true)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" /> Movimiento
        </button>
        <button className="p-2 hover:bg-stone-100 rounded-xl relative">
          <FileUp className="w-5 h-5" />
          <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
        </button>
        <button className="p-2 hover:bg-stone-100 rounded-xl">
          <FileDown className="w-5 h-5" />
        </button>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-6">
          <h2 className="font-semibold text-stone-800 mb-3">Stock Actual</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-2">Producto</th>
                  <th className="text-left p-2">Stock</th>
                  <th className="text-left p-2">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((p: any) => (
                  <tr key={p.id} className="border-b border-stone-100">
                    <td className="p-2">{p.nombre}</td>
                    <td className="p-2 font-semibold">{p.stock_actual}</td>
                    <td className="p-2 text-stone-700">{p.unidad || 'unidad'}</td>
                  </tr>
                ))}
                {stock.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-stone-600">No hay productos</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          <h2 className="font-semibold text-stone-800 mb-3">Últimos Movimientos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Producto</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Cantidad</th>
                  <th className="text-left p-2">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m: any) => (
                  <tr key={m.id} className="border-b border-stone-100">
                    <td className="p-2">{new Date(m.created_at).toLocaleString()}</td>
                    <td className="p-2">{m.productos?.nombre || 'Producto'}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        m.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-700' :
                        m.tipo === 'salida' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="p-2 font-medium">{m.cantidad}</td>
                    <td className="p-2 text-stone-700">{m.motivo || '-'}</td>
                  </tr>
                ))}
                {movimientos.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-stone-600">No hay movimientos</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Registrar Movimiento</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Producto</label>
                <select
                  value={form.producto_id}
                  onChange={e => setForm({ ...form, producto_id: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2"
                >
                  <option value="">Seleccionar...</option>
                  {productos.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm({ ...form, tipo: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2"
                >
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="ajuste">Ajuste</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={form.cantidad}
                  onChange={e => setForm({ ...form, cantidad: parseInt(e.target.value) || 1 })}
                  className="w-full border border-stone-300 rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Motivo (opcional)</label>
                <input
                  type="text"
                  value={form.motivo}
                  onChange={e => setForm({ ...form, motivo: e.target.value })}
                  className="w-full border border-stone-300 rounded-xl p-2"
                  placeholder="Ej. Compra a proveedor, ajuste por conteo"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-stone-300 rounded-xl">Cancelar</button>
              <button onClick={registrarMovimiento} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

