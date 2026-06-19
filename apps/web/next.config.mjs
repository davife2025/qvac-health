/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile monorepo packages
  transpilePackages: ["@qvac-health/types", "@qvac-health/ui"],

  // Fix #2: use private API_URL for server-side rewrite,
  // not the public NEXT_PUBLIC_ var which is baked into the client bundle
  // and could differ from the internal service address in production.
  // API_URL defaults to localhost for dev.
  async rewrites() {
    const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },

  // Fix #6: removed typedRoutes experimental flag — requires explicit
  // route.ts declarations for every page, not worth the overhead for now.
  // Re-enable if we add a full type-safe routing layer later.
};

export default nextConfig;
