/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.PLAYWRIGHT_TEST ? ".next-playwright" : ".next",
  experimental: {
    // https://github.com/vercel/next.js/issues/95545 - static-export prerender
    // of the internal /_global-error page can intermittently crash in the build
    // worker on some hosts. Retry and cap per-worker concurrency as a mitigation.
    staticGenerationRetryCount: 2,
    staticGenerationMaxConcurrency: 4,
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
