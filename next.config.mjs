/** @type {import('next').NextConfig} */
const nextConfig = {
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
