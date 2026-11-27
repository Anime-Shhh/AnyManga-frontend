"use client";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MangaImage from "./MangaImage";
import { chapterBatches } from "@/lib/chapter-batches";
import { canPrefetchChapter, chapterHref, loadChapter, type ChapterLink, type MangaDetails } from "@/lib/manga";

type Preview = { id: string; title: string; left: number; top: number; width: number; height: number; state: "loading" | "image" | "external" | "error"; src?: string; fallback?: string };
const control = "min-h-11 rounded-xl border border-white/15 bg-[#191721]/90 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-2 focus-visible:outline-violet-300";
export default function ChapterBrowser({ details, language }: { details: MangaDetails; language: string }) {
  const [descending, setDescending] = useState(false);
  const [selected, setSelected] = useState("");
  const batches = useMemo(() => chapterBatches(details.chapterEntries, descending), [details.chapterEntries, descending]);
  const active = batches.find((batch) => batch.id === selected) ?? batches[0];
  const [preview, setPreview] = useState<Preview>();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const request = useRef<AbortController | undefined>(undefined);
  const dismiss = useCallback(() => { clearTimeout(timer.current); request.current?.abort(); request.current = undefined; setPreview(undefined); }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") dismiss(); };
    window.addEventListener("scroll", dismiss, { capture: true, passive: true });
    window.addEventListener("resize", dismiss);
    document.addEventListener("keydown", key);
    return () => { clearTimeout(timer.current); request.current?.abort(); window.removeEventListener("scroll", dismiss, true); window.removeEventListener("resize", dismiss); document.removeEventListener("keydown", key); };
  }, [dismiss]);
  function arm(element: HTMLElement, chapter: ChapterLink) {
    dismiss();
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || !canPrefetchChapter()) return;
    timer.current = setTimeout(async () => {
      const controller = new AbortController(); request.current = controller;
      const rect = element.getBoundingClientRect();
      const width = Math.min(264, window.innerWidth - 24), height = Math.max(100, Math.min(360, window.innerHeight * .6));
      const left = rect.right + 12 + width <= window.innerWidth - 12 ? rect.right + 12 : rect.left - width - 12;
      const placement = { id: chapter.id, title: chapter.title, left: Math.max(12, Math.min(left, window.innerWidth - width - 12)), top: Math.max(12, Math.min(rect.top, window.innerHeight - height - 64)), width, height };
      setPreview({ ...placement, state: "loading" });
      try {
        const data = await loadChapter(details.slug, chapter.id, language, "", false, { preview: true, signal: controller.signal });
        if (controller.signal.aborted) return;
        const src = data.images[0];
        setPreview({ ...placement, state: src ? "image" : data.externalUrl ? "external" : "error", src, fallback: src ? data.imageFallbacks?.[src] : undefined });
      } catch { if (!controller.signal.aborted) setPreview({ ...placement, state: "error" }); }
    }, 2000);
  }
  return <section aria-labelledby="chapter-heading" className="mt-8 rounded-3xl border border-white/10 bg-[#100f18]/85 p-5 shadow-2xl sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="chapter-heading" className="text-2xl font-semibold">Chapters</h2><p className="mt-1 text-xs text-white/45">{details.chapterEntries.length.toLocaleString()} available entries · grouped by chapter number</p></div>
      {details.chapterEntries.length > 0 && language === "en" && <Link href={`/download?${new URLSearchParams({ manga: details.slug })}`} className="rounded-full border border-violet-200/25 bg-violet-300/10 px-4 py-2 text-sm text-violet-100 hover:bg-violet-300/20">Download PDF</Link>}
    </div>
    {active ? <>
      <div className="my-5 flex flex-wrap items-end gap-3 border-y border-white/10 py-4">
        {batches.length > 1 && <label className="grid gap-1.5 text-xs text-white/60">Chapter range<select aria-label="Chapter range" className={control} value={active.id} onChange={(e) => { dismiss(); setSelected(e.target.value); }}>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.label}</option>)}</select></label>}
        <label className="grid gap-1.5 text-xs text-white/60">Order<select aria-label="Chapter order" className={control} value={descending ? "desc" : "asc"} onChange={(e) => { dismiss(); setDescending(e.target.value === "desc"); setSelected(""); }}><option value="asc">Oldest first</option><option value="desc">Newest first</option></select></label>
        <p className="pb-3 text-xs text-white/45" role="status">{active.label} · {active.entries.length} entries</p>
      </div>
      <ol aria-label="Chapters in selected range" className="grid gap-2 md:grid-cols-2">{active.entries.map((chapter) => <li key={chapter.id}>
        <Link href={chapterHref(details.slug, chapter.id, language)} prefetch={false} onPointerEnter={(e) => arm(e.currentTarget, chapter)} onPointerLeave={dismiss} onFocus={(e) => arm(e.currentTarget, chapter)} onBlur={dismiss} onClick={dismiss} aria-describedby={preview?.id === chapter.id ? "chapter-preview" : undefined} className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[.025] px-4 py-3 text-sm text-white/80 transition-colors hover:border-violet-200/25 hover:bg-violet-200/10 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-300"><span className="break-words">{chapter.title}</span><span aria-hidden className="text-white/25 group-hover:text-violet-200">↗</span></Link>
      </li>)}</ol>
    </> : <p className="mt-5 text-zinc-300">No chapters listed for this language.</p>}
    {preview && createPortal(<aside id="chapter-preview" role="tooltip" className="pointer-events-none fixed z-[180] overflow-hidden rounded-2xl border border-white/20 bg-[#15131e] p-3 shadow-2xl" style={{ left: preview.left, top: preview.top, width: preview.width }}>
      <p className="mb-2 truncate text-xs font-medium text-zinc-200">{preview.title} · first page</p>
      {preview.state === "image" && preview.src ? <MangaImage src={preview.src} fallbackSrc={preview.fallback} alt={`First page of ${preview.title}`} onError={() => setPreview((p) => p?.id === preview.id ? { ...p, state: "error" } : p)} className="mx-auto block h-auto max-w-full rounded-md object-contain" style={{ maxHeight: preview.height }} /> : <div className="flex items-center justify-center rounded-lg bg-white/5 px-4 text-center text-xs text-zinc-400" style={{ height: Math.min(220, preview.height) }}>{preview.state === "loading" ? "Loading preview…" : preview.state === "external" ? "Read this release on the publisher’s website." : "Preview unavailable. Open the chapter to read."}</div>}
    </aside>, document.body)}
  </section>;
}
