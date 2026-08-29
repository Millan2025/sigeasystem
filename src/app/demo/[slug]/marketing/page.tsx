import MarketingModule from "@/components/MarketingModule";
import { NEGOCIOS } from "@/config/negocios";

export default async function MarketingDemoPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tenant?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const negocio = (NEGOCIOS as any)[slug];
  return <MarketingModule tenantId={sp?.tenant || negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76"} negocioNombre={negocio?.titulo} negocioSlug={slug} />;
}