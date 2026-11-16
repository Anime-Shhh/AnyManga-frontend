import type { NextConfig } from "next";

const backend = (process.env.MANGA_API_ORIGIN || "http://127.0.0.1:8080").replace(/\/$/, "");
const endpoints = ["search", "featured", "popular", "mangapage", "chapterimages", "info", "chapters"];

const nextConfig: NextConfig = {
  async rewrites() {
    return endpoints.map((endpoint) => ({
      source: `/api/manga/${endpoint}`,
      destination: `${backend}/${endpoint}`,
    }));
  },
};

export default nextConfig;
