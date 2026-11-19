import ChapterReader from "./ChapterReader";

export default async function ChapterPage({
  params, searchParams,
}: {
  searchParams: Promise<{ language?: string }>;
  params: Promise<{ manga: string; chapter: string }>;
}) {
  const { manga, chapter } = await params;
  const { language = "en" } = await searchParams;
  return <ChapterReader key={JSON.stringify([manga, chapter, language])} manga={manga} chapter={chapter} language={language} />;
}
