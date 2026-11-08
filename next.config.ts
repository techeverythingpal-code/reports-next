import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // exceljs is a Node library; keep it out of the bundler.
  serverExternalPackages: ["exceljs"],
  experimental: {
    serverActions: {
      // Excel imports allow files up to 5 MB (same as the Laravel app),
      // plus a little room for the rest of the form.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
