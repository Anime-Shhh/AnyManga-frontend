"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface ChapterResponse {
  images: string[];
}

export default function ChapterPage() {
  const { manga, chapter } = useParams();
  const router = useRouter();

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!manga || !chapter) return;

    console.log("Fetching chapter:", manga, chapter);

    const fetchChapter = async () => {
      try {
        const res = await fetch("http://localhost:8080/chapterimages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ manga, chapter }),
        });

        console.log("Response status:", res.status);

        if (!res.ok) throw new Error(`Failed to fetch chapter (${res.status})`);

        const data: ChapterResponse = await res.json();
        console.log("Fetched data:", data);

        setImages(data.images || []);
      } catch (err) {
        console.error("Error loading chapter:", err);
        setError("Failed to load chapter images.");
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [manga, chapter]);

  const handleBackToManga = () => {
    if (manga) {
      router.push(`/read/${manga}`);
    }
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">{error}</div>;
  if (!images.length)
    return <div className="text-center mt-8">No images found for this chapter.</div>;

  return (
    <div className="flex flex-col items-center p-4 pt-32">
      {/* Top button */}
      <button
        onClick={handleBackToManga}
        className="px-6 py-2 bg-purple-700 text-white font-semibold hover:bg-purple-800 transition rounded-md"
      >
        Back to Manga
      </button>

      <h1 className="text-2xl font-semibold mb-4">{`${manga} — ${chapter}`}</h1>

      {images.map((src, index) => (
        <div key={index} className="w-full max-w-3xl">
          <img
            src={src}
            alt={`Page ${index + 1}`}
            className="w-full h-auto" // removed rounded-lg and shadow-md
            loading="lazy"
          />
        </div>
      ))}

      {/* Bottom button */}
      <button
        onClick={handleBackToManga}
        className="px-6 py-2 bg-purple-700 text-white font-semibold hover:bg-purple-800 transition rounded-md mt-4"
      >
        Back to Manga
      </button>
    </div>
  );
}
