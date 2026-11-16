"use client";

/* eslint-disable @next/next/no-img-element -- Chapter pages are served directly from MangaRead. */
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, House } from "lucide-react";
import { useEffect, useState } from "react";
import { chapterHref, getCachedChapter, loadChapter, mangaHref, type ChapterData } from "@/lib/manga";

const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-violet-300 sm:px-4";

function ReaderNav({ manga, data, bottom = false }: { manga: string; data?: ChapterData; bottom?: boolean }) {
  const slug = data?.slug ?? manga;
  return (
    <nav aria-label={bottom ? "Chapter navigation at end" : "Chapter navigation"} className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
      <Link href="/" className={button}><House size={17} aria-hidden /> Home</Link>
      <Link href={mangaHref(slug)} className={button}><BookOpen size={17} aria-hidden /> Manga</Link>
      {data && (
        <>
          {data.previous ? (
            <Link href={chapterHref(slug, data.previous.id)} prefetch={false} className={button} rel="prev">
              <ArrowLeft size={17} aria-hidden /> Previous chapter
            </Link>
          ) : <button type="button" disabled className={`${button} opacity-40`}><ArrowLeft size={17} aria-hidden /> Previous chapter</button>}
          {data.next ? (
            <Link href={chapterHref(slug, data.next.id)} prefetch={false} className={button} rel="next">
              Next chapter <ArrowRight size={17} aria-hidden />
            </Link>
          ) : <button type="button" disabled className={`${button} opacity-40`}>Next chapter <ArrowRight size={17} aria-hidden /></button>}
        </>
      )}
    </nav>
  );
}

export default function ChapterReader({ manga, chapter }: { manga: string; chapter: string }) {
  const [data, setData] = useState<ChapterData>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    const cached = getCachedChapter(manga, chapter);
    const result = cached ? Promise.resolve(cached) : loadChapter(manga, chapter);
    result.then((response) => {
      if (current) setData(response);
    }).catch((failure: Error) => {
      if (current) setError(failure.message);
    });
    return () => { current = false; };
  }, [manga, chapter, attempt]);

  useEffect(() => {
    if (!data) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || connection?.effectiveType?.endsWith("2g")) return;

    let active = true;
    const timer = window.setTimeout(() => {
      for (const neighbor of [data.next, data.previous]) {
        if (!neighbor || getCachedChapter(data.slug, neighbor.id)) continue;
        void loadChapter(data.slug, neighbor.id)
          .then((chapter) => {
            if (!active || !chapter.images[0]) return;
            const image = new window.Image();
            image.fetchPriority = "low";
            image.src = chapter.images[0];
          })
          .catch(() => { /* A failed prefetch can be retried by opening the chapter. */ });
      }
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [data]);

  return (
    <article className="mx-auto min-h-screen max-w-5xl px-3 pb-14 pt-24 sm:px-6">
      <ReaderNav manga={manga} data={data} />
      {error ? (
        <div className="mt-9 text-center">
          <p role="alert" className="text-rose-300">{error}</p>
          <button type="button" className="mt-3 text-violet-200 underline" onClick={() => {
            setError("");
            setAttempt((value) => value + 1);
          }}>Try again</button>
        </div>
      ) : !data ? (
        <p role="status" className="mt-9 text-center text-zinc-300">Loading chapter…</p>
      ) : (
        <>
          <header className="mb-5 mt-7 text-center">
            <p className="text-sm font-medium text-violet-300">{data.manga}</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{data.chapter.title}</h1>
          </header>
          <div className="mx-auto max-w-3xl bg-black">
            {data.images.map((src, index) => (
              <img
                key={`${index}-${src}`}
                src={src}
                alt={`Page ${index + 1}`}
                className="block h-auto w-full"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding="async"
              />
            ))}
          </div>
          <div className="mt-6">
            <ReaderNav manga={manga} data={data} bottom />
          </div>
        </>
      )}
    </article>
  );
}
