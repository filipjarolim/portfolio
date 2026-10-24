import type { NextConfig } from "next";
import { folioHeaders } from "./src/lib/folio-headers";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/cv", destination: "/cv.pdf", permanent: false }];
  },
  async headers() {
    return [{ source: "/:path*", headers: folioHeaders }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
