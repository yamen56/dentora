import createNextIntlPlugin from "next-intl/plugin";

// Point the next-intl plugin at our request config (cookie-based locale, no URL prefix)
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // One canonical host: fold www and the legacy vercel.app URL into the
  // apex domain so search engines see a single site.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.whymedicine.app" }],
        destination: "https://whymedicine.app/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "dentora-delta.vercel.app" }],
        destination: "https://whymedicine.app/:path*",
        permanent: true,
      },
    ];
  },
  // Baseline security headers. SAMEORIGIN (not DENY) because the app renders
  // its own PDF proxy route inside same-origin frames.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // pdfjs-dist ships .mjs workers; don't try to polyfill `canvas` on the server
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
