"use client";
import Link from "next/link";
import MangaImage from "@/components/MangaImage";
import MangaDescription from "@/components/MangaDescription";
import ChapterBrowser from "@/components/ChapterBrowser";
import { useEffect, useState } from "react";
import { mangaAPI, type MangaDetails } from "@/lib/manga";

export default function MangaPageClient({ manga }: { manga: string }) {
  const [language, setLanguage] = useState("en");
  const [loaded, setLoaded] = useState<{ key: string; data: MangaDetails }>();
  const [failure, setFailure] = useState<{ key: string; message: string }>();
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([manga, language, attempt]);
  const details = loaded?.key === key ? loaded.data : undefined;
  const error = failure?.key === key ? failure.message : "";
  useEffect(() => {
    const request = new AbortController();
    mangaAPI<MangaDetails>("mangapage", { title: manga, language }, request.signal)
      .then((data) => { if (!request.signal.aborted) setLoaded({ key, data }); })
      .catch((error: Error) => { if (!request.signal.aborted) setFailure({ key, message: error.message }); });
    return () => request.abort();
  }, [manga, language, key]);
  return <div className="relative isolate min-h-screen overflow-hidden bg-[#0c0a14]">
    {details?.image && <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <MangaImage src={details.image} fallbackSrc={details.imageFallback} alt="" className="size-full scale-110 object-cover object-top opacity-40 blur-[36px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0a14]/55 via-[#0c0a14]/70 to-[#0c0a14]" />
    </div>}
    <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-8">
      <Link href="/read" className="text-sm font-medium text-white/65 hover:text-white">← Browse manga</Link>
      {error ? <div className="mt-7 rounded-2xl border border-white/10 bg-black/30 p-6"><p role="alert" className="text-rose-300">{error}</p><button type="button" className="mt-3 text-violet-200 underline" onClick={() => setAttempt((n) => n + 1)}>Try again</button></div> : !details ? <p role="status" className="mt-8 text-zinc-300">Loading manga details…</p> : <>
        <article className="mt-6 grid gap-7 rounded-3xl border border-white/10 bg-[#14121d]/75 p-5 shadow-2xl sm:p-8 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-9">
          <div>{details.image && <MangaImage src={details.image} fallbackSrc={details.imageFallback} alt={`${details.name} cover`} className="mx-auto w-40 rounded-2xl border border-white/15 shadow-2xl md:w-full" />}</div>
          <div className="min-w-0">
            <p className="mb-2 text-xs font-medium uppercase tracking-[.25em] text-white/45">Discover your next chapter</p>
            <h1 className="break-words text-4xl font-bold tracking-tight sm:text-5xl">{details.name}</h1>
            {!!details.authors?.length && <p className="mt-3 text-sm text-white/65">By {details.authors.join(" · ")}</p>}
            {!!details.genres?.length && <ul aria-label="Genres" className="mt-4 flex flex-wrap gap-2">{details.genres.map((genre, i) => <li key={`${genre}-${i}`} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/65">{genre}</li>)}</ul>}
            <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-white/10 py-4">
              <p className="text-sm text-white/65"><strong className="text-white">{details.chapterEntries.length.toLocaleString()}</strong> chapter entries</p>
              <label className="flex items-center gap-2 text-xs text-white/60">Chapter language<select aria-label="Chapter language" className="min-h-10 rounded-lg border border-white/15 bg-[#191721] px-3 text-sm text-white" value={language} onChange={(e) => setLanguage(e.target.value)}>{Array.from(new Set(["en", language, ...details.languages ?? []])).sort().map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
            </div>
            {details.description && <MangaDescription key={key} description={details.description} />}
            {!!details.sources?.length && <p className="mt-5 text-xs leading-5 text-white/40">Sources: {details.sources.map((source) => source.name).join(" · ")}</p>}
          </div>
        </article>
        <ChapterBrowser key={key} details={details} language={language} />
      </>}
    </div>
  </div>;
}
