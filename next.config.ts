import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — produces a fully static site in `out/` that can be
  // served from any static host or bundled inside an Android APK as an
  // android_asset. API routes are NOT generated in this mode (the AI and
  // GitHub features show their "not configured" banners in the APK).
  output: "export",
  // Use relative asset paths so the static export works when loaded
  // from `file:///android_asset/www/index.html` inside the WebView.
  assetPrefix: "./",
  trailingSlash: true,
  // Disable image optimization (static export cannot run the optimizer).
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
