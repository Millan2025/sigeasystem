import { createClient } from "@supabase/supabase-js";
import WhatsAppMarketing from "@/components/WhatsAppMarketing";

export const dynamic = "force-dynamic";

export default async function MarketingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tenant?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tenantId = (sp.tenant || "").trim();

  let nombre = "";
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    if (tenantId) {
      const { data } = await supabase.from("tenants").select("id, nombre").eq("id", tenantId).maybeSingle();
      nombre = data?.nombre || "";
    }
    if (!nombre && slug) {
      const { data } = await supabase.from("tenants").select("id, nombre").eq("slug", slug).maybeSingle();
      nombre = data?.nombre || "";
    }
  } catch (e) {}

  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center text-stone-600">
          <p className="text-lg font-semibold">Entra desde la tarjeta Marketing de tu dashboard.</p>
        </div>
      </div>
    );
  }

  const titulo = nombre || "Tu negocio";

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Marketing Digital</h1>
          <p className="text-emerald-100 mt-1">{titulo}</p>
        </div>
        <WhatsAppMarketing tenantId={tenantId} negocioNombre={titulo} />
      </div>
    </div>
  );
}
