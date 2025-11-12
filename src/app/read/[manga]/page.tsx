"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import AnimatedList from "@/components/AnimatedList";

interface MangaInfo {
  image: string;
  name: string;
  description: string;
  chapters: string[];
}

export default function MangaPage({
  params,
}: {
  params: Promise<{ manga: string }>;
}) {
  const { manga } = use(params);
  const title = decodeURIComponent(manga);
  const router = useRouter();

  const [mangaInfo, setMangaInfo] = useState<MangaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/mangapage?title=${encodeURIComponent(title)}`
        );
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setMangaInfo(data);
      } catch (err) {
        console.error("Error fetching manga info:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [title]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white text-2xl">
        Loading manga details...
      </div>
    );
  }

  if (!mangaInfo) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500 text-xl">
        Failed to load manga information.
      </div>
    );
  }

  const { image, name, description, chapters } = mangaInfo;

  return (
    <div className="pt-24 px-12 min-h-screen bg-[#060010] text-white">
      <div className="flex flex-col lg:flex-row items-start gap-12">
        {/* ─── Cover Image ─────────────────────────────────────────── */}
        <div className="flex-shrink-0 w-full lg:w-1/3 flex justify-center lg:justify-start">
          <img
            src={image}
            alt={name}
            className="w-[350px] h-[500px] object-cover rounded-2xl shadow-2xl border-2 border-purple-800"
          />
        </div>

        {/* ─── Manga Metadata ───────────────────────────────────────── */}
        <div className="flex-1 space-y-6">
          <h1 className="text-5xl font-bold text-[#5227FF]">{name}</h1>
          <p className="text-gray-300 leading-relaxed max-w-3xl">
            {description}
          </p>

          {/* ─── Chapters Section ───────────────────────────────────── */}
          <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-4 text-[#5227EE]">
              Chapters
            </h2>
            <AnimatedList
              items={chapters}
              onItemSelect={(chapter) => {
                router.push(
                  `/read/${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}/${encodeURIComponent(chapter.toLowerCase().replace(/\s+/g, '-'))}`
                );
              }}
              showGradients
              enableArrowNavigation
              displayScrollbar
            />
          </div>
        </div>
      </div>
    </div>
  );
}
