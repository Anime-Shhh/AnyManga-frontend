"use client";

/* eslint-disable @next/next/no-img-element -- MangaRead serves remote covers directly. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { mangaAPI, mangaHref, type MangaCard, type SearchResults as Results } from "@/lib/manga";

export default function SearchResults({ query }: { query: string }) {
  const [items, setItems] = useState<MangaCard[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const request = new AbortController();
    mangaAPI<Results>("search", { q: query, page: String(page) }, request.signal)
      .then((response) => {
        if (request.signal.aborted) return;
        setItems((current) => {
          if (page === 1) return response.results;
          const seen = new Set(current.map(({ slug }) => slug));
          return [...current, ...response.results.filter(({ slug }) => !seen.has(slug))];
        });
        setTotal(response.total);
        setHasMore(response.hasMore);
      })
      .catch((failure: Error) => {
        if (!request.signal.aborted) setError(failure.message);
      })
      .finally(() => {
        if (!request.signal.aborted) setLoading(false);
      });
    return () => request.abort();
  }, [query, page, attempt]);

  return (
    <section className="mt-4" aria-label="Search results" aria-busy={loading}>
      {total !== null && total > 0 && (
        <p className="mb-6 text-sm text-zinc-300">{total} {total === 1 ? "result" : "results"}</p>
      )}
      {total === 0 && <p role="status" className="mt-5 text-zinc-300">No manga found for this search.</p>}
      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <li key={item.slug}>
              <Link href={mangaHref(item.slug)} prefetch={false} className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-violet-300">
                <div className="aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-violet-950/40 group-hover:border-violet-400">
                  {item.image && <img src={item.image} alt="" className="size-full object-cover" loading="lazy" />}
                </div>
                <p title={item.title} className="mt-2 line-clamp-3 font-medium group-hover:text-violet-200">{item.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {loading && <p role="status" className="mt-6 text-zinc-300">Searching manga sources…</p>}
      {error && <p role="alert" className="mt-6 text-rose-300">{error}</p>}
      {(error || hasMore) && (
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setError("");
            if (error) setAttempt((value) => value + 1);
            else setPage((value) => value + 1);
          }}
          className="mt-6 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-50"
        >
          {error ? "Try again" : "Load more"}
        </button>
      )}
    </section>
  );
}
