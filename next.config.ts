import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  async redirects() {
    return [{ source: '/', destination: '/home', permanent: true }]
  },
};

export default nextConfig;
