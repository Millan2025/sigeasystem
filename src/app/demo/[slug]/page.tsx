import NegocioHome from "@/components/NegocioHome";

// Next.js 15+: params es una Promise
export default async function DynamicNegocioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <NegocioHome negocioSlug={slug} />;
}
