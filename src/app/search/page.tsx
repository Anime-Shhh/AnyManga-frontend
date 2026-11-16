import SearchResults from "./SearchResults";

export const metadata = { title: "Search manga | AnyManga" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-28 sm:px-8">
      <h1 className="text-3xl font-semibold sm:text-4xl">
        {query ? <>Results for “{query}”</> : "Search manga"}
      </h1>
      {query ? <SearchResults key={query} query={query} /> : (
        <p className="mt-4 text-zinc-300">Enter a title in the search bar.</p>
      )}
    </div>
  );
}
