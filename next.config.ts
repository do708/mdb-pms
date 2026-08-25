import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: [
        "@sparticuz/chromium",
        "puppeteer-core",
        "puppeteer",
        "sharp",
    ],
    experimental: {
        middlewareClientMaxBodySize: "25mb",
        proxyClientMaxBodySize: "25mb",
    },
};

export default nextConfig;