/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  redirects() {
    return [
      { source: '/game/guide', destination: '/huong-dan', permanent: true },
      { source: '/game/oan', destination: '/kiem-chung', permanent: true },
    ]
  },
}

export default nextConfig
