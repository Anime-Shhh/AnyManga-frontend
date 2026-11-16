"use client";

/* eslint-disable @next/next/no-img-element -- MangaRead serves remote covers directly. */
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { mangaAPI, mangaHref, type MangaCard } from "@/lib/manga";

export default function BrowsePage() {
  const [featured, setFeatured] = useState<MangaCard[]>();
  const [popular, setPopular] = useState<MangaCard[]>();
  const [slide, setSlide] = useState(0);
  const [featureError, setFeatureError] = useState("");
  const [popularError, setPopularError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const request = new AbortController();
    mangaAPI<MangaCard[]>("featured", undefined, request.signal)
      .then(setFeatured)
      .catch((error: Error) => {
        if (!request.signal.aborted) setFeatureError(error.message);
      });
    mangaAPI<MangaCard[]>("popular", undefined, request.signal)
      .then(setPopular)
      .catch((error: Error) => {
        if (!request.signal.aborted) setPopularError(error.message);
      });
    return () => request.abort();
  }, [attempt]);

  const slides = featured?.slice(0, 6) ?? [];
  const current = slides[slide % Math.max(1, slides.length)];
  const retry = () => {
    setFeatureError("");
    setPopularError("");
    setAttempt((value) => value + 1);
  };

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-28 sm:px-8">
      <h1 className="text-3xl font-semibold sm:text-4xl">Browse manga</h1>
      {current ? (
        <section aria-label="Featured manga" className="relative mt-6 overflow-hidden rounded-2xl border border-violet-300/15 bg-[#18102b]">
          {current.image && (
            <div aria-hidden className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl" style={{ backgroundImage: `url("${current.image}")` }} />
          )}
          <div className="relative grid grid-cols-[1fr_30%] items-center gap-5 bg-gradient-to-r from-[#17102a] via-[#17102a]/60 to-transparent p-5 sm:gap-10 sm:p-10">
            <div>
              <h2 className="text-sm font-medium text-violet-200">Featured manga</h2>
              <p aria-live="polite" className="mt-2 break-words text-2xl font-semibold sm:text-5xl">{current.title}</p>
              <Link href={mangaHref(current.slug)} className="mt-4 inline-flex rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400 sm:mt-7">
                View manga
              </Link>
              {slides.length > 1 && (
                <div className="mt-5 flex gap-2 sm:mt-8">
                  <button type="button" aria-label="Previous featured manga" className="grid size-10 place-items-center rounded-full border border-white/20 hover:bg-white/10" onClick={() => setSlide((value) => (value - 1 + slides.length) % slides.length)}>
                    <ArrowLeft size={18} />
                  </button>
                  <button type="button" aria-label="Next featured manga" className="grid size-10 place-items-center rounded-full border border-white/20 hover:bg-white/10" onClick={() => setSlide((value) => (value + 1) % slides.length)}>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
            {current.image && <img src={current.image} alt="" className="mx-auto aspect-[2/3] w-full max-w-44 rounded-lg border border-white/15 object-cover shadow-xl" />}
          </div>
        </section>
      ) : (
        <p role={featureError ? "alert" : "status"} className="mt-6 text-zinc-300">{featureError || "Loading featured manga…"}</p>
      )}
      <section className="mt-10" aria-labelledby="popular-title">
        <h2 id="popular-title" className="text-2xl font-semibold">Popular manga</h2>
        {popular ? (
          <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {popular.map((manga) => (
              <li key={manga.slug}>
                <Link href={mangaHref(manga.slug)} className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-violet-300">
                  <div className="aspect-[2/3] overflow-hidden rounded-lg border border-white/10 bg-violet-950/40 group-hover:border-violet-400">
                    {manga.image && <img src={manga.image} alt="" loading="lazy" className="size-full object-cover" />}
                  </div>
                  <h3 className="mt-2 font-medium group-hover:text-violet-200">{manga.title}</h3>
                  {manga.chapters[0] && <p className="mt-1 text-sm text-zinc-400">{manga.chapters[0]}</p>}
                </Link>
              </li>
            ))}
          </ul>
        ) : <p role={popularError ? "alert" : "status"} className="mt-5 text-zinc-300">{popularError || "Loading popular manga…"}</p>}
      </section>
      {(featureError || popularError) && <button type="button" className="mt-5 text-violet-200 underline" onClick={retry}>Try again</button>}
    </div>
  );
}
