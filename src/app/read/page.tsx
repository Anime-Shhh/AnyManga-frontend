"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link"

interface CarouselItem {
  title: string;
  image: string;
  description: string;
}

export default function CarouselPage() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [popular, setPopular] = useState<{ image: string; name: string; chapters: string[] }[]>([]);

  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8080/featured");
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch carousel items:", error);
      }
    };

    const fetchPopular = async () => {
      try {
        const res = await fetch("http://localhost:8080/popular");
        const data = await res.json();
        setPopular(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch popular items:", error);
      }
    };

    fetchData();
    fetchPopular();
  }, []);

  useEffect(() => {
    if (items.length === 0) return;

    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);

    autoAdvanceRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 10000);

    return () => {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    };
  }, [items.length, currentIndex]);

  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const goToPrevious = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  const goToSlide = (index: number) => setCurrentIndex(index);

  const scrollManga = (direction: "left" | "right") => {
    const container = document.getElementById("mangaScroll");
    if (container) {
      const scrollAmount = window.innerWidth / 1.5;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060010]">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const upcomingSlides = items
    .slice(currentIndex + 1)
    .concat(items.slice(0, currentIndex + 1))
    .slice(0, 4);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#060010]">
      {/* Background Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-screen"
          style={{
            backgroundImage: `url(${currentItem.image})`,
            backgroundSize: "cover",
            backgroundPosition: "top center",
            filter: "blur(8px)",
          }}
        >
          <div className="absolute inset-0 bg-black/70" />
        </motion.div>
      </AnimatePresence>

      {/* Foreground Carousel */}
      <motion.div className="relative z-10 min-h-screen">
        <div className="flex items-center justify-between min-h-[calc(100vh-150px)] px-16 py-8">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            key={currentIndex}
            className="flex-1 max-w-lg"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#5227FF] mb-4 uppercase">
              {currentItem.title}
            </h2>
            <h6 className="text-base font-semibold text-white/80 mb-6">{currentItem.description}</h6>

            <div className="flex gap-4">
              <Link href={`/read/${encodeURIComponent(currentItem.title.toLowerCase().replace(/\s+/g, '-'))}`}>
                <button className="px-6 py-3 bg-black/30 backdrop-blur-sm border border-white rounded-lg text-white hover:bg-black/50 transition">
                  SEE MORE
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Image */}
          <div className="flex-1 flex justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              key={currentIndex}
              className="relative"
            >
              <img
                src={currentItem.image}
                alt={currentItem.title}
                className="max-w-full h-auto max-h-[70vh] object-contain"
              />
            </motion.div>
          </div>
        </div>

        {/* Navigation */}
        <div className="absolute bottom-12 left-8 z-20 flex gap-2">
          <button
            onClick={goToPrevious}
            className="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition"
          >
            ←
          </button>
          <button
            onClick={goToNext}
            className="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition"
          >
            →
          </button>
        </div>

        {/* Thumbnails */}
        <div className="absolute bottom-8 right-8 z-20 flex gap-4">
          {upcomingSlides.map((item, index) => (
            <motion.div
              key={`${currentIndex}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => goToSlide((currentIndex + index + 1) % items.length)}
              className="cursor-pointer"
            >
              <div className="w-44 rounded-lg overflow-hidden shadow-lg bg-black/30 backdrop-blur-sm border border-white/10 hover:border-white/30 transition">
                <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
                <div className="p-3 h-12 flex items-center overflow-hidden">
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* --- Popular Manga Section --- */}
      {/* Additional Content Area for Future Cards */}
      <div className="relative z-10 pt-16 bg-gradient-to-b from-transparent to-[#060010]">
        <div className="absolute top-0 left-0 w-full h-[50px] bg-gradient-to-b from-transparent to-[#060010]" />
        <div className="w-full overflow-hidden">
          <h2 className="text-4xl font-bold text-white px-8 mb-6">Popular Manga</h2>

          {/* Infinite scrollable manga section */}
          <div className="relative">
            {/* Left fade overlay */}
            <div className="absolute left-0 top-0 h-full w-48 bg-gradient-to-r from-[#060010] via-[#060010]/80 to-transparent pointer-events-none" />

            {/* Scroll container */}
            <div
              id="mangaScroll"
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 5) {
                  el.scrollLeft = 0; // jump back to start
                } else if (el.scrollLeft <= 0) {
                  el.scrollLeft = el.scrollWidth / 2; // jump to middle copy
                }
              }}
              className="flex overflow-x-scroll scrollbar-hide scroll-smooth space-x-6 px-8"
            >
              {[...popular, ...popular].map((manga, index) => (
                <div
                  key={index}
                  className="min-w-[250px] bg-[#100020] rounded-2xl overflow-hidden shadow-lg border border-transparent hover:border-[#5227FF] transition-all duration-300"
                >
                  <img
                    src={manga.image}
                    alt={manga.name}
                    className="w-full h-72 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-white text-lg font-semibold truncate">
                      {manga.name}
                    </h3>
                    <div className="text-gray-400 text-sm mt-1 overflow-y-auto max-h-20 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                      {manga.chapters.slice(0, 5).map((ch, i) => (
                        <p key={i}>• {ch}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right fade overlay */}
            <div className="absolute right-0 top-0 h-full w-48 bg-gradient-to-l from-[#060010] via-[#060010]/80 to-transparent pointer-events-none" />

            {/* Scroll buttons */}
            <button
              onClick={() => scrollManga("left")}
              className="absolute left-8 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center 
             bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition z-30"
            >
              ←
            </button>

            <button
              onClick={() => scrollManga("right")}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center 
             bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition z-30"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
