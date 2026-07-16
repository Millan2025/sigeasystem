import NegocioHome from "@/components/NegocioHome";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ClienteDashboardPage({ params }: Props) {
  const { slug } = await params;
  return <NegocioHome negocioSlug={slug} />;
}
