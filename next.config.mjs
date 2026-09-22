/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.PLAYWRIGHT_TEST ? ".next-playwright" : ".next",
  experimental: {
    // Root cause (reproduced locally): a non-production NODE_ENV (e.g.
// development) during `next build` makes Next run dev-mode React, so every
// prerender throws "Cannot read properties of null (reading 'useRef'/...)".
// Fix is environmental: NODE_ENV must be production/unset on the host.
// The settings below are defensive insurance only (transient prerender
// failures degrade to dynamic instead of failing the deploy).
    staticGenerationRetryCount: 5,
    staticGenerationMaxConcurrency: 2,
    staticGenerationMinPagesPerWorker: 25,
    prerenderEarlyExit: false,
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
