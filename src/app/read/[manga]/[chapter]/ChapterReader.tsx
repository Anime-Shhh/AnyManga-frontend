"use client";

import MangaImage from "@/components/MangaImage";
import { useNavigationVisibility } from "@/components/NavigationVisibility";
import { ReaderNav, ReaderOverlay } from "@/components/ReaderNavigation";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getCachedChapter, loadChapter, canPrefetchChapter, warmChapterImages, sourceNames, type ChapterData } from "@/lib/manga";

const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-violet-300 sm:px-4";

export default function ChapterReader({ manga, chapter, language = "en" }: { manga: string; chapter: string; language?: string }) {
  const { syncScroll, mobile } = useNavigationVisibility();
  const [data, setData] = useState<ChapterData | undefined>(() => getCachedChapter(manga, chapter, language));
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const nearEnd = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);
  const [imageGeneration, setImageGeneration] = useState(0);
  const skipped = useRef<string[]>([]);
  const refreshed = useRef(false);
  async function imageFailed() {
    if (refreshed.current) { setImageError(true); return; }
    refreshed.current = true;
    try { setData(await loadChapter(manga, chapter, language, skipped.current.join(","), true)); setImageGeneration((value) => value + 1); }
    catch { setImageError(true); }
  }

  useEffect(() => {
    let current = true;
    const cached = getCachedChapter(manga, chapter, language);
    const result = cached ? Promise.resolve(cached) : loadChapter(manga, chapter, language);
    result.then((response) => {
      if (current) setData(response);
    }).catch((failure: Error) => {
      if (current) setError(failure.message);
    });
    return () => { current = false; };
  }, [manga, chapter, language, attempt]);

  useEffect(() => {
    if (!data?.next || !canPrefetchChapter()) return;
    const timer = window.setTimeout(() => {
      void loadChapter(data.slug, data.next!.id, language).catch(() => {});
    }, 350);
    return () => window.clearTimeout(timer);
  }, [data, language]);

  useEffect(() => {
    if (!data?.next || !nearEnd.current || !canPrefetchChapter()) return;
    let active = true;
    let warming = false;
    const observer = new IntersectionObserver((entries) => {
      if (warming || !entries.some((entry) => entry.isIntersecting)) return;
      warming = true;
      // Refresh expired metadata before warming images with short-lived CDN URLs.
      void loadChapter(data.slug, data.next!.id, language).then((next) => {
        if (active) return warmChapterImages(next);
      }).catch(() => { warming = false; });
    }, { rootMargin: "800px 0px" });
    observer.observe(nearEnd.current);
    return () => { active = false; observer.disconnect(); };
  }, [data, language]);

  async function tryAnotherSource() {
    if (!data?.provider) return;
    skipped.current.push(data.provider);
    setImageError(false);
    refreshed.current = false;
    try {
      setData(await loadChapter(manga, chapter, language, skipped.current.join(",")));
    } catch (failure) {
      setImageError(true);
      setError(failure instanceof Error ? failure.message : "No other source is available.");
    }
  }

  return (
    <article data-reader-surface className={`mx-auto min-h-screen max-w-5xl px-3 pb-14 pt-24 sm:px-6 ${mobile ? "" : "md:pr-24 xl:pr-6"}`}>
      <ReaderOverlay manga={manga} data={data} />
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
            {data.provider && <p className="mt-2 text-xs text-zinc-400">{sourceNames[data.provider] ?? data.provider}{data.groups?.length ? ` · ${data.groups.join(", ")}` : ""}</p>}
            {imageError && <p role="alert" className="mt-3 text-sm text-rose-300">An image could not load. <button className="underline" onClick={tryAnotherSource}>Try another source</button></p>}
            {data.externalUrl && <a href={data.externalUrl} target="_blank" rel="noopener noreferrer" className={`${button} mt-5`}>Read on publisher’s website <ArrowRight size={17} /></a>}
          </header>
          <div className="mx-auto max-w-3xl bg-black">
            {data.images.map((src, index) => (
              <div key={`${imageGeneration}-${index}-${src}`} ref={index === Math.max(0, data.images.length - 3) ? nearEnd : undefined}>
              <MangaImage
                src={src}
                fallbackSrc={data.imageFallbacks?.[src]}
                alt={`Page ${index + 1}`}
                className="block h-auto w-full"
                style={{ minHeight: "50vh" }}
                onLoad={(event) => { event.currentTarget.style.minHeight = ""; syncScroll(); }}
                onError={imageFailed}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding="async"
              />
              </div>
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
