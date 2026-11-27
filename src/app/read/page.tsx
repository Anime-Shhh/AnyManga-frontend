"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import MangaImage from "@/components/MangaImage";
import { mangaAPI, mangaHref, type MangaCard, sourceNames } from "@/lib/manga";

import { useDiscovery, type DiscoveryCard } from "@/lib/use-discovery";

type BrowseFeed = "manhwa" | "manhua";

const browseRows = [
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
    mangaAPI<MangaCard[]>("category", { name: feed }, request.signal)
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

type FeedProps = { items?: MangaCard[]; error: string; retry: () => void };
function CardSignal({ manga, kind }: { manga: MangaCard; kind?: string }) {
  const card = manga as Partial<DiscoveryCard>;
  const signal = card.signals?.[0];
  if (!signal) return null;
  const stats = card.signals?.find(item => item.followers);
  const date = kind === "recent" ? card.updatedAt : kind === "new" ? card.addedAt : undefined;
  return <div className="mt-2 space-y-1 text-xs leading-relaxed text-violet-200/80">
    <p>{kind === "popular" && signal.rank ? `#${signal.rank} · ` : ""}{signal.label} · {sourceNames[signal.provider] ?? signal.provider}{card.signals && card.signals.length > 1 ? ` +${card.signals.length - 1}` : ""}</p>
    {stats?.followers ? <p>{stats.followers.toLocaleString("en-US")} MangaDex followers{stats.rating ? ` · ${stats.rating.toFixed(1)}/10` : ""}</p> : null}
    {date && <time dateTime={date}>{kind === "new" ? "Cataloged " : "Updated "}{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</time>}
  </div>;
}
function CuratedRow({ title, feed }: { title: string; feed: BrowseFeed }) {
  const result = useBrowseFeed(feed);
  return <BrowseRow title={title} feed={feed} {...result} />;
}
function BrowseRow({ title, feed, description, items, error, retry }: FeedProps & { title: string; feed: string; description?: string }) {
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
      <h2 id={`heading-${feed}`} className="px-5 text-3xl font-bold text-white sm:px-8 sm:text-4xl">{title}</h2>
      {description && <p className="mt-2 max-w-3xl px-5 text-sm leading-relaxed text-zinc-400 sm:px-8">{description}</p>}
      <div className="h-6" />
      {!items ? (
        <div className="px-5 sm:px-8"><FeedStatus error={error} retry={retry} label={title} /></div>
      ) : items.length === 0 ? <p className="px-5 text-zinc-400 sm:px-8">No picks available right now.</p> : (
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
                    <h3 className="line-clamp-2 text-lg font-semibold text-white" title={manga.title}>{manga.title}</h3>
                    {manga.chapters.slice(0, 2).map((chapter, i) => (
                      <p key={`${i}-${chapter}`} className="mt-1 truncate text-sm text-gray-400">• {chapter}</p>
                    ))}
                    <CardSignal manga={manga} kind={feed} />
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

function FeaturedCarousel({ items, error, retry }: { items?: DiscoveryCard[]; error: string; retry: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const count = items?.length ?? 0;
  const currentItem = items?.[currentIndex % (count || 1)];

  useEffect(() => {
    if (count < 2 || reduceMotion || paused || hovered || focused) return;
    const timer = window.setTimeout(() => setCurrentIndex((value) => (value + 1) % count), 10_000);
    return () => window.clearTimeout(timer);
  }, [count, currentIndex, focused, hovered, paused, reduceMotion]);

  if (!items || !currentItem) {
    return <div className="flex min-h-56 items-center justify-center px-5 pt-24"><FeedStatus error={error || (items ? "No discovery picks are available right now." : "")} retry={retry} label="featured manga" /></div>;
  }

  const image = currentItem.image;
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
          ><MangaImage src={image} fallbackSrc={currentItem.imageFallback} alt="" className="size-full object-cover object-top" /></motion.div>
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
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">{currentItem.spotlightReason || "Discover something new"}</p>
          <h1 className="mb-3 break-words text-3xl font-bold uppercase text-[#9274ff] sm:text-4xl md:text-5xl">{currentItem.title}</h1>
          {currentItem.description && (
            <p className="mb-5 line-clamp-4 text-sm font-semibold leading-relaxed text-white/80 lg:line-clamp-6 lg:text-base">{currentItem.description}</p>
          )}
          <div className="mb-5"><CardSignal manga={currentItem} kind={currentItem.spotlightKind} /></div>
          <Link prefetch={false} href={mangaHref(currentItem.slug)} className="inline-flex rounded-lg border border-white bg-black/30 px-6 py-3 text-white backdrop-blur-sm transition hover:bg-black/50">
            SEE MORE
          </Link>
        </motion.div>
        {image && (
          <motion.div
            key={currentItem.slug + "-cover"}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.8 }}
            className="order-1 max-w-full sm:order-2 sm:max-w-[42%]"
          ><MangaImage src={image} fallbackSrc={currentItem.imageFallback} alt="" className="h-[min(31svh,17rem)] max-w-full object-contain sm:h-auto sm:max-h-[54svh]" /></motion.div>
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
  const { data, error, retry } = useDiscovery();
  return (
    <div className="min-h-screen overflow-hidden bg-[#060010] pb-16">
      <FeaturedCarousel items={data?.featured} error={error} retry={retry} />
      {data && error && <div role="status" className="px-5 pt-6 text-sm text-amber-200 sm:px-8">Showing the last available picks. Refresh is temporarily unavailable. <button onClick={retry} className="underline">Retry</button></div>}
      {(data?.sections ?? [
        { id: "popular", title: "Popular across sources", description: "Provider rankings and MangaDex followers.", items: undefined },
        { id: "recent", title: "Latest chapter releases", description: "Recently updated series across providers.", items: undefined },
        { id: "new", title: "Newly added series", description: "New to provider catalogs, not necessarily newly published.", items: undefined },
      ]).map(section => <BrowseRow key={section.id} feed={section.id} {...section} error={error} retry={retry} />)}
      {browseRows.map((row) => <CuratedRow key={row.feed} {...row} />)}
      {data && <details className="mx-5 mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400 sm:mx-8">
        <summary className="cursor-pointer text-zinc-200">About these picks</summary>
        <p className="mt-3 max-w-3xl leading-relaxed">Picks combine public provider rankings, MangaDex followers, recent chapters, and newly added catalog entries. Rankings describe each provider’s list position, not a shared view count. The spotlight mixes these lists and opens on a different pick each visit. Feeds refresh every five minutes while this page is visible.</p>
        <ul className="mt-3 space-y-2">{data.sources.map(source => <li key={source.provider}><span className="text-zinc-200">{source.name}</span>: {source.availableFeeds.length ? source.availableFeeds.map(kind => ({ popular: "popular", recent: "recent chapters", new: "newly added" })[kind] ?? kind).join(", ") : "temporarily unavailable"}{source.staleFeeds.length > 0 ? " · using recent saved picks" : ""}{source.unavailableFeeds.length > 0 && source.availableFeeds.length > 0 ? " · some feeds unavailable" : ""}</li>)}</ul>
        <p className="mt-3">Checked <time dateTime={data.updatedAt}>{new Date(data.updatedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC</time>. A source outage does not remove picks from the remaining providers.</p>
      </details>}
    </div>
  );
}
