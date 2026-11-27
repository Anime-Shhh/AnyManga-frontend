"use client";

import { useEffect, useState } from "react";
import { mangaAPI, type MangaCard } from "@/lib/manga";

export interface DiscoverySignal {
  provider: string;
  label: string;
  rank?: number;
  followers?: number;
  rating?: number;
}
export interface DiscoveryCard extends MangaCard {
  description?: string;
  signals: DiscoverySignal[];
  updatedAt?: string;
  addedAt?: string;
  spotlightKind?: string;
  spotlightReason?: string;
}
export interface DiscoveryResponse {
  featured: DiscoveryCard[];
  sections: { id: string; title: string; description: string; items: DiscoveryCard[] }[];
  sources: { provider: string; name: string; availableFeeds: string[]; staleFeeds: string[]; unavailableFeeds: string[] }[];
  updatedAt: string;
}
const refreshInterval = 5 * 60_000;

export function useDiscovery() {
  const [data, setData] = useState<DiscoveryResponse>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let request: AbortController | undefined;
    let lastAttempt = 0;
    // A different opening pick per visit, from the server's ranked candidate mix.
    const offset = crypto.getRandomValues(new Uint32Array(1))[0];
    async function refresh(force = false) {
      if (request || (!force && (document.hidden || Date.now() - lastAttempt < refreshInterval))) return;
      lastAttempt = Date.now();
      request = new AbortController();
      try {
        const result = await mangaAPI<DiscoveryResponse>("discovery", undefined, AbortSignal.any([request.signal, AbortSignal.timeout(55_000)]));
        if (!active) return;
        const index = result.featured.length ? offset % result.featured.length : 0;
        setData({ ...result, featured: [...result.featured.slice(index), ...result.featured.slice(0, index)] });
        setError("");
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Discovery feeds are temporarily unavailable.");
      } finally { request = undefined; }
    }
    void refresh(true);
    const timer = window.setInterval(() => void refresh(), refreshInterval);
    const visible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => { active = false; request?.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [attempt]);
  return { data, error, retry: () => setAttempt(value => value + 1) };
}
