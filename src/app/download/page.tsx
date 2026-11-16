import DownloadForm from "./DownloadForm";

export const metadata = { title: "Download manga | AnyManga" };

export default async function DownloadPage({
  searchParams,
}: {
  searchParams: Promise<{ manga?: string | string[] }>;
}) {
  const { manga } = await searchParams;
  const initialManga = typeof manga === "string" ? manga : "";
  return <DownloadForm key={initialManga} initialManga={initialManga} />;
}
