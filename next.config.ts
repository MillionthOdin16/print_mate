import type { NextConfig } from "next";

const isMobileBuild = process.env.BUILD_TARGET === 'mobile';

const nextConfig: NextConfig = {
  ...(isMobileBuild && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true
    },
    experimental: {
      // Don't fail on missing generateStaticParams for now
      fallbackNodePolyfills: false
    }
  })
};

export default nextConfig;
