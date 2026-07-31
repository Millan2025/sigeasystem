"use client";

import { useState } from "react";
import BackButton from "@/components/BackButton";
import { Download, Upload, FileSpreadsheet } from "lucide-react";

export default function ExcelMaestroPage() {
  const [importando, setImportando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const descargarPlantilla = () => {
    // Función simplificada para descargar plantilla
    alert("Función de descarga de plantilla (implementar)");
  };

  const importarExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportando(true);
    setMensaje("Importando...");
    // Simular importación
    setTimeout(() => {
      setMensaje("✅ Importación completada (simulada)");
      setImportando(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <BackButton />
        <h1 className="text-xl font-bold text-stone-800 flex-1">Excel Maestro</h1>
      </header>
      <div className="p-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
          <h2 className="text-lg font-bold text-stone-800 mb-4">Gestión de Plantillas Excel</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={descargarPlantilla}
              className="bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-600"
            >
              <Download className="w-4 h-4" /> Descargar Plantilla
            </button>
            <label className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-blue-600">
              <Upload className="w-4 h-4" /> Importar Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={importarExcel}
                className="hidden"
                disabled={importando}
              />
            </label>
            {mensaje && (
              <div className="w-full mt-4 p-3 bg-stone-100 rounded-xl text-stone-700">
                {mensaje}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}