"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit2, Trash2, Download, Search, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Colaborador {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  cargo: string;
  fecha_contratacion: string;
  salario: number;
  estado: string;
  horario: any;
  permisos: any;
  observaciones: string;
}

export default function PersonalPage() {
  const supabase = createClient();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Colaborador | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    cargo: "",
    fecha_contratacion: "",
    salario: "",
    estado: "activo",
    horario: {
      lunes: { entrada: "08:00", salida: "17:00" },
      martes: { entrada: "08:00", salida: "17:00" },
      miercoles: { entrada: "08:00", salida: "17:00" },
      jueves: { entrada: "08:00", salida: "17:00" },
      viernes: { entrada: "08:00", salida: "17:00" },
      sabado: { entrada: "", salida: "" },
      domingo: { entrada: "", salida: "" }
    },
    permisos: {
      admin: false,
      ventas: true,
      inventario: true,
      produccion: true,
      finanzas: false,
      personal: false
    },
    observaciones: ""
  });

  useEffect(() => {
    cargarColaboradores();
  }, []);

  const cargarColaboradores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("colaboradores")
      .select("*")
      .order("nombre");

    if (error) {
      console.error("Error:", error);
    } else {
      setColaboradores(data || []);
    }
    setLoading(false);
  };

  const guardarColaborador = async () => {
    const data = {
      ...form,
      salario: parseFloat(form.salario) || 0,
      horario: form.horario,
      permisos: form.permisos
    };

    if (editing) {
      const { error } = await supabase
        .from("colaboradores")
        .update(data)
        .eq("id", editing.id);
      if (error) { alert("Error: " + error.message); return; }
    } else {
      const { error } = await supabase
        .from("colaboradores")
        .insert([data]);
      if (error) { alert("Error: " + error.message); return; }
    }

    resetForm();
    cargarColaboradores();
  };

  const eliminarColaborador = async (id: string) => {
    if (!confirm("¿Eliminar este colaborador?")) return;
    const { error } = await supabase.from("colaboradores").delete().eq("id", id);
    if (error) { alert("Error: " + error.message); } else { cargarColaboradores(); }
  };

  const editarColaborador = (colaborador: Colaborador) => {
    setEditing(colaborador);
    setForm({
      nombre: colaborador.nombre,
      apellido: colaborador.apellido,
      email: colaborador.email,
      telefono: colaborador.telefono || "",
      cargo: colaborador.cargo || "",
      fecha_contratacion: colaborador.fecha_contratacion || "",
      salario: colaborador.salario?.toString() || "",
      estado: colaborador.estado || "activo",
      horario: colaborador.horario || form.horario,
      permisos: colaborador.permisos || form.permisos,
      observaciones: colaborador.observaciones || ""
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      cargo: "",
      fecha_contratacion: "",
      salario: "",
      estado: "activo",
      horario: {
        lunes: { entrada: "08:00", salida: "17:00" },
        martes: { entrada: "08:00", salida: "17:00" },
        miercoles: { entrada: "08:00", salida: "17:00" },
        jueves: { entrada: "08:00", salida: "17:00" },
        viernes: { entrada: "08:00", salida: "17:00" },
        sabado: { entrada: "", salida: "" },
        domingo: { entrada: "", salida: "" }
      },
      permisos: {
        admin: false,
        ventas: true,
        inventario: true,
        produccion: true,
        finanzas: false,
        personal: false
      },
      observaciones: ""
    });
    setEditing(null);
    setShowModal(false);
  };

  // Exportar a Excel con punto y coma (;)
  const exportarExcel = () => {
    if (colaboradores.length === 0) { alert("No hay colaboradores"); return; }

    const headers = ["Nombre;Apellido;Email;Teléfono;Cargo;Fecha Contratación;Salario;Estado;Observaciones"];
    const rows = colaboradores.map(c => 
      [c.nombre, c.apellido, c.email, c.telefono || "", c.cargo || "", 
       c.fecha_contratacion || "", c.salario?.toString() || "0", c.estado || "activo", c.observaciones || ""].join(";")
    );
    const csv = "\uFEFF" + headers.join("\n") + "\n" + rows.join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `colaboradores_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const colaboradoresFiltrados = colaboradores.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cargo && c.cargo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-amber-300">👥 Colaboradores</h1>
            <p className="text-xs text-stone-400">Gestiona el equipo de tu negocio</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Barra de herramientas */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl focus:border-amber-400 outline-none transition text-stone-800"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={exportarExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition text-sm">
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button onClick={() => setShowModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition text-sm">
              <Plus className="w-4 h-4" /> Nuevo
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-stone-400">Cargando...</div>
          ) : colaboradoresFiltrados.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              {searchTerm ? "No se encontraron colaboradores" : "No hay colaboradores registrados"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-amber-50 border-b border-stone-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Colaborador</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Cargo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-stone-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {colaboradoresFiltrados.map((c) => (
                    <tr key={c.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition">
                      <td className="px-4 py-3 text-sm text-stone-800 font-medium">{c.nombre} {c.apellido}</td>
                      <td className="px-4 py-3 text-sm text-stone-600">{c.cargo || "-"}</td>
                      <td className="px-4 py-3 text-sm text-stone-600">{c.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          c.estado === "activo" ? "bg-emerald-100 text-emerald-700" :
                          c.estado === "inactivo" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>{c.estado}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => editarColaborador(c)} className="p-1 text-amber-600 hover:bg-amber-50 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => eliminarColaborador(c.id)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => resetForm()}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-stone-800">{editing ? "Editar" : "Nuevo"} Colaborador</h2>
                <button onClick={resetForm} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-400 outline-none text-stone-800" /></div>
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Apellido *</label><input type="text" value={form.apellido} onChange={(e) => setForm({...form, apellido: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-400 outline-none text-stone-800" /></div>
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-400 outline-none text-stone-800" /></div>
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Teléfono</label><input type="text" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-400 outline-none text-stone-800" /></div>
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Cargo</label><input type="text" value={form.cargo} onChange={(e) => setForm({...form, cargo: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-400 outline-none text-stone-800" /></div>
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Fecha Contratación</label><input type="date" value={form.fecha_contratacion} onChange={(e) => setForm({...form, fecha_contratacion: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-400 outline-none text-stone-800" /></div>
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Salario</label><input type="number" value={form.salario} onChange={(e) => setForm({...form, salario: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-400 outline-none text-stone-800" /></div>
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Estado</label>
                  <select value={form.estado} onChange={(e) => setForm({...form, estado: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-400 outline-none text-stone-800">
                    <option value="activo">Activo</option><option value="inactivo">Inactivo</option><option value="vacaciones">Vacaciones</option>
                  </select>
                </div>
              </div>

              {/* Horario */}
              <div className="mt-4"><h3 className="font-semibold text-stone-700 mb-2">Horario Semanal</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["lunes","martes","miercoles","jueves","viernes","sabado","domingo"].map((dia) => (
                    <div key={dia} className="flex items-center gap-1 text-sm">
                      <span className="w-16 text-stone-600 capitalize">{dia.slice(0,3)}</span>
                      <input type="time" value={form.horario[dia]?.entrada || ""} onChange={(e) => setForm({...form, horario: {...form.horario, [dia]: {...form.horario[dia], entrada: e.target.value}}})} className="w-16 px-1 py-1 border border-stone-200 rounded text-sm text-stone-800" />
                      <span className="text-stone-400">-</span>
                      <input type="time" value={form.horario[dia]?.salida || ""} onChange={(e) => setForm({...form, horario: {...form.horario, [dia]: {...form.horario[dia], salida: e.target.value}}})} className="w-16 px-1 py-1 border border-stone-200 rounded text-sm text-stone-800" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div className="mt-4"><label className="block text-sm font-medium text-stone-700 mb-1">Observaciones</label>
                <textarea value={form.observaciones} onChange={(e) => setForm({...form, observaciones: e.target.value})} rows={2} className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:border-amber-400 outline-none text-stone-800" placeholder="Notas adicionales..." />
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={guardarColaborador} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-xl font-medium transition">{editing ? "Actualizar" : "Crear"} Colaborador</button>
                <button onClick={resetForm} className="px-6 py-2 border border-stone-300 rounded-xl hover:bg-stone-50 transition text-stone-700">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
