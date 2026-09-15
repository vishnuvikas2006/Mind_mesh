import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Allow a phone on the same Wi-Fi to load Next.js development resources.
  // This is a hostname allow-list, so it intentionally has no URL scheme.
  allowedDevOrigins: ["192.168.1.4"],
  // The repository has a separate root lockfile for backend tooling. Keep
  // Turbopack scoped to this Next.js application in both local and Render runs.
  turbopack: { root: process.cwd() },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(self)" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      ],
    }];
  },
};

export default nextConfig;
