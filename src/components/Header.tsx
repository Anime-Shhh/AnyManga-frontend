"use client";

import { BookOpen, Download, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SearchBar from "./Searchbar";

const navigationLink = "inline-flex min-h-10 min-w-8 shrink-0 items-center justify-center gap-2 rounded-full px-1.5 text-white/85 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-300 sm:px-2 lg:px-3";

export default function Header() {
  const pathname = usePathname();
  const [hiddenFor, setHiddenFor] = useState("");
  const lastScroll = useRef(0);

  useEffect(() => {
    lastScroll.current = window.scrollY;
    function handleScroll() {
      const current = window.scrollY;
      if (current === lastScroll.current) return;
      setHiddenFor(current > 100 && current > lastScroll.current ? pathname : "");
      lastScroll.current = current;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const hidden = hiddenFor === pathname;

  return (
    <header onFocusCapture={() => setHiddenFor("")} className={`pointer-events-none fixed inset-x-0 top-0 z-[150] transition-[transform,opacity] duration-500 ease-in-out motion-reduce:transition-none ${hidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}>
      <nav aria-label="Main navigation" className="mx-auto grid max-w-[105rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1 px-2 pt-4 sm:gap-3 sm:px-5 xl:grid-cols-[1fr_minmax(0,56rem)_1fr] xl:gap-5">
        <Link href="/read" aria-label="AnyManga" className={`pointer-events-auto justify-self-start ${navigationLink} text-sm font-bold tracking-tight sm:text-lg`}>
          AnyManga
        </Link>
        <SearchBar />
        <div className="pointer-events-auto flex shrink-0 justify-self-end">
          <Link href="/" aria-label="Home" className={navigationLink}>
            <House size={18} aria-hidden /><span className="hidden text-sm lg:inline">Home</span>
          </Link>
          <Link href="/read" aria-label="Browse manga" className={navigationLink}>
            <BookOpen size={18} aria-hidden /><span className="hidden text-sm lg:inline">Browse</span>
          </Link>
          <Link href="/download" aria-label="Download manga" className={navigationLink}>
            <Download size={18} aria-hidden /><span className="hidden text-sm lg:inline">Download</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
