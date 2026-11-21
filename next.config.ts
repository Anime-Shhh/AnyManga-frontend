import type { NextConfig } from "next";

// API forwarding lives in the server-only route handler so its key never reaches the browser.
const nextConfig: NextConfig = {};
export default nextConfig;
