import { preloadImage } from "@/lib/images";
export interface MangaCard {
  slug: string;
  title: string;
  image: string;
  imageFallback?: string;
  chapters: string[];
}

export interface ChapterLink {
  id: string;
  title: string;
}

export interface MangaDetails {
  slug: string;
  name: string;
  image: string;
  imageFallback?: string;
  description: string;
  chapterEntries: ChapterLink[];
  language?: string;
  languages?: string[];
  sources?: { id: string; name: string; chapters: number }[];
}

export interface ChapterData {
  manga: string;
  slug: string;
  images: string[];
  imageFallbacks?: Record<string, string>;
  chapter: ChapterLink;
  provider?: string;
  externalUrl?: string;
  groups?: string[];
  language?: string;
  previous: ChapterLink | null;
  next: ChapterLink | null;
}

export interface SearchResults {
  results: MangaCard[];
  total: number;
  hasMore: boolean;
}

export function mangaHref(slug: string) {
  return `/read/${encodeURIComponent(slug)}`;
}

export function chapterHref(slug: string, chapter: string, language = "en") {
  return `${mangaHref(slug)}/${encodeURIComponent(chapter)}${language === "en" ? "" : `?language=${encodeURIComponent(language)}`}`;
}

export async function mangaAPI<T>(
  endpoint: string,
  params?: Record<string, string>,
  signal?: AbortSignal,
): Promise<T> {
  const query = params ? `?${new URLSearchParams(params)}` : "";
  const response = await fetch(`/api/manga/${endpoint}${query}`, { signal });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "The manga service is unavailable. Please try again.");
  }
  return response.json();
}

const chapterCache = new Map<string, { data: ChapterData; expires: number }>();
const chapterRequests = new Map<string, Promise<ChapterData>>();

export function getCachedChapter(manga: string, chapter: string, language = "en") {
  const key = chapterHref(manga, chapter, language);
  const entry = chapterCache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data;
  chapterCache.delete(key);
}

export function loadChapter(manga: string, chapter: string, language = "en", skip = "", refresh = false): Promise<ChapterData> {
  const cached = skip || refresh ? undefined : getCachedChapter(manga, chapter, language);
  if (cached) return Promise.resolve(cached);

  const key = chapterHref(manga, chapter, language) + (skip ? `&skip=${skip}` : "") + (refresh ? "&refresh=1" : "");
  const pending = chapterRequests.get(key);
  if (pending) return pending;

  const request = mangaAPI<ChapterData>("chapterimages", { manga, chapter, language, ...(skip ? { skip } : {}), ...(refresh ? { refresh: "1" } : {}) })
    .then((data) => {
      const canonicalKey = chapterHref(data.slug, data.chapter.id, language);
      const entry = { data, expires: Date.now() + 2 * 60_000 };
      for (const entryKey of new Set([key, canonicalKey, chapterHref(manga, chapter, language)])) {
        chapterCache.delete(entryKey);
        chapterCache.set(entryKey, entry);
      }
      while (chapterCache.size > 24) {
        const oldestKey = chapterCache.keys().next().value;
        if (oldestKey === undefined) break;
        chapterCache.delete(oldestKey);
      }
      return data;
    })
    .finally(() => chapterRequests.delete(key));

  chapterRequests.set(key, request);
  return request;
}

export function canPrefetchChapter() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return !connection?.saveData && !connection?.effectiveType?.endsWith("2g");
}
export function warmChapterImages(chapter: ChapterData) {
  return Promise.all(chapter.images.slice(0, 3).map((src) => preloadImage(src, chapter.imageFallbacks?.[src])));
}
export const sourceNames: Record<string, string> = { weebcentral: "WeebCentral", mangapill: "MangaPill", mangaread: "MangaRead", mangadex: "MangaDex" };
