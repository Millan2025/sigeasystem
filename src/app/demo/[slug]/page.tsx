import NegocioHome from "@/components/NegocioHome";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DynamicNegocioPage({ params }: Props) {
  const { slug } = await params;
  return <NegocioHome negocioSlug={slug} />;
}
