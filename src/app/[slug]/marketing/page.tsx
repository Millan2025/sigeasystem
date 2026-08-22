import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let tenant: { id: string; nombre: string } | null = null;
  if (sp.tenant) {
    const { data } = await supabase.from("tenants").select("id, nombre").eq("id", sp.tenant).maybeSingle();
    tenant = data;
  }
  if (!tenant) {
    const { data } = await supabase.from("tenants").select("id, nombre").eq("slug", slug).maybeSingle();
    tenant = data;
  }
  if (!tenant) redirect("/404");

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-6">
          <h1 className="text-3xl font-bold">Marketing Digital</h1>
          <p className="text-emerald-100 mt-1">{tenant.nombre}</p>
        </div>
        <WhatsAppMarketing tenantId={tenant.id} negocioNombre={tenant.nombre} />
      </div>
    </div>
  );
}
