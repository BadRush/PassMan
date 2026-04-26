import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
};

// In development, Next.js 16 uses Turbopack by default.
// withSerwist injects a webpack plugin that conflicts with Turbopack.
// Only apply Serwist wrapper in production builds.
const isDev = process.env.NODE_ENV === "development";
export default isDev ? nextConfig : withSerwist(nextConfig);
