import MarketingModule from "@/components/MarketingModule";

export default async function MarketingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const NEGOCIOS: any = {
    "pollo-broster": { tenantId: "2382b73d-0f4d-4f1a-98a0-f25ad0fb7b11", titulo: "Pollo Broster" },
    "la-casa-del-pan": { tenantId: "20e53ee4-44df-40d5-bcd0-cc8b5fbc8965", titulo: "La Casa del Pan" },
  };
  const negocio = NEGOCIOS[slug];
  return <MarketingModule tenantId={negocio?.tenantId || ""} negocioNombre={negocio?.titulo} />;
}
