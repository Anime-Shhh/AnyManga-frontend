"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CarouselItem {
  title: string;
  image: string;
  description: string;
}

export default function CarouselPage() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:8080/featured');
        const data = await res.json();
        console.log("Fetched data:", data); // see what’s actually returned
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch carousel items:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (items.length === 0) return;

    // Clear existing timeout
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current);
    }

    // Set up auto-advance
    autoAdvanceRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 10000);

    return () => {
      if (autoAdvanceRef.current) {
        clearInterval(autoAdvanceRef.current);
      }
    };
  }, [items.length, currentIndex]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060010]">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const upcomingSlides = items.slice(currentIndex + 1).concat(items.slice(0, currentIndex + 1)).slice(0, 4);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Blur */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url(${currentItem.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px)',
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/70" />
        </motion.div>
      </AnimatePresence>

      {/* Top Navigation - Search Centered */}
      <nav className="relative z-20 flex justify-center p-6">
        <motion.div
          animate={{
            scale: isSearchFocused ? 1.3 : 1,
            width: isSearchFocused ? '400px' : '250px',
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex items-center"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search..."
              className="w-full px-4 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50"
            />
          </div>
        </motion.div>
      </nav>

      {/* Content */}
      <motion.div
        className="relative z-10 min-h-[calc(100vh-80px)]"
        animate={{
          filter: isSearchFocused ? 'blur(3px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.3 }}
      >

        {/* Main Carousel Content */}
        <div className="flex items-center justify-between min-h-[calc(100vh-150px)] px-16 py-8">
          {/* Left Side - Text Content */}
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
            <h3 >
              {currentItem.description}
            </h3>

            <div className="flex gap-4">
              <button className="px-6 py-3 bg-black/30 backdrop-blur-sm border border-white rounded-lg text-white hover:bg-black/50 transition">
                SEE MORE
              </button>
            </div>
          </motion.div>
          {/* Right Side - Main Image */}
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

        {/* Carousel Controls */}
        <div className="absolute bottom-12 left-8 z-20">
          <div className="flex gap-2">
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
        </div>

        {/* Upcoming Slides Thumbnails */}
        <div className="absolute bottom-8 right-8 z-20">
          <div className="flex gap-4">
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
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-3 h-12 flex items-center">
                    <p className="text-white font-semibold text-sm">{item.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="fixed bottom-0 left-0 w-full h-1 bg-transparent z-20">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 10, repeat: Infinity }}
            className="h-full bg-red-500"
          />
        </div>
      </motion.div>

      {/* Additional Content Area for Future Cards */}
      <div className="relative z-10 bg-[#060010] pt-16">
        <div className="container mx-auto px-8 py-16">
          <h2 className="text-4xl font-bold text-white mb-8">More Content</h2>
          <p className="text-white/60">
            Additional cards and categories will be added here.
          </p>
        </div>
      </div>
    </div>
  );
}

