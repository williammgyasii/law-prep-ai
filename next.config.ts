import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "app.lawhub.org" },
      { protocol: "https", hostname: "images.ctfassets.net" },
      { protocol: "https", hostname: "cdne-lawhub.azureedge.net" },
    ],
  },
};

export default nextConfig;
