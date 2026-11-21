"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import MangaImage from "@/components/MangaImage";
import { mangaAPI, mangaHref, type MangaCard, type MangaDetails } from "@/lib/manga";

type BrowseFeed = "featured" | "popular" | "manhwa" | "manhua";

const browseRows = [
  { feed: "popular", title: "Popular Manga" },
  { feed: "manhwa", title: "Manhwa" },
  { feed: "manhua", title: "Manhua" },
] as const;

const arrowClass = "grid size-10 shrink-0 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-violet-300";

function useBrowseFeed(feed: BrowseFeed) {
  const [items, setItems] = useState<MangaCard[]>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const request = new AbortController();
    const category = feed === "manhwa" || feed === "manhua";
    mangaAPI<MangaCard[]>(category ? "category" : feed, category ? { name: feed } : undefined, request.signal)
      .then((data) => {
        if (!request.signal.aborted) setItems(data);
      })
      .catch((error: Error) => {
        if (!request.signal.aborted) setError(error.message);
      });
    return () => request.abort();
  }, [feed, attempt]);

  function retry() {
    setError("");
    setAttempt((value) => value + 1);
  }

  return { items, error, retry };
}

function FeedStatus({ error, retry, label }: { error: string; retry: () => void; label: string }) {
  return error ? (
    <div role="alert" className="text-zinc-300">
      <p>{error}</p>
      <button type="button" onClick={retry} className="mt-2 text-violet-300 underline">Try again</button>
    </div>
  ) : <p role="status" className="text-zinc-300">Loading {label}…</p>;
}

function BrowseRow({ title, feed }: { title: string; feed: BrowseFeed }) {
  const { items, error, retry } = useBrowseFeed(feed);
  const rail = useRef<HTMLUListElement>(null);
  const reduceMotion = useReducedMotion();

  function scroll(direction: -1 | 1) {
    const list = rail.current;
    if (!list) return;
    const end = list.scrollWidth - list.clientWidth;
    const wraps = direction === 1 ? list.scrollLeft >= end - 2 : list.scrollLeft <= 2;
    const left = wraps ? (direction === 1 ? 0 : end) : list.scrollLeft + direction * list.clientWidth * 0.65;
    list.scrollTo({ left, behavior: reduceMotion ? "instant" : "smooth" });
  }

  return (
    <section className="relative pt-12 sm:pt-16" aria-labelledby={`heading-${feed}`}>
      <h2 id={`heading-${feed}`} className="mb-6 px-5 text-3xl font-bold text-white sm:px-8 sm:text-4xl">{title}</h2>
      {!items ? (
        <div className="px-5 sm:px-8"><FeedStatus error={error} retry={retry} label={title} /></div>
      ) : (
        <div className="relative">
          <ul ref={rail} className="flex snap-x gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:gap-6 sm:px-8 [&::-webkit-scrollbar]:hidden">
            {items.map((manga) => (
              <li key={manga.slug} className="w-44 shrink-0 snap-start sm:w-[250px]">
                <Link
                  href={mangaHref(manga.slug)}
                  prefetch={false}
                  className="block overflow-hidden rounded-2xl border border-transparent bg-[#100020] shadow-lg transition hover:border-[#5227FF] focus-visible:border-violet-300"
                >
                  <div className="h-56 bg-violet-950/40 sm:h-72">
                    {manga.image && <MangaImage src={manga.image} fallbackSrc={manga.imageFallback} alt="" loading="lazy" className="size-full object-cover" />}
                  </div>
                  <div className="min-h-24 p-4">
                    <h3 className="truncate text-lg font-semibold text-white" title={manga.title}>{manga.title}</h3>
                    {manga.chapters.slice(0, 5).map((chapter, i) => (
                      <p key={`${i}-${chapter}`} className="mt-1 truncate text-sm text-gray-400">• {chapter}</p>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {items.length > 1 && (
            <>
              <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-28 bg-gradient-to-r from-[#060010] to-transparent sm:block" />
              <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-28 bg-gradient-to-l from-[#060010] to-transparent sm:block" />
              <button type="button" aria-label={`Scroll ${title} left`} className={`${arrowClass} absolute left-1 top-1/2 -translate-y-1/2 sm:left-8`} onClick={() => scroll(-1)}>←</button>
              <button type="button" aria-label={`Scroll ${title} right`} className={`${arrowClass} absolute right-1 top-1/2 -translate-y-1/2 sm:right-8`} onClick={() => scroll(1)}>→</button>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function FeaturedCarousel() {
  const { items, error, retry } = useBrowseFeed("featured");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  const [details, setDetails] = useState<MangaDetails>();
  const detailCache = useRef(new Map<string, MangaDetails>());
  const reduceMotion = useReducedMotion();
  const count = items?.length ?? 0;
  const currentItem = items?.[currentIndex];
  const currentSlug = currentItem?.slug;

  useEffect(() => {
    if (count < 2 || reduceMotion || paused || hovered || focused) return;
    const timer = window.setTimeout(() => setCurrentIndex((value) => (value + 1) % count), 10_000);
    return () => window.clearTimeout(timer);
  }, [count, currentIndex, focused, hovered, paused, reduceMotion]);

  useEffect(() => {
    if (!currentSlug) return;
    const request = new AbortController();
    const cached = detailCache.current.get(currentSlug);
    const result = cached ? Promise.resolve(cached) : mangaAPI<MangaDetails>("mangapage", { title: currentSlug }, request.signal);
    result.then((data) => {
      if (request.signal.aborted) return;
      detailCache.current.set(currentSlug, data);
      setDetails(data);
    }).catch(() => { /* The carousel can keep using the catalog cover. */ });
    return () => request.abort();
  }, [currentSlug]);

  if (!items || !currentItem) {
    return <div className="flex min-h-56 items-center justify-center px-5 pt-24"><FeedStatus error={error} retry={retry} label="featured manga" /></div>;
  }

  const selectedDetails = details?.slug === currentItem.slug ? details : undefined;
  const image = selectedDetails?.image || currentItem.image;
  const upcoming = Array.from({ length: Math.min(4, count - 1) }, (_, i) => items[(currentIndex + i + 1) % count]);

  return (
    <section
      aria-label="Featured manga carousel"
      className="relative flex min-h-svh flex-col overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    >
      <AnimatePresence>
        {image && (
          <motion.div
            aria-hidden
            key={currentItem.slug}
            initial={reduceMotion ? false : { scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduceMotion ? undefined : { scale: 1.1, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 1 }}
            className="absolute inset-0 bg-cover bg-top blur-[8px]"
            style={{ backgroundImage: `url("${image}")` }}
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/70 to-[#060010]" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-5 pb-5 pt-24 sm:flex-row sm:justify-between sm:gap-10 sm:px-16">
        <motion.div
          key={currentItem.slug}
          initial={reduceMotion ? false : { opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.8 }}
          className="order-2 w-full max-w-lg sm:order-1"
        >
          <h1 className="mb-3 break-words text-3xl font-bold uppercase text-[#9274ff] sm:text-4xl md:text-5xl">{currentItem.title}</h1>
          {selectedDetails?.description && (
            <p className="mb-5 line-clamp-4 text-sm font-semibold leading-relaxed text-white/80 lg:line-clamp-6 lg:text-base">{selectedDetails.description}</p>
          )}
          <Link href={mangaHref(currentItem.slug)} className="inline-flex rounded-lg border border-white bg-black/30 px-6 py-3 text-white backdrop-blur-sm transition hover:bg-black/50">
            SEE MORE
          </Link>
        </motion.div>
        {image && (
          <motion.img
            key={currentItem.slug + "-cover"}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.8 }}
            src={image}
            alt=""
            className="order-1 h-[min(31svh,17rem)] max-w-full object-contain sm:order-2 sm:h-auto sm:max-h-[54svh] sm:max-w-[42%]"
          />
        )}
      </div>

      {count > 1 && (
        <div className="relative z-10 flex items-end justify-between gap-3 px-5 pb-8 sm:px-8">
          <div className="flex shrink-0 gap-2">
            <button type="button" aria-label="Previous featured manga" className={arrowClass} onClick={() => setCurrentIndex((value) => (value - 1 + count) % count)}>←</button>
            <button type="button" aria-label="Next featured manga" className={arrowClass} onClick={() => setCurrentIndex((value) => (value + 1) % count)}>→</button>
            {!reduceMotion && <button type="button" aria-label={paused ? "Play carousel" : "Pause carousel"} className={arrowClass} onClick={() => setPaused((value) => !value)}>{paused ? "▶" : "Ⅱ"}</button>}
          </div>
          <div className="hidden gap-3 sm:flex lg:gap-4">
            {upcoming.map((item, index) => (
              <motion.button
                key={item.slug}
                type="button"
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.1 }}
                aria-label={`Show ${item.title}`}
                onClick={() => setCurrentIndex((currentIndex + index + 1) % count)}
                className={`overflow-hidden rounded-lg border border-white/10 bg-black/30 text-left shadow-lg backdrop-blur-sm transition hover:border-white/30 focus-visible:border-violet-300 ${index >= 2 ? "hidden lg:block" : ""}`}
              >
                {item.image && <MangaImage src={item.image} fallbackSrc={item.imageFallback} alt="" className="h-24 w-24 object-cover md:h-32 md:w-32 xl:h-44 xl:w-44" />}
                <span className="block w-24 truncate p-2 text-xs font-semibold text-white md:w-32 xl:w-44 xl:p-3">{item.title}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function BrowsePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#060010] pb-16">
      <FeaturedCarousel />
      {browseRows.map((row) => <BrowseRow key={row.feed} {...row} />)}
    </div>
  );
}
