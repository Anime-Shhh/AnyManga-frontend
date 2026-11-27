import { randomUUID } from "node:crypto";
import { isIP } from "node:net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const methods: Record<string, readonly string[]> = {
  health: ["GET"], discovery: ["GET"], search: ["GET"], featured: ["GET"], popular: ["GET"],
  category: ["GET"], mangapage: ["GET"], chapterimages: ["GET", "POST"],
  info: ["GET"], chapters: ["POST"], image: ["GET"],
};
const forwardedHeaders = ["content-type", "content-disposition", "content-length", "cache-control", "retry-after", "x-content-type-options", "x-anymanga-backend-id", "x-anymanga-request-id", "x-anymanga-pages", "x-accel-buffering"];

async function forward(request: Request, context: { params: Promise<{ endpoint: string }> }) {
  const { endpoint } = await context.params;
  if (!Object.hasOwn(methods, endpoint)) return Response.json({ error: "Unknown endpoint." }, { status: 404 });
  if (!methods[endpoint].includes(request.method)) return Response.json({ error: "Method not allowed." }, { status: 405, headers: { Allow: methods[endpoint].join(", ") } });
  const origin = process.env.MANGA_API_ORIGIN ?? (process.env.VERCEL ? "" : "http://127.0.0.1:8080");
  const key = process.env.MANGA_API_KEY;
  let target: URL;
  try {
    const configured = new URL(origin);
    if (configured.username || configured.password || configured.search || configured.hash || configured.pathname !== "/" ||
      (configured.protocol !== "https:" && !(configured.protocol === "http:" && !process.env.VERCEL && ["127.0.0.1", "localhost"].includes(configured.hostname)))) throw new Error();
    if (process.env.VERCEL && !key) throw new Error();
    target = new URL(`/${endpoint}`, configured);
    target.search = new URL(request.url).search;
  } catch { return Response.json({ error: "The manga service is not configured." }, { status: 503 }); }
  const headers = new Headers();
  if (key) headers.set("Authorization", `Bearer ${key}`);
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim();
  if (process.env.VERCEL && ip && isIP(ip)) headers.set("X-AnyManga-Client-IP", ip);
  headers.set("X-AnyManga-Forward-ID", randomUUID());
  let body: Uint8Array | undefined;
  if (request.method === "POST") {
    headers.set("Content-Type", "application/json");
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    if (reader) while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 16 * 1024) { await reader.cancel(); return Response.json({ error: "Request is too large." }, { status: 413 }); }
      chunks.push(value);
    }
    body = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  }
  try {
    const response = await fetch(target, { method: request.method, headers, body: body as BodyInit | undefined, redirect: "manual", cache: "no-store", signal: AbortSignal.any([request.signal, AbortSignal.timeout(endpoint === "health" ? 5_000 : endpoint === "chapters" ? 295_000 : 58_000)]) });
    if (response.status >= 300 && response.status < 400) { await response.body?.cancel(); throw new Error("Unexpected origin redirect"); }
    const output = new Headers();
    for (const name of forwardedHeaders) { const value = response.headers.get(name); if (value) output.set(name, value); }
    if (response.headers.get("content-encoding")) output.delete("content-length");
    if (endpoint !== "image") output.set("Cache-Control", endpoint === "chapters" ? "no-store, no-transform" : "no-store");
    return new Response(response.body, { status: response.status, headers: output });
  } catch {
    return Response.json({ error: "The manga service is temporarily unavailable. Please try again." }, { status: 503, headers: { "Retry-After": "5", "Cache-Control": "no-store" } });
  }
}
export const GET = forward;
export const POST = forward;
