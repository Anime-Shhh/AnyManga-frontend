"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, House, Menu, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { chapterHref, mangaHref, type ChapterData } from "@/lib/manga";
import { useNavigationVisibility } from "@/components/NavigationVisibility";

const readerButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-violet-300 sm:px-4";

export function ReaderNav({ manga, data, bottom = false, overlay = false }: { manga: string; data?: ChapterData; bottom?: boolean; overlay?: boolean }) {
  const { mobile } = useNavigationVisibility();
  const slug = data?.slug ?? manga;
  const button = overlay ? `${readerButton} justify-start border-transparent md:justify-center 2xl:justify-start` : readerButton;
  const label = overlay && !mobile ? "sr-only 2xl:not-sr-only" : "";
  return (
    <nav aria-label={overlay ? "Floating chapter navigation" : bottom ? "Chapter navigation at end" : "Chapter navigation"} className={overlay ? "flex flex-col gap-1" : "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center"}>
      <Link href="/" aria-label="Home" title="Home" className={button}><House size={17} aria-hidden /> <span className={label}>Home</span></Link>
      <Link href={mangaHref(slug)} aria-label="Manga page" title="Manga page" className={button}><BookOpen size={17} aria-hidden /> <span className={label}>Manga page</span></Link>
      {data && (
        <>
          {data.previous ? (
            <Link href={chapterHref(slug, data.previous.id, data.language)} prefetch={false} aria-label="Previous chapter" title="Previous chapter" className={button} rel="prev">
              <ArrowLeft size={17} aria-hidden /> <span className={label}>Previous chapter</span>
            </Link>
          ) : <button type="button" aria-label="Previous chapter" disabled className={`${button} opacity-40`}><ArrowLeft size={17} aria-hidden /> <span className={label}>Previous chapter</span></button>}
          {data.next ? (
            <Link href={chapterHref(slug, data.next.id, data.language)} prefetch={false} aria-label="Next chapter" title="Next chapter" className={button} rel="next">
              <span className={label}>Next chapter</span> <ArrowRight size={17} aria-hidden />
            </Link>
          ) : <button type="button" aria-label="Next chapter" disabled className={`${button} opacity-40`}><span className={label}>Next chapter</span> <ArrowRight size={17} aria-hidden /></button>}
        </>
      )}
    </nav>
  );
}


export function ReaderOverlay({ manga, data }: { manga: string; data?: ChapterData }) {
  const { visible, mobile, menuOpen, toggleMenu } = useNavigationVisibility();
  const trigger = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !menuOpen && visible && mobile) trigger.current?.focus();
    wasOpen.current = menuOpen;
  }, [menuOpen, visible, mobile]);
  if (!visible) return null;
  return (
    <aside aria-label="Reader controls" data-navigation-chrome>
      {!mobile && <div className="fixed right-3 top-1/2 z-[140] hidden -translate-y-1/2 rounded-2xl border border-white/15 bg-[#171020]/95 p-1.5 shadow-xl backdrop-blur-md md:block lg:right-5">
        <ReaderNav manga={manga} data={data} overlay />
      </div>}
      {mobile && <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[160] flex flex-col items-end gap-3">
        {menuOpen && <div id="reader-navigation-panel" className="max-w-[calc(100vw-2rem)] rounded-2xl border border-white/15 bg-[#171020]/95 p-2 shadow-xl backdrop-blur-md"><ReaderNav manga={manga} data={data} overlay /></div>}
        <button ref={trigger} type="button" aria-label={menuOpen ? "Close reader controls" : "Open reader controls"} aria-expanded={menuOpen} aria-controls="reader-navigation-panel" onClick={toggleMenu} className="grid size-12 place-items-center rounded-full border border-white/20 bg-[#25153c]/95 text-white shadow-xl backdrop-blur-md hover:bg-violet-900 focus-visible:outline-2 focus-visible:outline-violet-300">
          {menuOpen ? <X size={23} aria-hidden /> : <Menu size={23} aria-hidden />}
        </button>
      </div>}
    </aside>
  );
}
