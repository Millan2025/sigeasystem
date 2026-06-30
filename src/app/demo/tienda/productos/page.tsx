"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, RefreshCw } from "lucide-react";

const NEGOCIOS = {
  panaderia: { titulo: "Panadería Doña Rosa", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  restaurante: { titulo: "Restaurante Caribe", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  carniceria: { titulo: "Carnicería El Buen Sabor", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  salsamentaria: { titulo: "Salsamentaria La Especial", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  ferreteria: { titulo: "Ferretería El Tornillo", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  tienda: { titulo: "Tienda La Esquina De Calidad", tenantId: "58d06407-6d1c-4beb-acee-8965001fbbee" },
};

export default function ProductosAdminPage() {
  const pathname = usePathname();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    categoria: '',
    precio: 0,
    stock: 0,
    unidad: 'unidad',
    tipo_unidad: 'unidad',
    venta_por_peso: false,
    icono: '📦'
  });

  const pathParts = pathname?.split('/') || [];
  const negocioSlug = pathParts[2] || 'restaurante';
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantId = negocio?.tenantId || '7e045520-5e36-4e3f-a39f-10ea7d6dce76';

  const cargarProductos = () => {
    setLoading(true);
    fetch(`/api/products?tenant=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setProductos(d.data || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    cargarProductos();
  }, [tenantId]);

  const guardarProducto = async () => {
    const url = '/api/products';
    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { ...form, id: editing } : { ...form, tenant_id: tenantId };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) {
      setShowModal(false);
      setEditing(null);
      setForm({ nombre: '', categoria: '', precio: 0, stock: 0, unidad: 'unidad', tipo_unidad: 'unidad', venta_por_peso: false, icono: '📦' });
      cargarProductos();
    } else {
      alert(data.error || 'Error al guardar');
    }
  };

  const eliminarProducto = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      cargarProductos();
    } else {
      alert(data.error || 'Error al eliminar');
    }
  };

  const editarProducto = (p: any) => {
    setEditing(p.id);
    setForm({
      nombre: p.nombre,
      categoria: p.categoria,
      precio: p.precio,
      stock: p.stock,
      unidad: p.unidad || 'unidad',
      tipo_unidad: p.tipo_unidad || 'unidad',
      venta_por_peso: p.venta_por_peso || false,
      icono: p.icono || '📦'
    });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/demo/${negocioSlug}`} className="p-2 hover:bg-stone-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">Productos - {negocio?.titulo || 'Negocio'}</h1>
        <div className="flex-1"></div>
        <button onClick={cargarProductos} className="p-2 hover:bg-stone-100 rounded-xl">
          <RefreshCw className="w-5 h-5" />
        </button>
        <button onClick={() => { setEditing(null); setForm({ nombre: '', categoria: '', precio: 0, stock: 0, unidad: 'unidad', tipo_unidad: 'unidad', venta_por_peso: false, icono: '📦' }); setShowModal(true); }} 
          className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1">
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-2">Icono</th>
                  <th className="text-left p-2">Nombre</th>
                  <th className="text-left p-2">Categoría</th>
                  <th className="text-left p-2">Precio</th>
                  <th className="text-left p-2">Stock</th>
                  <th className="text-left p-2">Unidad</th>
                  <th className="text-left p-2">Venta por peso</th>
                  <th className="text-left p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p: any) => (
                  <tr key={p.id} className="border-b border-stone-100">
                    <td className="p-2 text-2xl">{p.icono || '📦'}</td>
                    <td className="p-2 font-medium">{p.nombre}</td>
                    <td className="p-2 text-stone-700">{p.categoria}</td>
                    <td className="p-2">${p.precio?.toLocaleString()}</td>
                    <td className="p-2">{p.stock}</td>
                    <td className="p-2 text-stone-700">{p.tipo_unidad}</td>
                    <td className="p-2">{p.venta_por_peso ? '✅' : '❌'}</td>
                    <td className="p-2 flex gap-2">
                      <button onClick={() => editarProducto(p)} className="p-1 hover:bg-stone-100 rounded"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => eliminarProducto(p.id)} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {productos.length === 0 && <tr><td colSpan={8} className="p-4 text-center text-stone-600">No hay productos</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editing ? 'Editar' : 'Nuevo'} Producto</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-stone-700">Nombre *</label>
                <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Categoría *</label>
                <input type="text" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Precio</label>
                <input type="number" step="0.01" value={form.precio} onChange={e => setForm({...form, precio: parseFloat(e.target.value) || 0})} className="w-full border border-stone-300 rounded-xl p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Stock inicial</label>
                <input type="number" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value) || 0})} className="w-full border border-stone-300 rounded-xl p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Unidad</label>
                <select value={form.tipo_unidad} onChange={e => setForm({...form, tipo_unidad: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2">
                  <option value="unidad">Unidad</option>
                  <option value="kilogramo">Kilogramo</option>
                  <option value="libra">Libra</option>
                  <option value="gramo">Gramo</option>
                  <option value="litro">Litro</option>
                  <option value="mililitro">Mililitro</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.venta_por_peso} onChange={e => setForm({...form, venta_por_peso: e.target.checked})} />
                <label className="text-sm font-medium text-stone-700">Venta por peso</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Icono (emoji)</label>
                <input type="text" value={form.icono} onChange={e => setForm({...form, icono: e.target.value})} className="w-full border border-stone-300 rounded-xl p-2" maxLength={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-stone-300 rounded-xl">Cancelar</button>
              <button onClick={guardarProducto} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

