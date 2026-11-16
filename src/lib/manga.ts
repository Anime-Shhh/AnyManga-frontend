export interface MangaCard {
  slug: string;
  title: string;
  image: string;
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
  description: string;
  chapterEntries: ChapterLink[];
}

export interface ChapterData {
  manga: string;
  slug: string;
  images: string[];
  chapter: ChapterLink;
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

export function chapterHref(slug: string, chapter: string) {
  return `${mangaHref(slug)}/${encodeURIComponent(chapter)}`;
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

export function getCachedChapter(manga: string, chapter: string) {
  const key = chapterHref(manga, chapter);
  const entry = chapterCache.get(key);
  if (entry && entry.expires > Date.now()) return entry.data;
  chapterCache.delete(key);
}

export function loadChapter(manga: string, chapter: string): Promise<ChapterData> {
  const cached = getCachedChapter(manga, chapter);
  if (cached) return Promise.resolve(cached);

  const key = chapterHref(manga, chapter);
  const pending = chapterRequests.get(key);
  if (pending) return pending;

  const request = mangaAPI<ChapterData>("chapterimages", { manga, chapter })
    .then((data) => {
      const canonicalKey = chapterHref(data.slug, data.chapter.id);
      const entry = { data, expires: Date.now() + 2 * 60_000 };
      for (const entryKey of new Set([key, canonicalKey])) {
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
