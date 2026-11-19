"use client";

/* eslint-disable @next/next/no-img-element -- Covers come from the manga service. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { chapterHref, mangaAPI, type MangaDetails } from "@/lib/manga";

export default function MangaPageClient({ manga }: { manga: string }) {
  const [language, setLanguage] = useState("en");
  const [details, setDetails] = useState<MangaDetails>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const request = new AbortController();
    mangaAPI<MangaDetails>("mangapage", { title: manga, language }, request.signal)
      .then((data) => {
        if (!request.signal.aborted) setDetails(data);
      })
      .catch((failure: Error) => {
        if (!request.signal.aborted) setError(failure.message);
      });
    return () => request.abort();
  }, [manga, language, attempt]);

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-28 sm:px-8">
      <Link href="/read" className="text-sm font-medium text-violet-300 hover:text-white">← Browse manga</Link>
      {error ? (
        <div className="mt-6">
          <p role="alert" className="text-rose-300">{error}</p>
          <button type="button" className="mt-3 text-violet-200 underline" onClick={() => {
            setError("");
            setAttempt((value) => value + 1);
          }}>Try again</button>
        </div>
      ) : !details ? (
        <p role="status" className="mt-6 text-zinc-300">Loading manga details…</p>
      ) : (
        <div className="mt-6 grid gap-7 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-10">
          {details.image && (
            <img
              src={details.image}
              alt=""
              className="aspect-[2/3] w-44 rounded-xl border border-white/10 object-cover md:w-full"
            />
          )}
          <div className={details.image ? "" : "md:col-span-2"}>
            <h1 className="text-3xl font-semibold sm:text-5xl">{details.name}</h1>
            {details.sources && <p className="mt-3 text-xs text-zinc-400">Sources: {details.sources.map((source) => source.name).join(" · ")}</p>}
            {!!details.languages?.length && <label className="mt-4 flex items-center gap-3 text-sm text-zinc-300">Chapter language
              <select className="rounded-lg border border-white/15 bg-[#1b152a] p-2 text-white" value={language} onChange={(event) => { setLanguage(event.target.value); setError(""); }}>
                {Array.from(new Set(["en", ...details.languages])).sort().map((code) => <option key={code} value={code}>{code}</option>)}
              </select>
            </label>}
            {details.description && (
              <p className="mt-5 max-w-3xl whitespace-pre-line leading-relaxed text-zinc-300">{details.description}</p>
            )}
            <div className="mb-3 mt-9 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold">Chapters</h2>
              {details.chapterEntries.length > 0 && language === "en" && (
                <Link href={`/download?${new URLSearchParams({ manga: details.slug })}`} className="text-sm text-violet-200 hover:text-white">Download PDF</Link>
              )}
            </div>
            {details.chapterEntries.length === 0 ? <p className="text-zinc-300">No chapters listed.</p> : (
              <ol className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
                {details.chapterEntries.map((chapter) => (
                  <li key={chapter.id}>
                    <Link
                      href={chapterHref(details.slug, chapter.id, language)}
                      prefetch={false}
                      className="block px-4 py-3 text-sm text-zinc-100 hover:bg-violet-400/10 focus-visible:bg-violet-400/10"
                    >
                      {chapter.title}
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
