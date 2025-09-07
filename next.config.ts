import type { NextConfig } from "next";

const isMobileBuild = process.env.BUILD_TARGET === 'mobile';

const nextConfig: NextConfig = {
  ...(isMobileBuild && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true
    },
    distDir: 'out'
  })
};

export default nextConfig;
