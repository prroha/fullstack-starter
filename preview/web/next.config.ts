import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "../../core/web",
    "../../modules/ecommerce/web",
    "../../modules/lms/web",
    "../../modules/booking/web",
    "../../modules/helpdesk/web",
    "../../modules/invoicing/web",
    "../../modules/events/web",
    "../../modules/tasks/web",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
