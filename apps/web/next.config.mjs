/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile monorepo packages
  transpilePackages: ["@qvac-health/types", "@qvac-health/ui"],

  // API runs separately — all /api/* calls proxy to Fastify
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },

  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
