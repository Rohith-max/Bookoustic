/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://192.168.137.1:3000", // or whatever your LAN IP is
    // add any other origins you use for dev/testing
  ],
}


export default nextConfig
