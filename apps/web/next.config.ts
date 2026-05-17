import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @regi/db ships TypeScript source with no build step; Next must transpile
  // the workspace package itself. See ADR 0008.
  transpilePackages: ["@regi/db"],
};

export default nextConfig;
