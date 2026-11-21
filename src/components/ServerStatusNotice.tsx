"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertCircle, ExternalLink } from "lucide-react";

export default function ServerStatusNotice() {
  const pathname = usePathname();
  const eligible = pathname === "/" || pathname === "/read" || pathname.startsWith("/read/");
  const reading = /^\/read\/[^/]+\/[^/]+\/?$/.test(pathname);
  const [status, setStatus] = useState<"unknown" | "up" | "down" | "offline">("unknown");

  useEffect(() => {
    if (!eligible) return;
    let active = true;
    let pending = false;
    let controller: AbortController | undefined;
    async function check() {
      if (pending || document.hidden) return;
      if (!navigator.onLine) { setStatus("offline"); return; }
      pending = true;
      controller = new AbortController();
      const timer = window.setTimeout(() => controller?.abort(), 8_000);
      try {
        const response = await fetch("/api/manga/health", { cache: "no-store", signal: controller.signal });
        if (active) setStatus(response.status === 204 ? "up" : "down");
      } catch {
        if (active) setStatus(navigator.onLine ? "down" : "offline");
      } finally { window.clearTimeout(timer); pending = false; }
    }
    function offline() { controller?.abort(); if (active) setStatus("offline"); }
    void check();
    const timer = window.setInterval(() => { void check(); }, 30_000);
    const resume = () => { void check(); };
    window.addEventListener("online", resume);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", resume);
    return () => {
      active = false; controller?.abort(); window.clearInterval(timer);
      window.removeEventListener("online", resume);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [eligible, pathname]);

  if (!eligible || status === "unknown" || status === "up") return null;
  return (
    <aside role="status" aria-live="polite" aria-atomic="true" className={`fixed inset-x-3 ${reading ? "top-24" : "bottom-[max(1rem,env(safe-area-inset-bottom))]"} z-[170] mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-amber-300/25 bg-[#191222]/95 px-4 py-3 text-sm text-white shadow-xl backdrop-blur-md sm:inset-x-6`}>
      <span className="inline-flex items-center gap-2"><AlertCircle size={18} aria-hidden className="shrink-0 text-amber-300" />{status === "offline" ? "You’re offline. Reconnect to check server status." : "Servers are currently down."}</span>
      {status === "down" && <a href="https://github.com/Anime-Shhh/AnyManga-Backend/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 font-medium text-violet-200 underline decoration-violet-300/50 underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-300">Self-hosting guide <ExternalLink size={14} aria-hidden /></a>}
    </aside>
  );
}
