/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  eslint: {
    // ESLint dijalankan terpisah (CI/dev), bukan saat production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript errors sudah dicek manual, skip saat build
    ignoreBuildErrors: false,
  },
}

export default nextConfig
