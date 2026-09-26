import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "mysql2", "groq-sdk"],
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
