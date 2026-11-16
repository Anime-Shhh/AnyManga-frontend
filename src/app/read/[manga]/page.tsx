import MangaPageClient from "./MangaPageClient";

export default async function MangaPage({
  params,
}: {
  params: Promise<{ manga: string }>;
}) {
  const { manga } = await params;
  return <MangaPageClient key={manga} manga={manga} />;
}
