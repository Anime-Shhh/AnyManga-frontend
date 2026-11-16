"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { mangaAPI, type MangaDetails } from "@/lib/manga";

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
    if (!details || busy) return;
    const ids = details.chapterEntries.slice(start, end + 1).map(({ id }) => id);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/manga/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: details.slug, chapters: ids }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not generate the PDF.");
      }
      const address = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = address;
      link.download = `${details.slug}-${start + 1}-${end + 1}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(address), 1000);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not generate the PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-5 pb-16 pt-28 sm:px-8">
      <h1 className="text-3xl font-semibold sm:text-4xl">Download manga</h1>
      <form onSubmit={lookup} className="mt-6">
        <label htmlFor="download-manga" className="block text-sm font-medium">Manga name or slug</label>
        <div className="mt-2 flex gap-2">
          <input id="download-manga" required value={manga} onChange={(event) => setManga(event.target.value)} className={field} />
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
              <button type="button" className={`${button} mt-5`} disabled={busy} onClick={download}>{busy ? "Preparing PDF…" : "Download PDF"}</button>
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
