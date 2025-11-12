"use client";

import React, { useEffect, useState } from "react";
import AnimatedList from "@/components/AnimatedList";

export default function MangaPageClient({ manga }: { manga: string }) {
  const [mangaData, setMangaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMangaData = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/mangapage?title=${encodeURIComponent(manga)}`
        );
        if (!res.ok) throw new Error("Failed to fetch manga data");
        const data = await res.json();
        setMangaData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMangaData();
  }, [manga]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-400">
        Loading manga details...
      </div>
    );
  }

  if (error || !mangaData) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Error: {error || "Failed to load manga information"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060010] text-white p-10 flex flex-col md:flex-row items-start justify-center gap-12">
      {/* Left: Enlarged Cover */}
      <div className="flex-shrink-0 w-full md:w-[40%] flex justify-center">
        <img
          src={mangaData.image}
          alt={mangaData.name}
          className="w-[80%] md:w-full h-auto rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] object-cover"
        />
      </div>

      {/* Right: Info and Chapters */}
      <div className="w-full md:w-[55%] flex flex-col justify-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-purple-400">
          {mangaData.name}
        </h1>

        <p className="text-gray-300 mb-10 text-lg leading-relaxed">
          {mangaData.description}
        </p>

        <h2 className="text-2xl font-semibold mb-4 text-purple-300">
          Chapters
        </h2>

        <AnimatedList
          items={mangaData.chapters}
          onItemSelect={(item, index) => {
            console.log(`Selected chapter ${index + 1}: ${item}`);
          }}
          showGradients={true}
          enableArrowNavigation={true}
          displayScrollbar={true}
        />
      </div>
    </div>
  );
}
