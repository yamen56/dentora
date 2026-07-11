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
