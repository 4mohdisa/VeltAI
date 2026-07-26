import type { NextConfig } from 'next';

// Static export: every page is SSG'd to plain HTML/CSS/JS in web/out — host it
// on any static server (S3/CloudFront, nginx). No Node server required.
const nextConfig: NextConfig = {
  output: 'export',
  // This package is its own root. Without this, Turbopack walks up to the
  // monorepo's root lockfile and infers /  as the workspace root (the Expo app),
  // which mis-scopes module resolution and file tracing on CI.
  turbopack: { root: __dirname },
  images: { unoptimized: true }, // no image CDN in a static export; we ship no raster images anyway
  trailingSlash: true, // /privacy/ → privacy/index.html — plays nice with dumb static hosts
};

export default nextConfig;
