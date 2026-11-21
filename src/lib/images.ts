const resolved = new Map<string, string>();
function remember(src: string, target: string) {
  resolved.set(src, target);
  while (resolved.size > 256) resolved.delete(resolved.keys().next().value!);
}
export function resolvedImage(src: string) { return resolved.get(src) ?? src; }
export function fallbackImage(src: string, fallback?: string) {
  if (!fallback || resolvedImage(src) === fallback) return undefined;
  remember(src, fallback); return fallback;
}
const warming = new Map<string, Promise<void>>();
export function preloadImage(src: string, fallback?: string): Promise<void> {
  const prior = warming.get(src); if (prior) return prior;
  const pending = new Promise<void>((resolve, reject) => {
    const image = new Image(); image.referrerPolicy = "no-referrer"; image.fetchPriority = "low";
    image.onload = () => resolve();
    image.onerror = () => { const next = fallbackImage(src, fallback); if (next) image.src = next; else reject(new Error("Image preload failed")); };
    image.src = resolvedImage(src);
  }).catch(() => { warming.delete(src); });
  warming.set(src, pending);
  while (warming.size > 72) warming.delete(warming.keys().next().value!);
  return pending;
}
