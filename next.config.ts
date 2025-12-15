import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bun"],
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
