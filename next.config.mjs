/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.PLAYWRIGHT_TEST ? ".next-playwright" : ".next",
  productionBrowserSourceMaps: false,
  
  // Experimental flags optimized for low-memory environments
  experimental: {
    staticGenerationMaxConcurrency: 1, // Restrict worker concurrency
    staticGenerationMinPagesPerWorker: 25,
    webpackBuildWorker: false, // Prevents spawing extra Node processes
  },

  images: {
    unoptimized: true,
  },

  // Disable Webpack caching in memory during build
  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;