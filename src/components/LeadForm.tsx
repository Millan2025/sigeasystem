"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  onSuccess: () => void;
  tipoNegocio?: string;
}

export default function LeadForm({ onSuccess, tipoNegocio = "tienda" }: Props) {
  const supabase = createClient();
  const [form, setForm] = useState({ nombre: "", whatsapp: "", tipo_negocio: tipoNegocio });
  const [loading, setLoading] = useState(false);

  const guardar = async () => {
    if (!form.nombre || !form.whatsapp) {
      alert("Nombre y WhatsApp son obligatorios");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("crm_prospectos").insert({
      nombre: form.nombre,
      whatsapp: form.whatsapp,
      tipo_negocio: form.tipo_negocio,
      estado: "demo",
      fuente: "qr_publico",
      plan_interes: "barrio",
    });
    setLoading(false);
    if (error) {
      alert("Error al guardar: " + error.message);
      return;
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold text-stone-800 mb-2">Accede al dashboard completo</h2>
        <p className="text-sm text-stone-600 mb-4">
          Completa tus datos para ver finanzas, inventario, créditos y reportes del negocio.
        </p>
        <div className="space-y-3">
          <input
            placeholder="Tu nombre *"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full border rounded-lg p-3"
          />
          <input
            placeholder="WhatsApp (solo números) *"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className="w-full border rounded-lg p-3"
            type="tel"
          />
          <select
            value={form.tipo_negocio}
            onChange={(e) => setForm({ ...form, tipo_negocio: e.target.value })}
            className="w-full border rounded-lg p-3"
          >
            <option value="tienda">Tienda</option>
            <option value="panaderia">Panadería</option>
            <option value="carniceria">Carnicería</option>
            <option value="salsamentaria">Salsamentaria</option>
            <option value="ferreteria">Ferretería</option>
            <option value="restaurante">Restaurante</option>
            <option value="distribuidora">Distribuidora</option>
          </select>
          <button
            onClick={guardar}
            disabled={loading}
            className="w-full bg-emerald-600 text-white rounded-lg p-3 font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Acceder al dashboard completo"}
          </button>
        </div>
      </div>
    </div>
  );
}
