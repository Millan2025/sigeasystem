"use client";`nimport { useTenant } from "@/hooks/useTenant";`nimport BackButton from "@/components/BackButton";
const formatDate = (fechaStr: string) => {
  if (!fechaStr) return "-";
  const partes = fechaStr.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
};
export default function ComprasPage() {  return (    <div className="min-h-screen bg-stone-50">      <header className="bg-white shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">        <BackButton />        <h1 className="text-xl font-bold text-stone-800 flex-1">Compras</h1>      </header>      <div className="p-4 max-w-7xl mx-auto">        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">          <p className="text-stone-500">M├│dulo de Compras en construcci├│n</p>          <p className="text-sm text-stone-400 mt-2">Funcionalidad disponible pr├│ximamente</p>        </div>      </div>    </div>  );}