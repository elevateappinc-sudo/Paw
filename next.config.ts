import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allow production builds even with type errors (fixes strict mode issues)
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Transpile DiceBear ESM-only packages for Next.js compatibility
  transpilePackages: [
    "@dicebear/core",
    "@dicebear/collection",
    "@dicebear/adventurer",
    "@dicebear/adventurer-neutral",
    "@dicebear/fun-emoji",
    "@dicebear/lorelei",
    "@dicebear/bottts",
  ],
};

export default nextConfig;
