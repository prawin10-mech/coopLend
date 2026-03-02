import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent massive libraries from getting aggressively tree-shaken and causing Vercel trace memory limits
  serverExternalPackages: ["mongoose", "xlsx", "bcryptjs"]
};

export default nextConfig;
