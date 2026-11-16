"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const search = query.trim();
    if (!search) return;
    router.push(`/search?${new URLSearchParams({ q: search })}`);
  }

  return (
    <form
      role="search"
      aria-label="Manga search"
      action="/search"
      onSubmit={submit}
      className="pointer-events-auto mx-auto flex w-full min-w-0 max-w-4xl items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white shadow-2xl shadow-black/20 backdrop-blur-xl transition-all duration-300 ease-out focus-within:border-white/35 sm:gap-3 sm:px-5 sm:py-3"
    >
      <button type="submit" aria-label="Search" className="shrink-0 rounded-full text-white/80 hover:text-white focus-visible:outline-2">
        <Search size={22} aria-hidden />
      </button>
      <input
        name="q"
        type="search"
        aria-label="Search manga"
        placeholder="Search manga, authors, genres..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        maxLength={100}
        required
        className="min-w-0 flex-1 bg-transparent text-base placeholder-white/50 outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="shrink-0 rounded-full text-white/60 hover:text-white focus-visible:outline-2">
          <X size={20} aria-hidden />
        </button>
      )}
    </form>
  );
}
