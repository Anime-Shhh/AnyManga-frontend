"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  return (
    <div className="fixed inset-x-0 top-4.5 z-40 flex justify-center pointer-events-none">
      <div
        className={`
          flex items-center gap-3
          bg-white/5 backdrop-blur-xl
          border border-white/10
          rounded-full
          shadow-2xl shadow-black/20
          px-5 py-3 w-full max-w-2xl
          sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl
          transition-all duration-300 ease-out
          pointer-events-auto
        `}
      >
        {/* Search Icon */}
        <Search
          size={22}
          className="text-white/80 flex-shrink-0 transition hover:text-white"
        />

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search manga, authors, genres..."
          className="bg-transparent text-white placeholder-white/50 outline-none flex-1 text-base sm:text-sm"
        />

        {/* Clear Button */}
        {query && (
          <X
            size={20}
            className="text-white/60 cursor-pointer hover:text-white transition"
            onClick={() => setQuery("")}
          />
        )}
      </div>
    </div>
  );
}
