/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ];

    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'sha256-G0tmYWm7yA172ZRNDY/0jxJIDQjKKxcrYmaVn2FFJWA='",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' https://raw.githubusercontent.com data:",
          "font-src 'self' data:",
          "connect-src 'self' https://pokeapi.co",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
        ].join('; '),
      });
    }

    if (process.env.VERCEL_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000',
      });
    }

    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // Keep static generation from overwhelming the external Pokemon API.
  experimental: {
    cpus: 2,
    staticGenerationMaxConcurrency: 1,
  },
};

module.exports = nextConfig
