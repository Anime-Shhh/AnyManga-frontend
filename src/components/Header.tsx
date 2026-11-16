"use client";

import { BookOpen, Download, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SearchBar from "./Searchbar";

const navigationLink = "inline-flex size-10 shrink-0 items-center justify-center gap-2 rounded-lg text-zinc-200 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-300 sm:w-auto sm:px-3";

export default function Header() {
  const pathname = usePathname();
  const [hiddenFor, setHiddenFor] = useState("");
  const lastScroll = useRef(0);

  useEffect(() => {
    lastScroll.current = window.scrollY;
    function handleScroll() {
      const current = window.scrollY;
      setHiddenFor(current > 100 && current > lastScroll.current ? pathname : "");
      lastScroll.current = current;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const hidden = hiddenFor === pathname && /^\/read\/[^/]+\/[^/]+/.test(pathname);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0c0a14]/95 backdrop-blur transition-transform duration-300 focus-within:translate-y-0 ${hidden ? "-translate-y-full" : ""}`}>
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-5 sm:px-8">
        <Link href="/" aria-label="AnyManga home" className={`${navigationLink} font-bold tracking-tight`}>
          <House size={19} className="sm:hidden" aria-hidden />
          <span className="hidden sm:inline">AnyManga</span>
        </Link>
        <SearchBar />
        <nav aria-label="Main navigation" className="flex shrink-0 gap-1">
          <Link href="/read" aria-label="Browse manga" className={navigationLink}>
            <BookOpen size={19} aria-hidden /><span className="hidden text-sm sm:inline">Browse</span>
          </Link>
          <Link href="/download" aria-label="Download manga" className={navigationLink}>
            <Download size={19} aria-hidden /><span className="hidden text-sm md:inline">Download</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
