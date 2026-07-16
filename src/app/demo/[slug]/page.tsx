import NegocioHome from "@/components/NegocioHome";

export default function DynamicNegocioPage({ params }: { params: { slug: string } }) {
  return <NegocioHome negocioSlug={params.slug} />;
}
