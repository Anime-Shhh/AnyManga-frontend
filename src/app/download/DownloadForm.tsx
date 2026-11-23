"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { mangaAPI, type MangaDetails } from "@/lib/manga";
import { formatBytes, receivePDF } from "@/lib/download";

const field = "w-full rounded-lg border border-white/15 bg-[#1b152a] px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-violet-300";
const button = "rounded-lg bg-violet-500 px-4 py-2 font-semibold text-white hover:bg-violet-400 disabled:opacity-50";
const maxChapters = 10;

export default function DownloadForm({ initialManga }: { initialManga: string }) {
  const [manga, setManga] = useState(initialManga);
  const [request, setRequest] = useState(initialManga);
  const [details, setDetails] = useState<MangaDetails>();
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const transfer = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<{ phase: "preparing" | "downloading" | "complete" | "cancelled"; bytes: number; speed: number; seconds: number }>();
  useEffect(() => () => transfer.current?.abort(), []);

  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    mangaAPI<MangaDetails>("mangapage", { title: request }, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setDetails(data); })
      .catch((error: Error) => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [request, attempt]);

  function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setDetails(undefined);
    setStart(0);
    setEnd(0);
    setRequest(manga.trim());
  }

  async function download() {
    if (!details || busy || transfer.current) return;
    const ids = details.chapterEntries.slice(start, end + 1).map(({ id }) => id);
    setBusy(true);
    setError("");
    const controller = new AbortController();
    transfer.current = controller;
    let phase: "preparing" | "downloading" = "preparing";
    let received = 0;
    const started = performance.now();
    let priorTime = started, priorBytes = 0;
    setProgress({ phase, bytes: 0, speed: 0, seconds: 0 });
    const timer = window.setInterval(() => {
      const now = performance.now();
      setProgress({ phase, bytes: received, speed: (received - priorBytes) / ((now - priorTime) / 1000), seconds: (now - started) / 1000 });
      priorTime = now; priorBytes = received;
    }, 500);
    try {
      const response = await fetch("/api/manga/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: details.slug, chapters: ids }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not generate the PDF.");
      }
      phase = "downloading";
      const pdf = await receivePDF(response, controller.signal, (bytes) => { received = bytes; });
      setProgress({ phase: "complete", bytes: received, speed: 0, seconds: (performance.now() - started) / 1000 });
      const address = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = address;
      link.download = `${details.slug}-${start + 1}-${end + 1}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(address), 60_000);
    } catch (failure) {
      if (controller.signal.aborted) setProgress({ phase: "cancelled", bytes: received, speed: 0, seconds: (performance.now() - started) / 1000 });
      else { setProgress(undefined); setError(failure instanceof Error ? failure.message : "Could not download the PDF."); }
    } finally {
      window.clearInterval(timer);
      transfer.current = null;
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-5 pb-16 pt-28 sm:px-8">
      <h1 className="text-3xl font-semibold sm:text-4xl">Download manga</h1>
      <form onSubmit={lookup} className="mt-6">
        <label htmlFor="download-manga" className="block text-sm font-medium">Manga name or slug</label>
        <div className="mt-2 flex gap-2">
          <input id="download-manga" required disabled={busy} value={manga} onChange={(event) => setManga(event.target.value)} className={field} />
          <button type="submit" disabled={busy || !manga.trim() || request === manga.trim()} className={button}>Find</button>
        </div>
      </form>
      {request && !details && !error && <p role="status" className="mt-5 text-zinc-300">Looking up chapters…</p>}
      {details && (
        <section className="mt-9">
          <h2 className="text-xl font-semibold">{details.name}</h2>
          {details.chapterEntries.length === 0 ? <p className="mt-3 text-zinc-300">No chapters listed.</p> : (
            <>
              <p className="mt-2 text-sm text-zinc-300">Choose up to {maxChapters} consecutive chapters.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid min-w-0 gap-2 text-sm">First chapter
                  <select className={field} value={start} disabled={busy} onChange={(event) => {
                    const position = Number(event.target.value);
                    setStart(position);
                    setEnd(position);
                  }}>
                    {details.chapterEntries.map((chapter, i) => <option key={chapter.id} value={i}>{chapter.title}</option>)}
                  </select>
                </label>
                <label className="grid min-w-0 gap-2 text-sm">Last chapter
                  <select className={field} value={end} disabled={busy} onChange={(event) => setEnd(Number(event.target.value))}>
                    {details.chapterEntries.slice(start, start + maxChapters).map((chapter, i) => <option key={chapter.id} value={start + i}>{chapter.title}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <button type="button" className={button} disabled={busy} onClick={download}>{busy ? "Downloading…" : "Download PDF"}</button>
                {busy && <button type="button" onClick={() => transfer.current?.abort()} className="min-h-10 rounded-lg border border-white/20 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10">Cancel</button>}
              </div>
              {progress && <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <p role="status" className="text-sm text-zinc-200">{progress.phase === "preparing" ? "Preparing chapter list…" : progress.phase === "downloading" ? "Receiving PDF as pages are processed…" : progress.phase === "cancelled" ? "Download cancelled." : "PDF downloaded."}</p>
                {busy && <progress aria-label="PDF download in progress" className="mt-3 h-2 w-full accent-violet-400" />}
                <p aria-label="Download transfer statistics" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-zinc-400">
                  <span>{formatBytes(progress.bytes)} received</span>
                  {busy && <span>{formatBytes(progress.speed)}/s</span>}
                  <span>{Math.floor(progress.seconds / 60)}:{String(Math.floor(progress.seconds % 60)).padStart(2, "0")} elapsed</span>
                </p>
              </div>}
            </>
          )}
        </section>
      )}
      {error && <p role="alert" className="mt-5 text-rose-300">{error}</p>}
      {error && !details && (
        <button type="button" className="mt-3 text-violet-200 underline" onClick={() => {
          setError("");
          setAttempt((value) => value + 1);
        }}>Try again</button>
      )}
      <Link href="/read" className="mt-6 inline-block text-sm text-violet-200 hover:text-white">Browse manga</Link>
    </div>
  );
}
