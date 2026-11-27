import type { ChapterLink } from "./manga";
export type ChapterBatch = { id: string; label: string; entries: ChapterLink[] };
export function chapterBatches(entries: ChapterLink[], descending = false): ChapterBatch[] {
  const groups = new Map<number, ChapterLink[]>();
  const prologue: ChapterLink[] = [], specials: ChapterLink[] = [];
  for (const chapter of entries) {
    // Older origins may omit the canonical field. Never infer from opaque IDs.
    const raw = chapter.number ?? chapter.title.match(/^(?:chapter|ch\.?|episode)\s+(-?[0-9]+(?:\.[0-9]+)?)(?=$|[\s:–—-])/i)?.[1];
    const n = raw !== undefined && /^-?\d+(?:\.\d+)?$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isFinite(n)) { specials.push(chapter); continue; }
    if (n < 1) { prologue.push(chapter); continue; }
    const start = Math.floor((Math.floor(n) - 1) / 50) * 50 + 1;
    const group = groups.get(start) ?? []; group.push(chapter); groups.set(start, group);
  }
  const batches: ChapterBatch[] = [];
  if (prologue.length) batches.push({ id: "prologue", label: "Prologue / Chapter 0", entries: prologue });
  for (const start of [...groups.keys()].sort((a, b) => a - b)) batches.push({ id: String(start), label: `${start}–${start + 49}`, entries: groups.get(start)! });
  if (specials.length) batches.push({ id: "specials", label: "Specials & extras", entries: specials });
  return descending ? batches.reverse().map((batch) => ({ ...batch, entries: [...batch.entries].reverse() })) : batches;
}
