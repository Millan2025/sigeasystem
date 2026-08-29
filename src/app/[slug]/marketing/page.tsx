import MarketingModule from "@/components/MarketingModule";
import { NEGOCIOS } from "@/config/negocios";

export default async function MarketingPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tenant?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const negocio = (NEGOCIOS as any)[slug];
  return <MarketingModule tenantId={sp?.tenant || negocio?.tenantId || ""} negocioNombre={negocio?.titulo} negocioSlug={slug} />;
}