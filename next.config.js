/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep static generation from overwhelming the external Pokemon API.
  experimental: {
    cpus: 2,
    staticGenerationMaxConcurrency: 1,
  },
}

module.exports = nextConfig
