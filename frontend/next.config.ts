import type { NextConfig } from "next";

// The browser only ever talks to this Next.js origin. API calls under /api (plus the Swagger UI)
// are proxied to the Spring Boot service, which keeps cookies same-site and removes the need for
// CORS in the browser. NOTE: rewrites are resolved at build time, so BACKEND_INTERNAL_URL must be
// provided when running `next build` (docker-compose passes it as a build argument).
const backend = (process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080").replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/swagger-ui/:path*", destination: `${backend}/swagger-ui/:path*` },
      { source: "/swagger-ui.html", destination: `${backend}/swagger-ui.html` },
      { source: "/v3/api-docs/:path*", destination: `${backend}/v3/api-docs/:path*` },
      { source: "/v3/api-docs", destination: `${backend}/v3/api-docs` },
    ];
  },
};

export default nextConfig;
