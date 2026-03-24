/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      // Strapi CMS media (Azure Blob Storage)
      {
        protocol: 'https',
        hostname: '*.blob.core.windows.net',
      },
      // Strapi local development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // unsafe-eval retained: required by Next.js dev/build tooling
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://*.blob.core.windows.net",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.azurewebsites.net https://*.azurecontainerapps.io https://*.ciamlogin.com https://login.microsoftonline.com",
              "frame-src 'none'",
              "form-action 'self' https://*.ciamlogin.com",
              "base-uri 'self'",
              "object-src 'none'",
            ].join('; ')
          },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
}

export default nextConfig
