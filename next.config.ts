const nextConfig = {
  images: {
    formats: ['image/webp'],                    // drop avif
    minimumCacheTTL: 60 * 60 * 24 * 31,        // 31 days
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 128, 256, 500],
    qualities: [75,55],                            // simplify unless you use 55 explicitly
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@fortawesome/react-fontawesome',
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/free-brands-svg-icons',
      'framer-motion',
      '@heroicons/react',
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig