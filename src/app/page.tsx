"use client";

import Link from "next/link";
import RotatingText from "@/components/RotatingText";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black via-[#0a001f] to-[#12004a] text-white px-6 py-12 text-center">

      {/* Hero Section */}
      <div className="flex flex-col items-center gap-8 mt-24">
        <div className="flex items-center gap-3">
          <RotatingText
            texts={["Discover", "Read", "Download"]}
            mainClassName="px-2 sm:px-3 bg-[#5227FF] text-white overflow-hidden py-1 sm:py-2 justify-center rounded-lg text-5xl sm:text-6xl font-bold"
            staggerFrom="last"
            initial={{ y: "100%" }}
            animate={{ y: 0.5 }}
            exit={{ y: "-150%" }}
            auto={true}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-1"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={3000}

          />
          <h1 className="text-5xl sm:text-6xl font-bold text-white">Any Manga</h1>
        </div>

        <p className="text-lg max-w-2xl text-gray-300 leading-relaxed">
          Welcome to <span className="font-semibold text-white">AnyManga</span> —
          your all-in-one manga reader built for speed, simplicity, and discovery.
          Browse popular manga, read seamlessly online, or download your favorites
          to enjoy offline.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <Link
            href="/read"
            className="px-6 py-3 bg-[#5227FF] hover:bg-[#6e3dff] rounded-full text-white font-medium transition-all"
          >
            Start Reading
          </Link>
          <Link
            href="/download"
            className="px-6 py-3 border border-white/30 hover:border-[#5227FF] hover:text-[#B19EEF] rounded-full text-white font-medium transition-all"
          >
            Download Manga
          </Link>
        </div>
      </div>

      {/* Backend Status Notice (stays at the very bottom) */}
      <div className="fixed bottom-0 w-full bg-yellow-500/20 text-yellow-300 py-2 text-sm backdrop-blur-lg z-[50]">
        ⚠️ If the website functionality isn’t working, the backend may be down.
        You can run it locally by cloning
        <Link
          href="https://github.com/Anime-Shhh/AnyManga-Backend"
          className="underline font-medium text-yellow-400 hover:text-yellow-200 ml-1"
          target="_blank"
        >
          AnyManga-Backend
        </Link>
        and running <code className="bg-yellow-900/40 px-1 rounded">main.go</code>.
      </div>

      {/* Footer (now sits above the backend notice) */}
      <footer className="absolute bottom-12 text-gray-500 text-sm">
        Made by{" "}
        <Link
          href="https://github.com/Anime-Shhh"
          target="_blank"
          className="text-[#B19EEF] hover:text-[#5227FF] font-medium"
        >
          Anime-Shhh
        </Link>
      </footer>
    </main>
  );
}
