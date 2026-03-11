import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js to let Node.js resolve these CJS-only packages at runtime
  // instead of bundling them through the ESM pipeline
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
