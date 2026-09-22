/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.PLAYWRIGHT_TEST ? ".next-playwright" : ".next",
  experimental: {
    // https://github.com/vercel/next.js/issues/95545 - static generation of a
    // random page (incl. the internal /_global-error fallback) can crash in the
    // build worker when the host CPU is contended. Mitigations:
    // - retries mask the per-attempt race,
    // - low per-worker concurrency + batching into one worker reduce contention,
    // - prerenderEarlyExit:false degrades a failed page to dynamic instead of
    //   killing the whole build (otherwise a transient failure = deploy failure).
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
