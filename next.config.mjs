/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.PLAYWRIGHT_TEST ? ".next-playwright" : ".next",
  experimental: {
    // https://github.com/vercel/next.js/issues/95545 - static generation of a
    // random page (incl. the internal /_global-error fallback) can crash in the
    // build worker when the host CPU is contended; the race is per-attempt, so
    // generous retries plus low per-worker concurrency reliably mask it.
    staticGenerationRetryCount: 5,
    staticGenerationMaxConcurrency: 2,
  },
  images: {
    // Product images are supplied by the catalogue API. Serve them directly so
    // a temporary optimiser/network failure cannot leave catalogue cards blank.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
