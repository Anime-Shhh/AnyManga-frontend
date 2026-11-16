"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

export default function SearchBar() {
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const field = event.currentTarget.elements.namedItem("q") as HTMLInputElement;
    const query = field.value.trim();
    if (!query) return;
    router.push(`/search?${new URLSearchParams({ q: query })}`);
    field.blur();
  }

  return (
    <form
      role="search"
      aria-label="Manga search"
      action="/search"
      onSubmit={submit}
      className="flex min-w-0 flex-1 justify-center"
    >
      <div className="flex w-full max-w-xl items-center rounded-full border border-white/15 bg-[#171126]/95 pl-4 shadow-lg focus-within:border-violet-400">
        <input
          name="q"
          type="search"
          aria-label="Search manga"
          placeholder="Search manga"
          required
          maxLength={100}
          className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-400"
        />
        <button
          type="submit"
          aria-label="Search"
          className="grid size-11 shrink-0 place-items-center rounded-full text-violet-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-violet-300"
        >
          <Search size={20} aria-hidden />
        </button>
      </div>
    </form>
  );
}
