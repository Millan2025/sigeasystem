import MarketingModule from "@/components/MarketingModule";
import WhatsAppMarketing from "@/components/WhatsAppMarketing";

const DEMO_TENANT_ID = "ferreteria-demo-tenant";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-6">
          <h1 className="text-3xl font-bold">Marketing Digital</h1>
          <p className="text-emerald-100 mt-1">
erreteria</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button className="bg-white text-stone-800 rounded-lg px-4 py-2 font-semibold border-2 border-stone-200">WhatsApp</button>
          <button className="bg-white text-stone-500 rounded-lg px-4 py-2 border border-stone-200">Piezas</button>
          <button className="bg-white text-stone-500 rounded-lg px-4 py-2 border border-stone-200">Otras Redes</button>
          <button className="bg-white text-stone-500 rounded-lg px-4 py-2 border border-stone-200">Cronograma</button>
        </div>

        <WhatsAppMarketing tenantId={DEMO_TENANT_ID} negocioNombre="
erreteria" />
      </div>
    </div>
  );
}
