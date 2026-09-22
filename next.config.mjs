/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.PLAYWRIGHT_TEST ? ".next-playwright" : ".next",
  productionBrowserSourceMaps: false,
  
  // Disable linting and type-checking during production builds to save RAM
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    staticGenerationMaxConcurrency: 1,
    webpackBuildWorker: false,
  },

  images: {
    unoptimized: true,
  },

  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;