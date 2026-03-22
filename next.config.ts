import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Supabase Storage signed URL images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/**",
      },
    ],
  },
};

export default nextConfig;
