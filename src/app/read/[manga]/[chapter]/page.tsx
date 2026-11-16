import ChapterReader from "./ChapterReader";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ manga: string; chapter: string }>;
}) {
  const { manga, chapter } = await params;
  return <ChapterReader key={JSON.stringify([manga, chapter])} manga={manga} chapter={chapter} />;
}
